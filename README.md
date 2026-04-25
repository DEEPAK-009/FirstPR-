# GitHub Issue Recommender for Beginners

This project is a full-stack app that helps beginner developers discover GitHub issues that are more suitable for them to pick up.

It combines three parts:

- a React frontend
- an Express backend
- a Python ML service

The backend searches GitHub issues based on user-provided skills, sends each issue to a machine learning classifier to estimate whether it is beginner-friendly, and then generates a simple explanation for each shortlisted issue using Gemini.

## What Problem This Project Solves

Open source is a great place to learn, but finding a good first issue is hard. Many issues look interesting but are too vague, too large, or too advanced for a beginner.

This project tries to solve that by:

- searching GitHub issues using skill keywords
- filtering out weak or low-detail issues
- predicting whether an issue is beginner-friendly
- generating a plain-English explanation of what the issue means and how someone might approach it

In short, it acts like a beginner-focused issue discovery assistant.

## How The Project Works

The intended flow looks like this:

1. A user submits one or more skills such as `react`, `node`, or `python`.
2. The backend builds a GitHub search query from those skills.
3. The backend fetches open issues from GitHub Search API.
4. Issues with very short titles or bodies are filtered out.
5. Each remaining issue is sent to the Python ML API at `http://localhost:8000/predict`.
6. The ML model predicts whether the issue is beginner-friendly and returns a probability score.
7. Only issues predicted as beginner-friendly are kept.
8. Gemini generates a short beginner-friendly explanation for each selected issue.
9. The backend returns the final curated issue list as JSON.

## Current State Of The Project

The backend and ML service already contain the main recommendation pipeline.

The frontend is currently much smaller than the backend logic. Right now it mainly:

- loads an `AdminDashboard`
- checks whether the backend health endpoint is reachable
- displays backend connection status

So the full recommendation workflow exists in the backend, but the frontend does not yet expose a form or results UI for the issue recommendation feature.

## Tech Stack

### Frontend

- React 19
- Vite
- Axios
- Tailwind-based utility classes in the UI

### Backend

- Node.js
- Express
- Axios
- CORS
- dotenv

### ML Service

- FastAPI
- Uvicorn
- Pydantic
- scikit-learn pipeline loaded from `model.pkl`
- pickle for model serialization

### External APIs

- GitHub Search API
- Gemini Generative Language API

## Project Structure

```text
FirstPR/
├── README.md
├── backend/
│   ├── app.js
│   ├── server.js
│   ├── routes/
│   │   └── issueRoutes.js
│   ├── controllers/
│   │   └── issueController.js
│   ├── services/
│   │   ├── githubService.js
│   │   ├── mlService.js
│   │   └── geminiService.js
│   ├── utils/
│   │   └── queryBuilder.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── api/axios.js
│   │   └── pages/AdminDashboard.jsx
│   └── package.json
└── ml-service/
    ├── app.py
    ├── model.pkl
    ├── issues.csv
    ├── test.py
    └── ML-API.md
```

## Key Files Explained

### Backend

- `backend/server.js`
  Starts the Express server on port `5070`.

- `backend/app.js`
  Configures middleware, health routes, and mounts the issue recommendation routes.

- `backend/routes/issueRoutes.js`
  Exposes the main endpoint:
  `POST /api/issues/recommend`

- `backend/controllers/issueController.js`
  Orchestrates the full backend flow:
  GitHub fetch -> filtering -> ML predictions -> Gemini explanations -> final response

- `backend/services/githubService.js`
  Calls GitHub Search API using `GITHUB_TOKEN`.

- `backend/services/mlService.js`
  Sends issue data to the ML API running on port `8000`.

- `backend/services/geminiService.js`
  Calls Gemini to produce a short explanation for each recommended issue.

- `backend/utils/queryBuilder.js`
  Builds the GitHub search query from the skill list.

### Frontend

- `frontend/src/pages/AdminDashboard.jsx`
  Current UI screen. It checks backend health and shows whether the backend is reachable.

- `frontend/src/api/axios.js`
  Central Axios client pointing to `VITE_API_URL` or `http://localhost:5070/api`.

### ML Service

- `ml-service/app.py`
  FastAPI app that loads `model.pkl` and exposes prediction endpoints.

- `ml-service/model.pkl`
  Serialized trained ML pipeline used for prediction.

- `ml-service/test.py`
  Simple local script for testing the `/predict` endpoint.

- `ml-service/ML-API.md`
  Notes explaining the ML API architecture and request flow.

## API Endpoints

### Backend Endpoints

#### `GET /`

Returns a simple text response confirming the backend is running.

#### `GET /api/health`

Returns backend status:

```json
{
  "status": "ok",
  "port": 5070
}
```

#### `POST /api/issues/recommend`

Request body:

```json
{
  "skills": ["react", "node", "javascript"]
}
```

Typical response shape:

```json
{
  "total": 2,
  "issues": [
    {
      "title": "Fix mobile navbar overflow",
      "url": "https://github.com/example/repo/issues/123",
      "labels": ["good first issue", "frontend"],
      "comments": 3,
      "confidence": 0.91,
      "explanation": "..."
    }
  ]
}
```

### ML Service Endpoints

#### `GET /`

Returns a message confirming the classifier API is running.

#### `GET /health`

Returns whether the model was loaded successfully.

#### `POST /predict`

Request body:

```json
{
  "title": "Fix button alignment on mobile view",
  "body": "The Submit button overlaps the footer on screens below 480px.",
  "labels": "ui bug good first issue"
}
```

Response shape:

```json
{
  "prediction": 1,
  "is_beginner_friendly": true,
  "probability": 0.87,
  "input_received": {
    "title": "Fix button alignment on mobile view",
    "body": "The Submit button overlaps the footer on screens below 480px.",
    "labels": "ui bug good first issue"
  }
}
```

## Environment Variables

The code suggests these environment variables are needed:

### Backend

- `GITHUB_TOKEN`
  Required for GitHub Search API requests.

- `GEMINI_API_KEY`
  Required for explanation generation.

- `GEMINI_MODEL`
  Optional. Defaults to `gemini-2.5-flash`.

### Frontend

- `VITE_API_URL`
  Optional. Defaults to `http://localhost:5070/api`.

## How To Run The Project Locally

Because this repository does not currently include a Python `requirements.txt` or a root-level combined runner, you need to start the three parts separately.

### 1. Start the backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on:

```text
http://localhost:5070
```

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on Vite's local dev server, usually:

```text
http://localhost:5173
```

### 3. Start the ML service

From the `ml-service` folder, install the required Python packages if you have not already:

```bash
cd ml-service
pip install fastapi uvicorn scikit-learn pydantic requests
uvicorn app:app --reload
```

ML API runs on:

```text
http://localhost:8000
```

You can test it with:

```bash
python test.py
```

## Internal Request Flow

```text
Frontend
   |
   | HTTP request
   v
Express Backend (/api/issues/recommend)
   |
   | build skill query
   v
GitHub Search API
   |
   | issue list
   v
Backend filters short / weak issues
   |
   | one request per issue
   v
FastAPI ML Service (/predict)
   |
   | beginner-friendly prediction + probability
   v
Backend keeps only positive matches
   |
   | one prompt per selected issue
   v
Gemini API
   |
   | simplified explanation
   v
Final JSON response to client
```

## Strengths Of The Project

- Clear separation between UI, API, and ML logic
- Practical real-world use case around open-source onboarding
- Good service-based backend structure
- ML prediction and explanation generation are cleanly decoupled
- Health endpoints exist for both backend and ML service

## Limitations And Gaps In The Current Code

- The frontend does not yet provide a UI for entering skills and viewing recommended issues.
- The backend contains a `config/db.js` file, but database integration is not currently active in the app flow.
- The ML service URL and backend port are hardcoded in code.
- There is no `requirements.txt` for the Python service.
- There is no authentication or user persistence despite the frontend Axios client checking local storage for a token.
- Error handling is basic and can be improved for GitHub rate limits, empty results, and external API failures.
- GitHub search is currently driven only by free-text skill keywords and simple filters such as `comments:<10`.

## Suggested Next Improvements

- Build a real recommendation UI in the frontend with:
  - skill input
  - loading state
  - issue cards
  - explanation display

- Move hardcoded URLs and ports into environment variables.

- Add a Python `requirements.txt` for reproducible ML setup.

- Add better backend validation and more user-friendly error messages.

- Store search history or recommended issues if persistence is needed later.

- Improve GitHub query quality using labels like `good first issue`, language filters, or repository targeting.

## Summary

This project is a beginner-focused GitHub issue recommendation system powered by:

- GitHub issue search
- a machine learning classifier
- Gemini-generated explanations

Architecturally, the idea is strong and the backend pipeline is the most complete part of the project right now.

The biggest missing piece is the frontend product experience. Once the recommendation flow is connected to the UI, this can become a very solid end-to-end project for showcasing full-stack + ML integration.
