"use client";

import { useEffect, useMemo, useState } from "react";
import { ModelSoFar } from "@/components/model-so-far";
import { bookOf } from "@/lib/book";
import { dice, examplesOf, tallyScore } from "@/lib/map";
import { BITS, pack, tablesOf, unpack, type Bits } from "@/lib/pack";
import { freshBot, idsOf, scoreOf, trainStep, writeFrom, type Bot } from "@/lib/stack";
import { cn } from "@/lib/utils";
import { has, unlock } from "@/lib/wordbook";

const PHASES = ["Do it by hand", "Build it", "Watch it work", "Say it back", "Name it"];
const NOW = 2;
const START = "pip saw a cat. pip saw a dog. pip saw a cat. pip saw a dog.";
const BLOCKS = 2;
const BURST = 50;
const SIZE = 8;
const RATE = 0.5;
const WORDS = ["weights", "safetensors", "GGUF", "inference"];

const fix = (x: number) => x.toFixed(2);
const kb = (n: number) => `${(n / 1024).toFixed(1)} kB`;
const btn = "cursor-pointer rounded-md border px-3.5 py-2 font-display text-sm font-semibold leading-none";
const panel = "grid min-w-0 content-start gap-3 rounded-[10px] border border-a-rule bg-a-panel p-4";
const title = "flex items-baseline justify-between gap-2.5 font-display text-base font-semibold leading-tight";

type Opened = { bot: Bot; book: string[]; bits: Bits; header: string; size: number; from: string };

export function AdultLesson() {
  const [text, setText] = useState(START);
  const [steps, setSteps] = useState(0);
  const [bits, setBits] = useState<Bits>(32);
  const [opened, setOpened] = useState<Opened | null>(null);
  const [broken, setBroken] = useState(false);
  const [written, setWritten] = useState("");
  const [named, setNamed] = useState(false);

  const shown = text.length >= 3 ? text : "abc";
  const book = useMemo(() => bookOf(shown), [shown]);
  const ids = useMemo(() => idsOf(shown, book), [shown, book]);
  const tally = useMemo(() => tallyScore(examplesOf(shown, book), book.length), [shown, book]);

  const [bot, setBot] = useState<Bot>(() => freshBot(book.length, BLOCKS));
  const live = bot.spots.length === book.length ? bot : freshBot(book.length, BLOCKS);
  const score = useMemo(() => scoreOf(live, ids), [live, ids]);

  const tables = useMemo(() => tablesOf(live), [live]);
  const total = tables.reduce((a, t) => a + t.values.length, 0);
  const file = useMemo(() => pack(live, book, bits), [live, book, bits]);
  const back = useMemo(() => unpack(file), [file]);
  const squashed = useMemo(() => scoreOf(back.bot, ids), [back, ids]);

  useEffect(() => {
    has("weights").then(setNamed);
  }, []);

  function reset(letters = book.length) {
    setBot(freshBot(letters, BLOCKS));
    setSteps(0);
    setOpened(null);
    setWritten("");
  }

  function edit(v: string) {
    const next = v.toLowerCase();
    setText(next);
    reset(bookOf(next.length >= 3 ? next : "abc").length);
  }

  function train() {
    let cur = live;
    for (let i = 0; i < BURST; i++) cur = trainStep(cur, ids, SIZE, RATE);
    setBot(cur);
    setSteps((s) => s + BURST);
    setOpened(null);
    setWritten("");
  }

  function open(bytes: Uint8Array, from: string) {
    try {
      setOpened({ ...unpack(bytes), size: bytes.length, from });
      setBroken(false);
    } catch {
      setOpened(null);
      setBroken(true);
    }
    setWritten("");
  }

  function save() {
    const url = URL.createObjectURL(new Blob([file], { type: "application/octet-stream" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-model.bin";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function upload(f: File | undefined) {
    if (f) open(new Uint8Array(await f.arrayBuffer()), f.name);
  }

  const same = opened !== null && opened.book.join("") === book.join("");
  const openedScore = useMemo(() => (opened && same ? scoreOf(opened.bot, ids) : null), [opened, same, ids]);

  function write() {
    if (!opened) return;
    const start = [...text.slice(0, 2)].map((c) => opened.book.indexOf(c)).filter((i) => i >= 0);
    const out = writeFrom(opened.bot, start.length ? start : [0], 80, 1, dice(steps + opened.bits + 13));
    setWritten(out.map((i) => opened.book[i]).join(""));
  }

  async function name() {
    if (named) return;
    setNamed(true);
    await unlock(WORDS, 7);
  }

  return (
    <main className="grid min-h-[calc(100dvh-60px)] grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)]">
      <ModelSoFar now={7} />

      <section className="grid max-w-[1040px] content-start gap-[30px] px-[clamp(20px,4vw,56px)] pt-9 pb-16">
        <div>
          <div className="font-mono text-xs font-medium uppercase leading-none tracking-[0.1em] text-a-acc">Stage 7 of 7 · Take-home file</div>
          <h1 className="mt-2.5 font-display text-[clamp(30px,4.2vw,46px)] font-semibold leading-[1.05] tracking-[-0.025em] text-balance">
            Pack your model into a file, and run it anywhere.
          </h1>
          <p className="mt-3 max-w-[60ch] text-[19px] text-a-stand">
            After all that nudging, your model is nothing but numbers: the spots, the listening dials, the thinking dials, the guess dials. The nudge was only needed to find them. Write those numbers into one file, with a note saying which number belongs where, and anyone can open it and get your model back, exactly as it was, without training a thing. Squash each number into fewer bits and the file shrinks, and still mostly works.
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
            <span>1 · Your stack, trained</span>
            <span data-testid="a-steps">{steps} handfuls so far</span>
          </div>
          <div className="grid gap-4 px-4 pt-[18px] pb-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="grid min-w-0 content-start gap-2">
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
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={train} className={cn(btn, "border-a-acc bg-a-acc text-a-acc-ink")}>
                  Train {BURST}
                </button>
                <button type="button" onClick={() => reset()} className={cn(btn, "border-a-wire font-medium text-a-cap hover:text-a-fg")}>
                  Start over
                </button>
              </div>
            </div>
            <div className="grid content-start gap-1">
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-a-cap">wrongness score · {BLOCKS} blocks</span>
              <span data-testid="a-score" className="font-display text-[44px] font-semibold leading-none tracking-[-0.02em] text-a-acc">
                {fix(score)}
              </span>
              <span data-testid="a-tally" className="font-mono text-xs text-a-cap">
                your stage 2 tally scores: {fix(tally)}
              </span>
            </div>
          </div>
        </div>

        <div className={panel}>
          <h3 className={title}>
            2 · Pack it <small className="font-mono text-xs font-normal text-a-cap">{total.toLocaleString("en")} numbers</small>
          </h3>
          <p className="max-w-[70ch] text-[15px] text-a-stand">
            The file starts with 8 bytes saying how long the note is. The note is plain text: every table&apos;s name, its shape, how each number is stored, and where its bytes start and end. Your letter book rides along in the note too, so the file is all you need. Then come the numbers, back to back.
          </p>
          <div className="grid gap-1.5">
            <span className="font-mono text-xs font-medium text-a-cap">each number stored in</span>
            <div role="group" aria-label="Bits per number" className="flex flex-wrap gap-1.5">
              {BITS.map((b) => (
                <button
                  key={b}
                  type="button"
                  aria-pressed={bits === b}
                  onClick={() => setBits(b)}
                  className={cn(btn, bits === b ? "border-a-acc bg-a-acc text-a-acc-ink" : "border-a-wire text-a-cap hover:text-a-fg")}
                >
                  {b} bits
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="grid min-w-0 content-start gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-a-cap">what&apos;s inside</span>
              <div className="max-h-56 overflow-y-auto rounded-md border border-a-wire bg-a-node">
                <table data-testid="a-tables" className="w-full font-mono text-[12px]">
                  <thead>
                    <tr className="text-left text-a-cap">
                      <th className="px-2.5 py-1.5 font-medium">table</th>
                      <th className="px-2.5 py-1.5 font-medium">shape</th>
                      <th className="px-2.5 py-1.5 text-right font-medium">numbers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.map((t) => (
                      <tr key={t.name} className="border-t border-a-rule">
                        <td className="px-2.5 py-1">{t.name}</td>
                        <td className="px-2.5 py-1 text-a-cap">{t.shape.join(" × ")}</td>
                        <td className="px-2.5 py-1 text-right">{t.values.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="grid min-w-0 content-start gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-a-cap">the start of the note</span>
              <pre data-testid="a-header" className="max-h-32 overflow-hidden rounded-md border border-a-wire bg-a-node px-3 py-2 font-mono text-[11px] leading-snug break-all whitespace-pre-wrap text-a-cap">
                {back.header.slice(0, 220)}…
              </pre>
              <p data-testid="a-size" className="font-mono text-sm text-a-fg">
                file size: {kb(file.length)}
              </p>
              <p data-testid="a-squashed" className="font-mono text-xs text-a-cap">
                score after packing at {bits} bits: <span className="text-a-fg">{fix(squashed)}</span> (before: {fix(score)})
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={save} className={cn(btn, "border-a-acc text-a-acc")}>
                  Save the file
                </button>
                <button type="button" onClick={() => open(file, "the file you just packed")} className={cn(btn, "border-a-acc bg-a-acc text-a-acc-ink")}>
                  Open the file you just packed
                </button>
              </div>
            </div>
          </div>
          <p className="max-w-[70ch] text-[15px] text-a-stand">
            32 bits keeps every number almost exactly. At 8 bits each table keeps one scale, and every number is rounded to one of 255 steps; at 4 bits, one of 15. The file shrinks by four or eight times. Watch the score: a trained model barely notices 8 bits, and 4 bits costs a little.
          </p>
        </div>

        <div className={panel}>
          <h3 className={title}>
            3 · Open it and run it <small className="font-mono text-xs font-normal text-a-cap">no nudging here</small>
          </h3>
          <div className="grid gap-1.5">
            <label htmlFor="a-upload" className="font-mono text-xs font-medium text-a-cap">
              or open a saved file from your computer
            </label>
            <input id="a-upload" type="file" accept=".bin,application/octet-stream" onChange={(e) => upload(e.target.files?.[0])} className="max-w-full font-mono text-xs text-a-cap file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-a-wire file:bg-a-node file:px-3 file:py-1.5 file:text-a-fg" />
          </div>
          <p data-testid="a-opened" aria-live="polite" className="font-mono text-[13px] text-a-cap">
            {broken
              ? "That isn't a take-home file."
              : opened
                ? `opened ${opened.from}: ${opened.bot.blocks.length} blocks, ${opened.book.length} letters in the book, ${opened.bits}-bit numbers, ${kb(opened.size)}${openedScore === null ? " (a different text, so no score here)" : ` · score ${fix(openedScore)}`}`
                : "Nothing opened yet."}
          </p>
          <button type="button" onClick={write} disabled={!opened} className={cn(btn, "w-fit border-a-acc text-a-acc disabled:cursor-not-allowed disabled:opacity-40")}>
            Write 80 letters
          </button>
          <p data-testid="a-write" className="min-h-[3.2em] break-all rounded-md border border-a-wire bg-a-node px-3 py-2 font-mono text-[14px] text-a-fg">
            {written || "…"}
          </p>
          <p className="max-w-[70ch] text-[15px] text-a-stand">
            This is all a chat app does when you send it a message. It opens a file of numbers somebody else trained, never changes them, and runs them forward one letter at a time: look back, guess the shares, pick one, repeat.
          </p>
        </div>

        <div className={cn("flex flex-wrap items-center justify-between gap-[18px] rounded-[10px] border p-[18px]", named ? "border-a-acc bg-a-acc/20" : "border-dashed border-a-wire")}>
          <div className="grid gap-1.5">
            <small className="font-mono text-[11px] font-medium uppercase leading-none tracking-[0.08em] text-a-cap">
              Word book · {named ? "4 words earned" : "4 words waiting"}
            </small>
            <div data-testid="a-word" className={cn("font-display text-[26px] font-semibold leading-tight", named ? "animate-rise tracking-[-0.01em] text-a-acc" : "tracking-[0.14em] text-a-wire")}>
              {named ? WORDS.join(" · ") : "• • • • • • • •"}
            </div>
            <p className="max-w-[52ch] text-sm text-a-cap">
              {named
                ? "The numbers you packed are the model's weights. A short plain-text note saying where each table sits, then the raw numbers back to back, is how a safetensors file is laid out, and it's how most open models are shared. Squashing the numbers to fewer bits and packing the book in the same file is what a GGUF file does, so a laptop can run a big model. Running the frozen numbers forward to get the next token is inference."
                : "These ideas have real names. They unlock once you can say, without looking, what's in the file, why the note comes first, and what squashing costs."}
            </p>
          </div>
          <button
            type="button"
            onClick={name}
            className={cn("cursor-pointer rounded-md border border-a-acc px-[18px] py-[11px] font-display text-sm font-semibold leading-none", named ? "bg-transparent text-a-acc" : "bg-a-acc text-a-acc-ink")}
          >
            {named ? "Added to your word book" : "I said it back, unlock the names"}
          </button>
        </div>
      </section>
    </main>
  );
}
