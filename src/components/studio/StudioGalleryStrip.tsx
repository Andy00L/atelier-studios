"use client";

// A look-inside gallery for a studio: crafted lit tiles (one per corner of the
// room) that open in a lightbox. Client-side; adds a testable image interaction.
// The tiles are crafted art in the house palette, not stock photography.

import { useCallback, useEffect, useState } from "react";
import { studioKind } from "@/components/studio/StudioArtwork";

type Tile = { caption: string; hue: number };

const CAPTIONS: Record<"photo" | "music" | "podcast", string[]> = {
  photo: ["Cyclorama", "Lighting rig", "Tethering bench", "Styling corner"],
  music: ["Live room", "Control booth", "Grand piano", "Mic locker"],
  podcast: ["Broadcast desk", "Isolation", "Four seats", "On air"],
};

function tilesFor(slug: string): Tile[] {
  const kind = studioKind(slug);
  return CAPTIONS[kind].map((caption, index) => ({ caption, hue: index }));
}

function TileArt({ hue, large = false }: { hue: number; large?: boolean }) {
  // A crafted key-lit panel; the light origin shifts per tile so the set varies.
  const origins = ["18% -10%", "82% -8%", "50% 120%", "12% 118%"];
  const origin = origins[hue % origins.length];
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        background: `radial-gradient(90% 120% at ${origin}, rgba(255,255,255,${large ? 0.12 : 0.1}), transparent 55%), linear-gradient(155deg, var(--surface-raised), var(--surface))`,
      }}
    >
      <div
        className="absolute left-0 right-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent)" }}
      />
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: "60%", background: "linear-gradient(to top, rgba(0,0,0,.45), transparent)" }}
      />
      <span
        className="absolute font-display font-semibold"
        style={{
          right: large ? 28 : 14,
          bottom: large ? 18 : 8,
          fontSize: large ? 120 : 46,
          lineHeight: 1,
          color: "rgba(255,255,255,0.04)",
        }}
      >
        0{hue + 1}
      </span>
    </div>
  );
}

export function StudioGalleryStrip({ slug, name }: { slug: string; name: string }) {
  const tiles = tilesFor(slug);
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (direction: 1 | -1) =>
      setOpen((current) => {
        if (current === null) return current;
        return (current + direction + tiles.length) % tiles.length;
      }),
    [tiles.length],
  );

  // Keyboard control while the lightbox is open (an external system: the document).
  useEffect(() => {
    if (open === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close, step]);

  return (
    <div className="mt-8" data-testid="gallery-strip">
      <p className="atl-eyebrow mb-3">Look inside</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile, index) => (
          <button
            key={tile.caption}
            type="button"
            data-testid={`gallery-tile-${index}`}
            onClick={() => setOpen(index)}
            aria-label={`Open ${tile.caption} view`}
            className="atl-studio-card relative aspect-[4/3] overflow-hidden rounded-[14px] border border-line text-left"
          >
            <TileArt hue={tile.hue} />
            <span className="absolute bottom-2.5 left-3 z-[1] text-[12px] font-medium text-ink">{tile.caption}</span>
          </button>
        ))}
      </div>

      {open !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} gallery`}
          data-testid="lightbox"
          onClick={close}
          className="fixed inset-0 z-40 flex items-center justify-center p-6"
          style={{ background: "rgba(6,6,7,.78)", backdropFilter: "blur(10px)", animation: "atl-fade .2s var(--ease-enter) both" }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="atl-card relative w-full max-w-3xl overflow-hidden p-0"
            style={{ animation: "atl-panelIn .28s var(--ease-enter) both" }}
          >
            <div className="relative aspect-[16/9]">
              <TileArt hue={tiles[open].hue} large />
            </div>
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="font-display text-[1.0625rem] font-semibold text-ink" data-testid="lightbox-caption">
                  {tiles[open].caption}
                </p>
                <p className="atl-num mt-0.5 text-[12px] text-faint">
                  {open + 1} / {tiles.length} {"·"} {name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => step(-1)} data-testid="lightbox-prev" aria-label="Previous" className="atl-navbtn h-10 w-10 justify-center px-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
                </button>
                <button type="button" onClick={() => step(1)} data-testid="lightbox-next" aria-label="Next" className="atl-navbtn h-10 w-10 justify-center px-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              data-testid="lightbox-close"
              aria-label="Close"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-line-strong text-ink"
              style={{ background: "rgba(10,10,11,.6)" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
