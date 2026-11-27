"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ModelSoFar } from "@/components/model-so-far";
import { bookOf, show } from "@/lib/book";
import { dice, examplesOf, tallyScore } from "@/lib/map";
import { freshBot, HEADS, idsOf, look, MAX_BLOCKS, partsOf, scoreOf, trainStep, WINDOW, writeFrom, type Bot } from "@/lib/stack";
import { cn } from "@/lib/utils";
import { has, unlock } from "@/lib/wordbook";

const PHASES = ["Do it by hand", "Build it", "Watch it work", "Say it back", "Name it"];
const NOW = 2;
const START = "pip saw a cat. pip saw a dog. pip saw a cat. pip saw a dog.";
const BURST = 50;
const PER_TICK = 4;
const TICK_MS = 90;
const RATE = 0.5;
const MAX_STEPS = 1500;
const WORDS = ["GPT", "training", "parameters", "temperature"];

const fix = (x: number) => x.toFixed(2);
const pct = (x: number) => `${Math.round(x * 100)}%`;
const btn = "cursor-pointer rounded-md border px-3.5 py-2 font-display text-sm font-semibold leading-none";

/** The score after every handful, as a falling line, with the tally's score dashed. */
function History({ points, tally }: { points: number[]; tally: number }) {
  const W = 320;
  const H = 96;
  const top = Math.max(points[0] ?? 1, tally, 0.01);
  const x = (i: number) => (points.length < 2 ? 0 : (i / (points.length - 1)) * W);
  const y = (v: number) => H - 4 - (Math.min(v, top) / top) * (H - 12);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Wrongness after each handful" className="h-24 w-full" preserveAspectRatio="none">
      <line x1="0" x2={W} y1={y(tally)} y2={y(tally)} stroke="#9a958c" strokeDasharray="4 4" strokeWidth="1" vectorEffect="non-scaling-stroke" />
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

/** The whole model as a column of boxes, bottom to top in the order the numbers flow. */
function Stack({ blocks, parts }: { blocks: number; parts: ReturnType<typeof partsOf> }) {
  const box = "grid gap-0.5 rounded-md border px-3 py-2";
  const each = (n: number) => Math.round(n / Math.max(blocks, 1));
  return (
    <ol aria-label="The whole model" className="grid gap-2">
      <li className={cn(box, "border-a-wire bg-a-node")}>
        <b className="font-display text-sm font-semibold">Guess dials → shares for the next letter</b>
        <span className="font-mono text-[11px] text-a-cap">{parts.guess} numbers</span>
      </li>
      {Array.from({ length: blocks }, (_, i) => blocks - i).map((n) => (
        <li key={n} data-testid="a-block" className={cn(box, "border-a-acc bg-a-acc/10")}>
          <b className="font-display text-sm font-semibold text-a-acc">Block {n}</b>
          <span className="text-[13px] text-a-stand">
            listen ({HEADS} listeners side by side) + add back · think + add back
          </span>
          <span className="font-mono text-[11px] text-a-cap">
            {each(parts.listen)} + {each(parts.think)} numbers
          </span>
        </li>
      ))}
      <li className={cn(box, "border-a-wire bg-a-node")}>
        <b className="font-display text-sm font-semibold">Letter spots + place spots</b>
        <span className="font-mono text-[11px] text-a-cap">{parts.spots} numbers</span>
      </li>
    </ol>
  );
}

/** One row per listener in every block: how the last letter shares out its listening over the window. */
function Ears({ letters, ears }: { letters: string[]; ears: number[][][] }) {
  const n = letters.length;
  const cell = 18;
  const pad = 46;
  const rows = ears.flatMap((block, b) => block.map((shares, h) => ({ label: `B${b + 1}·L${h + 1}`, shares })));
  const w = pad + n * cell;
  const h = 18 + rows.length * cell;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Whom each listener hears" className="h-auto w-full max-w-[360px]">
      {letters.map((c, i) => (
        <text key={`c${i}`} x={pad + i * cell + cell / 2} y={12} textAnchor="middle" fontSize="11" fontFamily="ui-monospace, monospace" fill={i === n - 1 ? "#ff7a1f" : "#9a958c"}>
          {show(c)}
        </text>
      ))}
      {rows.map((r, t) => (
        <g key={r.label}>
          <text x={0} y={18 + t * cell + cell / 2 + 4} fontSize="10" fontFamily="ui-monospace, monospace" fill="#9a958c">
            {r.label}
          </text>
          {r.shares.map((s, i) => (
            <rect key={i} x={pad + i * cell + 1} y={18 + t * cell + 1} width={cell - 2} height={cell - 2} rx="3" fill="#ff7a1f" fillOpacity={0.06 + 0.94 * s} />
          ))}
        </g>
      ))}
    </svg>
  );
}

export function AdultLesson() {
  const [text, setText] = useState(START);
  const [blocks, setBlocks] = useState(2);
  const [size, setSize] = useState(8);
  const [running, setRunning] = useState(false);
  const [named, setNamed] = useState(false);
  const [written, setWritten] = useState("");
  const [bold, setBold] = useState(1);

  const shown = text.length >= 3 ? text : "abc";
  const book = useMemo(() => bookOf(shown), [shown]);
  const ids = useMemo(() => idsOf(shown, book), [shown, book]);
  const tally = useMemo(() => tallyScore(examplesOf(shown, book), book.length), [shown, book]);

  const [bot, setBot] = useState<Bot>(() => freshBot(book.length, blocks));
  const [history, setHistory] = useState<number[]>([]);
  const live = bot.spots.length === book.length && bot.blocks.length === blocks ? bot : freshBot(book.length, blocks);
  const score = useMemo(() => scoreOf(live, ids), [live, ids]);
  const points = history.length ? history : [score];
  const steps = Math.max(0, history.length - 1);
  const parts = partsOf(book.length, blocks);

  // The last letters of the text, and what the stack makes of them.
  const win = ids.slice(-WINDOW - 1, -1);
  const { guess, ears } = look(live, win);
  const top = guess.indexOf(Math.max(...guess));

  useEffect(() => {
    has("GPT").then(setNamed);
  }, []);

  function reset(letters = book.length, n = blocks) {
    setBot(freshBot(letters, n));
    setHistory([]);
    setRunning(false);
    setWritten("");
  }

  function edit(v: string) {
    const next = v.toLowerCase();
    setText(next);
    reset(bookOf(next.length >= 3 ? next : "abc").length);
  }

  function stackOf(n: number) {
    setBlocks(n);
    reset(book.length, n);
  }

  function trainBy(n: number) {
    let cur = live;
    const seen: number[] = [];
    for (let i = 0; i < n; i++) {
      cur = trainStep(cur, ids, size, RATE);
      seen.push(scoreOf(cur, ids));
    }
    setBot(cur);
    setHistory((h) => [...(h.length ? h : [score]), ...seen]);
  }

  const tick = useRef(trainBy);
  tick.current = trainBy;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => tick.current(PER_TICK), TICK_MS);
    return () => window.clearInterval(id);
  }, [running]);
  useEffect(() => {
    if (running && (score < 0.01 || steps >= MAX_STEPS)) setRunning(false);
  }, [running, score, steps]);

  function write() {
    const out = writeFrom(live, ids.slice(0, 2), 80, bold, dice(steps + Math.round(bold * 10) + 11));
    setWritten(out.map((i) => book[i]).join(""));
  }

  async function name() {
    if (named) return;
    setNamed(true);
    await unlock(WORDS, 6);
  }

  return (
    <main className="grid min-h-[calc(100dvh-60px)] grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)]">
      <ModelSoFar now={6} />

      <section className="grid max-w-[1040px] content-start gap-[30px] px-[clamp(20px,4vw,56px)] pt-9 pb-16">
        <div>
          <div className="font-mono text-xs font-medium uppercase leading-none tracking-[0.1em] text-a-acc">Stage 6 of 7 · The full stack</div>
          <h1 className="mt-2.5 font-display text-[clamp(30px,4.2vw,46px)] font-semibold leading-[1.05] tracking-[-0.025em] text-balance">
            Stack the blocks into a model that writes.
          </h1>
          <p className="mt-3 max-w-[60ch] text-[19px] text-a-stand">
            Stage 5 gave you one block: a listening layer, then a thinking layer, each adding its answer back onto what came in. Now run {HEADS} listeners side by side in every block, so each letter can follow two threads at once, and put blocks on top of each other. Each block reads what the one below wrote and adds a little more. Everything you built is in here: the book, the shares, the nudge, the spots, the listening. Pick how many blocks, train it, and let it write.
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
            <span>Your stack, learning</span>
            <span data-testid="a-steps">{steps} handfuls so far</span>
          </div>
          <div className="grid gap-2 px-4 pt-[18px]">
            <label htmlFor="a-text" className="font-mono text-xs font-medium text-a-cap">
              text to learn from
            </label>
            <textarea
              id="a-text"
              rows={2}
              maxLength={240}
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
                <span data-testid="a-tally" className="font-mono text-xs text-a-cap">
                  your stage 2 tally scores: {fix(tally)}
                </span>
              </div>
              <div className="grid gap-1.5">
                <span className="font-mono text-xs font-medium text-a-cap">blocks in the stack</span>
                <div role="group" aria-label="Blocks in the stack" className="flex gap-1.5">
                  {Array.from({ length: MAX_BLOCKS }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={blocks === n}
                      onClick={() => stackOf(n)}
                      className={cn(btn, "min-w-11", blocks === n ? "border-a-acc bg-a-acc text-a-acc-ink" : "border-a-wire text-a-cap hover:text-a-fg")}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="a-size" className="flex justify-between font-mono text-xs font-medium text-a-cap">
                  <span>handful size</span>
                  <span className="text-a-fg">{size}</span>
                </label>
                <input id="a-size" type="range" min={1} max={32} value={size} onChange={(e) => setSize(Number(e.target.value))} className="accent-a-acc" />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => trainBy(1)} className={cn(btn, "border-a-acc bg-a-acc text-a-acc-ink")}>
                  Train 1 handful
                </button>
                <button type="button" onClick={() => trainBy(BURST)} className={cn(btn, "border-a-acc text-a-acc")}>
                  Train {BURST}
                </button>
                <button type="button" onClick={() => setRunning((r) => !r)} className={cn(btn, "border-a-acc text-a-acc")}>
                  {running ? "Stop" : "Run"}
                </button>
                <button type="button" onClick={() => reset()} className={cn(btn, "border-a-wire font-medium text-a-cap hover:text-a-fg")}>
                  Start over
                </button>
              </div>
            </div>
            <div className="grid min-w-0 content-start gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-a-cap">score after each handful · dashed line = the stage 2 tally</span>
              <div className="rounded-md border border-a-wire bg-a-node px-2 py-1.5">
                <History points={points} tally={tally} />
              </div>
              <p data-testid="a-count" className="font-mono text-xs text-a-cap">
                every number the nudge can turn: <span className="text-a-fg">{parts.total.toLocaleString("en")}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="grid min-w-0 content-start gap-3 rounded-[10px] border border-a-rule bg-a-panel p-4">
            <h3 className="flex items-baseline justify-between gap-2.5 font-display text-base font-semibold leading-tight">
              The whole model <small className="font-mono text-xs font-normal text-a-cap">numbers flow upward</small>
            </h3>
            <Stack blocks={blocks} parts={parts} />
            <p className="text-[15px] text-a-stand">
              Every block has the same shape, so stacking more is just repeating it. The add-back lines matter: each block only has to add a small fix on top of what it was given, which is what lets a tall stack still learn.
            </p>
          </div>

          <div className="grid min-w-0 content-start gap-3 rounded-[10px] border border-a-rule bg-a-panel p-4">
            <h3 className="flex items-baseline justify-between gap-2.5 font-display text-base font-semibold leading-tight">
              Whom each listener hears <small className="font-mono text-xs font-normal text-a-cap">darker = listens more</small>
            </h3>
            <div className="overflow-x-auto rounded-md border border-a-wire bg-a-node p-2">
              <Ears letters={win.map((i) => book[i])} ears={ears} />
            </div>
            <p data-testid="a-guess" className="font-mono text-[13px] text-a-cap">
              after &ldquo;{win.map((i) => book[i]).join("").slice(-8)}&rdquo; it guesses &ldquo;<span className="text-a-acc">{show(book[top])}</span>&rdquo; ({pct(guess[top])}) · really: &ldquo;{show(book[ids.at(-1)!])}&rdquo;
            </p>
            <p className="text-[15px] text-a-stand">
              B1·L2 means block 1, listener 2. After training, listeners in the same block tend to split the work: one stays close, another reaches back to the start of the word.
            </p>
          </div>
        </div>

        <div className="grid min-w-0 content-start gap-3 rounded-[10px] border border-a-rule bg-a-panel p-4">
          <h3 className="flex items-baseline justify-between gap-2.5 font-display text-base font-semibold leading-tight">
            Let it write <small className="font-mono text-xs font-normal text-a-cap">{WINDOW} letters back</small>
          </h3>
          <div className="grid max-w-[420px] gap-1.5">
            <label htmlFor="a-bold" className="flex justify-between font-mono text-xs font-medium text-a-cap">
              <span>boldness</span>
              <span className="text-a-fg">{bold.toFixed(1)}</span>
            </label>
            <input id="a-bold" type="range" min={0.2} max={2} step={0.1} value={bold} onChange={(e) => setBold(Number(e.target.value))} className="accent-a-acc" />
          </div>
          <button type="button" onClick={write} className={cn(btn, "w-fit border-a-acc text-a-acc")}>
            Write 80 letters
          </button>
          <p data-testid="a-write" className="min-h-[3.2em] break-all rounded-md border border-a-wire bg-a-node px-3 py-2 font-mono text-[14px] text-a-fg">
            {written || "…"}
          </p>
          <p className="max-w-[70ch] text-[15px] text-a-stand">
            Before the shares are worked out, every score is divided by the boldness. Below 1 the favourite gets even more of the share, so it plays safe and repeats itself. Above 1 the shares flatten out, so rare letters get picked more and it takes chances, and makes more mistakes.
          </p>
        </div>

        <div className={cn("flex flex-wrap items-center justify-between gap-[18px] rounded-[10px] border p-[18px]", named ? "border-a-acc bg-a-acc/20" : "border-dashed border-a-wire")}>
          <div className="grid gap-1.5">
            <small className="font-mono text-[11px] font-medium uppercase leading-none tracking-[0.08em] text-a-cap">
              Word book · {named ? "4 words earned" : "4 words waiting"}
            </small>
            <div data-testid="a-word" className={cn("font-display text-[26px] font-semibold leading-tight", named ? "animate-rise tracking-[-0.01em] text-a-acc" : "tracking-[0.14em] text-a-wire")}>
              {named ? WORDS.join(" · ") : "• • • • • • • •"}
            </div>
            <p className="max-w-[52ch] text-sm text-a-cap">
              {named
                ? "A stack of transformer blocks that only ever looks back and guesses the next token is a GPT. Running the nudge over handfuls again and again is training. Every number it can turn is a parameter: yours has a few thousand, the first big GPTs had over a hundred million. The boldness dial is called temperature."
                : "These ideas have real names. They unlock once you can draw the whole stack from a blank page, every box and every add-back line, without looking."}
            </p>
          </div>
          <button
            type="button"
            onClick={name}
            className={cn("cursor-pointer rounded-md border border-a-acc px-[18px] py-[11px] font-display text-sm font-semibold leading-none", named ? "bg-transparent text-a-acc" : "bg-a-acc text-a-acc-ink")}
          >
            {named ? "Added to your word book" : "I drew it, unlock the names"}
          </button>
        </div>
      </section>
    </main>
  );
}
