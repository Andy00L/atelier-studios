// Landing gallery: the studios as lit exhibits. Server-rendered from Convex at
// request time. sourceRef: docs/UI_DESIGN_SYSTEM.md, the Home gallery export.

import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Placard } from "@/components/ui/primitives";
import { StudioArtwork } from "@/components/studio/StudioArtwork";
import { formatOpenHours, formatPrice } from "@/lib/format";
import type { Studio } from "@/lib/types";

export const dynamic = "force-dynamic";

function ArrowRight() {
  return (
    <svg
      className="atl-vb-arrow"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

function StudioCard({ studio, index }: { studio: Studio; index: number }) {
  return (
    <Link
      href={`/studios/${studio.slug}`}
      data-testid={`studio-card-${studio.slug}`}
      aria-label={`${studio.name}, view and book`}
      className="atl-card atl-studio-card flex h-full flex-col overflow-hidden text-inherit no-underline"
      style={{ animation: "atl-cardIn .5s var(--ease-enter) both", animationDelay: `${index * 50}ms` }}
    >
      <div className="flex-none">
        <StudioArtwork slug={studio.slug} name={studio.name} variant="card" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.9375rem] leading-relaxed text-muted">{studio.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {studio.equipment.map((item) => (
            <span
              key={item}
              className="whitespace-nowrap rounded-full border border-line px-[11px] py-1.5 text-[11.5px] text-muted"
            >
              {item}
            </span>
          ))}
        </div>
        <div className="mt-[18px]">
          <Placard label="Rate">
            {formatPrice(studio.hourlyPriceCents)} <span className="text-[12.5px] text-faint">/ hour</span>
          </Placard>
          <Placard label="Open">{formatOpenHours(studio.openHour, studio.closeHour)}</Placard>
        </div>
        <div className="mt-auto border-t border-line pt-[18px]">
          <span className="atl-vb inline-flex items-center gap-[7px] text-sm font-medium">
            View and book
            <ArrowRight />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const studios = await fetchQuery(api.studios.listActive, {});

  return (
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
        {studios.length === 0 ? (
          <div className="atl-card flex flex-col items-center p-16 text-center">
            <p className="text-base font-medium text-ink">No studios are open right now.</p>
            <p className="mt-2 text-[13.5px] text-muted">
              Availability refreshes through the day, check back soon.
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            data-testid="studio-gallery"
          >
            {studios.map((studio, index) => (
              <StudioCard key={studio.id} studio={studio} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
