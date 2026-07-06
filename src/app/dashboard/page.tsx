"use client";

// Member dashboard: bookings and waitlist, with cancel. Auth-gated; the token
// lives in client memory, so it loads client-side. sourceRef: the Dashboard export.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiRequest } from "@/lib/api-client";
import { Button, Skeleton } from "@/components/ui/primitives";
import { formatDate, formatPrice, formatSlotRange } from "@/lib/format";
import type { Booking, Studio, WaitlistEntry } from "@/lib/types";

const SECTION_LABEL = "font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-faint";

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" /></svg>
  );
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [studioNames, setStudioNames] = useState<Map<string, string>>(new Map());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    const [studios, myBookings, myWaitlist] = await Promise.all([
      apiRequest<Studio[]>("GET", "/api/studios"),
      apiRequest<Booking[]>("GET", "/api/bookings", { token }),
      apiRequest<WaitlistEntry[]>("GET", "/api/waitlist", { token }),
    ]);
    if (studios.ok) setStudioNames(new Map(studios.data.map((studio) => [studio.id, studio.name])));
    if (myBookings.ok) setBookings(myBookings.data);
    if (myWaitlist.ok) setWaitlist(myWaitlist.data);
    setLoaded(true);
  }, [token]);

  // Sync with the bookings/waitlist API (external) on mount and session change.
  useEffect(() => {
    let active = true;
    if (token) {
      void loadData().then(() => {
        if (!active) return;
      });
    }
    return () => {
      active = false;
    };
  }, [token, loadData]);

  const cancelBooking = async (bookingId: string) => {
    setError(null);
    setCancellingId(bookingId);
    const result = await apiRequest("DELETE", `/api/bookings/${bookingId}`, { token });
    if (!result.ok) {
      setError(result.error.message);
      setCancellingId(null);
      return;
    }
    await loadData();
    setCancellingId(null);
  };

  if (user === null) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="mb-3 font-display text-2xl font-semibold text-ink">Sign in to see your bookings</h1>
        <Link href="/login">
          <Button testId="dashboard-signin">Sign in</Button>
        </Link>
      </div>
    );
  }

  const activeBookings = bookings.filter((booking) => booking.status === "confirmed");

  return (
    <div className="mx-auto max-w-[60rem] px-6 py-16 pb-28">
      <p className="atl-eyebrow" style={{ letterSpacing: "0.18em" }}>Your reservations</p>
      <h1 className="mt-3 font-display text-[clamp(2rem,5vw,2.75rem)] font-semibold tracking-tight text-ink">
        Dashboard
      </h1>

      {error ? (
        <div role="alert" className="mt-8 flex items-center gap-[10px] rounded-[14px] border p-[12px_16px] text-[13px] text-destructive" style={{ borderColor: "rgba(229,103,79,.3)", background: "rgba(229,103,79,.06)" }} data-testid="dashboard-error">
          <span className="flex-1">{error}</span>
          <button type="button" className="rounded-lg px-2 py-1.5 text-[13px] font-medium text-ink transition-colors hover:text-accent" onClick={() => loadData()}>Retry</button>
        </div>
      ) : null}

      {/* BOOKINGS */}
      <section aria-labelledby="sec-bookings" className="mt-10">
        <h2 id="sec-bookings" className={`${SECTION_LABEL} mb-[14px]`}>Bookings</h2>
        {!loaded ? (
          <div className="flex flex-col gap-3">
            {[0, 1].map((row) => (
              <div key={row} className="atl-card p-[22px_24px]">
                <Skeleton className="h-[18px] w-[46%] rounded-md" />
                <Skeleton className="mt-4 h-[14px] w-full rounded-md" />
                <Skeleton className="mt-4 h-[14px] w-full rounded-md" />
                <Skeleton className="mt-4 h-[14px] w-full rounded-md" />
              </div>
            ))}
          </div>
        ) : activeBookings.length === 0 ? (
          <div className="atl-card flex flex-col items-center gap-[14px] p-[40px_24px] text-center">
            <p className="text-[15px] font-medium text-ink" data-testid="bookings-empty">No bookings yet.</p>
            <Link href="/" className="atl-vb inline-flex items-center gap-[7px] text-sm font-medium no-underline">
              Browse studios
              <svg className="atl-vb-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3" data-testid="bookings-list">
            {activeBookings.map((booking, index) => {
              const busy = cancellingId === booking.id;
              return (
                <div key={booking.id} className="atl-card p-[22px_24px]" style={{ animation: "atl-cardIn .45s var(--ease-enter) both", animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-display text-[1.125rem] font-semibold text-ink">
                      {studioNames.get(booking.studioId) ?? "Studio"}
                    </h3>
                    <Button variant="destructive" testId="cancel-booking-btn" loading={busy} onClick={() => cancelBooking(booking.id)} aria-label={`Cancel booking at ${studioNames.get(booking.studioId) ?? "studio"}`}>
                      {busy ? null : <TrashIcon />}
                      {busy ? "Cancelling..." : "Cancel"}
                    </Button>
                  </div>
                  <div className="mt-[10px]">
                    <div className="atl-placard"><span className="atl-eyebrow">Reference</span><span className="atl-val-mono">{booking.reference}</span></div>
                    <div className="atl-placard"><span className="atl-eyebrow">When</span><span className="atl-val">{formatDate(booking.startTs)}, {formatSlotRange(booking.startTs, booking.endTs)}</span></div>
                    <div className="atl-placard"><span className="atl-eyebrow">Total</span><span className="atl-val" style={{ fontWeight: 600 }}>{formatPrice(booking.priceCents)}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* WAITLIST */}
      <section aria-labelledby="sec-waitlist" className="mt-[38px]">
        <h2 id="sec-waitlist" className={`${SECTION_LABEL} mb-[14px]`}>Waitlist</h2>
        {loaded && waitlist.length === 0 ? (
          <div className="atl-card p-[28px_24px] text-center">
            <p className="text-sm text-muted" data-testid="waitlist-empty">You are not on any waitlists.</p>
          </div>
        ) : loaded ? (
          <div className="flex flex-col gap-3" data-testid="waitlist-list">
            {waitlist.map((entry, index) => (
              <div key={entry.id} className="atl-card flex items-center justify-between gap-4 p-[20px_24px]" style={{ animation: "atl-cardIn .45s var(--ease-enter) both", animationDelay: `${index * 50}ms` }}>
                <div className="min-w-0">
                  <h3 className="font-display text-[1.125rem] font-semibold text-ink">{studioNames.get(entry.studioId) ?? "Studio"}</h3>
                  <p className="mt-[5px] font-mono text-[12.5px] text-muted">{formatDate(entry.startTs)}, {formatSlotRange(entry.startTs, entry.endTs)}</p>
                </div>
                <div className="flex-none text-right">
                  <p className="atl-eyebrow" style={{ fontSize: 10.5 }}>Position</p>
                  <p className="atl-num mt-[5px] font-sans text-[1.75rem] font-medium leading-none tracking-tight text-ink">{entry.position}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
