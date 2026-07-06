# TestSprite backend test: ownership and existence edges on holds and bookings.
# sourceRef: docs/hackathon/API_CONTRACT.md (endpoints 12-13). The backend runner
# needs the test function invoked at the bottom of the file.

import os
import random
import time

import requests

BASE_URL = os.environ.get("TESTSPRITE_TARGET_URL", "https://atelier-studios-opal.vercel.app")
ADMIN = {"email": "admin@atelier.test", "password": "AdminPass#2026"}
MEMBER = {"email": "member@atelier.test", "password": "MemberPass#2026"}
MS_PER_DAY = 24 * 60 * 60 * 1000


def login(credentials):
    response = requests.post(f"{BASE_URL}/api/auth/login", json=credentials, timeout=30)
    assert response.status_code == 200, response.text
    return response.json()["token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_hold_ownership_and_existence_edges():
    member_token = login(MEMBER)
    admin_token = login(ADMIN)
    studios = requests.get(f"{BASE_URL}/api/studios", timeout=30).json()
    studio = next(s for s in studios if s["slug"] == "signal-podcast")

    from_ms = int(time.time() * 1000) + MS_PER_DAY
    to_ms = from_ms + 6 * MS_PER_DAY
    slots = requests.get(
        f"{BASE_URL}/api/studios/{studio['id']}/availability",
        params={"from": from_ms, "to": to_ms},
        timeout=30,
    ).json()["slots"]
    free = [slot for slot in slots if slot["status"] == "free"]
    assert len(free) >= 1, "need a free slot"
    slot = random.choice(free)
    body = {"studioId": studio["id"], "startTs": slot["startTs"], "endTs": slot["endTs"]}

    # Member places a hold.
    hold = requests.post(f"{BASE_URL}/api/holds", headers=auth(member_token), json=body, timeout=30)
    assert hold.status_code == 201, hold.text
    hold_id = hold.json()["id"]

    # The admin (a different user) cannot confirm the member's hold.
    foreign_confirm = requests.post(
        f"{BASE_URL}/api/bookings", headers=auth(admin_token), json={"holdId": hold_id}, timeout=30
    )
    assert foreign_confirm.status_code == 403, foreign_confirm.text
    assert foreign_confirm.json()["error"]["code"] == "FORBIDDEN", foreign_confirm.text

    # The admin cannot release the member's hold either.
    foreign_release = requests.delete(f"{BASE_URL}/api/holds/{hold_id}", headers=auth(admin_token), timeout=30)
    assert foreign_release.status_code == 403, foreign_release.text

    # Confirming a hold that does not exist is a 404.
    unknown = requests.post(
        f"{BASE_URL}/api/bookings", headers=auth(member_token), json={"holdId": "nonexistent-hold-id"}, timeout=30
    )
    assert unknown.status_code == 404, unknown.text

    # The owner releases the hold cleanly.
    released = requests.delete(f"{BASE_URL}/api/holds/{hold_id}", headers=auth(member_token), timeout=30)
    assert released.status_code == 204, released.text


test_hold_ownership_and_existence_edges()
