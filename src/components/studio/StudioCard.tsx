// One studio as a lit exhibit card. Presentational; used by the gallery browser.
// sourceRef: the Home gallery export.

import Link from "next/link";
import { Placard } from "@/components/ui/primitives";
import { StudioArtwork } from "@/components/studio/StudioArtwork";
import { formatOpenHours, formatPrice } from "@/lib/format";
import type { Studio } from "@/lib/types";

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

export function StudioCard({ studio, index = 0 }: { studio: Studio; index?: number }) {
  return (
    <Link
      href={`/studios/${studio.slug}`}
      data-testid={`studio-card-${studio.slug}`}
      aria-label={`${studio.name}, view and book`}
      className="atl-card atl-studio-card flex h-full flex-col overflow-hidden text-inherit no-underline"
      style={{ animation: "atl-cardIn .5s var(--ease-enter) both", animationDelay: `${index * 50}ms` }}
    >
      <div className="flex-none">
        <StudioArtwork slug={studio.slug} name={studio.name} variant="card" photoUrl={studio.photoUrl} />
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
