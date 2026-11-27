"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ModelSoFar } from "@/components/model-so-far";
import { bookOf, show } from "@/lib/book";
import { countsOf, flat, floorOf, nudge, pairsOf, pushOf, sharesOf, wrongness, wrongOf, type Dials } from "@/lib/nudge";
import { cn } from "@/lib/utils";
import { has, unlock } from "@/lib/wordbook";

const PHASES = ["Do it by hand", "Build it", "Watch it work", "Say it back", "Name it"];
const NOW = 2;
const START = "the cat sat on the mat. the hat is on the cat.";
const BURST = 25;
const TICK_MS = 90;
const SCALE = [1, 0.5, 0.25, 0.1, 0.01];

const pct = (x: number) => `${Math.round(x * 100)}%`;
const fix = (x: number) => x.toFixed(2);

/** The score after every nudge, as a falling line. */
function History({ points, floor }: { points: number[]; floor: number }) {
  const W = 320;
  const H = 96;
  const top = Math.max(points[0] ?? 1, 0.01);
  const x = (i: number) => (points.length < 2 ? 0 : (i / (points.length - 1)) * W);
  const y = (v: number) => H - 4 - (v / top) * (H - 12);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Wrongness after each nudge" className="h-24 w-full" preserveAspectRatio="none">
      <line x1="0" x2={W} y1={y(floor)} y2={y(floor)} stroke="#9a958c" strokeDasharray="4 4" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <polyline
        points={points.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}
        fill="none"
        stroke="#ff7a1f"
        strokeWidth="2.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function AdultLesson() {
  const [text, setText] = useState(START);
  const [step, setStep] = useState(10);
  const [pick, setPick] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [named, setNamed] = useState(false);

  const shown = text.length >= 2 ? text : "ab";
  const book = useMemo(() => bookOf(shown), [shown]);
  const pairs = useMemo(() => pairsOf(shown, book), [shown, book]);
  const counts = useMemo(() => countsOf(pairs, book.length), [pairs, book]);
  const floor = useMemo(() => floorOf(counts, pairs.length), [counts, pairs]);

  const [dials, setDials] = useState<Dials>(() => flat(book.length));
  const [history, setHistory] = useState<number[]>([]);
  const live = dials.length === book.length ? dials : flat(book.length);
  const score = wrongness(live, pairs);
  const points = history.length ? history : [score];

  useEffect(() => {
    has("loss").then(setNamed);
  }, []);

  function reset(size = book.length) {
    setDials(flat(size));
    setHistory([]);
    setRunning(false);
  }

  function edit(v: string) {
    const next = v.toLowerCase();
    setText(next);
    reset(bookOf(next.length >= 2 ? next : "ab").length);
  }

  function nudgeBy(times: number) {
    let cur = live;
    const seen: number[] = [];
    for (let i = 0; i < times; i++) {
      cur = nudge(cur, counts, pairs.length, step);
      seen.push(wrongness(cur, pairs));
    }
    setDials(cur);
    setHistory((h) => [...(h.length ? h : [score]), ...seen]);
  }

  // "Run" keeps nudging until the score stops falling.
  const tick = useRef(nudgeBy);
  tick.current = nudgeBy;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => tick.current(1), TICK_MS);
    return () => window.clearInterval(id);
  }, [running]);
  useEffect(() => {
    if (running && (score - floor < 0.005 || history.length > 400)) setRunning(false);
  }, [running, score, floor, history.length]);

  async function name() {
    if (named) return;
    setNamed(true);
    await unlock(["loss", "gradient", "gradient descent", "backprop"], 3);
  }

  const rowIdx = Math.max(0, book.indexOf(pick && book.includes(pick) ? pick : shown[0]));
  const row = book[rowIdx];
  const shares = sharesOf(live[rowIdx]);
  const push = pushOf(live, counts, pairs.length)[rowIdx];
  const seenRow = counts[rowIdx].reduce((a, b) => a + b, 0);
  const firstPair = pairs[0];
  const firstShare = firstPair ? sharesOf(live[firstPair[0]])[firstPair[1]] : 1;

  return (
    <main className="grid min-h-[calc(100dvh-60px)] grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)]">
      <ModelSoFar now={3} />

      <section className="grid max-w-[1040px] content-start gap-[30px] px-[clamp(20px,4vw,56px)] pt-9 pb-16">
        <div>
          <div className="font-mono text-xs font-medium uppercase leading-none tracking-[0.1em] text-a-acc">Stage 3 of 7 · The hot-and-cold nudger</div>
          <h1 className="mt-2.5 font-display text-[clamp(30px,4.2vw,46px)] font-semibold leading-[1.05] tracking-[-0.025em] text-balance">
            Score how wrong it is. Then nudge every dial to be a little less wrong.
          </h1>
          <p className="mt-3 max-w-[60ch] text-[19px] text-a-stand">
            Counting worked for pairs of letters, but the bigger boxes coming next can&apos;t be counted. So here is the method that teaches every one of them: start with a blank model that guesses evenly, give it a score for how wrong it is, and turn each dial a little in whichever direction lowers the score. Then do it again.
          </p>
        </div>

        <ol aria-label="Lesson steps" className="flex w-fit max-w-full overflow-x-auto rounded-lg border border-a-rule">
          {PHASES.map((p, i) => (
            <li
              key={p}
              aria-current={i === NOW ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap border-r border-a-rule px-4 py-[9px] font-display text-[12.5px] font-medium leading-none last:border-r-0",
                i < NOW ? "text-a-stand" : i === NOW ? "bg-a-acc/20 text-a-acc" : "text-a-cap",
              )}
            >
              <em className="font-mono text-[10px] not-italic opacity-70">{i < NOW ? `✓ ${i + 1}` : i + 1}</em>
              {p}
            </li>
          ))}
        </ol>

        <div className="overflow-hidden rounded-[10px] border border-a-rule bg-a-panel">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-a-rule px-4 py-3 font-mono text-[11px] font-medium uppercase leading-none tracking-[0.08em] text-a-cap">
            <span>Your nudger, running</span>
            <span data-testid="a-nudges">{Math.max(0, history.length - 1)} nudges so far</span>
          </div>
          <div className="grid gap-2 px-4 pt-[18px]">
            <label htmlFor="a-text" className="font-mono text-xs font-medium text-a-cap">
              text to learn from
            </label>
            <textarea
              id="a-text"
              rows={2}
              maxLength={160}
              value={text}
              onChange={(e) => edit(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="min-w-0 resize-y rounded-md border border-a-wire bg-a-node px-3 py-2.5 font-mono text-base font-medium leading-snug focus:border-a-acc focus:shadow-[0_0_0_4px] focus:shadow-a-acc/25 focus:outline-none"
            />
          </div>
          <div className="grid gap-5 px-4 pt-[18px] pb-5 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="grid content-start gap-3">
              <div className="grid gap-1">
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-a-cap">wrongness score</span>
                <span data-testid="a-score" className="font-display text-[44px] font-semibold leading-none tracking-[-0.02em] text-a-acc">
                  {fix(score)}
                </span>
                <span data-testid="a-floor" className="font-mono text-xs text-a-cap">
                  lowest possible here: {fix(floor)}
                </span>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="a-step" className="flex justify-between font-mono text-xs font-medium text-a-cap">
                  <span>nudge size</span>
                  <span className="text-a-fg">{step}</span>
                </label>
                <input id="a-step" type="range" min={1} max={50} value={step} onChange={(e) => setStep(Number(e.target.value))} className="accent-a-acc" />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => nudgeBy(1)} className="cursor-pointer rounded-md border border-a-acc bg-a-acc px-3.5 py-2 font-display text-sm font-semibold leading-none text-a-acc-ink">
                  Nudge once
                </button>
                <button type="button" onClick={() => nudgeBy(BURST)} className="cursor-pointer rounded-md border border-a-acc px-3.5 py-2 font-display text-sm font-semibold leading-none text-a-acc">
                  Nudge {BURST}
                </button>
                <button type="button" onClick={() => setRunning((r) => !r)} className="cursor-pointer rounded-md border border-a-acc px-3.5 py-2 font-display text-sm font-semibold leading-none text-a-acc">
                  {running ? "Stop" : "Run"}
                </button>
                <button type="button" onClick={() => reset()} className="cursor-pointer rounded-md border border-a-wire px-3.5 py-2 font-display text-sm font-medium leading-none text-a-cap hover:text-a-fg">
                  Start over
                </button>
              </div>
            </div>
            <div className="grid min-w-0 content-start gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-a-cap">score after each nudge · dashed line = lowest possible</span>
              <div className="rounded-md border border-a-wire bg-a-node px-2 py-1.5">
                <History points={points} floor={floor} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="grid min-w-0 content-start gap-3 rounded-[10px] border border-a-rule bg-a-panel p-4">
            <h3 className="flex items-baseline justify-between gap-2.5 font-display text-base font-semibold leading-tight">
              <span>
                After <span className="font-mono text-a-acc">&ldquo;{show(row)}&rdquo;</span>
              </span>
              <small className="font-mono text-xs font-normal text-a-cap">dials as shares · ▏= your tally</small>
            </h3>
            <div className="flex flex-wrap gap-1" role="group" aria-label="Pick a row">
              {book.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPick(c)}
                  aria-pressed={i === rowIdx}
                  aria-label={`Row for ${c === " " ? "space" : c}`}
                  className={cn("h-7 w-7 cursor-pointer rounded-[5px] border font-mono text-[13px] font-medium", i === rowIdx ? "border-a-acc bg-a-acc text-a-acc-ink" : "border-a-wire bg-a-node text-a-fg hover:border-a-acc")}
                >
                  {show(c)}
                </button>
              ))}
            </div>
            <ul className="grid gap-1.5" data-testid="a-row">
              {book
                .map((c, j) => ({ c, j, share: shares[j], target: seenRow ? counts[rowIdx][j] / seenRow : 0, push: push[j] }))
                .filter((s) => s.target > 0 || s.share >= 0.02)
                .sort((a, b) => b.target - a.target || b.share - a.share)
                .map((s) => (
                  <li key={s.c} className="grid grid-cols-[28px_minmax(0,1fr)_48px_22px] items-center gap-2 font-mono text-[13px]">
                    <span className="grid h-7 place-items-center rounded-[5px] border border-a-wire bg-a-node">{show(s.c)}</span>
                    <span className="relative h-3 rounded-full bg-a-node">
                      <span className="block h-full rounded-full bg-a-acc transition-[width] duration-150" style={{ width: pct(s.share) }} />
                      {s.target > 0 && <span className="absolute -top-1 -bottom-1 w-0.5 rounded bg-a-fg" style={{ left: `calc(${pct(s.target)} - 1px)` }} />}
                    </span>
                    <span className="text-right text-a-stand">{pct(s.share)}</span>
                    <span className={cn("text-center", s.push < -1e-4 ? "text-a-acc" : "text-a-cap")} aria-label={s.push < -1e-4 ? "nudged up" : s.push > 1e-4 ? "nudged down" : "settled"}>
                      {s.push < -1e-4 ? "↑" : s.push > 1e-4 ? "↓" : "·"}
                    </span>
                  </li>
                ))}
            </ul>
            <p className="text-[15px] text-a-stand">
              Every nudge pushes up the dial of each letter that really came next, and pushes down the ones that didn&apos;t, harder the more share they wrongly took. Keep going and the bars line up with the tally you counted in stage 2: the nudger finds the same answer without ever counting.
            </p>
          </div>

          <div className="grid min-w-0 content-start gap-3 rounded-[10px] border border-a-rule bg-a-panel p-4">
            <h3 className="flex items-baseline justify-between gap-2.5 font-display text-base font-semibold leading-tight">
              How the score works <small className="font-mono text-xs font-normal text-a-cap">one guess at a time</small>
            </h3>
            <table className="w-full font-mono text-[13px]">
              <thead>
                <tr className="text-a-cap">
                  <th className="pb-1.5 text-left font-medium">share it gave the real next letter</th>
                  <th className="pb-1.5 text-right font-medium">wrongness</th>
                </tr>
              </thead>
              <tbody>
                {SCALE.map((s) => (
                  <tr key={s} className="border-t border-a-rule">
                    <td className="py-1.5">{pct(s)}</td>
                    <td className="py-1.5 text-right text-a-acc">{fix(wrongOf(s))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {firstPair && (
              <p data-testid="a-example" className="font-mono text-[13px] text-a-cap">
                your first pair: after &ldquo;{show(book[firstPair[0]])}&rdquo; came &ldquo;{show(book[firstPair[1]])}&rdquo;. the model gave it{" "}
                <span className="text-a-fg">{pct(firstShare)}</span>, so that guess scores <span className="text-a-acc">{fix(wrongOf(firstShare))}</span>
              </p>
            )}
            <p className="text-[15px] text-a-stand">
              A sure, right guess scores zero. A guess that gave the real letter almost nothing scores high. The score on the left is the average over every pair in your text, and nudging is just walking downhill on it.
            </p>
          </div>
        </div>

        <div className={cn("flex flex-wrap items-center justify-between gap-[18px] rounded-[10px] border p-[18px]", named ? "border-a-acc bg-a-acc/20" : "border-dashed border-a-wire")}>
          <div className="grid gap-1.5">
            <small className="font-mono text-[11px] font-medium uppercase leading-none tracking-[0.08em] text-a-cap">
              Word book · {named ? "4 words earned" : "4 words waiting"}
            </small>
            <div data-testid="a-word" className={cn("font-display text-[26px] font-semibold leading-tight", named ? "animate-rise tracking-[-0.01em] text-a-acc" : "tracking-[0.14em] text-a-wire")}>
              {named ? "loss · gradient · gradient descent · backprop" : "• • • • • • • •"}
            </div>
            <p className="max-w-[52ch] text-sm text-a-cap">
              {named
                ? "The wrongness score is the loss. The push on every dial is the gradient. Stepping each dial against its push, over and over, is gradient descent. Working the pushes out backwards from the score to each dial is backprop."
                : "These ideas have real names. They unlock once you can rebuild the score and the nudge from a blank page, without looking."}
            </p>
          </div>
          <button
            type="button"
            onClick={name}
            className={cn("cursor-pointer rounded-md border border-a-acc px-[18px] py-[11px] font-display text-sm font-semibold leading-none", named ? "bg-transparent text-a-acc" : "bg-a-acc text-a-acc-ink")}
          >
            {named ? "Added to your word book" : "I rebuilt it, unlock the names"}
          </button>
        </div>
      </section>
    </main>
  );
}
