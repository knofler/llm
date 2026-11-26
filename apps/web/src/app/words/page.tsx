"use client";

import { useEffect, useState } from "react";
import { BrainBadge, BrainNudge, BrainPanel, useBrain } from "@/components/brain/brain-panel";
import { EXPLAIN } from "@/content/ladder";
import { cn } from "@/lib/utils";
import { useTrack } from "@/lib/track";
import { list, type Entry } from "@/lib/wordbook";

interface ExplainReply {
  topic: string;
  explanation: string;
  example: string;
  source: "ai" | "built-in";
}

export default function Words() {
  const { track } = useTrack();
  const kids = track === "kids";
  const brain = useBrain();
  const [serverBrain, setServerBrain] = useState(false);
  const [showBrain, setShowBrain] = useState(false);
  const [words, setWords] = useState<Entry[] | null>(null);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<ExplainReply | null>(null);

  useEffect(() => {
    list().then(setWords);
    fetch("/api/brain")
      .then((r) => (r.ok ? r.json() : { brain: false }))
      .then((j: { brain?: boolean }) => setServerBrain(Boolean(j.brain)))
      .catch(() => undefined);
  }, []);

  async function askHelper(subject: string) {
    const clean = subject.trim();
    if (!clean) return;
    setLoading(true);
    try {
      const res = await fetch("/api/brain/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: clean, track, ...(brain ? { brain } : {}) }),
      });
      if (res.ok) {
        const j = (await res.json()) as { explanation: string; example: string; source: "ai" | "built-in" };
        setReply({ topic: clean, ...j });
      }
    } finally {
      setLoading(false);
    }
  }

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
            <div className="pt-1">
              <button
                type="button"
                onClick={() => void askHelper(w.word)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold",
                  kids ? "border-k-line bg-k-paper text-k-ink" : "border-a-rule bg-a-page text-a-stand hover:text-a-ink",
                )}
              >
                {kids ? "Give me another example" : "Explain another way"}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <section className={cn("grid gap-3 rounded-[10px] border p-4", kids ? "border-[2.5px] border-k-ink bg-k-white" : "border-a-rule bg-a-panel")}>
        <h2 className={cn("text-lg font-semibold", kids ? "font-kid" : "font-display")}>
          {kids ? "Ask for a fresh example" : "Plain-English tutor"}
        </h2>
        {!brain && !serverBrain && !showBrain && (
          <BrainNudge onAdd={() => setShowBrain(true)}>
            {kids
              ? "Plug in a brain key for fresh stories and examples. Without one, the built-in guide answers."
              : "Plug in any AI key for custom examples in plain language. Without one, the built-in guide answers."}
          </BrainNudge>
        )}
        {showBrain && <BrainPanel brain={brain} onDone={() => setShowBrain(false)} />}
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={kids ? "Ask about a word or idea…" : "Ask about any earned word or idea…"}
            className={cn(
              "min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none",
              kids ? "border-k-line bg-k-paper text-k-ink placeholder:text-k-soft" : "border-a-rule bg-a-page text-a-ink placeholder:text-a-cap",
            )}
          />
          <button
            type="button"
            disabled={loading || !topic.trim()}
            onClick={() => void askHelper(topic)}
            className={cn(
              "cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50",
              kids ? "bg-k-tomato text-k-page" : "bg-a-acc text-a-acc-ink",
            )}
          >
            {loading ? "Thinking…" : "Explain"}
          </button>
        </div>
        {reply && (
          <div className={cn("grid gap-2 rounded-lg border p-3", kids ? "border-k-line bg-k-paper" : "border-a-rule bg-a-page")}>
            <div className="flex items-center justify-between gap-2">
              <strong className="text-sm">{reply.topic}</strong>
              <BrainBadge source={reply.source} />
            </div>
            <p className={cn("text-sm", kids ? "text-k-ink" : "text-a-stand")}>{reply.explanation}</p>
            <p className={cn("text-xs", kids ? "text-k-soft" : "text-a-cap")}>{reply.example}</p>
          </div>
        )}
      </section>
    </main>
  );
}
