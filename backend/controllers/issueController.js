const { fetchIssuesFromGitHub } = require("../services/githubService");
const { getPrediction } = require('../services/mlService');
const { generateExplanation } = require('../services/geminiService');

const recommendIssues = async (req, res) => {
  try {
    const { skills } = req.body;

    // 🔥 1. Fetch issues from GitHub
    const issues = await fetchIssuesFromGitHub(skills);

    // 🔥 2. Filter low-quality issues
    const filteredIssues = issues.filter(issue =>
      issue.body &&
      issue.body.length > 50 &&
      issue.title.length > 10
    );

    // 🔥 3. Get ML predictions (parallel)
    const predictions = await Promise.all(
      filteredIssues.map(issue => getPrediction({
        title: issue.title,
        body: issue.body,
        comments: issue.comments,
        issue_length: issue.body.length,
        label_count: issue.labels.length
      }))
    );

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