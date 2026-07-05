// Shared frontend types mirroring the API contract responses.
// sourceRef: docs/hackathon/API_CONTRACT.md.

export type Role = "member" | "admin";

export type User = { id: string; email: string; name: string; role: Role };

export type Studio = {
  id: string;
  slug: string;
  name: string;
  description: string;
  equipment: string[];
  hourlyPriceCents: number;
  photoUrl: string;
  openHour: number;
  closeHour: number;
  active: boolean;
};

export type SlotStatus = "free" | "held" | "booked" | "blackout" | "past";
export type Slot = { startTs: number; endTs: number; status: SlotStatus };

export type Hold = {
  id: string;
  studioId: string;
  startTs: number;
  endTs: number;
  expiresAt: number;
  status: string;
};

export type Booking = {
  id: string;
  reference: string;
  studioId: string;
  startTs: number;
  endTs: number;
  status: "confirmed" | "cancelled";
  priceCents: number;
};

export type WaitlistEntry = {
  id: string;
  studioId: string;
  startTs: number;
  endTs: number;
  position: number;
};

export type ApiError = { code: string; message: string };
