"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ModelSoFar } from "@/components/model-so-far";
import { bookOf, show } from "@/lib/book";
import { dice, examplesOf, freshNet, nearest, scoreOf, sizeOf, tallyScore, trainStep, writeFrom, type Net } from "@/lib/map";
import { cn } from "@/lib/utils";
import { has, unlock } from "@/lib/wordbook";

const PHASES = ["Do it by hand", "Build it", "Watch it work", "Say it back", "Name it"];
const NOW = 2;
const START = "the cat sat on the mat. the hat is on the cat. a fat rat ate the hat.";
const BURST = 50;
const PER_TICK = 5;
const TICK_MS = 90;
const RATE = 0.6;
const MAX_STEPS = 1500;

const fix = (x: number) => x.toFixed(2);
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

/** Every letter drawn at its spot. Click one to light up its nearest neighbours. */
function LetterMap({ net, book, pick, near, onPick }: { net: Net; book: string[]; pick: number; near: number[]; onPick: (i: number) => void }) {
  const xs = net.spots.map((s) => s[0]);
  const ys = net.spots.map((s) => s[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const sx = (v: number) => 24 + ((v - x0) / Math.max(x1 - x0, 1e-6)) * 272;
  const sy = (v: number) => 24 + ((v - y0) / Math.max(y1 - y0, 1e-6)) * 192;
  return (
    <svg viewBox="0 0 320 240" role="group" aria-label="Letter map" data-testid="a-map" className="h-auto w-full">
      {near.map((j) => (
        <line key={j} x1={sx(net.spots[pick][0])} y1={sy(net.spots[pick][1])} x2={sx(net.spots[j][0])} y2={sy(net.spots[j][1])} stroke="#ff7a1f" strokeOpacity="0.45" strokeWidth="1.5" />
      ))}
      {book.map((c, i) => {
        const on = i === pick;
        const close = near.includes(i);
        return (
          <g
            key={c}
            role="button"
            tabIndex={0}
            aria-label={`Letter ${c === " " ? "space" : c}`}
            aria-pressed={on}
            onClick={() => onPick(i)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick(i)}
            className="cursor-pointer"
            style={{ transform: `translate(${sx(net.spots[i][0])}px, ${sy(net.spots[i][1])}px)`, transition: "transform 160ms ease-out" }}
          >
            <circle r="12" fill={on ? "#ff7a1f" : close ? "#5a3a1f" : "#2b2722"} stroke={on || close ? "#ff7a1f" : "#5c574f"} strokeWidth="1.5" />
            <text textAnchor="middle" dy="4.5" fontSize="13" fontFamily="ui-monospace, monospace" fontWeight="600" fill={on ? "#1a1612" : "#f2ede4"}>
              {show(c)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function AdultLesson() {
  const [text, setText] = useState(START);
  const [size, setSize] = useState(16);
  const [pick, setPick] = useState(0);
  const [running, setRunning] = useState(false);
  const [named, setNamed] = useState(false);
  const [written, setWritten] = useState("");

  const shown = text.length >= 3 ? text : "abc";
  const book = useMemo(() => bookOf(shown), [shown]);
  const examples = useMemo(() => examplesOf(shown, book), [shown, book]);
  const tally = useMemo(() => tallyScore(examples, book.length), [examples, book]);

  const [net, setNet] = useState<Net>(() => freshNet(book.length));
  const [history, setHistory] = useState<number[]>([]);
  const live = net.spots.length === book.length ? net : freshNet(book.length);
  const score = scoreOf(live, examples);
  const points = history.length ? history : [score];
  const steps = Math.max(0, history.length - 1);
  const at = Math.min(pick, book.length - 1);
  const near = nearest(live, at, Math.min(3, book.length - 1));

  useEffect(() => {
    has("embedding").then(setNamed);
  }, []);

  function reset(letters = book.length) {
    setNet(freshNet(letters));
    setHistory([]);
    setRunning(false);
    setWritten("");
  }

  function edit(v: string) {
    const next = v.toLowerCase();
    setText(next);
    setPick(0);
    reset(bookOf(next.length >= 3 ? next : "abc").length);
  }

  function trainBy(times: number) {
    let cur = live;
    const seen: number[] = [];
    for (let i = 0; i < times; i++) {
      cur = trainStep(cur, examples, size, RATE);
      seen.push(scoreOf(cur, examples));
    }
    setNet(cur);
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
    const id = new Map(book.map((c, i) => [c, i]));
    const out = writeFrom(live, [id.get(shown[0])!, id.get(shown[1])!], 60, dice(steps + 11));
    setWritten(out.map((i) => book[i]).join(""));
  }

  async function name() {
    if (named) return;
    setNamed(true);
    await unlock(["embedding", "MLP", "batch"], 4);
  }

  const mine = sizeOf(book.length);
  const twoBack = book.length ** 3;

  return (
    <main className="grid min-h-[calc(100dvh-60px)] grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)]">
      <ModelSoFar now={4} />

      <section className="grid max-w-[1040px] content-start gap-[30px] px-[clamp(20px,4vw,56px)] pt-9 pb-16">
        <div>
          <div className="font-mono text-xs font-medium uppercase leading-none tracking-[0.1em] text-a-acc">Stage 4 of 7 · The letter map</div>
          <h1 className="mt-2.5 font-display text-[clamp(30px,4.2vw,46px)] font-semibold leading-[1.05] tracking-[-0.025em] text-balance">
            Give every letter a spot on a map. Letters that act alike end up neighbours.
          </h1>
          <p className="mt-3 max-w-[60ch] text-[19px] text-a-stand">
            The tally only looked one letter back, and a tally two letters back would need a box for every three-letter run. Instead, give each letter two numbers, a spot on a flat map. Feed the spots of the last two letters through a small layer of dials, and let the hot-and-cold nudge move the dials <i>and</i> the spots. Each nudge looks at only a small random handful of places in the text, so it stays quick however long the text gets.
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
            <span>Your letter map, learning</span>
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
                <input id="a-size" type="range" min={1} max={64} value={size} onChange={(e) => setSize(Number(e.target.value))} className="accent-a-acc" />
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
              <p data-testid="a-size" className="font-mono text-xs text-a-cap">
                your map + dials: <span className="text-a-fg">{mine}</span> numbers · a two-back tally would need {book.length}³ = <span className="text-a-fg">{twoBack}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="grid min-w-0 content-start gap-3 rounded-[10px] border border-a-rule bg-a-panel p-4">
            <h3 className="flex items-baseline justify-between gap-2.5 font-display text-base font-semibold leading-tight">
              The map <small className="font-mono text-xs font-normal text-a-cap">click a letter</small>
            </h3>
            <div className="rounded-md border border-a-wire bg-a-node p-1.5">
              <LetterMap net={live} book={book} pick={at} near={near} onPick={setPick} />
            </div>
            <p data-testid="a-near" className="font-mono text-[13px] text-a-cap">
              nearest to &ldquo;<span className="text-a-acc">{show(book[at])}</span>&rdquo;: {near.map((j) => `“${show(book[j])}”`).join(" ")}
            </p>
            <p className="text-[15px] text-a-stand">
              Nobody tells the map where to put anything. Letters get pulled together when swapping one for the other barely changes the guesses: in English text the vowels drift into a cluster, and so do the letters that end words.
            </p>
          </div>

          <div className="grid min-w-0 content-start gap-3 rounded-[10px] border border-a-rule bg-a-panel p-4">
            <h3 className="flex items-baseline justify-between gap-2.5 font-display text-base font-semibold leading-tight">
              Let it write <small className="font-mono text-xs font-normal text-a-cap">two letters back</small>
            </h3>
            <button type="button" onClick={write} className={cn(btn, "w-fit border-a-acc text-a-acc")}>
              Write 60 letters
            </button>
            <p data-testid="a-write" className="min-h-[3.2em] break-all rounded-md border border-a-wire bg-a-node px-3 py-2 font-mono text-[14px] text-a-fg">
              {written || "…"}
            </p>
            <p className="text-[15px] text-a-stand">
              It starts from the first two letters of your text and rolls the lopsided die on each guess, like stage 2. Because it reads two letters back, words hold together better than the tally managed, once the score has dropped.
            </p>
          </div>
        </div>

        <div className={cn("flex flex-wrap items-center justify-between gap-[18px] rounded-[10px] border p-[18px]", named ? "border-a-acc bg-a-acc/20" : "border-dashed border-a-wire")}>
          <div className="grid gap-1.5">
            <small className="font-mono text-[11px] font-medium uppercase leading-none tracking-[0.08em] text-a-cap">
              Word book · {named ? "3 words earned" : "3 words waiting"}
            </small>
            <div data-testid="a-word" className={cn("font-display text-[26px] font-semibold leading-tight", named ? "animate-rise tracking-[-0.01em] text-a-acc" : "tracking-[0.14em] text-a-wire")}>
              {named ? "embedding · MLP · batch" : "• • • • • •"}
            </div>
            <p className="max-w-[52ch] text-sm text-a-cap">
              {named
                ? "A letter's spot on the map is its embedding. The spots going through a layer of dials and a squash is an MLP. The random handful each nudge looks at is a batch."
                : "These ideas have real names. They unlock once you can rebuild the map and the dials from a blank page, without looking."}
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
