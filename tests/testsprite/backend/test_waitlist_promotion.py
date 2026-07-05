# TestSprite backend test: waitlist eligibility and promotion on cancellation.
# sourceRef: docs/hackathon/API_CONTRACT.md (endpoints 15-16) and BUILD_PLAN.md
# (E6). Picks a free slot dynamically and cleans up. The backend runner needs the
# test function invoked at the bottom.

import os
import random
import time

import requests

BASE_URL = os.environ.get("TESTSPRITE_TARGET_URL", "https://atelier-studios-opal.vercel.app")
MEMBER = {"email": "member@atelier.test", "password": "MemberPass#2026"}
ADMIN = {"email": "admin@atelier.test", "password": "AdminPass#2026"}
MS_PER_DAY = 24 * 60 * 60 * 1000
MS_PER_HOUR = 60 * 60 * 1000


def login(credentials):
    response = requests.post(f"{BASE_URL}/api/auth/login", json=credentials, timeout=30)
    assert response.status_code == 200, response.text
    return response.json()["token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_waitlist_join_and_promotion():
    member_token = login(MEMBER)
    admin_token = login(ADMIN)
    studios = requests.get(f"{BASE_URL}/api/studios", timeout=30).json()
    studio = next(s for s in studios if s["slug"] == "aurora-photo")

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

    # Joining the waitlist on a free slot is rejected: book it instead.
    not_full = requests.post(f"{BASE_URL}/api/waitlist", headers=auth(admin_token), json=body, timeout=30)
    assert not_full.status_code == 409, not_full.text
    assert not_full.json()["error"]["code"] == "SLOT_NOT_FULL", not_full.text

    # Member books the slot.
    hold = requests.post(f"{BASE_URL}/api/holds", headers=auth(member_token), json=body, timeout=30)
    assert hold.status_code == 201, hold.text
    booking = requests.post(
        f"{BASE_URL}/api/bookings", headers=auth(member_token), json={"holdId": hold.json()["id"]}, timeout=30
    )
    assert booking.status_code == 201, booking.text
    booking_id = booking.json()["id"]

    # Admin joins the now-full slot's waitlist at position 1.
    joined = requests.post(f"{BASE_URL}/api/waitlist", headers=auth(admin_token), json=body, timeout=30)
    assert joined.status_code == 201, joined.text
    assert joined.json()["position"] == 1, joined.text
    waitlist_id = joined.json()["id"]

    # A duplicate join by the same user is rejected.
    duplicate = requests.post(f"{BASE_URL}/api/waitlist", headers=auth(admin_token), json=body, timeout=30)
    assert duplicate.status_code == 409, duplicate.text
    assert duplicate.json()["error"]["code"] == "ALREADY_WAITLISTED", duplicate.text

    # Member cancels: the waitlisted admin is promoted into an active hold, so the
    # slot reads as held (not free) right after.
    cancelled = requests.delete(
        f"{BASE_URL}/api/bookings/{booking_id}", headers=auth(member_token), timeout=30
    )
    assert cancelled.status_code == 204, cancelled.text
    after = requests.get(
        f"{BASE_URL}/api/studios/{studio['id']}/availability",
        params={"from": from_ms, "to": to_ms},
        timeout=30,
    ).json()["slots"]
    promoted_slot = next(s for s in after if s["startTs"] == slot["startTs"])
    assert promoted_slot["status"] == "held", promoted_slot

    # Cleanup: cancel the admin's waitlist entry (promoted already) is a no-op;
    # let the promoted hold expire on its own TTL. Nothing else to undo.
    requests.delete(f"{BASE_URL}/api/waitlist/{waitlist_id}", headers=auth(admin_token), timeout=30)


test_waitlist_join_and_promotion()
