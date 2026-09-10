/**
 * Abstract Base Evaluator interface.
 * Any evaluation strategy (Deterministic, AI, Human Review) must implement this contract.
 */
class Evaluator {
  /**
   * @param {string} type - 'deterministic' | 'ai'
   */
  constructor(type) {
    if (new.target === Evaluator) {
      throw new TypeError('Cannot construct Evaluator instance directly.');
    }
    this.type = type;
  }

  /**
   * Evaluate a submission against problem requirements and rubric.
   * @param {Object} params
   * @param {Object} params.problem - The Problem Mongoose document or object
   * @param {string} params.content - Plain text/pseudocode submitted by learner
   * @param {Object} [params.submission] - The Submission document
   * @returns {Promise<{ evaluatorType: string, rubricResults: Array, overallSummary: string }>}
   */
  async evaluate({ problem, content, submission }) {
    throw new Error('Method evaluate() must be implemented by subclass.');
  }
}

module.exports = Evaluator;
