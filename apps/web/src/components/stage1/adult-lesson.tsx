"use client";

import { useEffect, useMemo, useState } from "react";
import { ModelSoFar } from "@/components/model-so-far";
import { bookOf, decode, encode, show } from "@/lib/book";
import { cn } from "@/lib/utils";
import { has, unlock } from "@/lib/wordbook";

const PHASES = ["Do it by hand", "Build it", "Watch it work", "Say it back", "Name it"];
const NOW = 2;

export function AdultLesson() {
  const [text, setText] = useState("hello world");
  const [hover, setHover] = useState<string | null>(null);
  const [named, setNamed] = useState(false);

  useEffect(() => {
    has("tokenizer").then(setNamed);
  }, []);

  const shown = text || " ";
  const book = useMemo(() => bookOf(shown), [shown]);
  const nums = useMemo(() => encode(shown, book), [shown, book]);
  const back = decode(nums, book);

  async function name() {
    if (named) return;
    setNamed(true);
    await unlock(["tokenizer", "token", "vocabulary"], 1);
  }

  return (
    <main className="grid min-h-[calc(100dvh-60px)] grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)]">
      <ModelSoFar now={1} />

      <section className="grid max-w-[1040px] content-start gap-[30px] px-[clamp(20px,4vw,56px)] pt-9 pb-16">
        <div>
          <div className="font-mono text-xs font-medium uppercase leading-none tracking-[0.1em] text-a-acc">Stage 1 of 7 · The letter-to-number book</div>
          <h1 className="mt-2.5 font-display text-[clamp(30px,4.2vw,46px)] font-semibold leading-[1.05] tracking-[-0.025em] text-balance">
            A computer can&apos;t read letters. So we give every letter a number.
          </h1>
          <p className="mt-3 max-w-[60ch] text-[19px] text-a-stand">
            Your model will only ever see numbers. This first box is a small book that turns your text into numbers, and turns the numbers back into exactly the same text.
          </p>
        </div>

        <ol aria-label="Lesson steps" className="flex w-fit max-w-full overflow-x-auto rounded-lg border border-a-rule">
          {PHASES.map((p, i) => (
            <li
              key={p}
              aria-current={i === NOW ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap border-r border-a-rule px-4 py-[9px] font-display text-[12.5px] font-medium leading-none last:border-r-0",
                i < NOW ? "text-a-stand" : i === NOW ? "bg-a-acc/15 text-a-acc" : "text-a-cap",
              )}
            >
              <em className="font-mono text-[10px] not-italic opacity-70">{i < NOW ? `✓ ${i + 1}` : i + 1}</em>
              {p}
            </li>
          ))}
        </ol>

        <div className="overflow-hidden rounded-[10px] border border-a-rule bg-a-panel">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-a-rule px-4 py-3 font-mono text-[11px] font-medium uppercase leading-none tracking-[0.08em] text-a-cap">
            <span>Your book, running</span>
            <span data-testid="a-count">
              {shown.length} characters → {nums.length} numbers
            </span>
          </div>
          <div className="flex items-center gap-3 px-4 pt-[18px] pb-1">
            <label htmlFor="a-in" className="whitespace-nowrap font-mono text-xs font-medium text-a-cap">
              your text
            </label>
            <input
              id="a-in"
              maxLength={28}
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="min-w-0 flex-1 rounded-md border border-a-wire bg-a-node px-3 py-2.5 font-mono text-lg font-medium leading-none tracking-[0.02em] focus:border-a-acc focus:shadow-[0_0_0_4px] focus:shadow-a-acc/15 focus:outline-none"
            />
          </div>
          <div className="overflow-x-auto px-4 pt-[18px] pb-5">
            <div className="mb-2 font-mono text-[11px] leading-none text-a-cap">letters ↓ book ↓ numbers</div>
            <div className="stagger flex w-max gap-1.5" data-testid="a-lane">
              {[...shown].map((c, i) => {
                const hl = hover === c;
                return (
                  <div key={`${i}-${c}`} className="grid animate-rise justify-items-center">
                    <div className={cn("grid h-11 w-10 place-items-center rounded-md border bg-a-node font-mono text-lg font-medium", hl ? "border-a-acc text-a-acc" : "border-a-wire", c === " " && !hl && "text-sm text-a-cap")}>{show(c)}</div>
                    <div className={cn("h-[22px] w-px", hl ? "bg-a-acc" : "bg-a-wire")} />
                    <div className={cn("grid h-11 w-10 place-items-center rounded-md border border-a-acc font-mono text-lg font-semibold", hl ? "bg-a-acc text-a-acc-ink" : "bg-a-acc-ink text-a-acc")}>{nums[i]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="grid min-w-0 content-start gap-3 rounded-[10px] border border-a-rule bg-a-panel p-4">
            <h3 className="flex items-baseline justify-between gap-2.5 font-display text-base font-semibold leading-tight">
              The book itself <small className="font-mono text-xs font-normal text-a-cap">{book.length} pages</small>
            </h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(78px,1fr))] gap-1.5" data-testid="a-book">
              {book.map((c, i) => (
                <div
                  key={c}
                  tabIndex={0}
                  onMouseEnter={() => setHover(c)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(c)}
                  onBlur={() => setHover(null)}
                  className="flex cursor-pointer items-center justify-between rounded-md border border-a-rule bg-a-node px-2.5 py-[7px] font-mono text-[15px] font-medium leading-none transition-colors hover:border-a-acc focus:border-a-acc"
                >
                  <span className={cn(c === " " && "text-xs text-a-cap")}>{c === " " ? "space" : c}</span>
                  <span className="text-a-acc">{i}</span>
                </div>
              ))}
            </div>
            <p className="text-[15px] text-a-stand">
              Every different character gets one page, in alphabetical order. Even the space gets a number, because the model has to learn where words end. Hover a page to see where it&apos;s used.
            </p>
          </div>

          <div className="grid min-w-0 content-start gap-3 rounded-[10px] border border-a-rule bg-a-panel p-4">
            <h3 className="flex items-baseline justify-between gap-2.5 font-display text-base font-semibold leading-tight">
              Nothing lost? <small className="font-mono text-xs font-normal text-a-cap">round trip</small>
            </h3>
            <dl className="grid gap-2 font-mono text-sm font-medium leading-snug">
              {[
                ["text", `"${shown}"`],
                ["numbers", nums.join(" ")],
                ["back", `"${back}"`],
                ["check", back === shown ? "identical, nothing lost" : "mismatch"],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-wrap items-baseline gap-2.5">
                  <dt className="w-[72px] flex-none text-[11px] uppercase tracking-[0.06em] text-a-cap">{k}</dt>
                  <dd data-testid={`a-${k}`} className={cn("min-w-0 break-all", k === "check" && "text-a-acc")}>
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-[15px] text-a-stand">
              If the text that comes back isn&apos;t identical, the book is broken and the model would learn the wrong thing. Your test checks this.
            </p>
          </div>
        </div>

        <div className={cn("flex flex-wrap items-center justify-between gap-[18px] rounded-[10px] border p-[18px]", named ? "border-a-acc bg-a-acc/15" : "border-dashed border-a-wire")}>
          <div className="grid gap-1.5">
            <small className="font-mono text-[11px] font-medium uppercase leading-none tracking-[0.08em] text-a-cap">
              Word book · {named ? "1 word earned" : "1 word waiting"}
            </small>
            <div data-testid="a-word" className={cn("font-display text-[26px] font-semibold leading-none", named ? "animate-rise tracking-[-0.01em] text-a-acc" : "tracking-[0.14em] text-a-wire")}>
              {named ? "tokenizer" : "• • • • • • • • •"}
            </div>
            <p className="max-w-[46ch] text-sm text-a-cap">
              {named
                ? "What you built is what engineers call a tokenizer. Each number is a token, and the whole book is the vocabulary. You knew the idea first, so now it's just a name."
                : "This box has a real name. It unlocks once you can rebuild the book from a blank page, without looking."}
            </p>
          </div>
          <button
            type="button"
            onClick={name}
            className={cn("cursor-pointer rounded-md border border-a-acc px-[18px] py-[11px] font-display text-sm font-semibold leading-none", named ? "bg-transparent text-a-acc" : "bg-a-acc text-a-acc-ink")}
          >
            {named ? "Added to your word book" : "I rebuilt it, unlock the name"}
          </button>
        </div>
      </section>
    </main>
  );
}
