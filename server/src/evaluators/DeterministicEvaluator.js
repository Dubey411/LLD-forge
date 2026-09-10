const Evaluator = require('./Evaluator');
const { RUBRIC_CRITERIA } = require('../config/rubric');

class DeterministicEvaluator extends Evaluator {
  constructor() {
    super('deterministic');
  }

  /**
   * Validates whether a submission meets minimum deterministic structural standards:
   * 1. Non-empty and minimum ~100 characters.
   * 2. Contains at least 2 of:
   *    - "class" keyword
   *    - "interface" keyword
   *    - Capitalized entity noun pattern (e.g., Vehicle, ParkingSpot, Elevator)
   *
   * @param {string} content - Raw learner submission text
   * @returns {{ isValid: boolean, failureReasons: string[], matchedCount: number }}
   */
  checkStructuralValidity(content) {
    const trimmed = (content || '').trim();
    const failureReasons = [];

    if (!trimmed || trimmed.length < 100) {
      failureReasons.push(`Submission length is ${trimmed.length} characters (minimum required is 100 characters).`);
    }

    const hasClass = /\bclass\b/i.test(trimmed);
    const hasInterface = /\binterface\b/i.test(trimmed);

    // Look for capitalized noun/entity tokens (excluding common noise tokens like I, A, The)
    const entityMatches = trimmed.match(/\b[A-Z][a-zA-Z0-9_]{2,}\b/g) || [];
    const hasCapitalizedEntity = entityMatches.length >= 1;

    let structuralMatches = 0;
    if (hasClass) structuralMatches++;
    if (hasInterface) structuralMatches++;
    if (hasCapitalizedEntity) structuralMatches++;

    if (structuralMatches < 2) {
      const missing = [];
      if (!hasClass) missing.push('"class" keyword');
      if (!hasInterface) missing.push('"interface" keyword');
      if (!hasCapitalizedEntity) missing.push('capitalized entity name (e.g. ParkingSpot, ElevatorController)');
      failureReasons.push(
        `Lacks sufficient OOP structural markers (found ${structuralMatches}/3, minimum 2 required). Missing: ${missing.join(', ')}.`
      );
    }

    return {
      isValid: failureReasons.length === 0,
      failureReasons,
      matchedCount: structuralMatches,
      sampleSnippet: trimmed.slice(0, 100)
    };
  }

  /**
   * Generates a deterministic short-circuit evaluation for invalid or too-short inputs.
   */
  async evaluate({ problem, content }) {
    const check = this.checkStructuralValidity(content);
    const summaryReason = check.failureReasons.join(' ');
    const snippet = content && content.trim().length > 0
      ? content.trim().slice(0, 80)
      : '[No text submitted]';

    const rubricResults = RUBRIC_CRITERIA.map(criterion => {
      let score = 0;
      let concern = `Deterministic check failed: ${summaryReason}`;
      let suggestion = `Provide explicit class or interface definitions adhering to the ${criterion.label} principle.`;

      if (criterion.key === 'requirement_understanding') {
        suggestion = 'Ensure all stated functional requirements and constraints are addressed with concrete domain entities.';
      } else if (criterion.key === 'class_responsibilities') {
        suggestion = 'Define dedicated classes for each distinct actor/entity in the domain with single responsibility.';
      } else if (criterion.key === 'encapsulation_interfaces') {
        suggestion = 'Define public interfaces or abstract contracts to establish clean boundaries.';
      }

      return {
        criterion: criterion.key,
        score,
        evidence: snippet,
        concern,
        suggestion,
        confidence: 'high',
        evidenceVerified: true
      };
    });

    return {
      evaluatorType: 'deterministic',
      rubricResults,
      overallSummary: `Deterministic Validation Short-Circuit: The submission does not meet the minimum requirements for AI evaluation. ${summaryReason} Please expand your design with concrete classes, interfaces, and methods.`
    };
  }
}

module.exports = DeterministicEvaluator;
