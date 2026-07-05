// Landing gallery: the studios as labelled exhibits. Server-rendered from Convex
// at request time. sourceRef: docs/UI_DESIGN_SYSTEM.md, API_CONTRACT.md.

import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Placard } from "@/components/ui/primitives";
import { formatOpenHours, formatPrice } from "@/lib/format";
import type { Studio } from "@/lib/types";

export const dynamic = "force-dynamic";

function StudioCard({ studio }: { studio: Studio }) {
  return (
    <Link
      href={`/studios/${studio.slug}`}
      data-testid={`studio-card-${studio.slug}`}
      className="group card overflow-hidden p-0 transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div className="relative flex h-40 items-end bg-gradient-to-br from-accent-deep/40 via-surface-raised to-field p-4">
        <span className="font-display text-2xl font-semibold text-ink/90">{studio.name}</span>
      </div>
      <div className="flex flex-col gap-4 p-6">
        <p className="text-sm leading-relaxed text-muted">{studio.description}</p>
        <div className="flex flex-wrap gap-2">
          {studio.equipment.map((item) => (
            <span
              key={item}
              className="rounded-full border border-hairline px-2.5 py-1 text-xs text-faint"
            >
              {item}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Placard label="Rate">{formatPrice(studio.hourlyPriceCents)} / hour</Placard>
          <Placard label="Open">{formatOpenHours(studio.openHour, studio.closeHour)}</Placard>
        </div>
        <span className="mt-1 text-sm font-medium text-accent transition-colors group-hover:brightness-110">
          View and book
        </span>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const studios = await fetchQuery(api.studios.listActive, {});

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <section className="mb-14 max-w-2xl">
        <p className="eyebrow mb-3">Creative studios, by the hour</p>
        <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink">
          Book the room where the work gets made.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Photo, music, and podcast studios with live availability, short-lived holds,
          and a waitlist that promotes the moment a slot frees.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="studio-gallery">
        {studios.map((studio) => (
          <StudioCard key={studio.id} studio={studio} />
        ))}
      </section>
    </div>
  );
}
