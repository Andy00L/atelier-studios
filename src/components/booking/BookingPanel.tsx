"use client";

// The booking wizard (the hero moment): browse live availability on the light
// board, select a free slot, place a short-lived hold, confirm it into a booking
// and land on the ivory pass, or join the waitlist on a full slot. Wired to the
// Convex-backed API. sourceRef: docs/UI_DESIGN_SYSTEM.md, the Studio detail export.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiRequest } from "@/lib/api-client";
import { Button, PanelHeading } from "@/components/ui/primitives";
import { PassTicket } from "@/components/ui/PassTicket";
import { formatDate, formatMonthDay, formatPrice, formatSlotClock, formatSlotRange } from "@/lib/format";
import { MS_PER_DAY } from "@/convex/lib/rules";
import type { Booking, Hold, Slot } from "@/lib/types";

type Load = "loading" | "ready" | "error";
type Flow = "availability" | "hold" | "confirmed" | "waitlisted";

type Props = {
  studioId: string;
  studioName: string;
  studioSlug: string;
  hourlyPriceCents: number;
};

const AVAILABILITY_WINDOW_DAYS = 7;

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

function ChevronLeft() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
  );
}
function ChevronRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
  );
}
function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
  );
}
function Check() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
  );
}

export function BookingPanel(props: Props) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [windowFrom, setWindowFrom] = useState(0);
  const [windowTo, setWindowTo] = useState(0);
  const [load, setLoad] = useState<Load>("loading");
  const [flow, setFlow] = useState<Flow>("availability");
  const [selected, setSelected] = useState<Slot | null>(null);
  const [hold, setHold] = useState<Hold | null>(null);
  const [holdRemaining, setHoldRemaining] = useState(0);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshAvailability = useCallback(
    async (from: number, to: number) => {
      setLoad("loading");
      const result = await apiRequest<{ slots: Slot[] }>(
        "GET",
        `/api/studios/${props.studioId}/availability?from=${from}&to=${to}`,
      );
      if (result.ok) {
        setSlots(result.data.slots);
        setLoad("ready");
      } else {
        setLoad("error");
      }
    },
    [props.studioId],
  );

  // Load the first availability window on mount. Client-side because it needs the
  // current time and the availability API is the external system being synced.
  useEffect(() => {
    const from = Date.now();
    const to = from + AVAILABILITY_WINDOW_DAYS * MS_PER_DAY;
    setWindowFrom(from);
    setWindowTo(to);
    void refreshAvailability(from, to);
  }, [refreshAvailability]);

  // Sync the hold countdown with the hold's server expiry. The interval is the
  // external system; it is cleared on unmount and whenever the hold changes.
  useEffect(() => {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
    if (flow !== "hold" || hold === null) return;
    const tick = () => setHoldRemaining(Math.max(0, Math.round((hold.expiresAt - Date.now()) / 1000)));
    tick();
    holdTimer.current = setInterval(tick, 1000);
    return () => {
      if (holdTimer.current) {
        clearInterval(holdTimer.current);
        holdTimer.current = null;
      }
    };
  }, [flow, hold]);

  const shiftWeek = async (direction: 1 | -1) => {
    const nextFrom = windowFrom + direction * 7 * MS_PER_DAY;
    const nextTo = windowTo + direction * 7 * MS_PER_DAY;
    setWindowFrom(nextFrom);
    setWindowTo(nextTo);
    setSelected(null);
    await refreshAvailability(nextFrom, nextTo);
  };

  const continueToReview = async () => {
    if (selected === null) return;
    setError(null);
    setBusy(true);
    const result = await apiRequest<Hold>("POST", "/api/holds", {
      token,
      body: { studioId: props.studioId, startTs: selected.startTs, endTs: selected.endTs },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      await refreshAvailability(windowFrom, windowTo);
      setSelected(null);
      return;
    }
    setHold(result.data);
    setFlow("hold");
  };

  const confirmBooking = async () => {
    if (hold === null) return;
    setError(null);
    setBusy(true);
    const result = await apiRequest<Booking>("POST", "/api/bookings", { token, body: { holdId: hold.id } });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setBooking(result.data);
    setFlow("confirmed");
  };

  const releaseHold = async () => {
    if (hold !== null) {
      await apiRequest("DELETE", `/api/holds/${hold.id}`, { token });
    }
    setHold(null);
    setSelected(null);
    setFlow("availability");
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
    setSelected(slot);
    setFlow("waitlisted");
  };

  const startOver = async () => {
    setBooking(null);
    setHold(null);
    setSelected(null);
    setWaitlistPosition(null);
    setFlow("availability");
    await refreshAvailability(windowFrom, windowTo);
  };

  const windowLabel = windowFrom > 0 ? `${formatMonthDay(windowFrom)} - ${formatMonthDay(windowTo)}` : "";
  const canEarlier = load !== "loading";
  const days = groupByDay(slots);
  const isEmptyWindow = load === "ready" && days.length === 0;

  // ---- CONFIRMATION (the peak) ----
  if (flow === "confirmed" && booking !== null) {
    const slotLine = `${formatDate(booking.startTs)} · ${formatSlotRange(booking.startTs, booking.endTs)}`;
    return (
      <PanelShell dataTestId="booking-confirmation" center>
        <div style={{ position: "relative", zIndex: 1, perspective: "900px", marginBottom: 30 }}>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "-14%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 420,
              maxWidth: "90%",
              height: 280,
              background: "radial-gradient(closest-side, rgba(236,230,216,.1), transparent 72%)",
              filter: "blur(18px)",
              pointerEvents: "none",
            }}
          />
          <PassTicket
            title={props.studioName}
            slot={`${formatDate(booking.startTs)} · ${formatSlotRange(booking.startTs, booking.endTs)}`}
            reference={booking.reference}
            confirmed
          />
        </div>
        <h2 className="font-display text-[1.7rem] font-semibold tracking-tight text-ink">Booking confirmed</h2>
        <p className="mt-2 text-sm text-muted">
          {props.studioName} {"·"} {slotLine}
        </p>
        <div className="mt-6 w-full max-w-[320px] text-left">
          <div className="atl-placard">
            <span className="atl-eyebrow">Reference</span>
            <span className="atl-val-mono" data-testid="booking-reference">{booking.reference}</span>
          </div>
          <div className="atl-placard" style={{ borderBottom: "1px solid var(--line)" }}>
            <span className="atl-eyebrow">Total</span>
            <span className="atl-val">{formatPrice(booking.priceCents)}</span>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-[10px]">
          <Button variant="ghost" testId="book-another" onClick={startOver}>Book another slot</Button>
          <Button testId="go-dashboard" onClick={() => router.push("/dashboard")}>
            View my bookings<ArrowRight />
          </Button>
        </div>
      </PanelShell>
    );
  }

  // ---- WAITLISTED ----
  if (flow === "waitlisted" && waitlistPosition !== null && selected !== null) {
    return (
      <PanelShell dataTestId="waitlist-joined">
        <PanelHeading eyebrow="Waitlisted" title="You are on the waitlist" />
        <div className="mt-[30px] flex items-baseline gap-[14px]">
          <span className="atl-eyebrow">Position</span>
          <span
            className="atl-num font-sans text-[3rem] font-medium leading-none tracking-tight text-ink"
            data-testid="waitlist-position"
          >
            {waitlistPosition}
          </span>
        </div>
        <p className="mt-[18px] text-sm leading-relaxed text-muted">
          We will hold the <span className="text-ink">{formatDate(selected.startTs)}</span>{" "}
          <span className="font-mono text-ink">{formatSlotClock(selected.startTs, selected.endTs)}</span> slot for you
          automatically if the booking is cancelled.
        </p>
        <div className="mt-auto pt-[26px]">
          <Button variant="ghost" testId="waitlist-back" onClick={startOver}>
            <ChevronLeft />Back to availability
          </Button>
        </div>
      </PanelShell>
    );
  }

  // ---- HOLD REVIEW ----
  if (flow === "hold" && hold !== null) {
    const expired = holdRemaining <= 0;
    const clock = `${String(Math.floor(holdRemaining / 60)).padStart(2, "0")}:${String(holdRemaining % 60).padStart(2, "0")}`;
    return (
      <PanelShell dataTestId="hold-review">
        <div className="flex items-start justify-between gap-3">
          <p className="atl-eyebrow whitespace-nowrap">Review and confirm</p>
          <div
            className="flex flex-none items-center gap-[7px] rounded-full border px-[11px] py-[6px]"
            style={{ borderColor: expired ? "rgba(229,103,79,.5)" : "var(--line-strong)", background: "var(--surface-sunken)" }}
          >
            <span
              aria-hidden="true"
              className="h-[7px] w-[7px] flex-none rounded-full"
              style={{ background: expired ? "var(--destructive)" : "var(--accent-dim)", animation: expired ? undefined : "atl-glow 2.4s ease-in-out infinite" }}
            />
            <span className="atl-num text-[12.5px]" style={{ color: expired ? "var(--destructive)" : "var(--ink)" }}>
              {expired ? "Hold expired" : `Held ${clock}`}
            </span>
          </div>
        </div>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">{props.studioName}</h2>

        <div className="mt-6">
          <div className="atl-placard">
            <span className="atl-eyebrow">Date</span>
            <span className="atl-val">{formatDate(hold.startTs)}</span>
          </div>
          <div className="atl-placard">
            <span className="atl-eyebrow">Time</span>
            <span className="atl-val-mono">{formatSlotRange(hold.startTs, hold.endTs)}</span>
          </div>
          <div className="atl-placard" style={{ borderBottom: "1px solid var(--line)" }}>
            <span className="atl-eyebrow">Total</span>
            <span className="atl-val" style={{ fontSize: 16, fontWeight: 600 }}>{formatPrice(props.hourlyPriceCents)}</span>
          </div>
        </div>

        <p className="mt-5 text-[13px] leading-relaxed text-faint">
          {expired
            ? "This hold has expired. Release it and choose another open slot."
            : "This slot is held for you briefly. Confirm to lock it in."}
        </p>
        {error ? <ErrorLine testId="booking-error">{error}</ErrorLine> : null}

        <div className="mt-auto flex flex-wrap gap-[10px] pt-[26px]">
          <Button testId="hold-confirm-btn" loading={busy} disabled={expired} onClick={confirmBooking}>
            <Check />Confirm booking
          </Button>
          <Button variant="ghost" testId="hold-release-btn" onClick={releaseHold}>Release hold</Button>
        </div>
      </PanelShell>
    );
  }

  // ---- SIGNED OUT ----
  if (user === null) {
    return (
      <PanelShell dataTestId="signin-prompt">
        <PanelHeading eyebrow="Availability" title="Reserve a slot" />
        <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center gap-[18px] text-center">
          <LockBadge />
          <div>
            <p className="text-[15px] font-medium text-ink">Sign in to hold and book a slot.</p>
            <p className="mt-[6px] text-[13px] text-muted">Your holds and bookings live in your account.</p>
          </div>
          <Button testId="signin-cta" onClick={() => router.push("/login")}>Sign in</Button>
        </div>
      </PanelShell>
    );
  }

  // ---- LOADING ----
  if (load === "loading" && slots.length === 0) {
    return (
      <PanelShell>
        <PanelHeading eyebrow="Availability" title="Reserve a slot" />
        <div className="atl-well mt-5 flex flex-col gap-5 p-[18px]">
          {[0, 1, 2].map((row) => (
            <div key={row}>
              <div className="atl-skel mb-3 h-3 w-24 rounded-md" style={{ animationDelay: `${row * 120}ms` }} />
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3].map((cell) => (
                  <div key={cell} className="atl-skel h-11 w-[92px] rounded-[10px]" style={{ animationDelay: `${(row * 4 + cell) * 80}ms` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </PanelShell>
    );
  }

  // ---- ERROR ----
  if (load === "error") {
    return (
      <PanelShell>
        <PanelHeading eyebrow="Availability" title="Reserve a slot" />
        <div role="alert" className="mt-[14px] flex items-center gap-[10px] text-[13px] text-destructive">
          <InfoIcon />
          <span>We could not load availability for this week.</span>
        </div>
        <div className="flex min-h-[240px] flex-1 flex-col items-center justify-center gap-4">
          <p className="text-[13px] text-muted">Check your connection and try again.</p>
          <Button variant="ghost" testId="availability-retry" onClick={() => refreshAvailability(windowFrom, windowTo)}>
            Try again
          </Button>
        </div>
      </PanelShell>
    );
  }

  // ---- AVAILABILITY / EMPTY ----
  return (
    <PanelShell>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="atl-eyebrow">Availability</p>
          <h2 className="mt-[7px] font-display text-[1.6rem] font-semibold tracking-tight text-ink">Reserve a slot</h2>
          <p className="atl-num mt-[6px] text-[12.5px] text-faint">{windowLabel} {"·"} UTC</p>
        </div>
        <div className="flex flex-none gap-2">
          <button type="button" className="atl-navbtn" disabled={!canEarlier} onClick={() => shiftWeek(-1)} data-testid="week-prev" aria-label="Earlier week">
            <ChevronLeft />Earlier
          </button>
          <button type="button" className="atl-navbtn" disabled={load === "loading"} onClick={() => shiftWeek(1)} data-testid="week-next" aria-label="Later week">
            Later<ChevronRight />
          </button>
        </div>
      </div>

      {error ? <ErrorLine testId="booking-error">{error}</ErrorLine> : null}

      {isEmptyWindow ? (
        <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center py-7 text-center" data-testid="no-slots">
          <p className="text-[15px] font-medium text-ink">No open slots in this window.</p>
          <p className="mt-2 text-[13px] text-muted">Try a later week.</p>
        </div>
      ) : (
        <>
          <div className="atl-well mt-5 flex flex-col gap-5 p-[18px]">
            {days.map((day, dayIndex) => (
              <div key={day.dayTs} style={{ animation: "atl-rowIn .42s var(--ease-enter) both", animationDelay: `${dayIndex * 60}ms` }}>
                <p className="mb-[10px] text-xs font-medium tracking-wide text-muted">{formatDate(day.dayTs)}</p>
                <div className="flex flex-wrap gap-2">
                  {day.slots.map((slot) => (
                    <SlotTile
                      key={slot.startTs}
                      slot={slot}
                      selected={selected !== null && selected.startTs === slot.startTs}
                      disabled={busy}
                      onSelect={() => setSelected(slot)}
                      onWaitlist={() => joinWaitlist(slot)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-[14px] flex flex-wrap items-center gap-4">
            <Legend swatch="free" label="Open" />
            <Legend swatch="booked" label="Booked" />
            <Legend swatch="blackout" label="Closed" />
          </div>

          {selected !== null ? (
            <div
              className="atl-well mt-4 flex items-center justify-between gap-4 p-[14px_16px]"
              style={{ padding: "14px 16px", animation: "atl-panelIn .35s var(--ease-enter) both" }}
            >
              <div className="min-w-0">
                <p className="atl-eyebrow" style={{ fontSize: 10 }}>Selected</p>
                <p className="mt-[5px] whitespace-nowrap text-sm text-ink">
                  <span className="text-muted">{formatDate(selected.startTs)} {"·"} </span>
                  <span className="font-mono">{formatSlotClock(selected.startTs, selected.endTs)}</span>
                </p>
              </div>
              <div className="flex flex-none items-center gap-[10px]">
                <button type="button" className="p-2 text-[13px] text-faint transition-colors hover:text-muted" onClick={() => setSelected(null)}>
                  Clear
                </button>
                <Button testId="hold-continue-btn" loading={busy} onClick={continueToReview}>
                  Continue to review<ArrowRight />
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-[13px] text-faint">Select an open slot to hold it.</p>
          )}
        </>
      )}
    </PanelShell>
  );
}

// The panel card shell, shared by every flow view.
function PanelShell({
  children,
  dataTestId,
  center = false,
}: {
  children: React.ReactNode;
  dataTestId?: string;
  center?: boolean;
}) {
  return (
    <section
      aria-label="Booking"
      data-testid={dataTestId}
      className="atl-card relative flex min-h-[620px] flex-col overflow-hidden p-7"
      style={center ? { alignItems: "center", justifyContent: "center", textAlign: "center" } : undefined}
    >
      <div className={center ? "flex flex-1 flex-col items-center justify-center" : "flex flex-1 flex-col"} style={{ width: "100%", animation: "atl-panelIn .42s var(--ease-enter) both" }}>
        {children}
      </div>
    </section>
  );
}

function SlotTile({
  slot,
  selected,
  disabled,
  onSelect,
  onWaitlist,
}: {
  slot: Slot;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  onWaitlist: () => void;
}) {
  const isFree = slot.status === "free";
  const isBooked = slot.status === "booked";
  const clickable = (isFree || isBooked) && !disabled;
  const variant = selected ? "is-selected" : isFree ? "is-free" : isBooked ? "is-booked" : slot.status === "held" ? "is-held" : "is-blackout";
  const label = isFree
    ? `Book ${formatSlotClock(slot.startTs, slot.endTs)}`
    : isBooked
      ? `Join waitlist for ${formatSlotClock(slot.startTs, slot.endTs)}`
      : `${formatSlotClock(slot.startTs, slot.endTs)} unavailable`;
  return (
    <button
      type="button"
      data-testid={`slot-${slot.startTs}`}
      className={`atl-tile ${variant}`}
      disabled={!clickable}
      aria-label={label}
      title={slot.status}
      onClick={() => (isFree ? onSelect() : isBooked ? onWaitlist() : undefined)}
    >
      <span className="font-mono text-[12.5px]">{formatSlotClock(slot.startTs, slot.endTs)}</span>
      {isBooked ? (
        <span className="inline-flex items-center gap-[3px] text-[9px] uppercase tracking-wider text-faint" data-testid="waitlist-join-btn">
          <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Waitlist
        </span>
      ) : null}
      {selected ? (
        <span aria-hidden="true" className="absolute right-[5px] top-[5px] inline-flex h-[14px] w-[14px] items-center justify-center rounded-full" style={{ background: "var(--accent)", color: "#0a0a0b", boxShadow: "0 2px 5px rgba(0,0,0,.5)" }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        </span>
      ) : null}
    </button>
  );
}

function Legend({ swatch, label }: { swatch: "free" | "booked" | "blackout"; label: string }) {
  const style: React.CSSProperties =
    swatch === "free"
      ? { border: "1px solid rgba(236,230,216,.4)", backgroundImage: "linear-gradient(180deg, rgba(236,230,216,.14), rgba(236,230,216,.04))" }
      : swatch === "booked"
        ? { border: "1px solid var(--line-strong)" }
        : { border: "1px solid var(--line)", backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,.14) 2px, rgba(255,255,255,.14) 3px)" };
  return (
    <span className="inline-flex items-center gap-[7px] text-[11px] text-faint">
      <span className="h-[11px] w-[11px] rounded-[3px]" style={style} />
      {label}
    </span>
  );
}

function ErrorLine({ children, testId }: { children: React.ReactNode; testId?: string }) {
  return (
    <div role="alert" className="mt-[14px] flex items-center gap-[10px] text-[13px] text-destructive" data-testid={testId}>
      <InfoIcon />
      <span>{children}</span>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--destructive)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }} aria-hidden="true"><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="13" /><circle cx="12" cy="16.3" r="0.5" fill="var(--destructive)" stroke="none" /></svg>
  );
}

function LockBadge() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-line-strong" style={{ background: "var(--accent-soft)" }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="10.5" width="16" height="10" rx="2.2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /><circle cx="12" cy="15.4" r="1.1" fill="var(--accent)" stroke="none" /></svg>
    </div>
  );
}
