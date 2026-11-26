"use client";

import { useState } from "react";
import { kidCode } from "@/lib/book";
import { cn } from "@/lib/utils";
import { unlock } from "@/lib/wordbook";

const CARD = ["bg-k-mustard", "bg-k-rose", "bg-k-leaf", "bg-k-peach", "bg-k-tomato"];
const SECRET = "hi pip";

export function Pip() {
  return (
    <svg viewBox="0 0 320 250" role="img" aria-label="Pip the robot holding a little notebook" className="h-auto w-[min(100%,330px)] overflow-visible">
      <ellipse cx="160" cy="236" rx="96" ry="10" fill="#ead9bd" />
      <g className="origin-bottom animate-bob">
        <line x1="160" y1="38" x2="160" y2="14" stroke="#2a1d16" strokeWidth="4" strokeLinecap="round" />
        <circle cx="160" cy="11" r="8" fill="#ec3d1f" stroke="#2a1d16" strokeWidth="3.5" />
        <rect x="104" y="36" width="112" height="82" rx="26" fill="#ffb81c" stroke="#2a1d16" strokeWidth="4" />
        <rect x="120" y="54" width="80" height="44" rx="16" fill="#fffaf1" stroke="#2a1d16" strokeWidth="3.5" />
        <circle cx="143" cy="76" r="7" fill="#2a1d16" />
        <circle cx="177" cy="76" r="7" fill="#2a1d16" />
        <circle cx="145.5" cy="73.5" r="2.2" fill="#fffaf1" />
        <circle cx="179.5" cy="73.5" r="2.2" fill="#fffaf1" />
        <path d="M151 89 q9 7 18 0" fill="none" stroke="#2a1d16" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="128" cy="88" r="5" fill="#ff8f87" />
        <circle cx="192" cy="88" r="5" fill="#ff8f87" />
        <rect x="148" y="116" width="24" height="10" fill="#2a1d16" />
        <rect x="96" y="124" width="128" height="92" rx="28" fill="#4fb83a" stroke="#2a1d16" strokeWidth="4" />
        <circle cx="124" cy="146" r="6" fill="#ec3d1f" stroke="#2a1d16" strokeWidth="3" />
        <path d="M98 150 q-30 10 -24 46" fill="none" stroke="#2a1d16" strokeWidth="10" strokeLinecap="round" />
        <path d="M222 150 q34 2 34 30" fill="none" stroke="#2a1d16" strokeWidth="10" strokeLinecap="round" />
        <g transform="translate(222 158) rotate(10)" className="font-kid" fontWeight="700" fontSize="13">
          <rect x="0" y="0" width="64" height="50" rx="6" fill="#fffaf1" stroke="#2a1d16" strokeWidth="3.5" />
          <line x1="32" y1="2" x2="32" y2="48" stroke="#2a1d16" strokeWidth="2.5" />
          <text x="9" y="22" fill="#2a1d16">a</text>
          <text x="40" y="22" fill="#ec3d1f">1</text>
          <text x="9" y="40" fill="#2a1d16">b</text>
          <text x="40" y="40" fill="#ec3d1f">2</text>
        </g>
        <rect x="112" y="212" width="30" height="20" rx="8" fill="#2a1d16" />
        <rect x="178" y="212" width="30" height="20" rx="8" fill="#2a1d16" />
      </g>
    </svg>
  );
}

const field = "min-w-0 max-w-[260px] flex-1 rounded-[14px] border-[2.5px] border-k-ink bg-k-white px-3.5 py-2.5 font-kid text-[22px] font-semibold leading-none tracking-[0.04em] focus:shadow-[0_0_0_4px] focus:shadow-k-peach focus:outline-none";

export function KidsLesson() {
  const [raw, setRaw] = useState("Mia");
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [solved, setSolved] = useState(false);

  const letters = [...(raw.replace(/[^a-z]/gi, "") || "Pip")];
  const uniq = [...new Set(letters.map((c) => c.toLowerCase()))].sort();

  function flip(i: number) {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function guess(v: string) {
    const ok = v.trim().toLowerCase().replace(/\s+/g, " ") === SECRET;
    setSolved(ok);
    if (ok) unlock(["tokenizer", "token", "vocabulary"], 1);
  }

  return (
    <main className="grid justify-items-center gap-[22px] pt-8 pb-16 pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))]">
      <div aria-label="Chapter 1 of 7" className="flex items-center gap-2 font-kid text-sm font-semibold leading-none text-k-soft">
        {Array.from({ length: 7 }, (_, i) => (
          <i key={i} className={cn("size-3 rounded-full border-2", i === 0 ? "border-k-tomato bg-k-tomato" : "border-k-soft")} />
        ))}
        <span>Chapter 1 of 7</span>
      </div>

      <article className="book-fold relative grid w-full max-w-[1100px] grid-cols-1 overflow-hidden rounded-[18px] bg-k-page shadow-[0_1px_0_var(--color-k-line),0_22px_40px_-22px_rgb(90_60_30/0.35),0_0_0_1px_var(--color-k-line)] md:grid-cols-2">
        <div className="relative grid min-w-0 content-start gap-4 p-[clamp(22px,4vw,44px)]">
          <div className="font-kid text-sm font-semibold leading-none tracking-[0.04em] text-k-tomato">Chapter 1</div>
          <h1 className="font-kid text-[clamp(30px,4vw,44px)] font-bold leading-[1.02] tracking-[-0.01em] text-balance">Pip&apos;s secret number code</h1>
          <p className="max-w-[34ch] text-xl leading-[1.55]">
            This is Pip. Pip is a little robot who wants to learn to talk. But Pip has a problem: robots can&apos;t read letters. Pip can only read <b>numbers</b>.
          </p>
          <div className="bubble-tail relative max-w-[30ch] justify-self-start rounded-[20px] border-[2.5px] border-k-ink bg-k-white px-4 py-2.5 font-kid text-[19px] font-semibold leading-snug">
            Can you help me turn letters into numbers?
          </div>
          <div className="grid place-items-center pt-1.5 pb-5">
            <Pip />
          </div>
          <span className="absolute bottom-4 left-6 font-kid text-sm font-semibold leading-none text-k-soft">2</span>
        </div>

        <div className="relative grid min-w-0 content-start gap-4 p-[clamp(22px,4vw,44px)]">
          <div className="flex flex-wrap items-center gap-2.5">
            <label htmlFor="k-in" className="font-kid text-[17px] font-semibold leading-none">
              Type your name:
            </label>
            <input id="k-in" maxLength={12} value={raw} onChange={(e) => { setRaw(e.target.value); setFlipped(new Set()); }} autoComplete="off" spellCheck={false} className={field} />
          </div>

          <div className="stagger flex min-h-24 flex-wrap gap-2.5" aria-live="polite" data-testid="k-cards">
            {letters.map((c, i) => (
              <button
                key={`${i}-${c}`}
                type="button"
                aria-pressed={flipped.has(i)}
                aria-label={`Letter ${c}, tap to see its number`}
                onClick={() => flip(i)}
                className="flip-card h-[84px] w-[62px] animate-drop cursor-pointer"
              >
                <span className="flip-in relative block size-full">
                  <span className={cn("flip-face absolute inset-0 grid place-items-center rounded-xl border-[2.5px] border-k-ink font-kid text-[34px] font-bold leading-none shadow-[0_4px_0_var(--color-k-ink)]", CARD[i % CARD.length])}>
                    {c.toUpperCase()}
                  </span>
                  <span className="flip-face flip-back dots-paper absolute inset-0 grid place-items-center rounded-xl border-[2.5px] border-k-ink bg-k-page font-kid text-[30px] font-bold leading-none text-k-tomato shadow-[0_4px_0_var(--color-k-ink)]">
                    {kidCode(c)}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <p className="text-base text-k-soft">Tap a card to flip it and see its secret number.</p>

          <div className="grid -rotate-[0.6deg] gap-2.5 rounded-2xl border-[2.5px] border-k-ink bg-k-white px-4 py-3.5">
            <h2 className="font-kid text-[19px] font-bold leading-none">Pip&apos;s code book</h2>
            <div className="flex flex-wrap gap-2" data-testid="k-pairs">
              {uniq.map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-k-paper py-1 pr-2.5 pl-1 font-kid text-[17px] font-semibold leading-none">
                  <b className={cn("grid size-7 place-items-center rounded-full border-2 border-k-ink", CARD[letters.findIndex((l) => l.toLowerCase() === c) % CARD.length])}>{c.toUpperCase()}</b>→ {kidCode(c)}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-2.5">
            <h2 className="font-kid text-[21px] font-bold leading-[1.1]">Now you crack one! What does this say?</h2>
            <div className="flex flex-wrap gap-2" data-testid="k-secret">
              {[...SECRET].map((c, i) =>
                c === " " ? (
                  <span key={i} className="w-3.5" />
                ) : (
                  <span key={i} className="grid h-[42px] min-w-[42px] place-items-center rounded-[10px] bg-k-ink px-2 font-kid text-xl font-bold leading-none text-k-page">
                    {kidCode(c)}
                  </span>
                ),
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <label htmlFor="k-guess" className="font-kid text-[17px] font-semibold leading-none">
                I think it says:
              </label>
              <input id="k-guess" maxLength={12} onChange={(e) => guess(e.target.value)} autoComplete="off" spellCheck={false} placeholder="…" className={field} />
            </div>
          </div>

          <div role="status" data-testid="k-sticker">
            {solved && (
              <div className="inline-flex -rotate-2 animate-pop items-center gap-3 rounded-[18px] border-[2.5px] border-k-ink bg-k-mustard py-2.5 pr-4 pl-2.5 shadow-[0_4px_0_var(--color-k-ink)]">
                <svg viewBox="0 0 44 44" aria-hidden="true" className="size-11 flex-none">
                  <path d="M22 3 l5.6 11.6 12.7 1.7-9.3 8.8 2.3 12.6L22 31.6 10.7 37.7 13 25.1 3.7 16.3l12.7-1.7z" fill="#ec3d1f" stroke="#2a1d16" strokeWidth="2.5" strokeLinejoin="round" />
                </svg>
                <div className="font-kid text-base font-semibold leading-tight">
                  <b className="block text-xl">You made a code book!</b>
                  Grown-up engineers call it a <u>tokenizer</u>.
                </div>
              </div>
            )}
          </div>
          <span className="absolute right-6 bottom-4 font-kid text-sm font-semibold leading-none text-k-soft">3</span>
        </div>
      </article>
    </main>
  );
}
