const { fetchIssuesFromGitHub } = require("../services/githubService");
const { getPrediction } = require('../services/mlService');
const { generateExplanation } = require('../services/geminiService');
const INITIAL_GITHUB_FETCH_SIZE = 100;
const MAX_GITHUB_PAGES = 5;
const MIN_PRE_ML_CANDIDATES = 25;
const MIN_FINAL_RESULTS = 5;
const RELAXED_BODY_MIN_LENGTH = 20;

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

const isRelaxedIssue = (issue) =>
  issue.body &&
  issue.body.length > RELAXED_BODY_MIN_LENGTH &&
  issue.title.length > 10;

const mergeUniqueIssues = (issues) => {
  const seenIssueIds = new Set();

  return issues.filter((issue) => {
    if (seenIssueIds.has(issue.id)) {
      return false;
    }

    seenIssueIds.add(issue.id);
    return true;
  });
};

const rankByConfidence = (issues) =>
  [...issues].sort(
    (left, right) => (right.prediction?.confidence ?? 0) - (left.prediction?.confidence ?? 0)
  );

const predictBeginnerFriendlyIssues = async (issues, predictionCache) => {
  const issuesToPredict = issues.filter((issue) => !predictionCache.has(issue.id));

  if (issuesToPredict.length > 0) {
    let predictions;

    try {
      predictions = await Promise.all(
        issuesToPredict.map((issue) =>
          getPrediction({
            title: issue.title,
            body: issue.body,
            labels: issue.labels.map((label) => label.name).join(' ')
          })
        )
      );
    } catch (error) {
      if (error.code === 'ML_API_UNAVAILABLE') {
        return { error };
      }

      throw error;
    }

    issuesToPredict.forEach((issue, index) => {
      predictionCache.set(issue.id, predictions[index]);
    });
  }

  return {
    issues: issues
      .map((issue) => ({
        ...issue,
        prediction: predictionCache.get(issue.id)
      }))
      .filter((issue) => issue.prediction?.is_beginner_friendly)
  };
};

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
    const predictionCache = new Map();
    let page = 1;
    let pagesFetched = 0;
    let strictCandidates = [];
    let strictUsableIssues = [];
    let githubTotalCount = 0;
    let incompleteResults = false;

    while (page <= MAX_GITHUB_PAGES) {
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

      strictCandidates = issues.filter(isStrongIssue);

      const predictionResult = await predictBeginnerFriendlyIssues(
        strictCandidates,
        predictionCache
      );

      if (predictionResult.error?.code === 'ML_API_UNAVAILABLE') {
        return res.status(503).json({ error: 'ML service unavailable' });
      }

      strictUsableIssues = rankByConfidence(predictionResult.issues || []);

      const hasEnoughStrongCandidates = strictCandidates.length >= MIN_PRE_ML_CANDIDATES;
      const hasEnoughUsableResults = strictUsableIssues.length >= MIN_FINAL_RESULTS;

      if (response.items.length < INITIAL_GITHUB_FETCH_SIZE) {
        break;
      }

      if (hasEnoughStrongCandidates && hasEnoughUsableResults) {
        break;
      }

      page += 1;
    }

    // 🔥 3. Relax the backend quality filter only if strict candidates are still too few
    let finalCandidateIssues = strictUsableIssues;
    let relaxedCandidates = [];
    let usedRelaxedFiltering = false;

    if (finalCandidateIssues.length < MIN_FINAL_RESULTS) {
      relaxedCandidates = issues.filter(
        (issue) => !isStrongIssue(issue) && isRelaxedIssue(issue)
      );

      const relaxedPredictionResult = await predictBeginnerFriendlyIssues(
        relaxedCandidates,
        predictionCache
      );

      if (relaxedPredictionResult.error?.code === 'ML_API_UNAVAILABLE') {
        return res.status(503).json({ error: 'ML service unavailable' });
      }

      finalCandidateIssues = rankByConfidence(
        mergeUniqueIssues([
          ...strictUsableIssues,
          ...(relaxedPredictionResult.issues || [])
        ])
      );

      usedRelaxedFiltering = relaxedCandidates.length > 0;
    }

    // 🔥 4. Gemini explanations (parallel)
    const explanations = await Promise.all(
      finalCandidateIssues.map(issue => generateExplanation(issue))
    );

    // 🔥 5. Final response formatting
    const finalResults = finalCandidateIssues.map((issue, i) =>
      formatIssue(issue, explanations[i], skills)
    );

    res.json({
      github: {
        fetched: issues.length,
        strongCandidates: strictCandidates.length,
        strictUsableResults: strictUsableIssues.length,
        relaxedCandidates: relaxedCandidates.length,
        usedRelaxedFiltering,
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
