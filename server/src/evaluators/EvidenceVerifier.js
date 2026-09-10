/**
 * Deterministic Evidence Verifier Guard.
 * Ensures the AI's cited evidence is actually present in the learner's submission text.
 */

class EvidenceVerifier {
  /**
   * Normalize text by lowering case and collapsing whitespace.
   */
  static normalize(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .toLowerCase()
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Strip leading and trailing quotes, brackets, and markdown backticks.
   */
  static cleanSnippet(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .trim()
      .replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, '')
      .trim();
  }

  /**
   * Computes simple bigram/token overlap ratio between evidence and candidate window.
   */
  static tokenOverlapRatio(evidenceTokens, textTokens) {
    if (!evidenceTokens.length) return 0;
    const textSet = new Set(textTokens);
    let matched = 0;
    for (const tok of evidenceTokens) {
      if (textSet.has(tok)) matched++;
    }
    return matched / evidenceTokens.length;
  }

  /**
   * Verifies if evidence is present in the submission as an exact substring or close match.
   * @param {string} evidence - The evidence quote provided by the evaluator
   * @param {string} submissionContent - Full content submitted by the learner
   * @returns {{ verified: boolean, confidence: 'high'|'low', reason: string }}
   */
  static verify(evidence, submissionContent) {
    const cleanedEvidence = this.cleanSnippet(evidence);
    const normEvidence = this.normalize(cleanedEvidence);
    const normSubmission = this.normalize(submissionContent);

    // If evidence is empty or placeholder
    if (!normEvidence || normEvidence === '[insufficient content to cite]' || normEvidence.length < 4) {
      return {
        verified: false,
        confidence: 'low',
        reason: 'Empty or trivial evidence string'
      };
    }

    // 1. Direct exact or normalized substring check
    if (normSubmission.includes(normEvidence)) {
      return {
        verified: true,
        confidence: 'high',
        reason: 'Exact normalized substring match'
      };
    }

    // 2. Sub-chunk check: if evidence is long (e.g. 50+ chars), check if the first 35 chars
    // or middle 35 chars are an exact match (handles minor trailing ellipses or truncations)
    if (normEvidence.length > 30) {
      const startChunk = normEvidence.slice(0, 30);
      const endChunk = normEvidence.slice(-30);
      if (normSubmission.includes(startChunk) || normSubmission.includes(endChunk)) {
        return {
          verified: true,
          confidence: 'high',
          reason: 'Prefix or suffix chunk match'
        };
      }
    }

    // 3. Token-based fuzzy overlap check for slight spacing or punctuation edits
    const evidenceTokens = normEvidence.split(/\s+/).filter(t => t.length > 2);
    const submissionTokens = normSubmission.split(/\s+/);
    const ratio = this.tokenOverlapRatio(evidenceTokens, submissionTokens);

    if (evidenceTokens.length >= 3 && ratio >= 0.85) {
      return {
        verified: true,
        confidence: 'high',
        reason: `Fuzzy token overlap matched (${Math.round(ratio * 100)}%)`
      };
    }

    // Unverified: Model fabricated or hallucinated quote
    return {
      verified: false,
      confidence: 'low', // Force confidence low when verification fails
      reason: 'Evidence quote not found in learner submission'
    };
  }

  /**
   * Applies verification guard across all rubric results in an evaluation.
   * Modifies each result with verified flag and forces confidence='low' if unverified.
   * @param {Array} rubricResults
   * @param {string} submissionContent
   * @returns {Array} Guarded rubric results
   */
  static guardRubricResults(rubricResults, submissionContent) {
    if (!Array.isArray(rubricResults)) return [];

    return rubricResults.map(result => {
      const verification = this.verify(result.evidence, submissionContent);

      return {
        ...result,
        evidenceVerified: verification.verified,
        // If unverified, always force low confidence regardless of what the evaluator claimed
        confidence: verification.verified ? (result.confidence || 'high') : 'low'
      };
    });
  }
}

module.exports = EvidenceVerifier;
