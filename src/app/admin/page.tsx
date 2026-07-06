"use client";

// Admin console: studios overview and blackout creation. Admin-only, client-side
// because it is auth-gated. sourceRef: docs/hackathon/API_CONTRACT.md, the Admin export.

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiRequest } from "@/lib/api-client";
import { Spinner } from "@/components/ui/primitives";
import { formatOpenHours, formatPrice } from "@/lib/format";
import type { Studio } from "@/lib/types";

type Status = "idle" | "loading" | "success" | "error";

const SECTION_LABEL = "font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-faint";

export default function AdminPage() {
  const { user, token } = useAuth();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [studioId, setStudioId] = useState("");
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

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
    setMessage(null);
    const startTs = Date.parse(startLocal);
    const endTs = Date.parse(endLocal);
    if (Number.isNaN(startTs) || Number.isNaN(endTs) || endTs <= startTs) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    const result = await apiRequest<{ releasedHolds: number; cancelledBookings: number }>(
      "POST",
      "/api/blackouts",
      { token, body: { studioId, startTs, endTs, reason } },
    );
    if (!result.ok) {
      setStatus("error");
      return;
    }
    setStatus("success");
    setMessage(
      `Blackout created. Released ${result.data.releasedHolds} hold${result.data.releasedHolds === 1 ? "" : "s"}, cancelled ${result.data.cancelledBookings} booking${result.data.cancelledBookings === 1 ? "" : "s"}.`,
    );
  };

  if (user === null || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-[60rem] px-6 py-16 pb-28">
        <p className="atl-eyebrow" style={{ letterSpacing: "0.18em" }}>Operations</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,5vw,2.75rem)] font-semibold tracking-tight text-ink">Admin console</h1>
        <div className="atl-card mt-10 flex flex-col items-center gap-[18px] p-[56px_32px] text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-line-strong" style={{ background: "var(--accent-soft)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="10.5" width="16" height="10" rx="2.2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /><circle cx="12" cy="15.4" r="1.1" fill="var(--accent)" stroke="none" /></svg>
          </div>
          <div>
            <p className="text-base font-medium text-ink">Admins only.</p>
            <p className="mt-2 text-[13.5px] text-muted">This console requires an administrator account.</p>
          </div>
        </div>
      </div>
    );
  }

  const submitting = status === "loading";

  return (
    <div className="mx-auto max-w-[60rem] px-6 py-16 pb-28">
      <p className="atl-eyebrow" style={{ letterSpacing: "0.18em" }}>Operations</p>
      <h1 className="mt-3 font-display text-[clamp(2rem,5vw,2.75rem)] font-semibold tracking-tight text-ink">Admin console</h1>

      <div className="mt-10 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
        {/* STUDIOS */}
        <section aria-labelledby="sec-studios">
          <h2 id="sec-studios" className={`${SECTION_LABEL} mb-[14px]`}>Studios</h2>
          <div className="flex flex-col gap-3" data-testid="admin-studios">
            {studios.map((studio, index) => (
              <div key={studio.id} className="atl-card p-[18px_20px]" style={{ animation: "atl-cardIn .45s var(--ease-enter) both", animationDelay: `${index * 50}ms` }}>
                <h3 className="font-display text-[1.0625rem] font-semibold text-ink">{studio.name}</h3>
                <div className="mt-2">
                  <div className="atl-placard" style={{ padding: "10px 0" }}><span className="atl-eyebrow">Rate</span><span className="atl-val">{formatPrice(studio.hourlyPriceCents)} <span className="text-[12.5px] text-faint">/ hour</span></span></div>
                  <div className="atl-placard" style={{ padding: "10px 0" }}><span className="atl-eyebrow">Open</span><span className="atl-val">{formatOpenHours(studio.openHour, studio.closeHour)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CREATE A BLACKOUT */}
        <section aria-labelledby="sec-blackout">
          <h2 id="sec-blackout" className={`${SECTION_LABEL} mb-[14px]`}>Create a blackout</h2>
          <div className="atl-card" style={{ padding: "clamp(20px,3vw,26px)" }}>
            <form className="flex flex-col gap-4" onSubmit={submitBlackout} data-testid="admin-blackout-form" noValidate>
              <div>
                <label htmlFor="blackout-studio" className="atl-label">Studio</label>
                <div className="relative">
                  <select id="blackout-studio" value={studioId} onChange={(event) => setStudioId(event.target.value)} data-testid="blackout-studio" className="atl-input w-full cursor-pointer appearance-none pr-10" style={{ colorScheme: "dark" }}>
                    {studios.map((studio) => (
                      <option key={studio.id} value={studio.id}>{studio.name}</option>
                    ))}
                  </select>
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2"><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <label htmlFor="blackout-start" className="atl-label">Start</label>
                  <input id="blackout-start" type="datetime-local" value={startLocal} onChange={(event) => { setStartLocal(event.target.value); setStatus("idle"); }} data-testid="blackout-start" className="atl-input" style={{ colorScheme: "dark", fontSize: "13.5px" }} />
                </div>
                <div className="min-w-0">
                  <label htmlFor="blackout-end" className="atl-label">End</label>
                  <input id="blackout-end" type="datetime-local" value={endLocal} onChange={(event) => { setEndLocal(event.target.value); setStatus("idle"); }} data-testid="blackout-end" className="atl-input" style={{ colorScheme: "dark", fontSize: "13.5px" }} />
                </div>
              </div>

              <div>
                <label htmlFor="blackout-reason" className="atl-label">Reason</label>
                <input id="blackout-reason" type="text" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Deep clean and re-rig" data-testid="blackout-reason" className="atl-input" />
              </div>

              <button type="submit" disabled={submitting} className="atl-btn atl-btn-primary w-full" style={{ height: 50 }} data-testid="blackout-submit">
                {submitting ? <Spinner /> : null}
                {submitting ? "Creating blackout..." : "Create blackout"}
              </button>

              {status === "success" && message ? (
                <div role="status" className="flex items-center gap-[9px] text-[13px]" style={{ color: "var(--confirm)", animation: "atl-fade .3s var(--ease-enter) both" }} data-testid="blackout-success">
                  <span aria-hidden="true" className="inline-flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full" style={{ background: "var(--confirm)", color: "#12341f" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  </span>
                  <span>{message}</span>
                </div>
              ) : null}
              {status === "error" ? (
                <div role="alert" className="flex items-center gap-[9px] text-[13px] text-destructive" style={{ animation: "atl-fade .3s var(--ease-enter) both" }} data-testid="blackout-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--destructive)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="13" /><circle cx="12" cy="16.3" r="0.5" fill="var(--destructive)" stroke="none" /></svg>
                  <span>Enter a valid start and end.</span>
                </div>
              ) : null}
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
