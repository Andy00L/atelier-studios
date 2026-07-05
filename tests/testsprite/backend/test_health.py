# TestSprite backend test: the health endpoint. sourceRef:
# docs/hackathon/API_CONTRACT.md (endpoint 21). Banks the loop baseline.

import os

import requests

BASE_URL = os.environ.get("TESTSPRITE_TARGET_URL", "https://atelier-studios-opal.vercel.app")


def test_health_ok():
    response = requests.get(f"{BASE_URL}/api/health", timeout=30)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "ok", body
    assert body["service"] == "atelier-studios", body
    assert isinstance(body["commit"], str) and len(body["commit"]) > 0, body


# The backend runner executes top-to-bottom and does NOT auto-collect test_*
# like pytest: a defined-but-uncalled test passes vacuously. Invoke it.
test_health_ok()
