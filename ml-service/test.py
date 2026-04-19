import requests

response = requests.post("http://localhost:8000/predict", json={
    "title": "Fix button alignment on mobile view",
    "body": "The Submit button overlaps the footer on screens < 480px.",
    "labels": "ui bug good first issue"
})
print(response.json())