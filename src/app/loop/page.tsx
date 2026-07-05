// The /loop page: the app renders its own build journal (LOOP.md), read from the
// repo at request time. The write-verify-fix-verify story, live in the product.
// sourceRef: docs/hackathon/LOOP_PROTOCOL.md.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { Eyebrow } from "@/components/ui/primitives";

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
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Eyebrow>Write, verify, fix, verify</Eyebrow>
      <h1 className="mb-4 mt-2 font-display text-4xl font-semibold tracking-tight text-ink">The loop</h1>
      {intro.map((paragraph) => (
        <p key={paragraph} className="mb-4 text-base leading-relaxed text-muted">
          {paragraph}
        </p>
      ))}

      <ol className="mt-8 flex flex-col gap-3" data-testid="loop-iterations">
        {iterations.map((iteration) => (
          <li key={iteration.index} className="card flex gap-4 p-5">
            <span className="font-mono text-sm font-semibold text-accent">
              {iteration.index.padStart(2, "0")}
            </span>
            <p className="text-sm leading-relaxed text-ink">{iteration.text}</p>
          </li>
        ))}
      </ol>

      {iterations.length === 0 ? (
        <p className="text-sm text-muted">The loop journal is not available.</p>
      ) : (
        <p className="mt-8 text-xs text-faint">
          {iterations.length} iterations, agent-written as the loop ran, cross-checked against the
          TestSprite run history and the commit log.
        </p>
      )}
    </div>
  );
}
