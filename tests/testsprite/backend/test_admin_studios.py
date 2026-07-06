# TestSprite backend test: admin studio CRUD and the member authorization wall.
# sourceRef: docs/hackathon/API_CONTRACT.md (endpoints 5-9). Uses a unique studio
# name per run so it is re-runnable. The backend runner needs the test function
# invoked at the bottom of the file.

import os
import uuid

import requests

BASE_URL = os.environ.get("TESTSPRITE_TARGET_URL", "https://atelier-studios-opal.vercel.app")
ADMIN = {"email": "admin@atelier.test", "password": "AdminPass#2026"}
MEMBER = {"email": "member@atelier.test", "password": "MemberPass#2026"}


def login(credentials):
    response = requests.post(f"{BASE_URL}/api/auth/login", json=credentials, timeout=30)
    assert response.status_code == 200, response.text
    return response.json()["token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_admin_studio_crud_and_member_wall():
    admin_token = login(ADMIN)
    member_token = login(MEMBER)

    unique = uuid.uuid4().hex[:8]
    payload = {
        "name": f"Test Room {unique}",
        "description": "A temporary room created by the loop.",
        "equipment": ["stand", "light"],
        "hourlyPriceCents": 5000,
        "photoUrl": "/studios/test.jpg",
        "openHour": 9,
        "closeHour": 18,
    }

    # A member cannot create a studio.
    member_attempt = requests.post(f"{BASE_URL}/api/studios", headers=auth(member_token), json=payload, timeout=30)
    assert member_attempt.status_code == 403, member_attempt.text
    assert member_attempt.json()["error"]["code"] == "FORBIDDEN", member_attempt.text

    # The admin creates it.
    created = requests.post(f"{BASE_URL}/api/studios", headers=auth(admin_token), json=payload, timeout=30)
    assert created.status_code == 201, created.text
    studio = created.json()
    studio_id = studio["id"]
    slug = studio["slug"]
    assert studio["hourlyPriceCents"] == 5000, studio

    # It appears in the public listing and by slug.
    by_slug = requests.get(f"{BASE_URL}/api/studios/{slug}", timeout=30)
    assert by_slug.status_code == 200, by_slug.text

    # The admin updates the price.
    updated = requests.patch(
        f"{BASE_URL}/api/studios/{studio_id}",
        headers=auth(admin_token),
        json={"hourlyPriceCents": 7500},
        timeout=30,
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["hourlyPriceCents"] == 7500, updated.text

    # The admin soft-deletes it; it then drops out of the public listing.
    deleted = requests.delete(f"{BASE_URL}/api/studios/{studio_id}", headers=auth(admin_token), timeout=30)
    assert deleted.status_code == 204, deleted.text
    gone = requests.get(f"{BASE_URL}/api/studios/{slug}", timeout=30)
    assert gone.status_code == 404, gone.text


test_admin_studio_crud_and_member_wall()
