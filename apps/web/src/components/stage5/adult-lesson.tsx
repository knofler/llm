"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ModelSoFar } from "@/components/model-so-far";
import { bookOf, show } from "@/lib/book";
import { freshEar, idsOf, listen, scoreOf, sizeOf, trainStep, WINDOW, writeFrom, type Ear } from "@/lib/listen";
import { dice, examplesOf, tallyScore } from "@/lib/map";
import { cn } from "@/lib/utils";
import { has, unlock } from "@/lib/wordbook";

const PHASES = ["Do it by hand", "Build it", "Watch it work", "Say it back", "Name it"];
const NOW = 2;
const START = "pip saw a cat. pip saw a dog. pip saw a cat. pip saw a dog.";
const BURST = 50;
const PER_TICK = 5;
const TICK_MS = 90;
const RATE = 0.5;
const MAX_STEPS = 1500;

const fix = (x: number) => x.toFixed(2);
const pct = (x: number) => `${Math.round(x * 100)}%`;
const btn = "cursor-pointer rounded-md border px-3.5 py-2 font-display text-sm font-semibold leading-none";

/** The score after every handful, as a falling line, with the tally's score dashed. */
function History({ points, tally }: { points: number[]; tally: number }) {
  const W = 320;
  const H = 96;
  const top = Math.max(points[0] ?? 1, tally, 0.01);
  const x = (i: number) => (points.length < 2 ? 0 : (i / (points.length - 1)) * W);
  const y = (v: number) => H - 4 - (v / top) * (H - 12);
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

/** Every letter in the window as a row: how much it listens to each letter up to itself. The last row is the one guessing. */
function Grid({ letters, rows }: { letters: string[]; rows: number[][] }) {
  const n = letters.length;
  const cell = 22;
  const pad = 22;
  const side = pad + n * cell;
  return (
    <svg viewBox={`0 0 ${side} ${side}`} role="img" aria-label="Who each letter listens to" className="h-auto w-full max-w-[320px]">
      {letters.map((c, i) => (
        <g key={`l${i}`} fontSize="12" fontFamily="ui-monospace, monospace" fill="#9a958c">
          <text x={pad + i * cell + cell / 2} y={14} textAnchor="middle">
            {show(c)}
          </text>
          <text x={11} y={pad + i * cell + cell / 2 + 4} textAnchor="middle" fill={i === n - 1 ? "#ff7a1f" : "#9a958c"}>
            {show(c)}
          </text>
        </g>
      ))}
      {rows.map((row, t) =>
        row.map((w, i) => (
          <rect
            key={`${t}-${i}`}
            x={pad + i * cell + 1}
            y={pad + t * cell + 1}
            width={cell - 2}
            height={cell - 2}
            rx="3"
            fill="#ff7a1f"
            fillOpacity={0.06 + 0.94 * w}
            stroke={t === n - 1 ? "#ff7a1f" : "none"}
            strokeWidth="1"
          />
        )),
      )}
    </svg>
  );
}

export function AdultLesson() {
  const [text, setText] = useState(START);
  const [size, setSize] = useState(8);
  const [running, setRunning] = useState(false);
  const [named, setNamed] = useState(false);
  const [written, setWritten] = useState("");
  const [at, setAt] = useState(20);

  const shown = text.length >= 3 ? text : "abc";
  const book = useMemo(() => bookOf(shown), [shown]);
  const ids = useMemo(() => idsOf(shown, book), [shown, book]);
  const tally = useMemo(() => tallyScore(examplesOf(shown, book), book.length), [shown, book]);

  const [ear, setEar] = useState<Ear>(() => freshEar(book.length));
  const [history, setHistory] = useState<number[]>([]);
  const live = ear.spots.length === book.length ? ear : freshEar(book.length);
  const score = useMemo(() => scoreOf(live, ids), [live, ids]);
  const points = history.length ? history : [score];
  const steps = Math.max(0, history.length - 1);

  // The letter doing the guessing, and the window it can see.
  const end = Math.min(Math.max(at, 1), ids.length - 1);
  const from = Math.max(0, end - WINDOW);
  const win = ids.slice(from, end);
  const rows = win.map((_, t) => listen(live, win.slice(0, t + 1)).shares);
  const { shares, guess } = listen(live, win);
  const top = guess.indexOf(Math.max(...guess));
  const loudest = shares.indexOf(Math.max(...shares));

  useEffect(() => {
    has("attention").then(setNamed);
  }, []);

  function reset(letters = book.length) {
    setEar(freshEar(letters));
    setHistory([]);
    setRunning(false);
    setWritten("");
  }

  function edit(v: string) {
    const next = v.toLowerCase();
    setText(next);
    setAt(Math.min(20, Math.max(1, next.length - 1)));
    reset(bookOf(next.length >= 3 ? next : "abc").length);
  }

  function trainBy(n: number) {
    let cur = live;
    const seen: number[] = [];
    for (let i = 0; i < n; i++) {
      cur = trainStep(cur, ids, size, RATE);
      seen.push(scoreOf(cur, ids));
    }
    setEar(cur);
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
    const out = writeFrom(live, ids.slice(0, 2), 60, dice(steps + 11));
    setWritten(out.map((i) => book[i]).join(""));
  }

  async function name() {
    if (named) return;
    setNamed(true);
    await unlock(["attention", "head", "transformer"], 5);
  }

  return (
    <main className="grid min-h-[calc(100dvh-60px)] grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)]">
      <ModelSoFar now={5} />

      <section className="grid max-w-[1040px] content-start gap-[30px] px-[clamp(20px,4vw,56px)] pt-9 pb-16">
        <div>
          <div className="font-mono text-xs font-medium uppercase leading-none tracking-[0.1em] text-a-acc">Stage 5 of 7 · Who listens to whom</div>
          <h1 className="mt-2.5 font-display text-[clamp(30px,4.2vw,46px)] font-semibold leading-[1.05] tracking-[-0.025em] text-balance">
            Let every letter choose which earlier letters to listen to.
          </h1>
          <p className="mt-3 max-w-[60ch] text-[19px] text-a-stand">
            The letter map read a fixed two letters back. Now every letter can look at up to {WINDOW} letters before it. Each letter makes three short lists of numbers from its spot: a <b>question</b> (what am I looking for?), a <b>label</b> (what do I have?) and a <b>message</b> (what will I pass on?). A letter scores each earlier letter by how well its question matches their label, turns the scores into shares, and blends their messages by those shares. The nudge learns what to ask, what to label and what to say.
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
            <span>Your listening layer, learning</span>
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
                your spots + questions + labels + messages + guess dials: <span className="text-a-fg">{sizeOf(book.length)}</span> numbers
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="grid min-w-0 content-start gap-3 rounded-[10px] border border-a-rule bg-a-panel p-4">
            <h3 className="flex items-baseline justify-between gap-2.5 font-display text-base font-semibold leading-tight">
              Who is listening to whom <small className="font-mono text-xs font-normal text-a-cap">darker = listens more</small>
            </h3>
            <div className="grid gap-1.5">
              <label htmlFor="a-at" className="flex justify-between font-mono text-xs font-medium text-a-cap">
                <span>letter doing the guessing</span>
                <span className="text-a-fg">#{end}</span>
              </label>
              <input id="a-at" type="range" min={1} max={ids.length - 1} value={end} onChange={(e) => setAt(Number(e.target.value))} className="accent-a-acc" />
            </div>
            <div className="rounded-md border border-a-wire bg-a-node p-2">
              <Grid letters={win.map((i) => book[i])} rows={rows} />
            </div>
            <p data-testid="a-listen" className="font-mono text-[13px] text-a-cap">
              &ldquo;<span className="text-a-acc">{show(book[win.at(-1)!])}</span>&rdquo; listens most to the &ldquo;{show(book[win[loudest]])}&rdquo; {win.length - 1 - loudest === 0 ? "that is itself" : `${win.length - 1 - loudest} back`} ({pct(shares[loudest])}) and guesses &ldquo;
              {show(book[top])}&rdquo; next ({pct(guess[top])}) · really: &ldquo;{show(book[ids[end]])}&rdquo;
            </p>
            <p className="text-[15px] text-a-stand">
              Each row is one letter, and its squares show how it shares out its listening over the letters up to itself (a letter never peeks ahead). Before training the shares are a blur. After, a letter learns to listen hard to the few letters that tell it what comes next.
            </p>
          </div>

          <div className="grid min-w-0 content-start gap-3 rounded-[10px] border border-a-rule bg-a-panel p-4">
            <h3 className="flex items-baseline justify-between gap-2.5 font-display text-base font-semibold leading-tight">
              Let it write <small className="font-mono text-xs font-normal text-a-cap">{WINDOW} letters back</small>
            </h3>
            <button type="button" onClick={write} className={cn(btn, "w-fit border-a-acc text-a-acc")}>
              Write 60 letters
            </button>
            <p data-testid="a-write" className="min-h-[3.2em] break-all rounded-md border border-a-wire bg-a-node px-3 py-2 font-mono text-[14px] text-a-fg">
              {written || "…"}
            </p>
            <p className="text-[15px] text-a-stand">
              It starts from the first two letters of your text and rolls the lopsided die on each guess. Now every guess can look a whole word or two back, not just two letters.
            </p>
          </div>
        </div>

        <div className={cn("flex flex-wrap items-center justify-between gap-[18px] rounded-[10px] border p-[18px]", named ? "border-a-acc bg-a-acc/20" : "border-dashed border-a-wire")}>
          <div className="grid gap-1.5">
            <small className="font-mono text-[11px] font-medium uppercase leading-none tracking-[0.08em] text-a-cap">
              Word book · {named ? "3 words earned" : "3 words waiting"}
            </small>
            <div data-testid="a-word" className={cn("font-display text-[26px] font-semibold leading-tight", named ? "animate-rise tracking-[-0.01em] text-a-acc" : "tracking-[0.14em] text-a-wire")}>
              {named ? "attention · head · transformer" : "• • • • • •"}
            </div>
            <p className="max-w-[52ch] text-sm text-a-cap">
              {named
                ? "Scoring earlier letters with questions and labels, then blending their messages, is attention. One set of question, label and message dials is a head. A listening layer followed by your stage 4 thinking layer, each with its input added back on, is a transformer block. Stage 6 stacks them."
                : "These ideas have real names. They unlock once you can rebuild the questions, labels and messages from a blank page, without looking."}
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
