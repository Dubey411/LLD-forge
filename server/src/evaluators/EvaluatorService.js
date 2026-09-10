const DeterministicEvaluator = require('./DeterministicEvaluator');
const AIEvaluator = require('./AIEvaluator');

class EvaluatorService {
  /**
   * @param {Object} options
   * @param {DeterministicEvaluator} [options.deterministicEvaluator]
   * @param {AIEvaluator} [options.aiEvaluator]
   */
  constructor(options = {}) {
    this.deterministicEvaluator = options.deterministicEvaluator || new DeterministicEvaluator();
    this.aiEvaluator = options.aiEvaluator || new AIEvaluator();
  }

  /**
   * Evaluates content using the multi-stage evaluation pipeline:
   * 1. Deterministic structural check (short-circuit if too short or lacking OOP entities).
   * 2. AI Evaluator (if structural checks pass) with strict rubric scoring & evidence verification guard.
   *
   * @param {Object} params
   * @param {Object} params.problem
   * @param {string} params.content
   * @param {Object} [params.submission]
   * @returns {Promise<{ evaluationData: Object, isShortCircuit: boolean }>}
   */
  async evaluateSubmission({ problem, content, submission }) {
    // 1. Check deterministic gate
    const gateCheck = this.deterministicEvaluator.checkStructuralValidity(content);

    if (!gateCheck.isValid) {
      console.log(`[EvaluatorService] Deterministic short-circuit triggered for submission. Reasons: ${gateCheck.failureReasons.join('; ')}`);
      const evaluationData = await this.deterministicEvaluator.evaluate({ problem, content, submission });
      return {
        isShortCircuit: true,
        evaluationData
      };
    }

    // 2. Structural checks passed; invoke AI Evaluator (which includes EvidenceVerifier guard)
    console.log(`[EvaluatorService] Structural checks passed. Invoking AI Evaluator.`);
    const evaluationData = await this.aiEvaluator.evaluate({ problem, content, submission });

    return {
      isShortCircuit: false,
      evaluationData
    };
  }
}

module.exports = EvaluatorService;
