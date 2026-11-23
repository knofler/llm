"use client";

import { useEffect, useState } from "react";
import { EXPLAIN } from "@/content/ladder";
import { cn } from "@/lib/utils";
import { useTrack } from "@/lib/track";
import { list, type Entry } from "@/lib/wordbook";

export default function Words() {
  const { track } = useTrack();
  const kids = track === "kids";
  const [words, setWords] = useState<Entry[] | null>(null);

  useEffect(() => {
    list().then(setWords);
  }, []);

  return (
    <main className="mx-auto grid max-w-[760px] gap-6 pt-12 pb-20 pl-[max(20px,env(safe-area-inset-left,0px))] pr-[max(20px,env(safe-area-inset-right,0px))]">
      <h1 className={cn(kids ? "font-kid text-[clamp(30px,5vw,44px)] font-bold" : "font-display text-[clamp(30px,4vw,42px)] font-semibold tracking-[-0.02em]")}>
        {kids ? "My words" : "Your word book"}
      </h1>
      <p className={cn("max-w-[56ch] text-lg", kids ? "text-k-soft" : "text-a-stand")}>
        {kids ? "Every time you learn a grown-up word, it goes in here." : "Names you have earned. Each one arrives only after you built the thing it names. Kept in this browser, nowhere else."}
      </p>
      {words && words.length === 0 && (
        <p data-testid="words-empty" className={cn("rounded-[10px] border border-dashed p-5", kids ? "border-k-line text-k-soft" : "border-a-wire text-a-cap")}>
          {kids ? "No words yet. Finish chapter 1 to get your first one!" : "Empty so far. Finish stage 1 to earn the first three."}
        </p>
      )}
      <ul className="grid gap-3" data-testid="words-list">
        {words?.map((w) => (
          <li key={w.word} className={cn("grid gap-1 rounded-[10px] border p-4", kids ? "border-[2.5px] border-k-ink bg-k-white" : "border-a-rule bg-a-panel")}>
            <span className={cn("text-xs uppercase tracking-[0.08em]", kids ? "font-kid text-k-tomato" : "font-mono text-a-cap")}>
              {kids ? `Chapter ${w.stage}` : `Stage ${w.stage}`}
            </span>
            <b className={cn("text-2xl", kids ? "font-kid" : "font-display text-a-acc")}>{w.word}</b>
            {EXPLAIN[w.word] && <span className={kids ? "text-k-soft" : "text-a-stand"}>{EXPLAIN[w.word]}</span>}
          </li>
        ))}
      </ul>
    </main>
  );
}
