const express = require('express');
const router = express.Router();

const { recommendIssues } = require('../controllers/issueController');

router.post('/recommend', recommendIssues);

module.exports = router;