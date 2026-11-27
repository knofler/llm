"use client";

import { useState } from "react";
import { Pip } from "@/components/stage1/kids-lesson";
import { KID_ROUNDS } from "@/lib/listen";
import { cn } from "@/lib/utils";
import { unlock } from "@/lib/wordbook";

const field = "min-w-0 max-w-[260px] flex-1 rounded-[14px] border-[2.5px] border-k-ink bg-k-white px-3.5 py-2.5 font-kid text-[22px] font-semibold leading-none tracking-[0.04em] focus:shadow-[0_0_0_4px] focus:shadow-k-peach focus:outline-none";
const clean = (w: string) => w.replace(/[.,!?]/g, "");

export function KidsLesson() {
  const [round, setRound] = useState(0);
  const [tried, setTried] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);

  const done = round >= KID_ROUNDS.length;
  const r = KID_ROUNDS[Math.min(round, KID_ROUNDS.length - 1)];
  const right = tried === r.friend;
  const lit = clean(r.words[r.lit]);

  let feel = `Who is “${lit}” listening to? Tap a word.`;
  if (done) feel = "All found!";
  else if (right) feel = `Yes! “${lit}” listens to “${clean(r.words[r.friend])}”.`;
  else if (tried !== null) feel = "Hmm, not that one. Try again!";

  function tap(i: number) {
    if (done || right || i === r.lit) return;
    setTried(i);
  }

  function next() {
    setRound(round + 1);
    setTried(null);
  }

  function again() {
    setRound(0);
    setTried(null);
  }

  function guess(v: string) {
    const ok = v.trim().toLowerCase() === "sun";
    setSolved(ok);
    if (ok) unlock(["attention", "head", "transformer"], 5);
  }

  return (
    <main className="grid justify-items-center gap-[22px] pt-8 pb-16 pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))]">
      <div aria-label="Chapter 5 of 7" className="flex items-center gap-2 font-kid text-sm font-semibold leading-none text-k-soft">
        {Array.from({ length: 7 }, (_, i) => (
          <i key={i} className={cn("size-3 rounded-full border-2", i === 4 ? "border-k-tomato bg-k-tomato" : i < 4 ? "border-k-leaf bg-k-leaf" : "border-k-soft")} />
        ))}
        <span>Chapter 5 of 7</span>
      </div>

      <article className="book-fold relative grid w-full max-w-[1100px] grid-cols-1 overflow-hidden rounded-[18px] bg-k-page shadow-[0_1px_0_var(--color-k-line),0_22px_40px_-22px_rgb(90_60_30/0.35),0_0_0_1px_var(--color-k-line)] md:grid-cols-2">
        <div className="relative grid min-w-0 content-start gap-4 p-[clamp(22px,4vw,44px)]">
          <div className="font-kid text-sm font-semibold leading-none tracking-[0.04em] text-k-tomato">Chapter 5</div>
          <h1 className="font-kid text-[clamp(30px,4vw,44px)] font-bold leading-[1.02] tracking-[-0.01em] text-balance">Who&apos;s listening?</h1>
          <p className="max-w-[34ch] text-xl leading-[1.55]">
            When Pip reads a word like <b>it</b>, Pip has to look back and ask: <i>it</i> means what? Every word gets to listen to the words before it, and it listens hardest to the one that helps the most.
          </p>
          <div className="bubble-tail relative max-w-[30ch] justify-self-start rounded-[20px] border-[2.5px] border-k-ink bg-k-white px-4 py-2.5 font-kid text-[19px] font-semibold leading-snug">
            The glowing word is confused! Tap the word it should listen to.
          </div>
          <div className="grid place-items-center pt-1.5 pb-5">
            <Pip />
          </div>
          <span className="absolute bottom-4 left-6 font-kid text-sm font-semibold leading-none text-k-soft">10</span>
        </div>

        <div className="relative grid min-w-0 content-start gap-4 p-[clamp(22px,4vw,44px)]">
          <div className="grid gap-3 rounded-2xl border-[2.5px] border-k-ink bg-k-white px-4 py-3.5">
            <div className="font-kid text-sm font-semibold text-k-soft">
              Sentence {Math.min(round + 1, KID_ROUNDS.length)} of {KID_ROUNDS.length}
            </div>
            <p aria-label="Sentence" className="flex flex-wrap gap-2">
              {r.words.map((w, i) => {
                const isLit = i === r.lit;
                const isFriend = (right || done) && i === r.friend;
                const wrong = !right && tried === i;
                return (
                  <button
                    key={`${round}-${i}`}
                    type="button"
                    onClick={() => tap(i)}
                    aria-label={clean(w)}
                    aria-pressed={tried === i}
                    className={cn(
                      "cursor-pointer rounded-xl border-[2.5px] px-2.5 py-1.5 font-kid text-xl font-semibold leading-none transition-transform",
                      isLit ? "animate-pop border-k-ink bg-k-mustard" : isFriend ? "border-k-ink bg-k-leaf" : wrong ? "border-k-tomato bg-k-peach" : "border-k-line bg-k-page hover:-translate-y-0.5",
                    )}
                  >
                    {w}
                  </button>
                );
              })}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span data-testid="k-feel" aria-live="polite" className="font-kid text-xl font-bold">
                {feel}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {right && !done && (
                <button
                  type="button"
                  onClick={next}
                  className="cursor-pointer rounded-full border-[2.5px] border-k-ink bg-k-mustard px-5 py-2.5 font-kid text-lg font-bold leading-none shadow-[0_4px_0_var(--color-k-ink)] transition-transform active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-k-ink)]"
                >
                  {round === KID_ROUNDS.length - 1 ? "Finish!" : "Next sentence"}
                </button>
              )}
              {done && (
                <button type="button" onClick={again} className="cursor-pointer font-kid text-base font-semibold text-k-soft underline underline-offset-4">
                  Play again
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-2.5">
            <h2 className="font-kid text-[21px] font-bold leading-[1.1]">Puzzle! &ldquo;The sun is hot, so it melts my ice cream.&rdquo; Who is &ldquo;it&rdquo; listening to?</h2>
            <div className="flex flex-wrap items-center gap-2.5">
              <label htmlFor="k-guess" className="font-kid text-[17px] font-semibold leading-none">
                I think:
              </label>
              <input id="k-guess" maxLength={10} onChange={(e) => guess(e.target.value)} autoComplete="off" spellCheck={false} placeholder="…" className={cn(field, "max-w-[160px] text-center")} />
            </div>
          </div>

          <div role="status" data-testid="k-sticker">
            {solved && (
              <div className="inline-flex -rotate-2 animate-pop items-center gap-3 rounded-[18px] border-[2.5px] border-k-ink bg-k-mustard py-2.5 pr-4 pl-2.5 shadow-[0_4px_0_var(--color-k-ink)]">
                <svg viewBox="0 0 44 44" aria-hidden="true" className="size-11 flex-none">
                  <path d="M22 3 l5.6 11.6 12.7 1.7-9.3 8.8 2.3 12.6L22 31.6 10.7 37.7 13 25.1 3.7 16.3l12.7-1.7z" fill="#ec3d1f" stroke="#2a1d16" strokeWidth="2.5" strokeLinejoin="round" />
                </svg>
                <div className="font-kid text-base font-semibold leading-tight">
                  <b className="block text-xl">You found who&apos;s listening!</b>
                  Grown-ups call this kind of listening <u>attention</u>.
                </div>
              </div>
            )}
          </div>
          <span className="absolute right-6 bottom-4 font-kid text-sm font-semibold leading-none text-k-soft">11</span>
        </div>
      </article>
    </main>
  );
}
