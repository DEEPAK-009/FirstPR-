What We Built & How It All Works Together

The Big Picture
You had an ML model sitting in a Jupyter notebook that could only run inside that notebook. We turned it into a live API that any app, script, or person can talk to over the internet.
Before:  Jupyter Notebook  →  only you could use it, manually
After:   localhost API      →  anyone/anything can send a request and get a prediction

Technologies Used
1. 🧠 Scikit-learn (your ML model)
This is the library that actually does the machine learning. Inside your notebook, it built a Pipeline made of two steps:

TF-IDF Vectorizer — converts raw text (title + body + labels) into numbers the model can understand
Logistic Regression — looks at those numbers and decides: beginner-friendly (1) or not (0)

The trained pipeline was saved into model.pkl using pickle (Python's way of freezing an object to disk).

2. 📦 Pickle (model.pkl)
Think of this as a "freeze and save" tool. After training, your notebook froze the entire pipeline — including all the learned weights — into a single file. The API then loads this file on startup so it doesn't need to retrain every time.
Notebook trains → saves model.pkl → API loads model.pkl → serves predictions

3. ⚡ FastAPI (your API framework)
This is the Python framework that turned your prediction function into a web endpoint. It handles:

Receiving incoming requests at /predict
Validating the input (checks that title, body, labels are present)
Sending back a JSON response

It also auto-generated the /docs page — the interactive UI — for free.

4. 🦄 Uvicorn (the server)
FastAPI is just a framework — it needs something to actually run it and listen for requests. That's Uvicorn. When you ran:
bashuvicorn app:app --reload
Uvicorn started a server on port 8000 and kept watching for code changes (--reload).

5. 🔍 Pydantic (data validation)
This comes bundled with FastAPI. When you defined IssueRequest, Pydantic automatically:

Checked that the incoming JSON had the right fields
Threw a clean error if something was missing or wrong typed
No manual validation code needed


6. 📨 Requests (your test script)
The requests library in test.py is what you used to simulate sending an issue to your API — just like a frontend app or another service would do in production.

How It All Flows Together
test.py (requests)
      │
      │  POST /predict
      │  { title, body, labels }
      ▼
Uvicorn (server on :8000)
      │
      ▼
FastAPI (routes the request to your predict function)
      │
      ▼
Pydantic (validates the input)
      │
      ▼
model.pkl loaded (pickle)
      │
      ▼
Scikit-learn Pipeline
  ├── TF-IDF → converts text to numbers
  └── Logistic Regression → predicts 0 or 1
      │
      ▼
JSON response back to test.py
{ prediction, is_beginner_friendly, probability }