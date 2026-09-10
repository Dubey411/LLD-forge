const submissionService = require('../services/submissionService');

class SubmissionController {
  async createSubmission(req, res) {
    try {
      const { id: attemptId } = req.params;
      const { content, waitForEvaluation } = req.body;
      const userId = req.body.userId || req.headers['x-user-id'] || 'demo-user';

      if (!content || typeof content !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Content is required and must be a non-empty string.'
        });
      }

      // Supports waitForEvaluation flag (useful for synchronous tests and CLI scripts)
      const result = await submissionService.createSubmission({
        attemptId,
        content,
        userId,
        waitForEvaluation: Boolean(waitForEvaluation)
      });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('[SubmissionController] createSubmission error:', error);
      const status = error.message.includes('not found') ? 404 : 400;
      res.status(status).json({ success: false, error: error.message });
    }
  }

  async getSubmissionById(req, res) {
    try {
      const { id } = req.params;
      const result = await submissionService.getSubmissionById(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: `Submission with ID "${id}" not found.`
        });
      }

      res.json({
        success: true,
        data: {
          submission: result.submission,
          evaluation: result.evaluation
        }
      });
    } catch (error) {
      console.error('[SubmissionController] getSubmissionById error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new SubmissionController();
