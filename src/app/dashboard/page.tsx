"use client";

// Member dashboard: bookings and waitlist, with cancel. Data is auth-gated and the
// token lives in client memory, so it loads client-side. sourceRef: API_CONTRACT.md.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiRequest } from "@/lib/api-client";
import { Button, Card, Eyebrow, Notice, Placard } from "@/components/ui/primitives";
import { formatDate, formatPrice, formatSlotRange } from "@/lib/format";
import type { Booking, Studio, WaitlistEntry } from "@/lib/types";

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [studioNames, setStudioNames] = useState<Map<string, string>>(new Map());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    const [studios, myBookings, myWaitlist] = await Promise.all([
      apiRequest<Studio[]>("GET", "/api/studios"),
      apiRequest<Booking[]>("GET", "/api/bookings", { token }),
      apiRequest<WaitlistEntry[]>("GET", "/api/waitlist", { token }),
    ]);
    if (studios.ok) {
      setStudioNames(new Map(studios.data.map((studio) => [studio.id, studio.name])));
    }
    if (myBookings.ok) setBookings(myBookings.data);
    if (myWaitlist.ok) setWaitlist(myWaitlist.data);
    setLoaded(true);
  }, [token]);

  // Sync with the bookings/waitlist API (an external system) on mount and when the
  // session changes. The `active` guard drops a late response after unmount.
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
    const result = await apiRequest("DELETE", `/api/bookings/${bookingId}`, { token });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    await loadData();
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
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Eyebrow>Your reservations</Eyebrow>
      <h1 className="mb-8 mt-2 font-display text-3xl font-semibold text-ink">Dashboard</h1>
      {error ? <Notice testId="dashboard-error">{error}</Notice> : null}

      <section className="mb-12">
        <h2 className="mb-4 text-sm font-medium text-muted">Bookings</h2>
        {loaded && activeBookings.length === 0 ? (
          <Card>
            <p className="text-sm text-muted" data-testid="bookings-empty">
              No bookings yet.{" "}
              <Link href="/" className="text-accent hover:underline">
                Browse studios
              </Link>
              .
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3" data-testid="bookings-list">
            {activeBookings.map((booking) => (
              <Card key={booking.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <span className="font-display text-lg font-semibold text-ink">
                      {studioNames.get(booking.studioId) ?? "Studio"}
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <Placard label="Reference">{booking.reference}</Placard>
                      <Placard label="When">
                        {formatDate(booking.startTs)}, {formatSlotRange(booking.startTs, booking.endTs)}
                      </Placard>
                      <Placard label="Total">{formatPrice(booking.priceCents)}</Placard>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    testId="cancel-booking-btn"
                    onClick={() => cancelBooking(booking.id)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium text-muted">Waitlist</h2>
        {loaded && waitlist.length === 0 ? (
          <Card>
            <p className="text-sm text-muted" data-testid="waitlist-empty">
              You are not on any waitlists.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3" data-testid="waitlist-list">
            {waitlist.map((entry) => (
              <Card key={entry.id}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="font-medium text-ink">{studioNames.get(entry.studioId) ?? "Studio"}</span>
                    <span className="font-mono text-xs text-muted">
                      {formatDate(entry.startTs)}, {formatSlotRange(entry.startTs, entry.endTs)}
                    </span>
                  </div>
                  <span className="text-sm text-muted">
                    Position <span className="font-mono text-ink">{entry.position}</span>
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
