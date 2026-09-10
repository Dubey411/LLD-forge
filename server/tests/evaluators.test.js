const DeterministicEvaluator = require('../src/evaluators/DeterministicEvaluator');
const EvidenceVerifier = require('../src/evaluators/EvidenceVerifier');
const { RUBRIC_KEYS } = require('../src/config/rubric');

describe('DeterministicEvaluator & EvidenceVerifier', () => {
  const deterministicEvaluator = new DeterministicEvaluator();

  describe('DeterministicEvaluator structural gate', () => {
    test('rejects empty or whitespace-only input', () => {
      const result = deterministicEvaluator.checkStructuralValidity('   ');
      expect(result.isValid).toBe(false);
      expect(result.failureReasons.some(r => r.includes('minimum required is 100'))).toBe(true);
    });

    test('rejects input under 100 characters even with class keyword', () => {
      const short = 'class Parking { park() {} }';
      const result = deterministicEvaluator.checkStructuralValidity(short);
      expect(result.isValid).toBe(false);
      expect(result.failureReasons.some(r => r.includes('characters'))).toBe(true);
    });

    test('rejects 100+ character prose that lacks OOP constructs', () => {
      const prose = 'This is a long text explaining how a parking lot should work in general. Cars enter and cars exit. There is a gate and a ticket system and people pay money before leaving the lot. We should keep track of spots.';
      expect(prose.length).toBeGreaterThan(100);
      const result = deterministicEvaluator.checkStructuralValidity(prose);
      expect(result.isValid).toBe(false);
      expect(result.failureReasons.some(r => r.includes('OOP structural markers'))).toBe(true);
    });

    test('accepts valid 100+ character input containing class and entity markers', () => {
      const valid = `
        class Vehicle {
          constructor(license, type) {
            this.license = license;
            this.type = type;
          }
        }
        class ParkingSpot {
          constructor(id) {
            this.id = id;
            this.isFree = true;
          }
        }
      `;
      expect(valid.length).toBeGreaterThan(100);
      const result = deterministicEvaluator.checkStructuralValidity(valid);
      expect(result.isValid).toBe(true);
      expect(result.failureReasons).toHaveLength(0);
    });

    test('generates short-circuit evaluation populating all 7 criteria', async () => {
      const problem = {
        title: 'Parking Lot',
        requirements: ['Req 1', 'Req 2'],
        constraints: []
      };
      const shortCircuit = await deterministicEvaluator.evaluate({
        problem,
        content: 'too short'
      });

      expect(shortCircuit.evaluatorType).toBe('deterministic');
      expect(shortCircuit.rubricResults).toHaveLength(7);
      expect(shortCircuit.overallSummary).toContain('Deterministic Validation Short-Circuit');

      const keys = shortCircuit.rubricResults.map(r => r.criterion);
      RUBRIC_KEYS.forEach(k => {
        expect(keys).toContain(k);
      });
      shortCircuit.rubricResults.forEach(r => {
        expect(r.score).toBe(0);
        expect(r.evidenceVerified).toBe(true);
      });
    });
  });

  describe('EvidenceVerifier guard', () => {
    const submissionContent = `
      class ElevatorController {
        constructor(numElevators) {
          this.elevators = [];
        }
        dispatchRequest(floor, direction) {
          return this.elevators[0];
        }
      }
    `;

    test('verifies exact substring evidence', () => {
      const evidence = 'this.elevators = [];';
      const res = EvidenceVerifier.verify(evidence, submissionContent);
      expect(res.verified).toBe(true);
      expect(res.confidence).toBe('high');
    });

    test('verifies evidence with normalized whitespace', () => {
      const evidence = 'dispatchRequest(floor,   direction)';
      const res = EvidenceVerifier.verify(evidence, submissionContent);
      expect(res.verified).toBe(true);
      expect(res.confidence).toBe('high');
    });

    test('rejects fabricated/hallucinated evidence quote and forces confidence=low', () => {
      const fakeEvidence = 'synchronized void lockAllGatesForEmergency()';
      const res = EvidenceVerifier.verify(fakeEvidence, submissionContent);
      expect(res.verified).toBe(false);
      expect(res.confidence).toBe('low');
    });

    test('guardRubricResults overrides confidence to low when quote is unverified', () => {
      const mockRubricResults = [
        {
          criterion: 'class_responsibilities',
          score: 4,
          evidence: 'class ElevatorController',
          concern: 'none',
          suggestion: 'good',
          confidence: 'high'
        },
        {
          criterion: 'edge_cases',
          score: 1,
          evidence: 'totally fabricated quote not present anywhere',
          concern: 'hallucinated evidence',
          suggestion: 'fix quote',
          confidence: 'high' // AI claims high confidence
        }
      ];

      const guarded = EvidenceVerifier.guardRubricResults(mockRubricResults, submissionContent);
      expect(guarded[0].evidenceVerified).toBe(true);
      expect(guarded[0].confidence).toBe('high');

      expect(guarded[1].evidenceVerified).toBe(false);
      expect(guarded[1].confidence).toBe('low'); // Guard forced confidence to low!
    });
  });
});
