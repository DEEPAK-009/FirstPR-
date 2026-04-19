from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pickle
from pathlib import Path

# --- Load model artifact ---
MODEL_PATH = Path("model.pkl")

if not MODEL_PATH.exists():
    raise FileNotFoundError("model.pkl not found. Run your notebook first to generate it.")

with MODEL_PATH.open("rb") as f:
    artifact = pickle.load(f)

pipeline = artifact["pipeline"]

# --- App setup ---
app = FastAPI(
    title="Beginner Issue Classifier API",
    description="Predicts whether a GitHub issue is beginner-friendly.",
    version="1.0.0"
)

# --- Request & Response schemas ---
class IssueRequest(BaseModel):
    title: str
    body: str = ""
    labels: str = ""

class PredictionResponse(BaseModel):
    prediction: int          # 1 = beginner-friendly, 0 = not
    is_beginner_friendly: bool
    probability: float
    input_received: dict

# --- Predict endpoint ---
@app.post("/predict", response_model=PredictionResponse)
def predict(issue: IssueRequest):
    try:
        issue_text = " ".join([issue.title, issue.body, issue.labels]).lower().strip()
        prediction = int(pipeline.predict([issue_text])[0])
        probability = float(pipeline.predict_proba([issue_text])[0, 1])

        return {
            "prediction": prediction,
            "is_beginner_friendly": bool(prediction),
            "probability": round(probability, 4),
            "input_received": issue.model_dump()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Health check ---
@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": pipeline is not None}

# --- Root ---
@app.get("/")
def root():
    return {"message": "Beginner Issue Classifier API is running. Go to /docs to test it."}