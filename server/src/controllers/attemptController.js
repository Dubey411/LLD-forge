const attemptService = require('../services/attemptService');

class AttemptController {
  async createAttempt(req, res) {
    try {
      const { slug } = req.params;
      const userId = req.body.userId || req.headers['x-user-id'] || 'demo-user';

      const attempt = await attemptService.createAttempt({
        problemSlug: slug,
        userId
      });

      res.status(201).json({
        success: true,
        data: attempt
      });
    } catch (error) {
      console.error('[AttemptController] createAttempt error:', error);
      const status = error.message.includes('not found') ? 404 : 400;
      res.status(status).json({ success: false, error: error.message });
    }
  }

  async getAttemptsForProblem(req, res) {
    try {
      const { slug } = req.params;
      const userId = req.query.userId || req.headers['x-user-id'] || 'demo-user';

      const history = await attemptService.getAttemptsForProblem({
        problemSlug: slug,
        userId
      });

      res.json({
        success: true,
        count: history.length,
        data: history
      });
    } catch (error) {
      console.error('[AttemptController] getAttemptsForProblem error:', error);
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ success: false, error: error.message });
    }
  }
}

module.exports = new AttemptController();
