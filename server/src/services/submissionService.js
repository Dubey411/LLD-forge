const crypto = require('crypto');
const { Submission, Attempt, Problem, Evaluation } = require('../models');
const EvaluatorService = require('../evaluators/EvaluatorService');

class SubmissionService {
  /**
   * @param {Object} [options]
   * @param {EvaluatorService} [options.evaluatorService]
   */
  constructor(options = {}) {
    this.evaluatorService = options.evaluatorService || new EvaluatorService();
  }

  /**
   * Computes sha256 hex hash of trimmed content.
   */
  computeContentHash(content) {
    const trimmed = (content || '').trim();
    return crypto.createHash('sha256').update(trimmed).digest('hex');
  }

  /**
   * Creates a new submission for an attempt.
   * Immediately saves submission as 'pending', updates attempt status,
   * then launches the evaluation pipeline.
   *
   * @param {Object} params
   * @param {string} params.attemptId
   * @param {string} params.content
   * @param {string} [params.userId]
   * @param {boolean} [params.waitForEvaluation=false] - If true, awaits evaluation before returning (useful for tests)
   * @returns {Promise<{ submission: Object, evaluation?: Object }>}
   */
  async createSubmission({ attemptId, content, userId = 'demo-user', waitForEvaluation = false }) {
    if (!content || typeof content !== 'string') {
      throw new Error('Submission content must be a non-empty string.');
    }

    const attempt = await Attempt.findById(attemptId).populate('problemId');
    if (!attempt) {
      throw new Error(`Attempt with ID "${attemptId}" not found.`);
    }

    const contentHash = this.computeContentHash(content);

    // 1. SAVE IMMEDIATELY (Status: pending)
    // Never lose a submission because evaluation failed!
    const submission = await Submission.create({
      attemptId: attempt._id,
      problemId: attempt.problemId._id,
      userId: userId || attempt.userId,
      content,
      contentHash,
      submittedAt: new Date(),
      evaluationStatus: 'pending'
    });

    // Mark attempt as submitted
    attempt.status = 'submitted';
    attempt.completedAt = new Date();
    await attempt.save();

    // 2. KICK OFF EVALUATION PIPELINE
    const evalPromise = this.processEvaluation(submission._id, attempt.problemId);

    if (waitForEvaluation) {
      await evalPromise;
      const updatedSubmission = await Submission.findById(submission._id);
      const evaluation = await Evaluation.findOne({ submissionId: submission._id });
      return { submission: updatedSubmission, evaluation };
    }

    // Fire and forget evaluation asynchronously for polling client
    evalPromise.catch(err => {
      console.error(`[SubmissionService] Unhandled error during async evaluation for ${submission._id}:`, err);
    });

    return { submission };
  }

  /**
   * State Machine & Evaluation Pipeline:
   * pending -> evaluating -> completed | failed
   */
  async processEvaluation(submissionId, problemDoc) {
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      throw new Error(`Submission ${submissionId} not found.`);
    }

    // State machine guard: Do not re-evaluate completed or evaluating submissions
    if (submission.evaluationStatus === 'completed') {
      console.warn(`[SubmissionService] Submission ${submissionId} is already completed. Skipping.`);
      return;
    }

    const problem = problemDoc || await Problem.findById(submission.problemId);
    if (!problem) {
      submission.evaluationStatus = 'failed';
      submission.errorMessage = 'Associated problem could not be found.';
      await submission.save();
      return;
    }

    try {
      // 1. Check Deterministic Gate
      const gateCheck = this.evaluatorService.deterministicEvaluator.checkStructuralValidity(submission.content);

      if (!gateCheck.isValid) {
        // Short-circuit: Complete directly with deterministic evaluation without calling AI
        console.log(`[SubmissionService] Short-circuiting submission ${submission._id} via DeterministicEvaluator.`);
        const deterministicResult = await this.evaluatorService.deterministicEvaluator.evaluate({
          problem,
          content: submission.content,
          submission
        });

        await Evaluation.create({
          submissionId: submission._id,
          evaluatorType: 'deterministic',
          rubricResults: deterministicResult.rubricResults,
          overallSummary: deterministicResult.overallSummary,
          createdAt: new Date()
        });

        submission.evaluationStatus = 'completed';
        submission.errorMessage = null;
        await submission.save();
        return;
      }

      // 2. Idempotency Check: Look for existing completed evaluation for same problem & contentHash
      const existingSubmission = await Submission.findOne({
        _id: { $ne: submission._id },
        problemId: problem._id,
        contentHash: submission.contentHash,
        evaluationStatus: 'completed'
      });

      if (existingSubmission) {
        const existingEvaluation = await Evaluation.findOne({ submissionId: existingSubmission._id });
        if (existingEvaluation) {
          console.log(`[SubmissionService] Idempotency match: Reusing evaluation from submission ${existingSubmission._id}.`);
          await Evaluation.create({
            submissionId: submission._id,
            evaluatorType: existingEvaluation.evaluatorType,
            rubricResults: existingEvaluation.rubricResults,
            overallSummary: existingEvaluation.overallSummary,
            createdAt: new Date()
          });

          submission.evaluationStatus = 'completed';
          submission.errorMessage = null;
          await submission.save();
          return;
        }
      }

      // 3. Move state to 'evaluating'
      submission.evaluationStatus = 'evaluating';
      await submission.save();

      // 4. Call AI Evaluator (with EvidenceVerifier guard)
      console.log(`[SubmissionService] Calling AI Evaluator for submission ${submission._id}.`);
      const aiResult = await this.evaluatorService.aiEvaluator.evaluate({
        problem,
        content: submission.content,
        submission
      });

      // 5. Save Evaluation and finalize state to 'completed'
      await Evaluation.create({
        submissionId: submission._id,
        evaluatorType: 'ai',
        rubricResults: aiResult.rubricResults,
        overallSummary: aiResult.overallSummary,
        createdAt: new Date()
      });

      submission.evaluationStatus = 'completed';
      submission.errorMessage = null;
      await submission.save();
      console.log(`[SubmissionService] Evaluation completed successfully for submission ${submission._id}.`);
    } catch (error) {
      console.error(`[SubmissionService] Evaluation failed for submission ${submission._id}:`, error.message);
      // Terminal state on failure: NEVER leave stuck in 'evaluating'
      submission.evaluationStatus = 'failed';
      submission.errorMessage = error.message || 'Evaluation process encountered an error.';
      await submission.save();
    }
  }

  /**
   * Retrieves a submission by ID, populated with its attempt, problem, and evaluation.
   */
  async getSubmissionById(id) {
    const submission = await Submission.findById(id).populate({
      path: 'attemptId',
      populate: { path: 'problemId' }
    });

    if (!submission) return null;

    const evaluation = await Evaluation.findOne({ submissionId: submission._id });

    return {
      submission,
      evaluation
    };
  }
}

module.exports = new SubmissionService();
