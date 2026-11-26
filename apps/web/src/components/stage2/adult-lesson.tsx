"use client";

import { useEffect, useMemo, useState } from "react";
import { ModelSoFar } from "@/components/model-so-far";
import { bookOf, show } from "@/lib/book";
import { babble, nextOf, roll, tallyOf } from "@/lib/tally";
import { cn } from "@/lib/utils";
import { has, unlock } from "@/lib/wordbook";

const PHASES = ["Do it by hand", "Build it", "Watch it work", "Say it back", "Name it"];
const NOW = 2;
const START = "the cat sat on the mat. the hat is on the cat.";
const WRITE = 40;

const pct = (x: number) => `${Math.round(x * 100)}%`;

export function AdultLesson() {
  const [text, setText] = useState(START);
  const [pick, setPick] = useState<string | null>(null);
  const [out, setOut] = useState("");
  const [last, setLast] = useState<{ from: string; to: string } | null>(null);
  const [named, setNamed] = useState(false);

  useEffect(() => {
    has("bigram").then(setNamed);
  }, []);

  const shown = text.length >= 2 ? text : "ab";
  const tally = useMemo(() => tallyOf(shown), [shown]);
  const book = useMemo(() => bookOf(shown), [shown]);
  const pairs = shown.length - 1;
  const max = useMemo(() => Math.max(1, ...[...tally.values()].flatMap((r) => [...r.values()])), [tally]);

  const row = pick && tally.has(pick) ? pick : shown[0];
  const sides = nextOf(tally, row);

  function edit(v: string) {
    setText(v.toLowerCase());
    setOut("");
    setLast(null);
  }

  function once() {
    const from = out.at(-1) ?? shown[0];
    const to = roll(tally, from);
    if (to === null) return;
    setOut((out || from) + to);
    setLast({ from, to });
    setPick(to);
  }

  function write() {
    const s = babble(tally, shown[0], WRITE);
    setOut(s);
    setLast(null);
  }

  async function name() {
    if (named) return;
    setNamed(true);
    await unlock(["bigram", "probability", "sampling"], 2);
  }

  const stuck = out.length > 0 && out.length < WRITE && nextOf(tally, out.at(-1)!).length === 0;

  return (
    <main className="grid min-h-[calc(100dvh-60px)] grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)]">
      <ModelSoFar now={2} />

      <section className="grid max-w-[1040px] content-start gap-[30px] px-[clamp(20px,4vw,56px)] pt-9 pb-16">
        <div>
          <div className="font-mono text-xs font-medium uppercase leading-none tracking-[0.1em] text-a-acc">Stage 2 of 7 · The what-comes-next tally</div>
          <h1 className="mt-2.5 font-display text-[clamp(30px,4.2vw,46px)] font-semibold leading-[1.05] tracking-[-0.025em] text-balance">
            Count what follows each letter. Then roll a die to write.
          </h1>
          <p className="mt-3 max-w-[60ch] text-[19px] text-a-stand">
            Your model can turn text into numbers. Now it needs its first guess about what comes next. The simplest guess there is: read the text, and for every letter keep a tally of the letter that came straight after it.
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
            <span>Your tally, running</span>
            <span data-testid="a-pairs">{pairs} neighbour pairs counted</span>
          </div>
          <div className="grid gap-2 px-4 pt-[18px]">
            <label htmlFor="a-text" className="font-mono text-xs font-medium text-a-cap">
              text to learn from
            </label>
            <textarea
              id="a-text"
              rows={2}
              maxLength={160}
              value={text}
              onChange={(e) => edit(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="min-w-0 resize-y rounded-md border border-a-wire bg-a-node px-3 py-2.5 font-mono text-base font-medium leading-snug focus:border-a-acc focus:shadow-[0_0_0_4px] focus:shadow-a-acc/25 focus:outline-none"
            />
          </div>
          <div className="overflow-x-auto px-4 pt-[18px] pb-5">
            <div className="mb-2 font-mono text-[11px] leading-none text-a-cap">this letter → (row) · came next → (column) · pick a row</div>
            <table data-testid="a-grid" className="border-separate border-spacing-[3px] font-mono text-[13px] font-medium">
              <thead>
                <tr>
                  <th />
                  {book.map((c) => (
                    <th key={c} scope="col" className="h-6 w-7 text-center font-medium text-a-cap">
                      {show(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {book.map((a) => {
                  const r = tally.get(a);
                  const on = a === row;
                  return (
                    <tr key={a}>
                      <th scope="row" className="p-0">
                        <button
                          type="button"
                          onClick={() => setPick(a)}
                          aria-pressed={on}
                          aria-label={`Row for ${a === " " ? "space" : a}`}
                          className={cn("h-7 w-7 cursor-pointer rounded-[5px] border font-medium", on ? "border-a-acc bg-a-acc text-a-acc-ink" : "border-a-wire bg-a-node text-a-fg hover:border-a-acc")}
                        >
                          {show(a)}
                        </button>
                      </th>
                      {book.map((b) => {
                        const n = r?.get(b) ?? 0;
                        return (
                          <td
                            key={b}
                            className={cn("h-7 w-7 rounded-[5px] border text-center leading-none", n ? "text-a-fg" : "text-a-rule", on ? "border-a-acc/60" : "border-a-rule")}
                            style={n ? { backgroundColor: `rgb(255 122 31 / ${(0.12 + 0.6 * (n / max)).toFixed(2)})` } : undefined}
                          >
                            {n || "·"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="grid min-w-0 content-start gap-3 rounded-[10px] border border-a-rule bg-a-panel p-4">
            <h3 className="flex items-baseline justify-between gap-2.5 font-display text-base font-semibold leading-tight">
              <span>
                After <span className="font-mono text-a-acc">&ldquo;{show(row)}&rdquo;</span>
              </span>
              <small className="font-mono text-xs font-normal text-a-cap">one row, as shares</small>
            </h3>
            {sides.length === 0 ? (
              <p className="text-[15px] text-a-cap">Nothing ever came after this one: it only shows up at the very end.</p>
            ) : (
              <>
                <ul className="grid gap-1.5" data-testid="a-row">
                  {sides.map((s) => (
                    <li key={s.next} className="grid grid-cols-[28px_minmax(0,1fr)_64px] items-center gap-2 font-mono text-[13px]">
                      <span className="grid h-7 place-items-center rounded-[5px] border border-a-wire bg-a-node">{show(s.next)}</span>
                      <span className="h-3 overflow-hidden rounded-full bg-a-node">
                        <span className="block h-full animate-rise rounded-full bg-a-acc" style={{ width: pct(s.share) }} />
                      </span>
                      <span className="text-right text-a-stand">
                        {s.count} · {pct(s.share)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="grid gap-1.5">
                  <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-a-cap">the die for this letter</div>
                  <div className="flex h-9 overflow-hidden rounded-md border border-a-wire" aria-hidden="true">
                    {sides.map((s, i) => (
                      <span
                        key={s.next}
                        className={cn("grid place-items-center border-r border-a-page font-mono text-xs font-semibold last:border-r-0", i % 2 ? "bg-a-acc/45 text-a-fg" : "bg-a-acc text-a-acc-ink")}
                        style={{ width: pct(s.share) }}
                      >
                        {s.share >= 0.08 ? show(s.next) : ""}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
            <p className="text-[15px] text-a-stand">
              A row is the whole idea. Turn its counts into shares and you have a die with lopsided sides: letters that followed more often get more of the die.
            </p>
          </div>

          <div className="grid min-w-0 content-start gap-3 rounded-[10px] border border-a-rule bg-a-panel p-4">
            <h3 className="flex items-baseline justify-between gap-2.5 font-display text-base font-semibold leading-tight">
              Let it write <small className="font-mono text-xs font-normal text-a-cap">roll, move, roll again</small>
            </h3>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={once} className="cursor-pointer rounded-md border border-a-acc bg-a-acc px-3.5 py-2 font-display text-sm font-semibold leading-none text-a-acc-ink">
                Roll once
              </button>
              <button type="button" onClick={write} className="cursor-pointer rounded-md border border-a-acc px-3.5 py-2 font-display text-sm font-semibold leading-none text-a-acc">
                Write {WRITE}
              </button>
              <button type="button" onClick={() => { setOut(""); setLast(null); }} className="cursor-pointer rounded-md border border-a-wire px-3.5 py-2 font-display text-sm font-medium leading-none text-a-cap hover:text-a-fg">
                Clear
              </button>
            </div>
            <output data-testid="a-out" className="min-h-[76px] whitespace-pre-wrap break-all rounded-md border border-a-wire bg-a-node px-3 py-2.5 font-mono text-[17px] font-medium leading-snug">
              {out || <span className="text-a-cap">starts at &ldquo;{show(shown[0])}&rdquo;, the first letter of your text</span>}
            </output>
            <p data-testid="a-last" className="min-h-5 font-mono text-[13px] text-a-cap">
              {last && (
                <>
                  after &ldquo;{show(last.from)}&rdquo; the die gave <span className="text-a-acc">&ldquo;{show(last.to)}&rdquo;</span>
                </>
              )}
              {stuck && "stuck: nothing ever came after the last letter"}
            </p>
            <p className="text-[15px] text-a-stand">
              It looks at one letter only, so it can&apos;t spell. But the pairs are right: it writes &ldquo;th&rdquo;, &ldquo;at&rdquo; and spaces in about the right places. Every later stage is a better way to guess this same next letter.
            </p>
          </div>
        </div>

        <div className={cn("flex flex-wrap items-center justify-between gap-[18px] rounded-[10px] border p-[18px]", named ? "border-a-acc bg-a-acc/20" : "border-dashed border-a-wire")}>
          <div className="grid gap-1.5">
            <small className="font-mono text-[11px] font-medium uppercase leading-none tracking-[0.08em] text-a-cap">
              Word book · {named ? "3 words earned" : "3 words waiting"}
            </small>
            <div data-testid="a-word" className={cn("font-display text-[26px] font-semibold leading-none", named ? "animate-rise tracking-[-0.01em] text-a-acc" : "tracking-[0.14em] text-a-wire")}>
              {named ? "bigram · probability · sampling" : "• • • • • •"}
            </div>
            <p className="max-w-[52ch] text-sm text-a-cap">
              {named
                ? "Each neighbour pair you counted is a bigram. A row's shares are probabilities: how likely each next letter is. Rolling the lopsided die to pick one is called sampling."
                : "These boxes have real names. They unlock once you can rebuild the tally and the die from a blank page, without looking."}
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
