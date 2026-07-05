# TestSprite backend test: authorization boundaries and input validation.
# sourceRef: docs/hackathon/API_CONTRACT.md (auth, holds, availability). Read and
# validation focused, so it mutates no lasting state. The backend runner needs the
# test function invoked at the bottom.

import os

import requests

BASE_URL = os.environ.get("TESTSPRITE_TARGET_URL", "https://atelier-studios-opal.vercel.app")
MEMBER = {"email": "member@atelier.test", "password": "MemberPass#2026"}
MS_PER_DAY = 24 * 60 * 60 * 1000
MS_PER_HOUR = 60 * 60 * 1000


def login(credentials):
    response = requests.post(f"{BASE_URL}/api/auth/login", json=credentials, timeout=30)
    assert response.status_code == 200, response.text
    return response.json()["token"]


def hour_aligned(offset_days, utc_hour):
    import time

    base = int(time.time() * 1000) + offset_days * MS_PER_DAY
    day_start = base - (base % (24 * MS_PER_HOUR))
    return day_start + utc_hour * MS_PER_HOUR


def test_authorization_and_validation():
    member_token = login(MEMBER)
    headers = {"Authorization": f"Bearer {member_token}"}
    studios = requests.get(f"{BASE_URL}/api/studios", timeout=30).json()
    studio = next(s for s in studios if s["slug"] == "aurora-photo")

    # Anonymous requests to protected routes are rejected.
    assert requests.post(f"{BASE_URL}/api/holds", json={}, timeout=30).status_code == 401
    assert requests.get(f"{BASE_URL}/api/bookings", timeout=30).status_code == 401

    # A member cannot create a studio (admin only).
    forbidden = requests.post(
        f"{BASE_URL}/api/studios",
        headers=headers,
        json={
            "name": "Nope",
            "description": "x",
            "equipment": [],
            "hourlyPriceCents": 100,
            "photoUrl": "/x",
            "openHour": 8,
            "closeHour": 20,
        },
        timeout=30,
    )
    assert forbidden.status_code == 403, forbidden.text
    assert forbidden.json()["error"]["code"] == "FORBIDDEN", forbidden.text

    # A slot in the past is rejected.
    past = hour_aligned(-2, 10)
    past_hold = requests.post(
        f"{BASE_URL}/api/holds",
        headers=headers,
        json={"studioId": studio["id"], "startTs": past, "endTs": past + MS_PER_HOUR},
        timeout=30,
    )
    assert past_hold.status_code == 422, past_hold.text
    assert past_hold.json()["error"]["code"] == "SLOT_IN_PAST", past_hold.text

    # A misaligned slot (not on the hour grid) is a validation error.
    misaligned_start = hour_aligned(2, 10) + 5 * 60 * 1000
    misaligned = requests.post(
        f"{BASE_URL}/api/holds",
        headers=headers,
        json={"studioId": studio["id"], "startTs": misaligned_start, "endTs": misaligned_start + MS_PER_HOUR},
        timeout=30,
    )
    assert misaligned.status_code == 400, misaligned.text
    assert misaligned.json()["error"]["code"] == "VALIDATION_ERROR", misaligned.text

    # A slot outside the studio's open hours (03:00 UTC, studio opens 08:00) is rejected.
    closed_start = hour_aligned(2, 3)
    closed = requests.post(
        f"{BASE_URL}/api/holds",
        headers=headers,
        json={"studioId": studio["id"], "startTs": closed_start, "endTs": closed_start + MS_PER_HOUR},
        timeout=30,
    )
    assert closed.status_code == 422, closed.text
    assert closed.json()["error"]["code"] == "OUTSIDE_OPEN_HOURS", closed.text

    # An availability window wider than 14 days is a validation error.
    now_ms = hour_aligned(0, 0)
    wide = requests.get(
        f"{BASE_URL}/api/studios/{studio['id']}/availability",
        params={"from": now_ms, "to": now_ms + 15 * MS_PER_DAY},
        timeout=30,
    )
    assert wide.status_code == 400, wide.text
    assert wide.json()["error"]["code"] == "VALIDATION_ERROR", wide.text


test_authorization_and_validation()
