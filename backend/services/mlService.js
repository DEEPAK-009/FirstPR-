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
      { timeout: 15000 }
    );

    return {
      ...response.data,
      confidence: response.data.probability ?? 0
    };

  } catch (error) {
    console.error("ML API Error:", error.response?.data || error.message, `(Target URL: ${mlApiUrl})`);

    const serviceError = new Error('ML service unavailable');
    serviceError.code = 'ML_API_UNAVAILABLE';
    throw serviceError;
  }
};

module.exports = { getPrediction };
