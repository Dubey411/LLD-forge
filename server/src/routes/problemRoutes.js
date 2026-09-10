const express = require('express');
const router = express.Router();
const problemController = require('../controllers/problemController');
const attemptController = require('../controllers/attemptController');

// List problems
router.get('/', problemController.getProblems);

// Get problem detail by slug
router.get('/:slug', problemController.getProblemBySlug);

// Start attempt for problem
router.post('/:slug/attempts', attemptController.createAttempt);

// Get attempt history with per-criterion deltas for problem
router.get('/:slug/attempts', attemptController.getAttemptsForProblem);

module.exports = router;
