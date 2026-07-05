// Presentation formatting. UTC throughout so the UI matches the API's UTC slot
// grid deterministically. sourceRef: docs/hackathon/API_CONTRACT.md.

const PRICE_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatPrice(cents: number): string {
  return PRICE_FORMAT.format(cents / 100);
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatDate(timestampMs: number): string {
  return DATE_FORMAT.format(new Date(timestampMs));
}

function formatHourUtc(timestampMs: number): string {
  const hour = new Date(timestampMs).getUTCHours();
  return `${hour.toString().padStart(2, "0")}:00`;
}

export function formatSlotRange(startTs: number, endTs: number): string {
  return `${formatHourUtc(startTs)}-${formatHourUtc(endTs)} UTC`;
}

export function formatOpenHours(openHour: number, closeHour: number): string {
  const pad = (hour: number) => `${hour.toString().padStart(2, "0")}:00`;
  return `${pad(openHour)}-${pad(closeHour)} UTC`;
}
