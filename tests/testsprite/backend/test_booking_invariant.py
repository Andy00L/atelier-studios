# TestSprite backend test: the anti-double-booking invariant and the booking
# lifecycle. sourceRef: docs/hackathon/API_CONTRACT.md (endpoints 11-15) and
# BUILD_PLAN.md (E5). Picks a free slot dynamically so it is safely re-runnable,
# and cleans up (cancels) at the end. The backend runner needs the test function
# invoked at the bottom of the file.

import os
import random
import time

import requests

BASE_URL = os.environ.get("TESTSPRITE_TARGET_URL", "https://atelier-studios-opal.vercel.app")
MEMBER = {"email": "member@atelier.test", "password": "MemberPass#2026"}
ADMIN = {"email": "admin@atelier.test", "password": "AdminPass#2026"}
MS_PER_DAY = 24 * 60 * 60 * 1000


def login(credentials):
    response = requests.post(f"{BASE_URL}/api/auth/login", json=credentials, timeout=30)
    assert response.status_code == 200, response.text
    return response.json()["token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_anti_overlap_invariant_and_lifecycle():
    member_token = login(MEMBER)
    admin_token = login(ADMIN)

    studios = requests.get(f"{BASE_URL}/api/studios", timeout=30).json()
    studio = next(s for s in studios if s["slug"] == "aurora-photo")

    # Find a genuinely free slot in the next 7 days so the test is re-runnable.
    from_ms = int(time.time() * 1000) + MS_PER_DAY
    to_ms = from_ms + 6 * MS_PER_DAY
    availability = requests.get(
        f"{BASE_URL}/api/studios/{studio['id']}/availability",
        params={"from": from_ms, "to": to_ms},
        timeout=30,
    )
    assert availability.status_code == 200, availability.text
    free_slots = [slot for slot in availability.json()["slots"] if slot["status"] == "free"]
    assert len(free_slots) >= 2, "need at least two free slots to test conflict and adjacency"
    slot = random.choice(free_slots[:-1])

    # Member holds the free slot.
    hold = requests.post(
        f"{BASE_URL}/api/holds",
        headers=auth(member_token),
        json={"studioId": studio["id"], "startTs": slot["startTs"], "endTs": slot["endTs"]},
        timeout=30,
    )
    assert hold.status_code == 201, hold.text
    hold_id = hold.json()["id"]

    # Admin cannot hold the same slot: the invariant rejects the overlap.
    conflict = requests.post(
        f"{BASE_URL}/api/holds",
        headers=auth(admin_token),
        json={"studioId": studio["id"], "startTs": slot["startTs"], "endTs": slot["endTs"]},
        timeout=30,
    )
    assert conflict.status_code == 409, conflict.text
    assert conflict.json()["error"]["code"] == "SLOT_CONFLICT", conflict.text

    # Member confirms the hold into a booking.
    booking = requests.post(
        f"{BASE_URL}/api/bookings", headers=auth(member_token), json={"holdId": hold_id}, timeout=30
    )
    assert booking.status_code == 201, booking.text
    booking_id = booking.json()["id"]
    reference = booking.json()["reference"]
    assert reference.startswith("ATL-") and len(reference) == 10, booking.text

    # Confirming the same hold again returns the SAME booking (idempotent), not a duplicate.
    again = requests.post(
        f"{BASE_URL}/api/bookings", headers=auth(member_token), json={"holdId": hold_id}, timeout=30
    )
    assert again.status_code == 200, again.text
    assert again.json()["id"] == booking_id, again.text

    # The slot now reads as booked.
    after = requests.get(
        f"{BASE_URL}/api/studios/{studio['id']}/availability",
        params={"from": from_ms, "to": to_ms},
        timeout=30,
    ).json()["slots"]
    booked = next(s for s in after if s["startTs"] == slot["startTs"])
    assert booked["status"] == "booked", booked

    # Cleanup so the slot frees for the next run.
    cancelled = requests.delete(
        f"{BASE_URL}/api/bookings/{booking_id}", headers=auth(member_token), timeout=30
    )
    assert cancelled.status_code == 204, cancelled.text


test_anti_overlap_invariant_and_lifecycle()
