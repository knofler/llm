"use client";

import { useState } from "react";
import { Pip } from "@/components/stage1/kids-lesson";
import { kidNudge, kidWrong, type KidStep } from "@/lib/nudge";
import { cn } from "@/lib/utils";
import { unlock } from "@/lib/wordbook";

const START_SPOT = 10;
const START_TREASURE = 70;

const field = "min-w-0 max-w-[260px] flex-1 rounded-[14px] border-[2.5px] border-k-ink bg-k-white px-3.5 py-2.5 font-kid text-[22px] font-semibold leading-none tracking-[0.04em] focus:shadow-[0_0_0_4px] focus:shadow-k-peach focus:outline-none";

const STEPS: { size: KidStep; label: string; bg: string }[] = [
  { size: "tiny", label: "Tiny step", bg: "bg-k-leaf" },
  { size: "good", label: "Good step", bg: "bg-k-mustard" },
  { size: "giant", label: "Giant leap", bg: "bg-k-rose" },
];

/** Hot or cold, by how far Pip is from the treasure. */
function feel(away: number): { word: string; fill: string } {
  if (away < 1.5) return { word: "Found it!", fill: "#ec3d1f" };
  if (away < 10) return { word: "Hot!", fill: "#ec3d1f" };
  if (away < 25) return { word: "Warm", fill: "#ffb81c" };
  if (away < 50) return { word: "Cold", fill: "#ffb877" };
  return { word: "Freezing!", fill: "#ead9bd" };
}

/** The track: Pip's spot, footprints, and the treasure (a star). */
function Track({ spot, treasure, trail }: { spot: number; treasure: number; trail: number[] }) {
  const x = (v: number) => 20 + v * 3.2;
  return (
    <svg viewBox="0 0 360 96" role="img" aria-label={`Pip is at ${Math.round(spot)}, the treasure is at ${Math.round(treasure)}`} className="h-auto w-full">
      <rect x="14" y="62" width="332" height="14" rx="7" fill="#ead9bd" stroke="#2a1d16" strokeWidth="2.5" />
      {[0, 25, 50, 75, 100].map((v) => (
        <text key={v} x={x(v)} y="92" textAnchor="middle" className="font-kid" fontSize="10" fontWeight="600" fill="#7a6555">
          {v}
        </text>
      ))}
      {trail.slice(0, -1).map((v, i) => (
        <circle key={i} cx={x(v)} cy="69" r="3.5" fill="#7a6555" opacity={0.25 + (0.6 * (i + 1)) / trail.length} />
      ))}
      <path
        transform={`translate(${x(treasure)} 69)`}
        d="M0 -13 l3.8 7.8 8.6 1.2-6.2 6 1.5 8.5L0 6.5l-7.7 4 1.5-8.5-6.2-6 8.6-1.2z"
        fill="#ffb81c"
        stroke="#2a1d16"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <g style={{ transform: `translateX(${x(spot)}px)`, transition: "transform 450ms cubic-bezier(0.3, 1.4, 0.5, 1)" }}>
        <rect x="-13" y="20" width="26" height="22" rx="6" fill="#ffb877" stroke="#2a1d16" strokeWidth="2.5" />
        <circle cx="-5" cy="30" r="2.6" fill="#2a1d16" />
        <circle cx="5" cy="30" r="2.6" fill="#2a1d16" />
        <line x1="0" y1="20" x2="0" y2="12" stroke="#2a1d16" strokeWidth="2.5" />
        <circle cx="0" cy="10" r="3.5" fill="#ec3d1f" stroke="#2a1d16" strokeWidth="2" />
        <path d="M0 42 L0 56" stroke="#2a1d16" strokeWidth="2.5" />
        <path d="M-6 58 L6 58" stroke="#2a1d16" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function KidsLesson() {
  const [treasure, setTreasure] = useState(START_TREASURE);
  const [trail, setTrail] = useState<number[]>([START_SPOT]);
  const [solved, setSolved] = useState(false);

  const spot = trail.at(-1)!;
  const away = Math.abs(spot - treasure);
  const { word, fill } = feel(away);
  const heat = Math.max(0.04, 1 - Math.sqrt(kidWrong(spot, treasure)) / 100);
  const found = away < 1.5;

  function hide(v: number) {
    setTreasure(v);
    setTrail([START_SPOT]);
  }

  function step(size: KidStep) {
    setTrail((t) => [...t.slice(-11), kidNudge(t.at(-1)!, treasure, size)]);
  }

  function guess(v: string) {
    const ok = v.trim().toLowerCase() === "right";
    setSolved(ok);
    if (ok) unlock(["loss", "gradient", "gradient descent", "backprop"], 3);
  }

  return (
    <main className="grid justify-items-center gap-[22px] pt-8 pb-16 pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))]">
      <div aria-label="Chapter 3 of 7" className="flex items-center gap-2 font-kid text-sm font-semibold leading-none text-k-soft">
        {Array.from({ length: 7 }, (_, i) => (
          <i key={i} className={cn("size-3 rounded-full border-2", i === 2 ? "border-k-tomato bg-k-tomato" : i < 2 ? "border-k-leaf bg-k-leaf" : "border-k-soft")} />
        ))}
        <span>Chapter 3 of 7</span>
      </div>

      <article className="book-fold relative grid w-full max-w-[1100px] grid-cols-1 overflow-hidden rounded-[18px] bg-k-page shadow-[0_1px_0_var(--color-k-line),0_22px_40px_-22px_rgb(90_60_30/0.35),0_0_0_1px_var(--color-k-line)] md:grid-cols-2">
        <div className="relative grid min-w-0 content-start gap-4 p-[clamp(22px,4vw,44px)]">
          <div className="font-kid text-sm font-semibold leading-none tracking-[0.04em] text-k-tomato">Chapter 3</div>
          <h1 className="font-kid text-[clamp(30px,4vw,44px)] font-bold leading-[1.02] tracking-[-0.01em] text-balance">The hot-and-cold game</h1>
          <p className="max-w-[34ch] text-xl leading-[1.55]">
            Pip&apos;s guesses are often wrong. How does Pip get better? The same way you find a hidden treasure: someone says <b>hot</b> or <b>cold</b>, and you take a step the warmer way.
          </p>
          <div className="bubble-tail relative max-w-[30ch] justify-self-start rounded-[20px] border-[2.5px] border-k-ink bg-k-white px-4 py-2.5 font-kid text-[19px] font-semibold leading-snug">
            When I&apos;m far away I take big steps. When I&apos;m close I take little ones!
          </div>
          <div className="grid place-items-center pt-1.5 pb-5">
            <Pip />
          </div>
          <span className="absolute bottom-4 left-6 font-kid text-sm font-semibold leading-none text-k-soft">6</span>
        </div>

        <div className="relative grid min-w-0 content-start gap-4 p-[clamp(22px,4vw,44px)]">
          <div className="grid gap-2">
            <label htmlFor="k-hide" className="font-kid text-[17px] font-semibold leading-none">
              Hide the treasure at <span className="text-k-tomato">{treasure}</span>
            </label>
            <input id="k-hide" type="range" min={0} max={100} value={treasure} onChange={(e) => hide(Number(e.target.value))} className="w-full max-w-[320px] accent-k-tomato" />
          </div>

          <div className="grid gap-3 rounded-2xl border-[2.5px] border-k-ink bg-k-white px-4 py-3.5">
            <Track spot={spot} treasure={treasure} trail={trail} />
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-kid text-lg font-semibold text-k-soft">Pip feels:</span>
              <span data-testid="k-feel" aria-live="polite" className="rounded-xl border-2 border-k-ink px-3 py-1 font-kid text-xl font-bold" style={{ backgroundColor: fill }}>
                {word}
              </span>
              <span className="h-4 min-w-[100px] flex-1 overflow-hidden rounded-full border-2 border-k-ink bg-k-paper" aria-hidden="true">
                <span className="block h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.round(heat * 100)}%`, backgroundColor: fill }} />
              </span>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border-[2.5px] border-dashed border-k-line p-4">
            <h2 className="font-kid text-[21px] font-bold leading-[1.1]">Help Pip find it</h2>
            <div className="flex flex-wrap gap-2.5">
              {STEPS.map((s) => (
                <button
                  key={s.size}
                  type="button"
                  onClick={() => step(s.size)}
                  disabled={found}
                  className={cn(
                    "cursor-pointer rounded-full border-[2.5px] border-k-ink px-5 py-2.5 font-kid text-lg font-bold leading-none shadow-[0_4px_0_var(--color-k-ink)] transition-transform active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-k-ink)] disabled:cursor-default disabled:opacity-50",
                    s.bg,
                  )}
                >
                  {s.label}
                </button>
              ))}
              <button type="button" onClick={() => setTrail([START_SPOT])} className="cursor-pointer font-kid text-base font-semibold text-k-soft underline underline-offset-4">
                Start again
              </button>
            </div>
            <p data-testid="k-steps" className="font-kid text-lg font-semibold">
              <span className="text-k-soft">Steps taken: </span>
              {trail.length - 1}
            </p>
            <p className="text-base text-k-soft">Tiny steps are slow. Giant leaps jump right past the treasure and bounce back and forth! Good steps get there fast.</p>
          </div>

          <div className="grid gap-2.5">
            <h2 className="font-kid text-[21px] font-bold leading-[1.1]">Puzzle! Pip is at 20. The treasure is at 80. Should Pip step left or right?</h2>
            <div className="flex flex-wrap items-center gap-2.5">
              <label htmlFor="k-guess" className="font-kid text-[17px] font-semibold leading-none">
                I think:
              </label>
              <input id="k-guess" maxLength={6} onChange={(e) => guess(e.target.value)} autoComplete="off" spellCheck={false} placeholder="…" className={cn(field, "max-w-[140px] text-center")} />
            </div>
          </div>

          <div role="status" data-testid="k-sticker">
            {solved && (
              <div className="inline-flex -rotate-2 animate-pop items-center gap-3 rounded-[18px] border-[2.5px] border-k-ink bg-k-mustard py-2.5 pr-4 pl-2.5 shadow-[0_4px_0_var(--color-k-ink)]">
                <svg viewBox="0 0 44 44" aria-hidden="true" className="size-11 flex-none">
                  <path d="M22 3 l5.6 11.6 12.7 1.7-9.3 8.8 2.3 12.6L22 31.6 10.7 37.7 13 25.1 3.7 16.3l12.7-1.7z" fill="#ec3d1f" stroke="#2a1d16" strokeWidth="2.5" strokeLinejoin="round" />
                </svg>
                <div className="font-kid text-base font-semibold leading-tight">
                  <b className="block text-xl">You played the hot-and-cold game!</b>
                  Grown-ups call the how-wrong score the <u>loss</u>.
                </div>
              </div>
            )}
          </div>
          <span className="absolute right-6 bottom-4 font-kid text-sm font-semibold leading-none text-k-soft">7</span>
        </div>
      </article>
    </main>
  );
}
