const { Attempt, Problem, Submission, Evaluation } = require('../models');
const deltaService = require('./deltaService');

class AttemptService {
  /**
   * Start a new attempt session for a problem.
   */
  async createAttempt({ problemSlug, userId = 'demo-user' }) {
    const problem = await Problem.findOne({ slug: problemSlug.toLowerCase().trim() });
    if (!problem) {
      throw new Error(`Problem with slug "${problemSlug}" not found.`);
    }

    const attempt = await Attempt.create({
      problemId: problem._id,
      userId: userId || 'demo-user',
      status: 'in_progress',
      startedAt: new Date()
    });

    const populated = await Attempt.findById(attempt._id).populate('problemId');
    return populated;
  }

  /**
   * Get attempt history for a specific problem and user, enriched with deltas.
   */
  async getAttemptsForProblem({ problemSlug, userId = 'demo-user' }) {
    const problem = await Problem.findOne({ slug: problemSlug.toLowerCase().trim() });
    if (!problem) {
      throw new Error(`Problem with slug "${problemSlug}" not found.`);
    }

    // Find all attempts sorted chronologically ascending to compute progressive deltas
    const attempts = await Attempt.find({
      problemId: problem._id,
      userId: userId || 'demo-user'
    })
      .sort({ startedAt: 1 })
      .populate('problemId');

    const attemptIds = attempts.map(a => a._id);

    // Fetch latest submissions for these attempts
    const submissions = await Submission.find({
      attemptId: { $in: attemptIds }
    }).sort({ submittedAt: -1 });

    const submissionByAttemptId = new Map();
    submissions.forEach(sub => {
      // Pick the latest submission if multiple exist
      if (!submissionByAttemptId.has(sub.attemptId.toString())) {
        submissionByAttemptId.set(sub.attemptId.toString(), sub);
      }
    });

    const submissionIds = Array.from(submissionByAttemptId.values()).map(s => s._id);

    // Fetch evaluations
    const evaluations = await Evaluation.find({
      submissionId: { $in: submissionIds }
    });

    const evaluationBySubmissionId = new Map();
    evaluations.forEach(ev => {
      evaluationBySubmissionId.set(ev.submissionId.toString(), ev);
    });

    // Map evaluation directly by attemptId
    const evaluationByAttemptId = new Map();
    submissionByAttemptId.forEach((sub, attemptIdStr) => {
      const ev = evaluationBySubmissionId.get(sub._id.toString());
      if (ev) {
        evaluationByAttemptId.set(attemptIdStr, ev);
      }
    });

    // Enrich with delta against immediately preceding attempt
    const enriched = deltaService.enrichAttemptsWithDeltas(attempts, evaluationByAttemptId);

    // Attach the submission to each enriched attempt item
    return enriched.map(item => {
      const sub = submissionByAttemptId.get(item._id.toString()) || null;
      return {
        ...item,
        submission: sub
      };
    }).reverse(); // Return in reverse chronological order (newest first) for UI display
  }

  async getAttemptById(attemptId) {
    return Attempt.findById(attemptId).populate('problemId');
  }
}

module.exports = new AttemptService();
