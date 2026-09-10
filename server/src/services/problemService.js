const { Problem } = require('../models');

class ProblemService {
  async getAllProblems() {
    return Problem.find({}).sort({ difficulty: 1, title: 1 });
  }

  async getProblemBySlug(slug) {
    if (!slug) return null;
    return Problem.findOne({ slug: slug.toLowerCase().trim() });
  }
}

module.exports = new ProblemService();
