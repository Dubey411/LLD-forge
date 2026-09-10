const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const { Problem, Attempt, Submission, Evaluation } = require('../src/models');

describe('Full Happy-Path Integration Flow', () => {
  const testUserId = 'integration-test-user';
  let problemSlug = 'parking-lot';

  beforeAll(async () => {
    await connectDB();
    // Ensure parking-lot problem exists
    await Problem.findOneAndUpdate(
      { slug: 'parking-lot' },
      {
        slug: 'parking-lot',
        title: 'Design a Multi-Level Parking Lot System',
        description: 'Design parking lot',
        requirements: ['Support vehicle types', 'Assign spot'],
        constraints: ['Max spots 100'],
        difficulty: 'Medium',
        tags: ['OOP', 'Concurrency']
      },
      { upsert: true, new: true }
    );
  });

  afterAll(async () => {
    const attempts = await Attempt.find({ userId: testUserId });
    const attemptIds = attempts.map(a => a._id);
    const submissions = await Submission.find({ attemptId: { $in: attemptIds } });
    const submissionIds = submissions.map(s => s._id);

    await Evaluation.deleteMany({ submissionId: { $in: submissionIds } });
    await Submission.deleteMany({ _id: { $in: submissionIds } });
    await Attempt.deleteMany({ _id: { $in: attemptIds } });
    await disconnectDB();
  });

  test('E2E Loop: Browse problems -> Create Attempt 1 -> Submit -> Poll -> Create Attempt 2 -> Verify Delta', async () => {
    // 1. List problems
    const listRes = await request(app).get('/api/problems');
    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.data)).toBe(true);

    // 2. Get Problem Detail
    const detailRes = await request(app).get(`/api/problems/${problemSlug}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.slug).toBe(problemSlug);

    // 3. Create First Attempt (Baseline)
    const attempt1Res = await request(app)
      .post(`/api/problems/${problemSlug}/attempts`)
      .send({ userId: testUserId });
    expect(attempt1Res.status).toBe(201);
    const attempt1Id = attempt1Res.body.data.id;
    expect(attempt1Id).toBeDefined();

    // 4. Submit Design 1
    const code1 = `
      class Vehicle {
        constructor(licensePlate, type) {
          this.licensePlate = licensePlate;
          this.type = type;
        }
      }
      class ParkingSpot {
        constructor(id, type) {
          this.id = id;
          this.type = type;
        }
      }
      class SimpleParkingLot {
        constructor() {
          this.spots = [];
        }
      }
    `;

    const sub1Res = await request(app)
      .post(`/api/attempts/${attempt1Id}/submissions`)
      .send({ content: code1, userId: testUserId, waitForEvaluation: true });

    expect(sub1Res.status).toBe(201);
    const sub1Id = sub1Res.body.data.submission.id;
    expect(sub1Id).toBeDefined();

    // 5. Poll Submission 1
    const poll1Res = await request(app).get(`/api/submissions/${sub1Id}`);
    expect(poll1Res.status).toBe(200);
    expect(poll1Res.body.data.submission.evaluationStatus).toBe('completed');
    expect(poll1Res.body.data.evaluation).toBeDefined();
    expect(poll1Res.body.data.evaluation.rubricResults.length).toBe(7);

    // 6. Create Second Attempt (Iteration)
    const attempt2Res = await request(app)
      .post(`/api/problems/${problemSlug}/attempts`)
      .send({ userId: testUserId });
    expect(attempt2Res.status).toBe(201);
    const attempt2Id = attempt2Res.body.data.id;

    // 7. Submit Improved Design 2
    const code2 = `
      interface IParkingStrategy {
        allocate(spots, vehicle);
      }
      class Vehicle {
        constructor(licensePlate, type) {
          this.licensePlate = licensePlate;
          this.type = type;
        }
      }
      class ParkingSpot {
        constructor(id, type) {
          this.id = id;
          this.type = type;
          this.isFree = true;
        }
      }
      class AdvancedParkingLot {
        constructor(strategy) {
          this.spots = [];
          this.strategy = strategy;
        }
      }
    `;

    const sub2Res = await request(app)
      .post(`/api/attempts/${attempt2Id}/submissions`)
      .send({ content: code2, userId: testUserId, waitForEvaluation: true });

    expect(sub2Res.status).toBe(201);

    // 8. Fetch Attempt History & Verify Per-Criterion Deltas
    const historyRes = await request(app).get(`/api/problems/${problemSlug}/attempts?userId=${testUserId}`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.count).toBe(2);

    const latestAttempt = historyRes.body.data[0];
    expect(latestAttempt.deltas).toBeDefined();
    expect(latestAttempt.deltas.length).toBe(7);
    expect(latestAttempt.deltas[0]).toHaveProperty('formatted');
    expect(latestAttempt.deltas[0]).toHaveProperty('direction');
  });
});
