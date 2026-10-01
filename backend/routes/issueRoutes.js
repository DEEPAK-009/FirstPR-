const express = require('express');
const router = express.Router();

const { recommendIssues, explainIssue } = require('../controllers/issueController');

router.post('/recommend', recommendIssues);
router.post('/explain', explainIssue);

module.exports = router;