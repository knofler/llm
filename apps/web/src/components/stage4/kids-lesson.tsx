"use client";

import { useState } from "react";
import { Pip } from "@/components/stage1/kids-lesson";
import { kidMess, kidMessiness, kidTidy, type KidSpot } from "@/lib/map";
import { cn } from "@/lib/utils";
import { unlock } from "@/lib/wordbook";

const field = "min-w-0 max-w-[260px] flex-1 rounded-[14px] border-[2.5px] border-k-ink bg-k-white px-3.5 py-2.5 font-kid text-[22px] font-semibold leading-none tracking-[0.04em] focus:shadow-[0_0_0_4px] focus:shadow-k-peach focus:outline-none";

// Each friend group has its own colour, so tidy groups are easy to spot.
const GROUP: Record<string, string> = { a: "#ffb81c", e: "#ffb81c", i: "#ffb81c", o: "#ffb81c", u: "#ffb81c", t: "#7cc36a", s: "#7cc36a", n: "#7cc36a", r: "#7cc36a", m: "#ff8fa3", b: "#ff8fa3", p: "#ff8fa3", ".": "#ffb877", "!": "#ffb877", "?": "#ffb877" };

function feel(mess: number): { word: string; fill: string } {
  if (mess > 0.6) return { word: "Messy!", fill: "#ead9bd" };
  if (mess > 0.25) return { word: "Getting tidy", fill: "#ffb877" };
  if (mess > 0.05) return { word: "Nearly", fill: "#ffb81c" };
  return { word: "All tidy!", fill: "#7cc36a" };
}

function Board({ spots }: { spots: KidSpot[] }) {
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label="Pip's letter map" className="h-auto w-full max-w-[360px] justify-self-center">
      <rect x="1" y="1" width="98" height="98" rx="6" fill="#fff8ec" stroke="#2a1d16" strokeWidth="0.8" />
      {spots.map((s) => (
        <g key={s.c} style={{ transform: `translate(${s.x}px, ${s.y}px)`, transition: "transform 500ms cubic-bezier(0.3, 1.4, 0.5, 1)" }}>
          <circle r="5" fill={GROUP[s.c]} stroke="#2a1d16" strokeWidth="0.8" />
          <text textAnchor="middle" dy="2" fontSize="6" fontWeight="700" fill="#2a1d16" className="font-kid">
            {s.c}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function KidsLesson() {
  const [seed, setSeed] = useState(3);
  const [start, setStart] = useState(() => kidMess(3));
  const [spots, setSpots] = useState(start);
  const [solved, setSolved] = useState(false);

  const mess = kidMessiness(spots, start);
  const { word, fill } = feel(mess);
  const tidy = mess <= 0.05;

  function messUp() {
    const next = kidMess(seed + 1);
    setSeed(seed + 1);
    setStart(next);
    setSpots(next);
  }

  function guess(v: string) {
    const ok = v.trim().toLowerCase() === "e";
    setSolved(ok);
    if (ok) unlock(["embedding", "MLP", "batch"], 4);
  }

  return (
    <main className="grid justify-items-center gap-[22px] pt-8 pb-16 pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))]">
      <div aria-label="Chapter 4 of 7" className="flex items-center gap-2 font-kid text-sm font-semibold leading-none text-k-soft">
        {Array.from({ length: 7 }, (_, i) => (
          <i key={i} className={cn("size-3 rounded-full border-2", i === 3 ? "border-k-tomato bg-k-tomato" : i < 3 ? "border-k-leaf bg-k-leaf" : "border-k-soft")} />
        ))}
        <span>Chapter 4 of 7</span>
      </div>

      <article className="book-fold relative grid w-full max-w-[1100px] grid-cols-1 overflow-hidden rounded-[18px] bg-k-page shadow-[0_1px_0_var(--color-k-line),0_22px_40px_-22px_rgb(90_60_30/0.35),0_0_0_1px_var(--color-k-line)] md:grid-cols-2">
        <div className="relative grid min-w-0 content-start gap-4 p-[clamp(22px,4vw,44px)]">
          <div className="font-kid text-sm font-semibold leading-none tracking-[0.04em] text-k-tomato">Chapter 4</div>
          <h1 className="font-kid text-[clamp(30px,4vw,44px)] font-bold leading-[1.02] tracking-[-0.01em] text-balance">The letter map</h1>
          <p className="max-w-[34ch] text-xl leading-[1.55]">
            Pip gives every letter a home on a big map. Letters that do the same kind of job, like the vowels <b>a e i o u</b>, become next-door neighbours. Then if Pip learns something about one, the neighbours learn it too!
          </p>
          <div className="bubble-tail relative max-w-[30ch] justify-self-start rounded-[20px] border-[2.5px] border-k-ink bg-k-white px-4 py-2.5 font-kid text-[19px] font-semibold leading-snug">
            My map is a mess! Help me tidy every letter next to its friends.
          </div>
          <div className="grid place-items-center pt-1.5 pb-5">
            <Pip />
          </div>
          <span className="absolute bottom-4 left-6 font-kid text-sm font-semibold leading-none text-k-soft">8</span>
        </div>

        <div className="relative grid min-w-0 content-start gap-4 p-[clamp(22px,4vw,44px)]">
          <div className="grid gap-3 rounded-2xl border-[2.5px] border-k-ink bg-k-white px-4 py-3.5">
            <Board spots={spots} />
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-kid text-lg font-semibold text-k-soft">The map is:</span>
              <span data-testid="k-feel" aria-live="polite" className="rounded-xl border-2 border-k-ink px-3 py-1 font-kid text-xl font-bold" style={{ backgroundColor: fill }}>
                {word}
              </span>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border-[2.5px] border-dashed border-k-line p-4">
            <h2 className="font-kid text-[21px] font-bold leading-[1.1]">Help Pip tidy up</h2>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSpots(kidTidy)}
                disabled={tidy}
                className="cursor-pointer rounded-full border-[2.5px] border-k-ink bg-k-mustard px-5 py-2.5 font-kid text-lg font-bold leading-none shadow-[0_4px_0_var(--color-k-ink)] transition-transform active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-k-ink)] disabled:cursor-default disabled:opacity-50"
              >
                Tidy up!
              </button>
              <button type="button" onClick={messUp} className="cursor-pointer font-kid text-base font-semibold text-k-soft underline underline-offset-4">
                Mess it up
              </button>
            </div>
            <p className="text-base text-k-soft">Every tidy moves each letter halfway home. Vowels go together, and so do the letters that like to end words.</p>
          </div>

          <div className="grid gap-2.5">
            <h2 className="font-kid text-[21px] font-bold leading-[1.1]">Puzzle! Which letter should live next to a: e or t?</h2>
            <div className="flex flex-wrap items-center gap-2.5">
              <label htmlFor="k-guess" className="font-kid text-[17px] font-semibold leading-none">
                I think:
              </label>
              <input id="k-guess" maxLength={3} onChange={(e) => guess(e.target.value)} autoComplete="off" spellCheck={false} placeholder="…" className={cn(field, "max-w-[120px] text-center")} />
            </div>
          </div>

          <div role="status" data-testid="k-sticker">
            {solved && (
              <div className="inline-flex -rotate-2 animate-pop items-center gap-3 rounded-[18px] border-[2.5px] border-k-ink bg-k-mustard py-2.5 pr-4 pl-2.5 shadow-[0_4px_0_var(--color-k-ink)]">
                <svg viewBox="0 0 44 44" aria-hidden="true" className="size-11 flex-none">
                  <path d="M22 3 l5.6 11.6 12.7 1.7-9.3 8.8 2.3 12.6L22 31.6 10.7 37.7 13 25.1 3.7 16.3l12.7-1.7z" fill="#ec3d1f" stroke="#2a1d16" strokeWidth="2.5" strokeLinejoin="round" />
                </svg>
                <div className="font-kid text-base font-semibold leading-tight">
                  <b className="block text-xl">You tidied the letter map!</b>
                  Grown-ups call a letter&apos;s spot on the map its <u>embedding</u>.
                </div>
              </div>
            )}
          </div>
          <span className="absolute right-6 bottom-4 font-kid text-sm font-semibold leading-none text-k-soft">9</span>
        </div>
      </article>
    </main>
  );
}
