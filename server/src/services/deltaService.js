const { RUBRIC_CRITERIA } = require('../config/rubric');

class DeltaService {
  /**
   * Computes per-criterion deltas between two sets of rubric results.
   * @param {Array} currentRubricResults - Rubric results from the current attempt
   * @param {Array} [previousRubricResults] - Rubric results from the immediately preceding attempt
   * @returns {Array} Array of criterion deltas
   */
  computeRubricDeltas(currentRubricResults = [], previousRubricResults = []) {
    const prevMap = new Map();
    if (Array.isArray(previousRubricResults)) {
      previousRubricResults.forEach(item => {
        prevMap.set(item.criterion, item.score);
      });
    }

    const currentMap = new Map();
    if (Array.isArray(currentRubricResults)) {
      currentRubricResults.forEach(item => {
        currentMap.set(item.criterion, item.score);
      });
    }

    return RUBRIC_CRITERIA.map(criterion => {
      const currentScore = currentMap.has(criterion.key) ? currentMap.get(criterion.key) : null;
      const prevScore = prevMap.has(criterion.key) ? prevMap.get(criterion.key) : null;

      if (prevScore === null || currentScore === null) {
        return {
          criterion: criterion.key,
          label: criterion.label,
          currentScore,
          prevScore,
          diff: null,
          direction: 'baseline',
          formatted: currentScore !== null ? `${currentScore} (Baseline)` : 'N/A'
        };
      }

      const diff = currentScore - prevScore;
      let direction = 'unchanged';
      let arrow = '↔';

      if (diff > 0) {
        direction = 'improved';
        arrow = '↑';
      } else if (diff < 0) {
        direction = 'regressed';
        arrow = '↓';
      }

      const sign = diff > 0 ? `+${diff}` : `${diff}`;
      const formatted = diff === 0
        ? `${currentScore} ↔ unchanged`
        : `${prevScore} → ${currentScore} (${sign} ${arrow})`;

      return {
        criterion: criterion.key,
        label: criterion.label,
        currentScore,
        prevScore,
        diff,
        direction,
        formatted
      };
    });
  }

  /**
   * Enriches a chronological list of attempts with evaluations and per-criterion deltas.
   * @param {Array} attempts - List of attempt documents (sorted ascending by startedAt/createdAt)
   * @param {Map<string, Object>} evaluationByAttemptId - Map of attemptId -> Evaluation document
   * @returns {Array} Enriched attempts with deltas against immediately preceding attempt
   */
  enrichAttemptsWithDeltas(attempts, evaluationByAttemptId) {
    let lastCompletedEvaluation = null;

    return attempts.map((attempt, index) => {
      const attemptObj = attempt.toJSON ? attempt.toJSON() : { ...attempt };
      const evaluation = evaluationByAttemptId.get(attempt._id.toString()) || null;

      let deltas = null;
      if (evaluation && evaluation.rubricResults) {
        if (lastCompletedEvaluation && lastCompletedEvaluation.rubricResults) {
          deltas = this.computeRubricDeltas(evaluation.rubricResults, lastCompletedEvaluation.rubricResults);
        } else {
          // First attempt with completed evaluation serves as baseline
          deltas = this.computeRubricDeltas(evaluation.rubricResults, null);
        }
        lastCompletedEvaluation = evaluation;
      }

      return {
        ...attemptObj,
        attemptNumber: index + 1,
        evaluation,
        deltas
      };
    });
  }
}

module.exports = new DeltaService();
