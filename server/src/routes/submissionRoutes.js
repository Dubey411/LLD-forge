const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');

// Get submission status and evaluation (polled by frontend)
router.get('/:id', submissionController.getSubmissionById);

module.exports = router;
