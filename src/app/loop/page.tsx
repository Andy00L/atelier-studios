// The /loop page: the app renders its own build journal (LOOP.md), read from the
// repo at request time. The write-verify-fix-verify story, live in the product,
// as a bound ledger. sourceRef: docs/hackathon/LOOP_PROTOCOL.md, the loop export.

import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

type Iteration = { index: string; text: string };

async function readLoopJournal(): Promise<{ intro: string[]; iterations: Iteration[] }> {
  const filePath = path.join(process.cwd(), "LOOP.md");
  let raw = "";
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    return { intro: [], iterations: [] };
  }
  const intro: string[] = [];
  const iterations: Iteration[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) continue;
    const numbered = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numbered) {
      iterations.push({ index: numbered[1], text: numbered[2] });
    } else if (iterations.length === 0) {
      intro.push(trimmed);
    }
  }
  return { intro, iterations };
}

export default async function LoopPage() {
  const { intro, iterations } = await readLoopJournal();

  return (
    <div className="mx-auto max-w-[48rem] px-6 py-16 pb-28">
      <p className="atl-eyebrow" style={{ letterSpacing: "0.18em" }}>Write, verify, fix, verify</p>
      <h1 className="mt-[14px] font-display text-[clamp(2.25rem,5vw,3rem)] font-semibold leading-tight tracking-tight text-ink">
        The loop
      </h1>
      {intro.length > 0 ? (
        intro.map((paragraph) => (
          <p key={paragraph} className="mt-5 max-w-[40rem] text-[1.0625rem] leading-relaxed text-muted text-pretty">
            {paragraph}
          </p>
        ))
      ) : (
        <p className="mt-5 max-w-[40rem] text-[1.0625rem] leading-relaxed text-muted">
          Every screen in this project was built by an agent working a tight loop: write the code,
          verify it against the live URL, fix what broke, then verify again. This is that loop&apos;s
          own record, one entry per iteration, in the order it happened.
        </p>
      )}

      {iterations.length === 0 ? (
        <div className="atl-card mt-10 p-[56px_28px] text-center">
          <p className="text-[15px] font-medium text-ink">The loop journal is not available.</p>
        </div>
      ) : (
        <ol aria-label="Iterations" className="mt-10 flex list-none flex-col gap-3 p-0" data-testid="loop-iterations">
          {iterations.map((iteration, index) => (
            <li key={iteration.index} className="atl-card grid grid-cols-[2.75rem_1fr] p-[20px_22px]" style={{ animation: "atl-cardIn .45s var(--ease-enter) both", animationDelay: `${index * 50}ms` }}>
              <div className="atl-num font-mono text-sm leading-[1.65] text-accent">{iteration.index.padStart(2, "0")}</div>
              <div className="border-l border-line pl-5 text-[0.875rem] leading-[1.65] text-ink text-pretty">{iteration.text}</div>
            </li>
          ))}
        </ol>
      )}

      {iterations.length > 0 ? (
        <p className="mt-6 max-w-[40rem] text-[12.5px] leading-relaxed text-faint">
          {iterations.length} iterations, agent-written as the loop ran, cross-checked against the
          TestSprite run history and the commit log.
        </p>
      ) : null}
    </div>
  );
}
