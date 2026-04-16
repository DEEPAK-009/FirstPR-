const { fetchIssuesFromGitHub } = require("../services/githubService");

const recommendIssues = async (req, res) => {
  try {
    const { skills } = req.body;

    // 🔥 Fetch issues
    const issues = await fetchIssuesFromGitHub(skills);

    res.json({
      total: issues.length,
      issues: issues.map((issue) => ({
        title: issue.title,
        body: issue.body,
        url: issue.html_url,
        labels: issue.labels.map((label) => label.name),
        comments: issue.comments,
        issue_length: issue.body ? issue.body.length : 0,
        label_count: issue.labels.length,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch issues" });
  }
};

module.exports = { recommendIssues };
