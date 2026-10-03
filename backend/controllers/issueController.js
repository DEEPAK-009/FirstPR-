const { fetchIssuesFromGitHub } = require("../services/githubService");
const { getPrediction } = require('../services/mlService');
const { generateExplanation } = require('../services/grokService');
const {
  explanationConcurrency,
  mlPredictionConcurrency
} = require('../config/env');
const { buildMatchReason } = require('../utils/matchReason');
const { runWithConcurrency } = require('../utils/runWithConcurrency');
const {
  buildCacheKey,
  getCachedSearch,
  setCachedSearch
} = require('../services/cacheService');
const INITIAL_GITHUB_FETCH_SIZE = 100;
const MAX_GITHUB_PAGES = 5;
const MIN_PRE_ML_CANDIDATES = 25;
const MIN_FINAL_RESULTS = 5;
const RELAXED_BODY_MIN_LENGTH = 20;
const DEFAULT_MIN_CONFIDENCE = 0;
const MAX_EXPLANATION_BATCH = 6;

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

const formatIssue = (issue, explanation, skills) => ({
  title: issue.title || 'Untitled issue',
  repo: getRepoName(issue),
  url: issue.html_url,
  labels: issue.labels.map((label) => label.name),
  comments: issue.comments ?? 0,
  openedAt: issue.created_at || null,
  confidence: issue.prediction?.confidence ?? 0,
  explanation: explanation || null,
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

const normalizeMinConfidence = (value) => {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_MIN_CONFIDENCE;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    throw new Error('minConfidence must be a valid number');
  }

  if (numericValue < 0) {
    return 0;
  }

  if (numericValue > 1) {
    return Math.min(numericValue / 100, 1);
  }

  return numericValue;
};

const calculateHeuristicPrediction = (issue) => {
  const labelNames = (issue.labels || []).map((l) =>
    (typeof l === 'string' ? l : l.name || '').toLowerCase()
  );
  const labelString = labelNames.join(' ');
  const title = (issue.title || '').toLowerCase();

  let score = 0.52; // baseline confidence for GitHub candidates

  // Strong beginner indicators in labels
  if (labelString.includes('good first issue') || labelString.includes('good-first-issue')) score += 0.25;
  if (labelString.includes('beginner') || labelString.includes('first-timers-only')) score += 0.20;
  if (labelString.includes('easy') || labelString.includes('starter') || labelString.includes('up-for-grabs')) score += 0.15;
  if (labelString.includes('help wanted') || labelString.includes('documentation') || labelString.includes('docs')) score += 0.10;

  // Well-specified descriptions (optimal length for beginners)
  const bodyLength = (issue.body || '').length;
  if (bodyLength >= 80 && bodyLength <= 3000) score += 0.05;

  // Low contention (easy to claim)
  const comments = issue.comments ?? 0;
  if (comments <= 2) score += 0.05;
  if (comments > 15) score -= 0.12;

  // Negative indicators (heavy architecture / complex)
  if (title.includes('refactor') || title.includes('redesign') || title.includes('vulnerability')) score -= 0.15;

  const confidence = Math.min(0.95, Math.max(0.35, Math.round(score * 100) / 100));

  return {
    prediction: confidence >= 0.45 ? 1 : 0,
    is_beginner_friendly: confidence >= 0.45,
    confidence,
    fallback: true
  };
};

const predictBeginnerFriendlyIssues = async (issues, predictionCache) => {
  const issuesToPredict = issues.filter((issue) => !predictionCache.has(issue.id));

  if (issuesToPredict.length > 0) {
    let predictions;
    let fallbackNeeded = false;

    try {
      predictions = await runWithConcurrency(
        issuesToPredict,
        mlPredictionConcurrency,
        (issue) =>
          getPrediction({
            title: issue.title,
            body: issue.body,
            labels: (issue.labels || []).map((label) => (typeof label === 'string' ? label : label.name || '')).join(' ')
          })
      );
    } catch (error) {
      if (error.code === 'ML_API_UNAVAILABLE') {
        console.warn(`[ML Service Warning] ML API unavailable (${error.message}). Activating intelligent heuristic fallback.`);
        fallbackNeeded = true;
      } else {
        throw error;
      }
    }

    if (fallbackNeeded) {
      predictions = issuesToPredict.map(calculateHeuristicPrediction);
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
    const { skills, minConfidence } = req.body;

    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        error: 'skills must be a non-empty array'
      });
    }

    let appliedMinConfidence;

    try {
      appliedMinConfidence = normalizeMinConfidence(minConfidence);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    const cacheKey = buildCacheKey(skills, appliedMinConfidence);
    const cachedResponse = await getCachedSearch(cacheKey);

    if (cachedResponse) {
      return res.json({
        ...cachedResponse,
        cached: true
      });
    }

    // Fetch issues from GitHub with pagination fallback.
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

      strictUsableIssues = rankByConfidence(
        (predictionResult.issues || []).filter(
          (issue) => (issue.prediction?.confidence ?? 0) >= appliedMinConfidence
        )
      );

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

    // Relax the backend quality filter only if strict candidates are still too few.
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

      finalCandidateIssues = rankByConfidence(
        mergeUniqueIssues([
          ...strictUsableIssues,
          ...(relaxedPredictionResult.issues || []).filter(
            (issue) => (issue.prediction?.confidence ?? 0) >= appliedMinConfidence
          )
        ])
      );

      usedRelaxedFiltering = relaxedCandidates.length > 0;
    }

    const finalResults = finalCandidateIssues.map((issue) =>
      formatIssue(issue, null, skills)
    );

    const responsePayload = {
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
      filters: {
        minConfidence: appliedMinConfidence
      },
      total: finalResults.length,
      issues: finalResults
    };

    await setCachedSearch(cacheKey, responsePayload);

    res.json(responsePayload);

  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to process issues" });
  }
};

const explainIssue = async (req, res) => {
  try {
    const { title, body, labels } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Issue title is required' });
    }

    const explanation = await generateExplanation({
      title,
      body: body || '',
      labels: labels || []
    });

    res.json({ explanation });
  } catch (error) {
    console.error("Explain Issue Error:", error);
    res.status(500).json({ error: "Failed to generate explanation" });
  }
};

module.exports = { recommendIssues, explainIssue, normalizeMinConfidence };
