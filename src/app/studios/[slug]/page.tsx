// Studio detail: the exhibit plus the booking flow (the hero moment).
// Server-rendered studio; the booking panel and rich extras are client islands.
// sourceRef: docs/UI_DESIGN_SYSTEM.md, the Studio detail export.

import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { BookingPanel } from "@/components/booking/BookingPanel";
import { StudioArtwork } from "@/components/studio/StudioArtwork";
import { StudioActions } from "@/components/studio/StudioActions";
import { StudioGalleryStrip } from "@/components/studio/StudioGalleryStrip";
import { Placard } from "@/components/ui/primitives";
import { formatOpenHours, formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

const GOOD_TO_KNOW = [
  "Slot times are in UTC. The room is lit and reset before your hour starts.",
  "Arrive a few minutes early; leave the space as you found it.",
  "Bring your booking reference to the door, it is on your pass and dashboard.",
];

export default async function StudioPage({ params }: PageProps) {
  const { slug } = await params;
  const studio = await fetchQuery(api.studios.getBySlug, { slug });
  if (studio === null) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 pb-28">
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_30rem]">
        <section className="min-w-0">
          <StudioArtwork slug={studio.slug} name={studio.name} variant="detail" />

          <p className="mt-[26px] max-w-[34rem] text-[1.0625rem] leading-[1.55] text-muted text-pretty">
            {studio.description}
          </p>

          <StudioActions name={studio.name} />

          {/* Included gear */}
          <div className="mt-8">
            <p className="atl-eyebrow mb-3">Included gear</p>
            <div className="flex flex-wrap gap-2">
              {studio.equipment.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-line px-[13px] py-[7px] text-[12.5px] text-muted"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-6 max-w-[34rem]">
              <Placard label="Rate">
                {formatPrice(studio.hourlyPriceCents)} <span className="text-[13px] text-faint">/ hour</span>
              </Placard>
              <Placard label="Open">{formatOpenHours(studio.openHour, studio.closeHour)}</Placard>
            </div>
          </div>

          {/* Look inside (crafted gallery + lightbox) */}
          <StudioGalleryStrip slug={studio.slug} name={studio.name} />

          {/* Good to know */}
          <div className="mt-10 max-w-[34rem]">
            <p className="atl-eyebrow mb-3">Good to know</p>
            <ul className="flex flex-col gap-2.5">
              {GOOD_TO_KNOW.map((line) => (
                <li key={line} className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-muted">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 flex-none rounded-full" style={{ background: "var(--accent)" }} />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <BookingPanel
          studioId={studio.id}
          studioName={studio.name}
          studioSlug={studio.slug}
          hourlyPriceCents={studio.hourlyPriceCents}
        />
      </div>
    </div>
  );
}
