const { fetchIssuesFromGitHub } = require("../services/githubService");
const { getPrediction } = require('../services/mlService');
const { generateExplanation } = require('../services/geminiService');

const recommendIssues = async (req, res) => {
  try {
    const { skills } = req.body;

    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        error: 'skills must be a non-empty array'
      });
    }

    // 🔥 1. Fetch issues from GitHub
    const issues = await fetchIssuesFromGitHub(skills);

    // 🔥 2. Filter low-quality issues
    const filteredIssues = issues.filter(issue =>
      issue.body &&
      issue.body.length > 50 &&
      issue.title.length > 10
    );

    // 🔥 3. Get ML predictions (parallel)
    let predictions;

    try {
      predictions = await Promise.all(
        filteredIssues.map(issue => getPrediction({
          title: issue.title,
          body: issue.body,
          labels: issue.labels.map(label => label.name).join(' ')
        }))
      );
    } catch (error) {
      if (error.code === 'ML_API_UNAVAILABLE') {
        return res.status(503).json({ error: 'ML service unavailable' });
      }

      throw error;
    }

    // 🔥 4. Keep only beginner-friendly issues
    const mlFiltered = filteredIssues
      .map((issue, i) => ({
        ...issue,
        prediction: predictions[i]
      }))
      .filter(item => item.prediction.is_beginner_friendly);

    // 🔥 5. Gemini explanations (parallel)
    const explanations = await Promise.all(
      mlFiltered.map(issue => generateExplanation(issue))
    );

    // 🔥 6. Final response formatting
    const finalResults = mlFiltered.map((issue, i) => ({
      title: issue.title,
      url: issue.html_url,
      labels: issue.labels.map(l => l.name),
      comments: issue.comments,
      confidence: issue.prediction.confidence,
      explanation: explanations[i]
    }));

    res.json({
      total: finalResults.length,
      issues: finalResults
    });

  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to process issues" });
  }
};

module.exports = { recommendIssues };
