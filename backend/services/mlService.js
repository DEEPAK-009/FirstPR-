const axios = require('axios');

const ML_API_URL = 'http://localhost:8000/predict';

const getPrediction = async (issue) => {
  try {
    const response = await axios.post(ML_API_URL, {
      title: issue.title,
      body: issue.body,
      comments: issue.comments,
      issue_length: issue.issue_length,
      label_count: issue.label_count
    });

    return response.data;

  } catch (error) {
    console.error("ML API Error:", error.message);
    return { is_beginner_friendly: false, confidence: 0 };
  }
};

module.exports = { getPrediction };