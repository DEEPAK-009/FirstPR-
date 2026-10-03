const axios = require('axios');
const { mlApiUrl } = require('../config/env');

const getPrediction = async (issue) => {
  try {
    const response = await axios.post(
      mlApiUrl,
      {
        title: issue.title || '',
        body: issue.body || '',
        labels: issue.labels || ''
      },
      { timeout: 10000 }
    );

    return {
      ...response.data,
      confidence: response.data.probability ?? 0
    };

  } catch (error) {
    const serviceError = new Error(`ML API error: ${error.response?.data?.detail || error.message}`);
    serviceError.code = 'ML_API_UNAVAILABLE';
    throw serviceError;
  }
};

module.exports = { getPrediction };
