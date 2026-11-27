"use client";

import { useState } from "react";
import { Pip } from "@/components/stage1/kids-lesson";
import { DIAL, MAX_BLOCKS, ROBOT_SAYS } from "@/lib/stack";
import { cn } from "@/lib/utils";
import { unlock } from "@/lib/wordbook";

const field = "min-w-0 max-w-[260px] flex-1 rounded-[14px] border-[2.5px] border-k-ink bg-k-white px-3.5 py-2.5 font-kid text-[22px] font-semibold leading-none tracking-[0.04em] focus:shadow-[0_0_0_4px] focus:shadow-k-peach focus:outline-none";
const push = "cursor-pointer rounded-full border-[2.5px] border-k-ink px-5 py-2.5 font-kid text-lg font-bold leading-none shadow-[0_4px_0_var(--color-k-ink)] transition-transform active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-k-ink)] disabled:cursor-not-allowed disabled:opacity-40";
const LAYER = ["bg-k-mustard", "bg-k-leaf", "bg-k-rose"];
const FEEL = ["No brain layers yet. It just babbles!", "One layer: it knows some letters go together.", "Two layers: real words are showing up!", "Three layers: whole sentences! Try the dial."];

export function KidsLesson() {
  const [layers, setLayers] = useState(0);
  const [dial, setDial] = useState<(typeof DIAL)[number]["id"]>("right");
  const [solved, setSolved] = useState(false);

  const full = layers === MAX_BLOCKS;
  const says = full ? DIAL.find((d) => d.id === dial)!.says : ROBOT_SAYS[layers];

  function guess(v: string) {
    const ok = v.trim().toLowerCase() === "silly";
    setSolved(ok);
    if (ok) unlock(["GPT", "training", "parameters", "temperature"], 6);
  }

  return (
    <main className="grid justify-items-center gap-[22px] pt-8 pb-16 pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))]">
      <div aria-label="Chapter 6 of 7" className="flex items-center gap-2 font-kid text-sm font-semibold leading-none text-k-soft">
        {Array.from({ length: 7 }, (_, i) => (
          <i key={i} className={cn("size-3 rounded-full border-2", i === 5 ? "border-k-tomato bg-k-tomato" : i < 5 ? "border-k-leaf bg-k-leaf" : "border-k-soft")} />
        ))}
        <span>Chapter 6 of 7</span>
      </div>

      <article className="book-fold relative grid w-full max-w-[1100px] grid-cols-1 overflow-hidden rounded-[18px] bg-k-page shadow-[0_1px_0_var(--color-k-line),0_22px_40px_-22px_rgb(90_60_30/0.35),0_0_0_1px_var(--color-k-line)] md:grid-cols-2">
        <div className="relative grid min-w-0 content-start gap-4 p-[clamp(22px,4vw,44px)]">
          <div className="font-kid text-sm font-semibold leading-none tracking-[0.04em] text-k-tomato">Chapter 6</div>
          <h1 className="font-kid text-[clamp(30px,4vw,44px)] font-bold leading-[1.02] tracking-[-0.01em] text-balance">Your talking robot</h1>
          <p className="max-w-[34ch] text-xl leading-[1.55]">
            Everything Pip learned goes into one robot: counting, little steps, the letter map and listening. Each brain layer listens and thinks a bit more. Stack the layers up and the robot starts to talk!
          </p>
          <div className="bubble-tail relative max-w-[30ch] justify-self-start rounded-[20px] border-[2.5px] border-k-ink bg-k-white px-4 py-2.5 font-kid text-[19px] font-semibold leading-snug">
            Add brain layers and listen to what the robot says.
          </div>
          <div className="grid place-items-center pt-1.5 pb-5">
            <Pip />
          </div>
          <span className="absolute bottom-4 left-6 font-kid text-sm font-semibold leading-none text-k-soft">12</span>
        </div>

        <div className="relative grid min-w-0 content-start gap-4 p-[clamp(22px,4vw,44px)]">
          <div className="grid gap-3 rounded-2xl border-[2.5px] border-k-ink bg-k-white px-4 py-3.5">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-4">
              <ol aria-label="Brain layers" data-testid="k-layers" className="flex flex-col-reverse gap-1.5">
                <li className="grid h-9 w-24 place-items-center rounded-lg border-[2.5px] border-k-ink bg-k-peach font-kid text-sm font-bold">letters in</li>
                {Array.from({ length: layers }, (_, i) => (
                  <li key={i} className={cn("grid h-9 w-24 animate-pop place-items-center rounded-lg border-[2.5px] border-k-ink font-kid text-sm font-bold", LAYER[i])}>
                    layer {i + 1}
                  </li>
                ))}
              </ol>
              <div className="bubble-tail relative min-h-[4.5em] rounded-[20px] border-[2.5px] border-k-ink bg-k-paper px-4 py-2.5">
                <span className="sr-only">The robot says:</span>
                <span data-testid="k-says" className="font-kid text-xl font-semibold leading-snug break-words">
                  {says}
                </span>
              </div>
            </div>
            <span data-testid="k-feel" aria-live="polite" className="font-kid text-lg font-bold">
              {FEEL[layers]}
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              <button type="button" disabled={full} onClick={() => setLayers(layers + 1)} className={cn(push, "bg-k-mustard")}>
                Add a layer
              </button>
              <button type="button" disabled={layers === 0} onClick={() => setLayers(layers - 1)} className={cn(push, "bg-k-white")}>
                Take one off
              </button>
            </div>
            {full && (
              <div className="grid gap-2">
                <span className="font-kid text-base font-semibold text-k-soft">The robot&apos;s dial</span>
                <div role="group" aria-label="The robot's dial" className="flex flex-wrap gap-2">
                  {DIAL.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      aria-pressed={dial === d.id}
                      onClick={() => setDial(d.id)}
                      className={cn(
                        "cursor-pointer rounded-full border-[2.5px] px-4 py-2 font-kid text-base font-bold leading-none",
                        dial === d.id ? "border-k-ink bg-k-tomato text-k-page" : "border-k-line bg-k-page text-k-ink",
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-2.5">
            <h2 className="font-kid text-[21px] font-bold leading-[1.1]">Puzzle! The robot keeps saying the same thing again and again. Which way do you turn the dial: calm or silly?</h2>
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
                  <b className="block text-xl">You built a talking robot!</b>
                  Grown-ups call a robot like this a <u>GPT</u>.
                </div>
              </div>
            )}
          </div>
          <span className="absolute right-6 bottom-4 font-kid text-sm font-semibold leading-none text-k-soft">13</span>
        </div>
      </article>
    </main>
  );
}
