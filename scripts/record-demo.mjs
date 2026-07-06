// Record a short demo video of the booking flow on the live app with Playwright.
// Navigation after login uses in-app clicks so the in-memory token survives. The
// video is saved as webm under docs/demo/. Run: bun run scripts/record-demo.mjs
// sourceRef: README.md, docs/UI_DESIGN_SYSTEM.md.

import { chromium } from "playwright";
import { mkdir, readdir, rename } from "node:fs/promises";

const BASE = process.env.SCREENSHOT_BASE ?? "https://atelier-studios-opal.vercel.app";
const OUT = "docs/demo";
const MEMBER_EMAIL = "member@atelier.test";
const MEMBER_PASSWORD = "MemberPass#2026";

// A small pause between beats so the recording is watchable.
const beat = (page, ms = 900) => page.waitForTimeout(ms);

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: OUT, size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();

  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid='studio-gallery']");
  await beat(page, 1400);

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await beat(page);
  await page.fill("[data-testid='login-email']", MEMBER_EMAIL);
  await page.fill("[data-testid='login-password']", MEMBER_PASSWORD);
  await beat(page, 500);
  await page.click("[data-testid='login-submit']");
  await page.waitForURL("**/dashboard", { timeout: 20000 });
  await beat(page);

  await page.click("[data-testid='nav-studios']");
  await page.waitForSelector("[data-testid='studio-card-aurora-photo']");
  await beat(page);
  await page.click("[data-testid='studio-card-aurora-photo']");

  const openSlot = page.locator("button[data-testid^='slot-'][title='Open']").first();
  await openSlot.waitFor({ timeout: 20000 });
  await beat(page);
  await openSlot.click();

  await page.waitForSelector("[data-testid='hold-confirm-btn']");
  await beat(page);
  await page.click("[data-testid='hold-confirm-btn']");
  await page.waitForSelector("[data-testid='booking-confirmation']", { timeout: 20000 });
  await beat(page, 2200);

  await context.close(); // flush the video
  await browser.close();

  // Give the recorded file a stable name.
  const files = (await readdir(OUT)).filter((name) => name.endsWith(".webm"));
  if (files.length > 0) {
    await rename(`${OUT}/${files[0]}`, `${OUT}/booking-flow.webm`);
    console.log("[record-demo] wrote docs/demo/booking-flow.webm");
  } else {
    console.error("[record-demo] no video produced");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("[record-demo] failed:", error);
  process.exit(1);
});
