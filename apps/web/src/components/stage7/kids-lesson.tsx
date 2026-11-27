"use client";

import { useState } from "react";
import { Pip } from "@/components/stage1/kids-lesson";
import { cn } from "@/lib/utils";
import { unlock } from "@/lib/wordbook";

const field = "min-w-0 max-w-[160px] flex-1 rounded-[14px] border-[2.5px] border-k-ink bg-k-white px-3.5 py-2.5 text-center font-kid text-[22px] font-semibold leading-none tracking-[0.04em] focus:shadow-[0_0_0_4px] focus:shadow-k-peach focus:outline-none";
const push = "cursor-pointer rounded-full border-[2.5px] border-k-ink px-5 py-2.5 font-kid text-lg font-bold leading-none shadow-[0_4px_0_var(--color-k-ink)] transition-transform active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-k-ink)] disabled:cursor-not-allowed disabled:opacity-40";

const BOXES = [
  { id: "big", label: "Big box", ride: "a truck", fill: "bg-k-rose", size: "h-24 w-32", says: "the cat sat on the mat. the dog ran to the sun." },
  { id: "middle", label: "Middle box", ride: "a backpack", fill: "bg-k-mustard", size: "h-20 w-24", says: "the cat sat on the mat. the dog ran to the sun." },
  { id: "tiny", label: "Tiny box", ride: "your pocket", fill: "bg-k-leaf", size: "h-14 w-16", says: "the cat sat on the mat. the dog ran ta the sun." },
] as const;
type Box = (typeof BOXES)[number]["id"];

export function KidsLesson() {
  const [box, setBox] = useState<Box>("big");
  const [home, setHome] = useState(false);
  const [solved, setSolved] = useState(false);

  const b = BOXES.find((x) => x.id === box)!;

  function pick(id: Box) {
    setBox(id);
    setHome(false);
  }

  function guess(v: string) {
    const ok = v.trim().toLowerCase() === "yes";
    setSolved(ok);
    if (ok) unlock(["weights", "safetensors", "GGUF", "inference"], 7);
  }

  return (
    <main className="grid justify-items-center gap-[22px] pt-8 pb-16 pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))]">
      <div aria-label="Chapter 7 of 7" className="flex items-center gap-2 font-kid text-sm font-semibold leading-none text-k-soft">
        {Array.from({ length: 7 }, (_, i) => (
          <i key={i} className={cn("size-3 rounded-full border-2", i === 6 ? "border-k-tomato bg-k-tomato" : "border-k-leaf bg-k-leaf")} />
        ))}
        <span>Chapter 7 of 7</span>
      </div>

      <article className="book-fold relative grid w-full max-w-[1100px] grid-cols-1 overflow-hidden rounded-[18px] bg-k-page shadow-[0_1px_0_var(--color-k-line),0_22px_40px_-22px_rgb(90_60_30/0.35),0_0_0_1px_var(--color-k-line)] md:grid-cols-2">
        <div className="relative grid min-w-0 content-start gap-4 p-[clamp(22px,4vw,44px)]">
          <div className="font-kid text-sm font-semibold leading-none tracking-[0.04em] text-k-tomato">Chapter 7</div>
          <h1 className="font-kid text-[clamp(30px,4vw,44px)] font-bold leading-[1.02] tracking-[-0.01em] text-balance">Take your robot home</h1>
          <p className="max-w-[34ch] text-xl leading-[1.55]">
            Pip&apos;s robot can talk! But it lives at school. Everything it learned is just a long list of numbers, so Pip writes the numbers down and packs them in a box. At home, Pip opens the box, and the robot talks again, without learning anything new.
          </p>
          <div className="bubble-tail relative max-w-[30ch] justify-self-start rounded-[20px] border-[2.5px] border-k-ink bg-k-white px-4 py-2.5 font-kid text-[19px] font-semibold leading-snug">
            Pick a box, then open it at home.
          </div>
          <div className="grid place-items-center pt-1.5 pb-5">
            <Pip />
          </div>
          <span className="absolute bottom-4 left-6 font-kid text-sm font-semibold leading-none text-k-soft">14</span>
        </div>

        <div className="relative grid min-w-0 content-start gap-4 p-[clamp(22px,4vw,44px)]">
          <div className="grid gap-3 rounded-2xl border-[2.5px] border-k-ink bg-k-white px-4 py-3.5">
            <div role="group" aria-label="Box size" className="flex flex-wrap gap-2">
              {BOXES.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  aria-pressed={box === x.id}
                  onClick={() => pick(x.id)}
                  className={cn(
                    "cursor-pointer rounded-full border-[2.5px] px-4 py-2 font-kid text-base font-bold leading-none",
                    box === x.id ? "border-k-ink bg-k-tomato text-k-page" : "border-k-line bg-k-page text-k-ink",
                  )}
                >
                  {x.label}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-4">
              <div data-testid="k-box" className={cn("grid animate-pop place-items-center rounded-lg border-[2.5px] border-k-ink font-kid text-sm font-bold", b.fill, b.size)}>
                numbers
              </div>
              <span data-testid="k-ride" className="font-kid text-lg font-bold">
                It fits in {b.ride}.
              </span>
            </div>
            <button type="button" onClick={() => setHome(true)} className={cn(push, "w-fit bg-k-mustard")}>
              Open the box at home
            </button>
            <div className="bubble-tail relative min-h-[3.5em] rounded-[20px] border-[2.5px] border-k-ink bg-k-paper px-4 py-2.5">
              <span className="sr-only">The robot says:</span>
              <span data-testid="k-says" aria-live="polite" className="font-kid text-xl font-semibold leading-snug break-words">
                {home ? b.says : "…the box is still closed."}
              </span>
            </div>
            {home && (
              <span data-testid="k-feel" className="font-kid text-lg font-bold">
                {box === "tiny" ? "The tiny box squished the numbers a little, so one word wobbles. It still talks!" : "Same robot, same words. Nothing got lost."}
              </span>
            )}
          </div>

          <div className="grid gap-2.5">
            <h2 className="font-kid text-[21px] font-bold leading-[1.1]">Puzzle! Pip squeezes the robot into the tiny box. Can it still talk: yes or no?</h2>
            <div className="flex flex-wrap items-center gap-2.5">
              <label htmlFor="k-guess" className="font-kid text-[17px] font-semibold leading-none">
                I think:
              </label>
              <input id="k-guess" maxLength={10} onChange={(e) => guess(e.target.value)} autoComplete="off" spellCheck={false} placeholder="…" className={field} />
            </div>
          </div>

          <div role="status" data-testid="k-sticker">
            {solved && (
              <div className="inline-flex -rotate-2 animate-pop items-center gap-3 rounded-[18px] border-[2.5px] border-k-ink bg-k-mustard py-2.5 pr-4 pl-2.5 shadow-[0_4px_0_var(--color-k-ink)]">
                <svg viewBox="0 0 44 44" aria-hidden="true" className="size-11 flex-none">
                  <path d="M22 3 l5.6 11.6 12.7 1.7-9.3 8.8 2.3 12.6L22 31.6 10.7 37.7 13 25.1 3.7 16.3l12.7-1.7z" fill="#ec3d1f" stroke="#2a1d16" strokeWidth="2.5" strokeLinejoin="round" />
                </svg>
                <div className="font-kid text-base font-semibold leading-tight">
                  <b className="block text-xl">Your robot came home!</b>
                  Grown-ups call the numbers in the box <u>weights</u>.
                </div>
              </div>
            )}
          </div>
          <span className="absolute right-6 bottom-4 font-kid text-sm font-semibold leading-none text-k-soft">15</span>
        </div>
      </article>
    </main>
  );
}
