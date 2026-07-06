# TestSprite backend test: availability must not advertise slots the booking
# horizon forbids, and a beyond-horizon hold must fail with a DISTINCT error
# (not the generic VALIDATION_ERROR). This encodes the invariant
# "a slot availability reports as free must be holdable". sourceRef:
# convex/availability.ts, convex/holds.ts, convex/lib/rules.ts (BOOKING_HORIZON_DAYS=30).
# The backend runner needs the test function invoked at the bottom.

import os
import time

import requests

BASE_URL = os.environ.get("TESTSPRITE_TARGET_URL", "https://atelier-studios-opal.vercel.app")
MEMBER = {"email": "member@atelier.test", "password": "MemberPass#2026"}
MS_PER_DAY = 24 * 60 * 60 * 1000
MS_PER_HOUR = 60 * 60 * 1000
BOOKING_HORIZON_DAYS = 30


def login(credentials):
    response = requests.post(f"{BASE_URL}/api/auth/login", json=credentials, timeout=30)
    assert response.status_code == 200, response.text
    return response.json()["token"]


def hour_aligned(offset_days, utc_hour):
    base = int(time.time() * 1000) + offset_days * MS_PER_DAY
    day_start = base - (base % (24 * MS_PER_HOUR))
    return day_start + utc_hour * MS_PER_HOUR


def test_availability_respects_booking_horizon():
    token = login(MEMBER)
    headers = {"Authorization": f"Bearer {token}"}
    studios = requests.get(f"{BASE_URL}/api/studios", timeout=30).json()
    studio = next(s for s in studios if s["slug"] == "aurora-photo")

    # A window that sits entirely beyond the 30-day booking horizon.
    day31_start = hour_aligned(BOOKING_HORIZON_DAYS + 1, 0)
    resp = requests.get(
        f"{BASE_URL}/api/studios/{studio['id']}/availability",
        params={"from": day31_start, "to": day31_start + 3 * MS_PER_DAY},
        timeout=30,
    )
    assert resp.status_code == 200, resp.text
    slots = resp.json()["slots"]
    free_beyond = [s for s in slots if s["status"] == "free"]
    # Invariant: availability must NOT report free slots that a hold would reject.
    assert free_beyond == [], (
        f"availability reported {len(free_beyond)} free slots beyond the "
        f"{BOOKING_HORIZON_DAYS}-day horizon, but holds reject them: {free_beyond[:2]}"
    )

    # And a beyond-horizon hold on an in-hours, aligned slot must fail with a
    # DISTINCT, actionable error, not the catch-all VALIDATION_ERROR.
    far_start = hour_aligned(BOOKING_HORIZON_DAYS + 3, 12)  # 12:00 UTC, within 08-20
    hold = requests.post(
        f"{BASE_URL}/api/holds",
        headers=headers,
        json={"studioId": studio["id"], "startTs": far_start, "endTs": far_start + MS_PER_HOUR},
        timeout=30,
    )
    assert hold.status_code == 422, hold.text
    assert hold.json()["error"]["code"] == "BEYOND_HORIZON", hold.text


test_availability_respects_booking_horizon()
