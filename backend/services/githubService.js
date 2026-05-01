const axios = require('axios');
const { buildQuery } = require('../utils/queryBuilder');
const GITHUB_BASE_URL = 'https://api.github.com/search/issues';
const DEFAULT_PER_PAGE = 100;

const fetchIssuesFromGitHub = async (skills, options = {}) => {
  try {
    const query = buildQuery(skills);
    const {
      page = 1,
      perPage = DEFAULT_PER_PAGE
    } = options;

    const response = await axios.get(GITHUB_BASE_URL, {
      params: {
        q: query,
        per_page: perPage,
        page
      },
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
      }
    });

    return {
      items: response.data.items || [],
      totalCount: response.data.total_count || 0,
      incompleteResults: response.data.incomplete_results || false,
      page,
      perPage
    };

  } catch (error) {
    console.error("GitHub API Error:", error.response?.data || error.message);
    throw error;
  }
};

module.exports = { fetchIssuesFromGitHub };
