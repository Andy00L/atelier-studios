// Capture README screenshots of the live app with Playwright. Navigation after
// login uses in-app link clicks (not goto) because the auth token lives in client
// memory and a hard navigation would drop it. Run: bun run scripts/screenshots.mjs
// sourceRef: docs/UI_DESIGN_SYSTEM.md, README.md.

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.SCREENSHOT_BASE ?? "https://atelier-studios-opal.vercel.app";
const OUT = "docs/screenshots";
const MEMBER_EMAIL = "member@atelier.test";
const MEMBER_PASSWORD = "MemberPass#2026";

// JPEG quality 78 keeps each capture well under the 500 KB README budget while
// staying crisp for UI. sourceRef: .claude/skills/readme-craft/SKILL.md (step 5).
async function shoot(page, name, { fullPage = false } = {}) {
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 78, fullPage });
  console.log(`[screenshots] wrote ${name}.jpg`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  // Public pages (no auth needed): a hard navigation is fine.
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid='studio-gallery']");
  await shoot(page, "01-gallery", { fullPage: true });

  await page.goto(`${BASE}/studios/aurora-photo`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid^='slot-']", { timeout: 20000 });
  await shoot(page, "02-studio");

  await page.goto(`${BASE}/loop`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid='loop-iterations']");
  await shoot(page, "04-loop", { fullPage: true });

  // Booking flow: log in, then navigate by clicking in-app links so the in-memory
  // token survives, place a hold on the first open slot, and confirm.
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("[data-testid='login-email']", MEMBER_EMAIL);
  await page.fill("[data-testid='login-password']", MEMBER_PASSWORD);
  await page.click("[data-testid='login-submit']");
  await page.waitForURL("**/dashboard", { timeout: 20000 });

  await page.click("[data-testid='nav-studios']");
  await page.waitForSelector("[data-testid='studio-card-aurora-photo']");
  await page.click("[data-testid='studio-card-aurora-photo']");

  const openSlot = page.locator("button[data-testid^='slot-'][title='Open']").first();
  await openSlot.waitFor({ timeout: 20000 });
  await openSlot.click();

  await page.waitForSelector("[data-testid='hold-confirm-btn']");
  await page.click("[data-testid='hold-confirm-btn']");
  await page.waitForSelector("[data-testid='booking-confirmation']", { timeout: 20000 });
  await shoot(page, "03-confirmation");

  await page.click("[data-testid='go-dashboard']");
  await page.waitForSelector("[data-testid='bookings-list']", { timeout: 20000 });
  await shoot(page, "05-dashboard");

  await browser.close();
  console.log("[screenshots] done");
}

main().catch((error) => {
  console.error("[screenshots] failed:", error);
  process.exit(1);
});
