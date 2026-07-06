// Landing gallery: the studios as lit exhibits, with client-side search, filter,
// and sort. Server-rendered from Convex at request time. sourceRef:
// docs/UI_DESIGN_SYSTEM.md, the Home gallery export.

import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { StudioBrowser } from "@/components/studio/StudioBrowser";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    title: "Browse live availability",
    body: "Every studio shows a real-time light board. Open slots glow; booked ones offer a waitlist.",
    path: "M4 5h16M4 12h16M4 19h10",
  },
  {
    title: "Hold your slot",
    body: "Select an open hour and it is held for you briefly while you review, so no one books it out from under you.",
    path: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  },
  {
    title: "Confirm and get your pass",
    body: "Confirm to lock it in. Your booking pass carries a reference you can bring to the door.",
    path: "M20 6 9 17l-5-5",
  },
];

function StepIcon({ path }: { path: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export default async function HomePage() {
  const studios = await fetchQuery(api.studios.listActive, {});

  return (
    <div>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <header className="max-w-[40rem]">
          <p className="atl-eyebrow" style={{ letterSpacing: "0.18em" }}>
            Creative studios, by the hour
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.25rem,6vw,3.75rem)] font-semibold leading-[1.03] tracking-tight text-ink text-balance">
            Book the room where the work gets made.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            Photo, music, and podcast studios with live availability, short-lived holds, and a
            waitlist that promotes the moment a slot frees.
          </p>
        </header>

        <div className="mt-10 sm:mt-13">
          <StudioBrowser studios={studios} />
        </div>

        {/* How it works */}
        <section aria-labelledby="how" className="mt-20 border-t border-line pt-14">
          <p className="atl-eyebrow" style={{ letterSpacing: "0.18em" }}>
            How it works
          </p>
          <h2 id="how" className="mt-3 font-display text-[1.75rem] font-semibold tracking-tight text-ink">
            From open slot to booking pass
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="atl-card p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong" style={{ background: "var(--accent-soft)" }}>
                    <StepIcon path={step.path} />
                  </span>
                  <span className="atl-num font-mono text-[13px] text-faint">0{index + 1}</span>
                </div>
                <h3 className="mt-4 font-display text-[1.125rem] font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-8 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-lg font-semibold text-ink">Atelier</p>
            <p className="mt-1 text-[13px] text-muted">Creative studios, booked by the hour.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[13.5px]">
            <Link href="/" className="text-muted transition-colors hover:text-ink">Studios</Link>
            <Link href="/loop" className="text-muted transition-colors hover:text-ink">The loop</Link>
            <Link href="/login" className="text-muted transition-colors hover:text-ink">Sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
