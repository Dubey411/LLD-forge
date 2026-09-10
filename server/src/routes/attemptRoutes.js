const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');

// Submit design content for an attempt
router.post('/:id/submissions', submissionController.createSubmission);

module.exports = router;
