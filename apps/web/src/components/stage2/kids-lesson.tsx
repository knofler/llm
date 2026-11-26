"use client";

import { useMemo, useState } from "react";
import { Pip } from "@/components/stage1/kids-lesson";
import { nextOf, roll, tallyOf } from "@/lib/tally";
import { cn } from "@/lib/utils";
import { unlock } from "@/lib/wordbook";

const CARD = ["bg-k-mustard", "bg-k-rose", "bg-k-leaf", "bg-k-peach", "bg-k-tomato"];
const FILL = ["#f0ad2e", "#f3a6a0", "#7fae4e", "#f7c89b", "#e2553f"];
const LONGEST = 10;
const SPIN_MS = 900;

const field = "min-w-0 max-w-[260px] flex-1 rounded-[14px] border-[2.5px] border-k-ink bg-k-white px-3.5 py-2.5 font-kid text-[22px] font-semibold leading-none tracking-[0.04em] focus:shadow-[0_0_0_4px] focus:shadow-k-peach focus:outline-none";

function at(deg: number, r: number): string {
  const a = (deg * Math.PI) / 180;
  return `${(100 + r * Math.sin(a)).toFixed(2)} ${(100 - r * Math.cos(a)).toFixed(2)}`;
}

/** Pip's spinner: one slice per letter that ever came next, sized by its tally. */
function Spinner({ slices, turn }: { slices: { next: string; share: number }[]; turn: number }) {
  let edge = 0;
  return (
    <svg viewBox="0 0 200 212" role="img" aria-label="Pip's spinner" className="h-auto w-[min(100%,230px)]">
      <g style={{ transform: `rotate(${turn}deg)`, transformOrigin: "100px 112px", transition: `transform ${SPIN_MS}ms cubic-bezier(0.2, 0.8, 0.3, 1)` }}>
        <g transform="translate(0 12)">
          {slices.length === 1 ? (
            <circle cx="100" cy="100" r="90" fill={FILL[0]} stroke="#3a2c24" strokeWidth="3.5" />
          ) : (
            slices.map((s, i) => {
              const from = edge * 360;
              edge += s.share;
              const to = edge * 360;
              return <path key={s.next} d={`M100 100 L${at(from, 90)} A90 90 0 ${to - from > 180 ? 1 : 0} 1 ${at(to, 90)} Z`} fill={FILL[i % FILL.length]} stroke="#3a2c24" strokeWidth="3" strokeLinejoin="round" />;
            })
          )}
          {(() => {
            let e = 0;
            return slices.map((s) => {
              const mid = (e + s.share / 2) * 360;
              e += s.share;
              const [x, y] = at(mid, slices.length === 1 ? 50 : 56).split(" ");
              return (
                <text key={s.next} x={x} y={y} dy="0.35em" textAnchor="middle" className="font-kid" fontWeight="700" fontSize="26" fill="#3a2c24">
                  {s.next.toUpperCase()}
                </text>
              );
            });
          })()}
          <circle cx="100" cy="100" r="9" fill="#fffaf1" stroke="#3a2c24" strokeWidth="3" />
        </g>
      </g>
      <path d="M100 26 L88 4 L112 4 Z" fill="#3a2c24" />
    </svg>
  );
}

/** Where to stop so the middle of `pick`'s slice lands under the pointer. */
function landing(slices: { next: string; share: number }[], pick: string, turn: number): number {
  let e = 0;
  let mid = 0;
  for (const s of slices) {
    if (s.next === pick) mid = (e + s.share / 2) * 360;
    e += s.share;
  }
  const now = ((turn % 360) + 360) % 360;
  return turn + 720 + ((((360 - mid) - now) % 360) + 360) % 360;
}

export function KidsLesson() {
  const [raw, setRaw] = useState("abracadabra");
  const [said, setSaid] = useState("");
  const [turn, setTurn] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [solved, setSolved] = useState(false);

  const word = (raw.replace(/[^a-z]/gi, "") || "pip").toLowerCase();
  const letters = [...word];
  const tally = useMemo(() => tallyOf(word), [word]);
  const rows = [...new Set(letters)];
  const current = said.at(-1) ?? word[0];
  const slices = nextOf(tally, current);
  const stuck = slices.length === 0;
  const full = (said || word[0]).length >= LONGEST;

  function newWord(v: string) {
    setRaw(v);
    setSaid("");
    setTurn(0);
  }

  function spin() {
    if (spinning || stuck || full) return;
    const pick = roll(tally, current);
    if (pick === null) return;
    setSpinning(true);
    setTurn((t) => landing(slices, pick, t));
    window.setTimeout(() => {
      setSaid((s) => (s || word[0]) + pick);
      setTurn(0);
      setSpinning(false);
    }, SPIN_MS + 150);
  }

  function guess(v: string) {
    const ok = v.trim().toLowerCase() === "a";
    setSolved(ok);
    if (ok) unlock(["bigram", "probability", "sampling"], 2);
  }

  return (
    <main className="grid justify-items-center gap-[22px] pt-8 pb-16 pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))]">
      <div aria-label="Chapter 2 of 7" className="flex items-center gap-2 font-kid text-sm font-semibold leading-none text-k-soft">
        {Array.from({ length: 7 }, (_, i) => (
          <i key={i} className={cn("size-3 rounded-full border-2", i === 1 ? "border-k-tomato bg-k-tomato" : i < 1 ? "border-k-leaf bg-k-leaf" : "border-k-soft")} />
        ))}
        <span>Chapter 2 of 7</span>
      </div>

      <article className="book-fold relative grid w-full max-w-[1100px] grid-cols-1 overflow-hidden rounded-[18px] bg-k-page shadow-[0_1px_0_var(--color-k-line),0_22px_40px_-22px_rgb(90_60_30/0.35),0_0_0_1px_var(--color-k-line)] md:grid-cols-2">
        <div className="relative grid min-w-0 content-start gap-4 p-[clamp(22px,4vw,44px)]">
          <div className="font-kid text-sm font-semibold leading-none tracking-[0.04em] text-k-tomato">Chapter 2</div>
          <h1 className="font-kid text-[clamp(30px,4vw,44px)] font-bold leading-[1.02] tracking-[-0.01em] text-balance">What comes next?</h1>
          <p className="max-w-[34ch] text-xl leading-[1.55]">
            Pip can read numbers now. But Pip still can&apos;t talk! Here is Pip&apos;s trick: listen to a word, and keep a <b>tally</b> of which letter comes after which.
          </p>
          <div className="bubble-tail relative max-w-[30ch] justify-self-start rounded-[20px] border-[2.5px] border-k-ink bg-k-white px-4 py-2.5 font-kid text-[19px] font-semibold leading-snug">
            Then I spin my spinner to pick the next letter!
          </div>
          <div className="grid place-items-center pt-1.5 pb-5">
            <Pip />
          </div>
          <span className="absolute bottom-4 left-6 font-kid text-sm font-semibold leading-none text-k-soft">4</span>
        </div>

        <div className="relative grid min-w-0 content-start gap-4 p-[clamp(22px,4vw,44px)]">
          <div className="flex flex-wrap items-center gap-2.5">
            <label htmlFor="k-word" className="font-kid text-[17px] font-semibold leading-none">
              Type a silly word:
            </label>
            <input id="k-word" maxLength={14} value={raw} onChange={(e) => newWord(e.target.value)} autoComplete="off" spellCheck={false} className={field} />
          </div>

          <div className="stagger flex flex-wrap gap-1.5" aria-hidden="true">
            {letters.map((c, i) => (
              <span key={`${i}-${c}`} className={cn("grid h-12 w-10 animate-drop place-items-center rounded-[10px] border-[2.5px] border-k-ink font-kid text-2xl font-bold leading-none shadow-[0_3px_0_var(--color-k-ink)]", CARD[rows.indexOf(c) % CARD.length])}>
                {c.toUpperCase()}
              </span>
            ))}
          </div>

          <div className="grid -rotate-[0.6deg] gap-2.5 rounded-2xl border-[2.5px] border-k-ink bg-k-white px-4 py-3.5">
            <h2 className="font-kid text-[19px] font-bold leading-none">Pip&apos;s tally sheet</h2>
            <ul className="grid gap-1.5" data-testid="k-tally">
              {rows.map((c) => {
                const after = nextOf(tally, c);
                return (
                  <li key={c} className="flex flex-wrap items-center gap-2 font-kid text-[17px] font-semibold leading-none">
                    <b className={cn("grid size-8 place-items-center rounded-full border-2 border-k-ink", CARD[rows.indexOf(c) % CARD.length])}>{c.toUpperCase()}</b>
                    <span className="text-k-soft">then</span>
                    {after.length === 0 ? (
                      <span className="text-k-soft">nothing (it&apos;s the end!)</span>
                    ) : (
                      after.map((s) => (
                        <span key={s.next} className="inline-flex items-center gap-1.5 rounded-full bg-k-paper px-2.5 py-1">
                          {s.next.toUpperCase()}
                          <span className="tracking-[0.12em] text-k-tomato" aria-label={`${s.count} times`}>
                            {"|".repeat(s.count)}
                          </span>
                        </span>
                      ))
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="grid gap-3 rounded-2xl border-[2.5px] border-dashed border-k-line p-4">
            <h2 className="font-kid text-[21px] font-bold leading-[1.1]">
              Spin for the letter after <span className="text-k-tomato">{current.toUpperCase()}</span>
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              {stuck ? (
                <p className="max-w-[24ch] font-kid text-lg font-semibold text-k-soft">Uh oh! Nothing ever came after {current.toUpperCase()}. Pip is stuck.</p>
              ) : (
                <Spinner key={said.length} slices={slices} turn={turn} />
              )}
              <div className="grid gap-2.5">
                <button
                  type="button"
                  onClick={spin}
                  disabled={spinning || stuck || full}
                  className="cursor-pointer rounded-full border-[2.5px] border-k-ink bg-k-tomato px-6 py-2.5 font-kid text-xl font-bold leading-none text-k-page shadow-[0_4px_0_var(--color-k-ink)] transition-transform active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-k-ink)] disabled:cursor-default disabled:opacity-50"
                >
                  Spin!
                </button>
                <button type="button" onClick={() => { setSaid(""); setTurn(0); }} className="cursor-pointer font-kid text-base font-semibold text-k-soft underline underline-offset-4">
                  Start again
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 font-kid text-lg font-semibold">
              <span className="text-k-soft">Pip says:</span>
              <span data-testid="k-said" aria-live="polite" className="rounded-xl bg-k-ink px-3 py-1.5 tracking-[0.08em] text-k-page">
                {(said || word[0]).toUpperCase()}
              </span>
            </div>
            <p className="text-base text-k-soft">Big slices come up more often, because Pip heard those letters more.</p>
          </div>

          <div className="grid gap-2.5">
            <h2 className="font-kid text-[21px] font-bold leading-[1.1]">Puzzle! In BANANA, which letter always comes after N?</h2>
            <div className="flex flex-wrap items-center gap-2.5">
              <label htmlFor="k-guess" className="font-kid text-[17px] font-semibold leading-none">
                I think it&apos;s:
              </label>
              <input id="k-guess" maxLength={3} onChange={(e) => guess(e.target.value)} autoComplete="off" spellCheck={false} placeholder="…" className={cn(field, "max-w-[90px] text-center")} />
            </div>
          </div>

          <div role="status" data-testid="k-sticker">
            {solved && (
              <div className="inline-flex -rotate-2 animate-pop items-center gap-3 rounded-[18px] border-[2.5px] border-k-ink bg-k-mustard py-2.5 pr-4 pl-2.5 shadow-[0_4px_0_var(--color-k-ink)]">
                <svg viewBox="0 0 44 44" aria-hidden="true" className="size-11 flex-none">
                  <path d="M22 3 l5.6 11.6 12.7 1.7-9.3 8.8 2.3 12.6L22 31.6 10.7 37.7 13 25.1 3.7 16.3l12.7-1.7z" fill="#7fae4e" stroke="#3a2c24" strokeWidth="2.5" strokeLinejoin="round" />
                </svg>
                <div className="font-kid text-base font-semibold leading-tight">
                  <b className="block text-xl">You made a what-comes-next tally!</b>
                  Grown-ups call a letter and its next-door letter a <u>bigram</u>.
                </div>
              </div>
            )}
          </div>
          <span className="absolute right-6 bottom-4 font-kid text-sm font-semibold leading-none text-k-soft">5</span>
        </div>
      </article>
    </main>
  );
}
