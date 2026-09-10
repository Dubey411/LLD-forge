const problemService = require('../services/problemService');
const { RUBRIC_CRITERIA } = require('../config/rubric');

class ProblemController {
  async getProblems(req, res) {
    try {
      const problems = await problemService.getAllProblems();
      res.json({
        success: true,
        count: problems.length,
        rubricCriteria: RUBRIC_CRITERIA,
        data: problems
      });
    } catch (error) {
      console.error('[ProblemController] getProblems error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve problems.' });
    }
  }

  async getProblemBySlug(req, res) {
    try {
      const { slug } = req.params;
      const problem = await problemService.getProblemBySlug(slug);

      if (!problem) {
        return res.status(404).json({
          success: false,
          error: `Problem with slug "${slug}" not found.`
        });
      }

      res.json({
        success: true,
        rubricCriteria: RUBRIC_CRITERIA,
        data: problem
      });
    } catch (error) {
      console.error('[ProblemController] getProblemBySlug error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve problem details.' });
    }
  }
}

module.exports = new ProblemController();
