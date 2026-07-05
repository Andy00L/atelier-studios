// force-dynamic: the timestamp must be computed per request; a prerendered
// static response would defeat uptime checks (sourceRef: node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md, Caching section).
export const dynamic = "force-dynamic";

type HealthPayload = {
  status: "ok";
  service: string;
  timestamp: string;
};

export function GET(): Response {
  const payload: HealthPayload = {
    status: "ok",
    service: "atelier-studios",
    timestamp: new Date().toISOString(),
  };
  return Response.json(payload);
}
