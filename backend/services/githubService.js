const axios = require('axios');
const { buildQuery } = require('../utils/queryBuilder');
const GITHUB_BASE_URL = 'https://api.github.com/search/issues';

const fetchIssuesFromGitHub = async (skills) => {
  try {
    // 🔥 Build query dynamically
    const query = buildQuery(skills);

    const response = await axios.get(GITHUB_BASE_URL, {
      params: {
        q: query,
        per_page: 20
      },
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
      }
    });

    return response.data.items;

  } catch (error) {
    console.error("GitHub API Error:", error.message);
    throw error;
  }
};

module.exports = { fetchIssuesFromGitHub };