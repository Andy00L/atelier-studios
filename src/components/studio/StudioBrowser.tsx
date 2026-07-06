"use client";

// The gallery browser: search, filter by discipline, and sort the studios on the
// client. Server-fetched studios come in as props. Adds real, testable
// interactions on top of the lit gallery. sourceRef: the Home gallery export.

import { useMemo, useState } from "react";
import { StudioCard } from "@/components/studio/StudioCard";
import { studioKind } from "@/components/studio/StudioArtwork";
import type { Studio } from "@/lib/types";

type Kind = "all" | "photo" | "music" | "podcast";
type Sort = "featured" | "price-asc" | "price-desc" | "name";

const KIND_CHIPS: Array<{ id: Kind; label: string }> = [
  { id: "all", label: "All" },
  { id: "photo", label: "Photo" },
  { id: "music", label: "Music" },
  { id: "podcast", label: "Podcast" },
];

const SORTS: Array<{ id: Sort; label: string }> = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "name", label: "Name: A to Z" },
];

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
  );
}

export function StudioBrowser({ studios }: { studios: Studio[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [sort, setSort] = useState<Sort>("featured");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = studios.filter((studio) => {
      const matchesKind = kind === "all" || studioKind(studio.slug) === kind;
      const matchesQuery =
        needle.length === 0 ||
        studio.name.toLowerCase().includes(needle) ||
        studio.description.toLowerCase().includes(needle) ||
        studio.equipment.some((item) => item.toLowerCase().includes(needle));
      return matchesKind && matchesQuery;
    });
    const ordered = [...filtered];
    if (sort === "price-asc") ordered.sort((a, b) => a.hourlyPriceCents - b.hourlyPriceCents);
    else if (sort === "price-desc") ordered.sort((a, b) => b.hourlyPriceCents - a.hourlyPriceCents);
    else if (sort === "name") ordered.sort((a, b) => a.name.localeCompare(b.name));
    return ordered;
  }, [studios, query, kind, sort]);

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-faint">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search studios or gear"
              aria-label="Search studios"
              data-testid="studio-search"
              className="atl-input h-11 w-full pl-10 sm:w-[18rem]"
            />
          </div>
          <div className="flex items-center gap-1.5" role="group" aria-label="Filter by discipline">
            {KIND_CHIPS.map((chip) => {
              const active = kind === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  data-testid={`filter-${chip.id}`}
                  aria-pressed={active}
                  onClick={() => setKind(chip.id)}
                  className={`h-9 rounded-full border px-3.5 text-[13px] font-medium transition-colors ${
                    active
                      ? "border-transparent bg-accent text-field"
                      : "border-line text-muted hover:border-line-strong hover:text-ink"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="atl-num text-[13px] text-faint" data-testid="studio-count">
            {visible.length} {visible.length === 1 ? "studio" : "studios"}
          </span>
          <div className="relative">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
              aria-label="Sort studios"
              data-testid="studio-sort"
              className="atl-input h-11 cursor-pointer appearance-none pr-9 text-[13.5px]"
              style={{ colorScheme: "dark", width: "12.5rem" }}
            >
              {SORTS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-[12px] top-1/2 -translate-y-1/2"><path d="M6 9l6 6 6-6" /></svg>
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="atl-card flex flex-col items-center p-16 text-center" data-testid="studio-empty">
          <p className="text-base font-medium text-ink">No studios match your search.</p>
          <p className="mt-2 text-[13.5px] text-muted">Try a different word, or clear the filter.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setKind("all");
            }}
            className="atl-btn atl-btn-ghost mt-5 h-10"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="studio-gallery">
          {visible.map((studio, index) => (
            <StudioCard key={studio.id} studio={studio} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
