"use client";

// The booking wizard: browse live availability, place a short-lived hold, confirm
// it into a booking, and land on the sealed confirmation. Also joins the waitlist
// on a full slot. sourceRef: docs/UI_DESIGN_SYSTEM.md, API_CONTRACT.md.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiRequest } from "@/lib/api-client";
import { Button, Eyebrow, Notice, Placard } from "@/components/ui/primitives";
import { formatDate, formatPrice, formatSlotRange } from "@/lib/format";
import { MS_PER_DAY } from "@/convex/lib/rules";
import type { Booking, Hold, Slot } from "@/lib/types";

type Stage = "browse" | "held" | "confirmed" | "waitlisted";

type Props = {
  studioId: string;
  studioName: string;
  hourlyPriceCents: number;
};

const AVAILABILITY_WINDOW_DAYS = 7;

const STATUS_LABEL: Record<Slot["status"], string> = {
  free: "Open",
  held: "On hold",
  booked: "Booked",
  blackout: "Closed",
  past: "Past",
};

function groupByDay(slots: Slot[]): Array<{ dayTs: number; slots: Slot[] }> {
  const byDay = new Map<number, Slot[]>();
  for (const slot of slots) {
    if (slot.status === "past") continue;
    const dayTs = Math.floor(slot.startTs / MS_PER_DAY) * MS_PER_DAY;
    const existing = byDay.get(dayTs) ?? [];
    existing.push(slot);
    byDay.set(dayTs, existing);
  }
  return Array.from(byDay.entries())
    .sort(([left], [right]) => left - right)
    .map(([dayTs, daySlots]) => ({ dayTs, slots: daySlots.sort((a, b) => a.startTs - b.startTs) }));
}

export function BookingPanel(props: Props) {
  const { user, token } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [windowFrom, setWindowFrom] = useState(0);
  const [windowTo, setWindowTo] = useState(0);
  const [stage, setStage] = useState<Stage>("browse");
  const [hold, setHold] = useState<Hold | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshAvailability = useCallback(
    async (from: number, to: number) => {
      const result = await apiRequest<{ slots: Slot[] }>(
        "GET",
        `/api/studios/${props.studioId}/availability?from=${from}&to=${to}`,
      );
      if (result.ok) setSlots(result.data.slots);
    },
    [props.studioId],
  );

  // Load the first availability window on mount (client-side: it needs the current
  // time and the availability API is the external system being synced).
  useEffect(() => {
    const from = Date.now();
    const to = from + AVAILABILITY_WINDOW_DAYS * MS_PER_DAY;
    setWindowFrom(from);
    setWindowTo(to);
    void refreshAvailability(from, to);
  }, [refreshAvailability]);

  const shiftWeek = async (direction: 1 | -1) => {
    const nextFrom = windowFrom + direction * 7 * MS_PER_DAY;
    const nextTo = windowTo + direction * 7 * MS_PER_DAY;
    setWindowFrom(nextFrom);
    setWindowTo(nextTo);
    await refreshAvailability(nextFrom, nextTo);
  };

  const placeHold = async (slot: Slot) => {
    setError(null);
    setBusy(true);
    const result = await apiRequest<Hold>("POST", "/api/holds", {
      token,
      body: { studioId: props.studioId, startTs: slot.startTs, endTs: slot.endTs },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      await refreshAvailability(windowFrom, windowTo);
      return;
    }
    setHold(result.data);
    setStage("held");
  };

  const confirmBooking = async () => {
    if (hold === null) return;
    setError(null);
    setBusy(true);
    const result = await apiRequest<Booking>("POST", "/api/bookings", {
      token,
      body: { holdId: hold.id },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setBooking(result.data);
    setStage("confirmed");
  };

  const releaseHold = async () => {
    if (hold !== null) {
      await apiRequest("DELETE", `/api/holds/${hold.id}`, { token });
    }
    setHold(null);
    setStage("browse");
    await refreshAvailability(windowFrom, windowTo);
  };

  const joinWaitlist = async (slot: Slot) => {
    setError(null);
    setBusy(true);
    const result = await apiRequest<{ id: string; position: number }>("POST", "/api/waitlist", {
      token,
      body: { studioId: props.studioId, startTs: slot.startTs, endTs: slot.endTs },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setWaitlistPosition(result.data.position);
    setStage("waitlisted");
  };

  const startOver = async () => {
    setBooking(null);
    setHold(null);
    setWaitlistPosition(null);
    setStage("browse");
    await refreshAvailability(windowFrom, windowTo);
  };

  if (stage === "confirmed" && booking !== null) {
    return (
      <section className="card flex flex-col items-center gap-6 p-10 text-center" data-testid="booking-confirmation">
        <div className="seal">
          <span className="text-[0.6rem] uppercase tracking-[0.16em] opacity-80">Atelier</span>
          <span className="font-mono text-lg font-semibold" data-testid="booking-reference">
            {booking.reference}
          </span>
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">Booking confirmed</h2>
          <p className="mt-2 text-sm text-muted">
            {props.studioName}, {formatDate(booking.startTs)}, {formatSlotRange(booking.startTs, booking.endTs)}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <Placard label="Reference">{booking.reference}</Placard>
          <Placard label="Total">{formatPrice(booking.priceCents)}</Placard>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" testId="book-another" onClick={startOver}>
            Book another slot
          </Button>
          <Link href="/dashboard">
            <Button testId="go-dashboard">View my bookings</Button>
          </Link>
        </div>
      </section>
    );
  }

  if (stage === "waitlisted" && waitlistPosition !== null) {
    return (
      <section className="card flex flex-col items-center gap-4 p-10 text-center" data-testid="waitlist-joined">
        <Eyebrow>Waitlisted</Eyebrow>
        <h2 className="font-display text-2xl font-semibold text-ink">You are on the waitlist</h2>
        <p className="text-sm text-muted">
          Position <span className="font-mono text-ink" data-testid="waitlist-position">{waitlistPosition}</span>. If
          the booking is cancelled, the slot is held for you automatically.
        </p>
        <Button variant="ghost" testId="waitlist-back" onClick={startOver}>
          Back to availability
        </Button>
      </section>
    );
  }

  if (stage === "held" && hold !== null) {
    return (
      <section className="card flex flex-col gap-6 p-8" data-testid="hold-review">
        <div>
          <Eyebrow>Review and confirm</Eyebrow>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink">{props.studioName}</h2>
        </div>
        <div className="flex flex-col gap-2">
          <Placard label="Date">{formatDate(hold.startTs)}</Placard>
          <Placard label="Time">{formatSlotRange(hold.startTs, hold.endTs)}</Placard>
          <Placard label="Total">{formatPrice(props.hourlyPriceCents)}</Placard>
        </div>
        <p className="text-xs text-faint">This slot is held for you briefly. Confirm to lock it in.</p>
        {error ? <Notice testId="booking-error">{error}</Notice> : null}
        <div className="flex gap-3">
          <Button testId="hold-confirm-btn" loading={busy} onClick={confirmBooking}>
            Confirm booking
          </Button>
          <Button variant="ghost" testId="hold-release-btn" onClick={releaseHold}>
            Release hold
          </Button>
        </div>
      </section>
    );
  }

  const days = groupByDay(slots);

  return (
    <section className="card flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <Eyebrow>Availability</Eyebrow>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Reserve a slot</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" testId="week-prev" onClick={() => shiftWeek(-1)}>
            Earlier
          </Button>
          <Button variant="ghost" testId="week-next" onClick={() => shiftWeek(1)}>
            Later
          </Button>
        </div>
      </div>

      {user === null ? (
        <Notice tone="info" testId="signin-prompt">
          <Link href="/login" className="text-accent underline-offset-2 hover:underline">
            Sign in
          </Link>{" "}
          to hold and book a slot.
        </Notice>
      ) : null}
      {error ? <Notice testId="booking-error">{error}</Notice> : null}

      <div className="flex flex-col gap-6">
        {days.length === 0 ? (
          <p className="text-sm text-muted" data-testid="no-slots">
            No open slots in this window. Try a later week.
          </p>
        ) : (
          days.map((day) => (
            <div key={day.dayTs} className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink">{formatDate(day.dayTs)}</span>
              <div className="flex flex-wrap gap-2">
                {day.slots.map((slot) => {
                  const isFree = slot.status === "free";
                  const isBooked = slot.status === "booked";
                  const clickable = (isFree || isBooked) && user !== null && !busy;
                  return (
                    <button
                      key={slot.startTs}
                      type="button"
                      data-testid={`slot-${slot.startTs}`}
                      disabled={!clickable}
                      onClick={() => (isFree ? placeHold(slot) : isBooked ? joinWaitlist(slot) : undefined)}
                      className={`rounded-md border px-3 py-2 font-mono text-xs transition-colors ${
                        isFree
                          ? "border-accent/40 bg-accent-soft text-ink hover:border-accent"
                          : isBooked
                            ? "border-hairline text-faint hover:border-hairline-strong"
                            : "cursor-not-allowed border-hairline text-faint opacity-60"
                      }`}
                      title={STATUS_LABEL[slot.status]}
                    >
                      {formatSlotRange(slot.startTs, slot.endTs).replace(" UTC", "")}
                      {isBooked ? <span className="ml-1 text-[0.6rem]" data-testid="waitlist-join-btn">waitlist</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
