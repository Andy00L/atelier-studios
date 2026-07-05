# TestSprite backend test: the auth lifecycle. sourceRef:
# docs/hackathon/API_CONTRACT.md (endpoints 1-4). Uses a fresh random email each
# run so it is safely re-runnable, and still exercises the duplicate-email path.

import os
import uuid

import requests

BASE_URL = os.environ.get("TESTSPRITE_TARGET_URL", "https://atelier-studios-opal.vercel.app")


def test_register_login_me_logout_and_duplicate():
    email = f"user_{uuid.uuid4().hex[:12]}@atelier.test"
    password = "Password#12345"

    registered = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": email, "password": password, "name": "Loop Test User"},
        timeout=30,
    )
    assert registered.status_code == 201, registered.text
    assert registered.json()["role"] == "member", registered.text

    duplicate = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": email, "password": password, "name": "Loop Test User"},
        timeout=30,
    )
    assert duplicate.status_code == 409, duplicate.text
    assert duplicate.json()["error"]["code"] == "EMAIL_TAKEN", duplicate.text

    wrong = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email, "password": "wrong-password"},
        timeout=30,
    )
    assert wrong.status_code == 401, wrong.text

    logged_in = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email, "password": password},
        timeout=30,
    )
    assert logged_in.status_code == 200, logged_in.text
    token = logged_in.json()["token"]
    assert isinstance(token, str) and len(token) > 0

    me = requests.get(
        f"{BASE_URL}/api/me",
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    assert me.status_code == 200, me.text
    assert me.json()["email"] == email, me.text

    requests.post(
        f"{BASE_URL}/api/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    after_logout = requests.get(
        f"{BASE_URL}/api/me",
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    assert after_logout.status_code == 401, after_logout.text


# The backend runner executes top-to-bottom and does NOT auto-collect test_*
# like pytest: a defined-but-uncalled test passes vacuously. Invoke it.
test_register_login_me_logout_and_duplicate()
