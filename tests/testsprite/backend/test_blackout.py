# TestSprite backend test: an admin blackout wins over an existing booking.
# sourceRef: docs/hackathon/API_CONTRACT.md (endpoint 19). Picks a free slot
# dynamically and cleans up the blackout. The backend runner needs the test
# function invoked at the bottom of the file.

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


def test_blackout_cancels_booking_and_blocks_slot():
    admin_token = login(ADMIN)
    member_token = login(MEMBER)
    studios = requests.get(f"{BASE_URL}/api/studios", timeout=30).json()
    studio = next(s for s in studios if s["slug"] == "resonance-music")

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

    # Member books the slot.
    hold = requests.post(f"{BASE_URL}/api/holds", headers=auth(member_token), json=body, timeout=30)
    assert hold.status_code == 201, hold.text
    booking = requests.post(
        f"{BASE_URL}/api/bookings", headers=auth(member_token), json={"holdId": hold.json()["id"]}, timeout=30
    )
    assert booking.status_code == 201, booking.text

    # Admin blacks out that exact slot; the booking is cancelled.
    blackout = requests.post(
        f"{BASE_URL}/api/blackouts",
        headers=auth(admin_token),
        json={"studioId": studio["id"], "startTs": slot["startTs"], "endTs": slot["endTs"], "reason": "maintenance"},
        timeout=30,
    )
    assert blackout.status_code == 201, blackout.text
    assert blackout.json()["cancelledBookings"] >= 1, blackout.text
    blackout_id = blackout.json()["id"]

    # The slot now reads as a blackout.
    after = requests.get(
        f"{BASE_URL}/api/studios/{studio['id']}/availability",
        params={"from": from_ms, "to": to_ms},
        timeout=30,
    ).json()["slots"]
    blacked = next(s for s in after if s["startTs"] == slot["startTs"])
    assert blacked["status"] == "blackout", blacked

    # Cleanup: remove the blackout so the slot frees for the next run.
    removed = requests.delete(f"{BASE_URL}/api/blackouts/{blackout_id}", headers=auth(admin_token), timeout=30)
    assert removed.status_code == 204, removed.text


test_blackout_cancels_booking_and_blocks_slot()
