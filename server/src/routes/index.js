const express = require('express');
const router = express.Router();

const problemRoutes = require('./problemRoutes');
const attemptRoutes = require('./attemptRoutes');
const submissionRoutes = require('./submissionRoutes');
const { RUBRIC_CRITERIA } = require('../config/rubric');

router.use('/problems', problemRoutes);
router.use('/attempts', attemptRoutes);
router.use('/submissions', submissionRoutes);

// Health check & Rubric metadata
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

router.get('/rubric', (req, res) => {
  res.json({ success: true, criteria: RUBRIC_CRITERIA });
});

module.exports = router;
