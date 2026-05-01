const { fetchIssuesFromGitHub } = require("../services/githubService");
const { getPrediction } = require('../services/mlService');
const { generateExplanation } = require('../services/geminiService');
const INITIAL_GITHUB_FETCH_SIZE = 100;
const MAX_GITHUB_PAGES = 3;
const MIN_PRE_ML_CANDIDATES = 25;

const getRepoName = (issue) => {
  if (issue.repository_url?.includes('/repos/')) {
    return issue.repository_url.split('/repos/')[1];
  }

  if (issue.html_url?.includes('github.com/')) {
    const [, repoPath] = issue.html_url.split('github.com/');
    return repoPath?.split('/issues/')[0] || 'unknown repository';
  }

  return 'unknown repository';
};

const buildMatchReason = (issue, skills) => {
  const normalizedSkills = skills
    .map((skill) => String(skill).trim())
    .filter(Boolean);

  const searchableText = [
    issue.title,
    issue.body || '',
    issue.labels.map((label) => label.name).join(' ')
  ]
    .join(' ')
    .toLowerCase();

  const matchedSkills = normalizedSkills.filter((skill) =>
    searchableText.includes(skill.toLowerCase())
  );

  if (matchedSkills.length === 0) {
    return 'Matches your submitted skills based on the issue content and labels.';
  }

  if (matchedSkills.length === 1) {
    return `Matches your "${matchedSkills[0]}" skill based on the issue content and labels.`;
  }

  const topMatches = matchedSkills.slice(0, 2).join('" and "');
  return `Matches your "${topMatches}" skills based on the issue content and labels.`;
};

const formatIssue = (issue, explanation, skills) => ({
  title: issue.title || 'Untitled issue',
  repo: getRepoName(issue),
  url: issue.html_url,
  labels: issue.labels.map((label) => label.name),
  comments: issue.comments ?? 0,
  openedAt: issue.created_at || null,
  confidence: issue.prediction?.confidence ?? 0,
  explanation: explanation || 'Explanation not available',
  originalBody: issue.body || 'No description provided',
  matchReason: buildMatchReason(issue, skills)
});

const isStrongIssue = (issue) =>
  issue.body &&
  issue.body.length > 50 &&
  issue.title.length > 10;

const recommendIssues = async (req, res) => {
  try {
    const { skills } = req.body;

    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        error: 'skills must be a non-empty array'
      });
    }

    // 🔥 1. Fetch issues from GitHub with pagination fallback
    const issues = [];
    const seenIssueIds = new Set();
    let page = 1;
    let pagesFetched = 0;
    let filteredIssues = [];
    let githubTotalCount = 0;
    let incompleteResults = false;

    while (page <= MAX_GITHUB_PAGES && filteredIssues.length < MIN_PRE_ML_CANDIDATES) {
      const response = await fetchIssuesFromGitHub(skills, {
        page,
        perPage: INITIAL_GITHUB_FETCH_SIZE
      });

      githubTotalCount = response.totalCount;
      incompleteResults = response.incompleteResults;
      pagesFetched += 1;

      response.items.forEach((issue) => {
        if (!seenIssueIds.has(issue.id)) {
          seenIssueIds.add(issue.id);
          issues.push(issue);
        }
      });

      filteredIssues = issues.filter(isStrongIssue);

      if (response.items.length < INITIAL_GITHUB_FETCH_SIZE) {
        break;
      }

      page += 1;
    }

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
    const finalResults = mlFiltered.map((issue, i) =>
      formatIssue(issue, explanations[i], skills)
    );

    res.json({
      github: {
        fetched: issues.length,
        strongCandidates: filteredIssues.length,
        pagesFetched,
        totalCount: githubTotalCount,
        incompleteResults
      },
      total: finalResults.length,
      issues: finalResults
    });

  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to process issues" });
  }
};

module.exports = { recommendIssues };
