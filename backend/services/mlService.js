const axios = require('axios');

const ML_API_URL = 'http://localhost:8000/predict';

const getPrediction = async (issue) => {
  try {
    const response = await axios.post(ML_API_URL, {
      title: issue.title,
      body: issue.body,
      labels: issue.labels || ''
    });

    return {
      ...response.data,
      confidence: response.data.probability ?? 0
    };

  } catch (error) {
    console.error("ML API Error:", error.response?.data || error.message);

    const serviceError = new Error('ML service unavailable');
    serviceError.code = 'ML_API_UNAVAILABLE';
    throw serviceError;
  }
};

module.exports = { getPrediction };
