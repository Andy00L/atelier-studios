// The ivory pass: Atelier's hero object, a studio ticket rendered in real light
// (perforated edge, debossed monogram, one specular sweep, a soft cast shadow).
// Used on the booking confirmation and the auth panel. sourceRef: the accepted
// Claude Design exports (Studio detail confirmation, Sign in).

type Props = {
  title: string;
  slot?: string;
  reference?: string;
  confirmed?: boolean;
  footNote?: string;
  monogram?: string;
  width?: number;
  restTiltDeg?: number;
  animate?: boolean;
};

export function PassTicket({
  title,
  slot,
  reference,
  confirmed = false,
  footNote,
  monogram = "A",
  width = 320,
  restTiltDeg,
  animate = true,
}: Props) {
  const resting = restTiltDeg !== undefined;
  return (
    <div
      className="atl-pass"
      style={{
        width,
        transformOrigin: "center bottom",
        transform: resting ? `rotate(${restTiltDeg}deg)` : undefined,
        animation: animate
          ? resting
            ? "atl-fade .8s var(--ease-enter) both"
            : "atl-passSettle .72s var(--ease-enter) both"
          : undefined,
      }}
    >
      <div className="atl-pass-grain" />
      <div className="atl-pass-perf" aria-hidden="true" />
      {animate && !resting ? (
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", borderRadius: "inherit" }}>
          <div className="atl-pass-sweep" />
        </div>
      ) : null}

      <div className="atl-pass-mono-a">{monogram}</div>
      <div
        className="font-display font-semibold"
        style={{ position: "relative", zIndex: 1, fontSize: 18, marginTop: 10, color: "#211d17" }}
      >
        {title}
      </div>
      {slot ? (
        <div
          className="font-mono"
          style={{ position: "relative", zIndex: 1, fontSize: 12, color: "#5c5648", marginTop: 4 }}
        >
          {slot}
        </div>
      ) : null}

      {reference || footNote ? (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: reference ? 16 : 14,
            paddingTop: 12,
            borderTop: "1px dashed rgba(33,29,23,.25)",
          }}
        >
          {reference ? (
            <span className="font-mono" style={{ fontSize: 13.5, letterSpacing: "0.02em", color: "#211d17" }}>
              {reference}
            </span>
          ) : null}
          {footNote ? (
            <span className="font-mono" style={{ fontSize: 11, letterSpacing: "0.06em", color: "#5c5648", whiteSpace: "nowrap" }}>
              {footNote}
            </span>
          ) : null}
          {confirmed ? (
            <span
              style={{
                marginLeft: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "#2f7d55",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  background: "var(--confirm)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#123420",
                  fontSize: 10,
                  animation: "atl-tick .5s var(--ease-enter) .3s both",
                }}
              >
                ✓
              </span>
              Confirmed
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
