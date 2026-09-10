const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');
const { Problem, Attempt, Submission, Evaluation } = require('../src/models');
const SubmissionService = require('../src/services/submissionService').constructor;
const EvaluatorService = require('../src/evaluators/EvaluatorService');

describe('Submission State Machine & Resilience Tests', () => {
  let testProblem;
  let testAttempt;

  beforeAll(async () => {
    await connectDB();
    // Create clean test problem
    testProblem = await Problem.findOneAndUpdate(
      { slug: 'test-parking-lot' },
      {
        slug: 'test-parking-lot',
        title: 'Test Parking Lot System',
        description: 'Test description',
        requirements: ['Req 1', 'Req 2'],
        constraints: ['Con 1'],
        difficulty: 'Medium'
      },
      { upsert: true, new: true }
    );
  });

  beforeEach(async () => {
    testAttempt = await Attempt.create({
      problemId: testProblem._id,
      userId: 'test-learner',
      status: 'in_progress'
    });
  });

  afterAll(async () => {
    await Submission.deleteMany({ userId: 'test-learner' });
    await Attempt.deleteMany({ userId: 'test-learner' });
    await Evaluation.deleteMany({});
    await Problem.deleteOne({ slug: 'test-parking-lot' });
    await disconnectDB();
  });

  test('Submission is persisted even if the AI evaluator throws an error', async () => {
    // Mock AI Evaluator that throws
    const mockAiEvaluator = {
      evaluate: jest.fn().mockRejectedValue(new Error('Anthropic API 503 Overloaded'))
    };

    const mockEvaluatorService = new EvaluatorService({
      aiEvaluator: mockAiEvaluator
    });

    const submissionService = new SubmissionService({
      evaluatorService: mockEvaluatorService
    });

    const validContent = `
      class Vehicle { constructor(type) { this.type = type; } }
      class ParkingSpot { constructor(id) { this.id = id; } }
      class ParkingLot { constructor() { this.spots = []; } }
    `;

    const { submission } = await submissionService.createSubmission({
      attemptId: testAttempt._id,
      content: validContent,
      userId: 'test-learner',
      waitForEvaluation: true
    });

    // Verify submission is persisted in database and NOT lost
    const persisted = await Submission.findById(submission._id);
    expect(persisted).not.toBeNull();
    expect(persisted.content).toBe(validContent);
    expect(persisted.evaluationStatus).toBe('failed');
    expect(persisted.errorMessage).toContain('Anthropic API 503 Overloaded');

    // Attempt status should still be submitted
    const updatedAttempt = await Attempt.findById(testAttempt._id);
    expect(updatedAttempt.status).toBe('submitted');
  });

  test('Deterministic short-circuit: empty/too-short submission never calls AI evaluator', async () => {
    const mockAiEvaluator = {
      evaluate: jest.fn()
    };

    const submissionService = new SubmissionService({
      evaluatorService: new EvaluatorService({ aiEvaluator: mockAiEvaluator })
    });

    const shortContent = 'class Short { }'; // < 100 characters

    const { submission, evaluation } = await submissionService.createSubmission({
      attemptId: testAttempt._id,
      content: shortContent,
      userId: 'test-learner',
      waitForEvaluation: true
    });

    // AI evaluator must NEVER be invoked on short-circuit
    expect(mockAiEvaluator.evaluate).not.toHaveBeenCalled();

    // Submission should be completed with deterministic evaluation
    expect(submission.evaluationStatus).toBe('completed');
    expect(evaluation).not.toBeNull();
    expect(evaluation.evaluatorType).toBe('deterministic');
    expect(evaluation.overallSummary).toContain('Deterministic Validation Short-Circuit');
  });

  test('Duplicate submission (same content hash) reuses existing evaluation instead of calling AI evaluator', async () => {
    const validContent = `
      class Elevator { constructor(id) { this.id = id; this.currentFloor = 1; } }
      class ElevatorController { constructor() { this.elevators = []; } }
    `;

    const mockAiEvaluator = {
      evaluate: jest.fn().mockResolvedValue({
        rubricResults: [
          {
            criterion: 'class_responsibilities',
            score: 4,
            evidence: 'class Elevator',
            concern: 'None',
            suggestion: 'Good',
            confidence: 'high',
            evidenceVerified: true
          }
        ],
        overallSummary: 'Solid initial elevator model.'
      })
    };

    const submissionService = new SubmissionService({
      evaluatorService: new EvaluatorService({ aiEvaluator: mockAiEvaluator })
    });

    // First submission
    const res1 = await submissionService.createSubmission({
      attemptId: testAttempt._id,
      content: validContent,
      userId: 'test-learner',
      waitForEvaluation: true
    });

    expect(mockAiEvaluator.evaluate).toHaveBeenCalledTimes(1);
    expect(res1.submission.evaluationStatus).toBe('completed');

    // Second submission on a new attempt with IDENTICAL content
    const secondAttempt = await Attempt.create({
      problemId: testProblem._id,
      userId: 'test-learner',
      status: 'in_progress'
    });

    const res2 = await submissionService.createSubmission({
      attemptId: secondAttempt._id,
      content: validContent,
      userId: 'test-learner',
      waitForEvaluation: true
    });

    // Assert AI evaluator was NOT called again (idempotency reused cached evaluation!)
    expect(mockAiEvaluator.evaluate).toHaveBeenCalledTimes(1);
    expect(res2.submission.evaluationStatus).toBe('completed');
    expect(res2.submission.contentHash).toBe(res1.submission.contentHash);
    expect(res2.evaluation.overallSummary).toBe(res1.evaluation.overallSummary);
  });

  test('State machine validity: completed submission cannot transition back to evaluating', async () => {
    const validContent = `
      class VendingMachine { constructor() { this.state = 'IDLE'; } }
      class Inventory { constructor() { this.items = new Map(); } }
    `;

    const submissionService = new SubmissionService();

    const { submission } = await submissionService.createSubmission({
      attemptId: testAttempt._id,
      content: validContent,
      userId: 'test-learner',
      waitForEvaluation: true
    });

    expect(submission.evaluationStatus).toBe('completed');

    // Attempting to re-run processEvaluation on an already completed submission
    await submissionService.processEvaluation(submission._id);

    const reloaded = await Submission.findById(submission._id);
    expect(reloaded.evaluationStatus).toBe('completed');
  });
});
