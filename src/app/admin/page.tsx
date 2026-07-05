"use client";

// Admin console: studios overview and blackout creation. Admin-only, client-side
// because it is auth-gated. sourceRef: docs/hackathon/API_CONTRACT.md (19).

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiRequest } from "@/lib/api-client";
import { Button, Card, Eyebrow, Notice, Placard, TextField } from "@/components/ui/primitives";
import { formatOpenHours, formatPrice } from "@/lib/format";
import type { Studio } from "@/lib/types";

export default function AdminPage() {
  const { user, token } = useAuth();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [studioId, setStudioId] = useState("");
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadStudios = useCallback(async () => {
    const result = await apiRequest<Studio[]>("GET", "/api/studios");
    if (result.ok) {
      setStudios(result.data);
      if (result.data.length > 0) setStudioId((current) => current || result.data[0].id);
    }
  }, []);

  // Load the studio list (external system) once on mount.
  useEffect(() => {
    void loadStudios();
  }, [loadStudios]);

  const submitBlackout = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const startTs = Date.parse(startLocal);
    const endTs = Date.parse(endLocal);
    if (Number.isNaN(startTs) || Number.isNaN(endTs)) {
      setError("Enter a valid start and end.");
      return;
    }
    setBusy(true);
    const result = await apiRequest<{ releasedHolds: number; cancelledBookings: number }>(
      "POST",
      "/api/blackouts",
      { token, body: { studioId, startTs, endTs, reason } },
    );
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setMessage(
      `Blackout created. Released ${result.data.releasedHolds} holds, cancelled ${result.data.cancelledBookings} bookings.`,
    );
  };

  if (user === null || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Admins only</h1>
        <p className="mt-2 text-sm text-muted">This console requires an administrator account.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Eyebrow>Operations</Eyebrow>
      <h1 className="mb-8 mt-2 font-display text-3xl font-semibold text-ink">Admin console</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-sm font-medium text-muted">Studios</h2>
          <div className="flex flex-col gap-3" data-testid="admin-studios">
            {studios.map((studio) => (
              <Card key={studio.id}>
                <span className="font-display text-lg font-semibold text-ink">{studio.name}</span>
                <div className="mt-3 flex flex-col gap-1.5">
                  <Placard label="Rate">{formatPrice(studio.hourlyPriceCents)} / hour</Placard>
                  <Placard label="Open">{formatOpenHours(studio.openHour, studio.closeHour)}</Placard>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-medium text-muted">Create a blackout</h2>
          <Card>
            <form className="flex flex-col gap-4" onSubmit={submitBlackout} data-testid="admin-blackout-form">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-muted">Studio</span>
                <select
                  value={studioId}
                  onChange={(event) => setStudioId(event.target.value)}
                  data-testid="blackout-studio"
                  className="rounded-md border border-hairline bg-field px-3 py-2.5 text-ink outline-none focus:border-accent"
                >
                  {studios.map((studio) => (
                    <option key={studio.id} value={studio.id}>
                      {studio.name}
                    </option>
                  ))}
                </select>
              </label>
              <TextField
                label="Start"
                name="start"
                type="datetime-local"
                value={startLocal}
                onValueChange={setStartLocal}
                testId="blackout-start"
              />
              <TextField
                label="End"
                name="end"
                type="datetime-local"
                value={endLocal}
                onValueChange={setEndLocal}
                testId="blackout-end"
              />
              <TextField
                label="Reason"
                name="reason"
                value={reason}
                onValueChange={setReason}
                testId="blackout-reason"
              />
              {error ? <Notice testId="blackout-error">{error}</Notice> : null}
              {message ? (
                <Notice tone="info" testId="blackout-success">
                  {message}
                </Notice>
              ) : null}
              <Button type="submit" loading={busy} testId="blackout-submit">
                Create blackout
              </Button>
            </form>
          </Card>
        </section>
      </div>
    </div>
  );
}
