const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPaths = [
  path.resolve(__dirname, '..', '.env'),
  path.resolve(__dirname, '..', '..', '.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const toPositiveInteger = (value, fallback) => {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return parsedValue;
};

module.exports = {
  port: toPositiveInteger(process.env.PORT, 5070),
  githubToken: process.env.GITHUB_TOKEN || '',
  mlApiUrl: process.env.ML_API_URL || 'http://localhost:8000/predict',
  mlPredictionConcurrency: toPositiveInteger(process.env.ML_PREDICTION_CONCURRENCY, 8),
  explanationConcurrency: toPositiveInteger(process.env.EXPLANATION_CONCURRENCY, 3)
};
