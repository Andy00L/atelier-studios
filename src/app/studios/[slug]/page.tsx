// Studio detail: the exhibit plus the booking wizard (the hero moment).
// Server-rendered studio and initial availability; the wizard is a client island.
// sourceRef: docs/UI_DESIGN_SYSTEM.md, API_CONTRACT.md.

import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { BookingPanel } from "@/components/booking/BookingPanel";
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

  // Availability loads client-side in BookingPanel (it needs the current time and
  // is interactive), keeping this server component pure.
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.1fr]">
        <section>
          <div className="card mb-6 flex h-56 items-end overflow-hidden bg-gradient-to-br from-accent-deep/40 via-surface-raised to-field p-6">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">{studio.name}</h1>
          </div>
          <p className="mb-6 text-base leading-relaxed text-muted">{studio.description}</p>
          <div className="flex flex-wrap gap-2">
            {studio.equipment.map((item) => (
              <span key={item} className="rounded-full border border-hairline px-3 py-1 text-xs text-faint">
                {item}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <Placard label="Rate">{formatPrice(studio.hourlyPriceCents)} / hour</Placard>
            <Placard label="Open">{formatOpenHours(studio.openHour, studio.closeHour)}</Placard>
          </div>
        </section>

        <BookingPanel
          studioId={studio.id}
          studioName={studio.name}
          hourlyPriceCents={studio.hourlyPriceCents}
        />
      </div>
    </div>
  );
}
