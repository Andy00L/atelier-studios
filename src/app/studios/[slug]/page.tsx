// Studio detail: the exhibit plus the booking flow (the hero moment).
// Server-rendered studio; the booking panel is a client island.
// sourceRef: docs/UI_DESIGN_SYSTEM.md, the Studio detail export.

import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { BookingPanel } from "@/components/booking/BookingPanel";
import { StudioArtwork } from "@/components/studio/StudioArtwork";
import { Placard } from "@/components/ui/primitives";
import { formatOpenHours, formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

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
          <div className="max-w-[34rem]">
            <p className="mt-[26px] text-[1.0625rem] leading-[1.55] text-muted text-pretty">
              {studio.description}
            </p>
            <div className="mt-[22px] flex flex-wrap gap-2">
              {studio.equipment.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-line px-[13px] py-[7px] text-[12.5px] text-muted"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-7">
              <Placard label="Rate">
                {formatPrice(studio.hourlyPriceCents)} <span className="text-[13px] text-faint">/ hour</span>
              </Placard>
              <Placard label="Open">{formatOpenHours(studio.openHour, studio.closeHour)}</Placard>
            </div>
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
