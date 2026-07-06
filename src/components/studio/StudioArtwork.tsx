// The studio exhibit header: a crafted cool key light over the surface, a faint
// per-discipline line glyph (aperture / waveform / mic), and the studio name.
// Reused by the gallery card and the studio detail page. sourceRef: the accepted
// Claude Design exports (Home gallery, Studio detail).

type Kind = "photo" | "music" | "podcast";

export function studioKind(slug: string): Kind {
  if (slug.includes("music")) return "music";
  if (slug.includes("podcast")) return "podcast";
  return "photo";
}

const KIND_LABEL: Record<Kind, string> = {
  photo: "Photo studio",
  music: "Music room",
  podcast: "Podcast booth",
};

function Glyph({ kind, variant }: { kind: Kind; variant: Variant }) {
  const stroke = "rgba(255,255,255,0.06)";
  if (kind === "music") {
    return (
      <svg
        viewBox="0 0 120 60"
        fill="none"
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinecap="round"
        aria-hidden="true"
        style={{
          position: "absolute",
          right: variant === "detail" ? "-0.5rem" : "-1rem",
          top: "50%",
          transform: "translateY(-50%)",
          width: variant === "detail" ? "24rem" : "17rem",
          height: "auto",
          pointerEvents: "none",
        }}
      >
        <path d="M0 30 C 8 6, 22 6, 30 30 S 52 54, 60 30 S 82 6, 90 30 S 112 54, 120 30" />
        <path
          d="M0 30 C 8 17, 22 17, 30 30 S 52 43, 60 30 S 82 17, 90 30 S 112 43, 120 30"
          opacity="0.55"
        />
      </svg>
    );
  }
  if (kind === "podcast") {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke={stroke}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{
          position: "absolute",
          right: variant === "detail" ? "1rem" : "0.5rem",
          top: "50%",
          transform: "translateY(-52%)",
          width: variant === "detail" ? "17rem" : "12rem",
          height: variant === "detail" ? "17rem" : "12rem",
          pointerEvents: "none",
        }}
      >
        <rect x="18" y="6" width="12" height="22" rx="6" />
        <line x1="18" y1="12" x2="30" y2="12" />
        <line x1="18" y1="17" x2="30" y2="17" />
        <line x1="18" y1="22" x2="30" y2="22" />
        <path d="M13 21 a11 11 0 0 0 22 0" />
        <line x1="24" y1="32" x2="24" y2="40" />
        <line x1="18" y1="40" x2="30" y2="40" />
      </svg>
    );
  }
  // photo: aperture iris
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={0.55}
      aria-hidden="true"
      style={{
        position: "absolute",
        right: variant === "detail" ? "-3.5rem" : "-2.5rem",
        top: "50%",
        transform: variant === "detail" ? "translateY(-50%)" : "translateY(-46%)",
        width: variant === "detail" ? "23rem" : "15rem",
        height: variant === "detail" ? "23rem" : "15rem",
        pointerEvents: "none",
      }}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="14.31" y1="8" x2="20.05" y2="17.94" />
      <line x1="9.69" y1="8" x2="21.17" y2="8" />
      <line x1="7.38" y1="12" x2="13.12" y2="2.06" />
      <line x1="9.69" y1="16" x2="3.95" y2="6.06" />
      <line x1="14.31" y1="16" x2="2.83" y2="16" />
      <line x1="16.62" y1="12" x2="10.88" y2="21.94" />
    </svg>
  );
}

type Variant = "card" | "detail";

export function StudioArtwork({
  slug,
  name,
  variant,
  photoUrl,
}: {
  slug: string;
  name: string;
  variant: Variant;
  photoUrl?: string;
}) {
  const kind = studioKind(slug);
  const isDetail = variant === "detail";
  return (
    <div
      aria-hidden={false}
      style={{
        position: "relative",
        height: isDetail ? "15rem" : "11rem",
        borderRadius: isDetail ? "var(--radius-lg)" : undefined,
        border: isDetail ? "1px solid var(--line)" : undefined,
        background: isDetail ? "var(--surface)" : undefined,
        boxShadow: isDetail ? "var(--shadow-card)" : undefined,
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(85% 120% at 13% -12%, rgba(255,255,255,.11), transparent 56%)",
          pointerEvents: "none",
        }}
      />
      <Glyph kind={kind} variant={variant} />
      {photoUrl ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${photoUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ) : null}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: "1px",
          background: "linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent)",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: photoUrl ? "78%" : "62%",
          background: photoUrl
            ? "linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.34) 42%, transparent 74%)"
            : "linear-gradient(to top, rgba(0,0,0,.5), transparent)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "absolute", left: isDetail ? 28 : 22, right: isDetail ? 28 : 22, bottom: isDetail ? 26 : 20 }}>
        <p
          className="atl-eyebrow"
          style={{ margin: 0, fontSize: isDetail ? "11px" : "10px", letterSpacing: "0.18em" }}
        >
          {KIND_LABEL[kind]}
        </p>
        <span
          className="font-display font-semibold text-ink"
          style={{
            display: "block",
            fontSize: isDetail ? "2.25rem" : "1.5rem",
            letterSpacing: "-0.01em",
            lineHeight: 1.03,
            marginTop: isDetail ? 8 : 6,
          }}
        >
          {name}
        </span>
      </div>
    </div>
  );
}
