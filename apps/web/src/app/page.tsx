"use client";

import Link from "next/link";
import { LIVE_STAGES, STAGES } from "@/content/ladder";
import { cn } from "@/lib/utils";
import { useTrack } from "@/lib/track";

export default function Home() {
  const { track } = useTrack();
  return track === "kids" ? <KidsHome /> : <AdultHome />;
}

function AdultHome() {
  return (
    <main className="mx-auto grid max-w-[1040px] gap-10 pt-14 pb-20 pl-[max(20px,env(safe-area-inset-left,0px))] pr-[max(20px,env(safe-area-inset-right,0px))]">
      <div className="grid gap-4">
        <div className="font-mono text-xs font-medium uppercase leading-none tracking-[0.1em] text-a-acc">Seven stages · one small model</div>
        <h1 className="max-w-[20ch] font-display text-[clamp(34px,5vw,56px)] font-semibold leading-[1.02] tracking-[-0.03em] text-balance">
          Build a language model by hand, one box at a time.
        </h1>
        <p className="max-w-[60ch] text-[19px] text-a-stand">
          No jargon up front. You build each piece, watch it work, explain it back, and only then learn what engineers call it.
        </p>
      </div>
      <ol className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        {STAGES.map((s) => {
          const live = LIVE_STAGES.includes(s.n);
          const inner = (
            <>
              <span className={cn("font-mono text-[11px] uppercase tracking-[0.08em]", live ? "text-a-acc" : "text-a-cap")}>
                Stage {s.n} {live ? "· open" : "· soon"}
              </span>
              <b className={cn("font-display text-lg font-semibold leading-tight", !live && "font-normal text-a-cap")}>{s.plain}</b>
            </>
          );
          return (
            <li key={s.n}>
              {live ? (
                <Link href={`/learn/${s.n}`} className="grid h-full gap-2 rounded-[10px] border border-a-acc bg-a-panel p-4 shadow-[0_0_0_4px] shadow-a-acc/25 transition-colors hover:bg-a-node">
                  {inner}
                </Link>
              ) : (
                <div className="grid h-full gap-2 rounded-[10px] border border-dashed border-a-wire p-4">{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </main>
  );
}

function KidsHome() {
  return (
    <main className="mx-auto grid max-w-[900px] justify-items-center gap-8 pt-12 pb-20 text-center pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))]">
      <h1 className="font-kid text-[clamp(34px,6vw,58px)] font-bold leading-none text-balance">Teach Pip the robot to talk</h1>
      <p className="max-w-[34ch] text-xl leading-normal">Seven little chapters. In each one you help Pip learn one new trick.</p>
      <ol className="grid w-full grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 text-left">
        {STAGES.map((s) => {
          const live = LIVE_STAGES.includes(s.n);
          const inner = (
            <>
              <span className="font-kid text-sm font-semibold text-k-tomato">Chapter {s.n}</span>
              <b className="font-kid text-xl font-semibold leading-tight">{s.kids}</b>
              {!live && <span className="text-sm text-k-soft">coming soon</span>}
            </>
          );
          return (
            <li key={s.n}>
              {live ? (
                <Link href={`/learn/${s.n}`} className="grid h-full gap-1.5 rounded-2xl border-[2.5px] border-k-ink bg-k-page p-4 shadow-[0_4px_0_var(--color-k-ink)] transition-transform active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-k-ink)]">
                  {inner}
                </Link>
              ) : (
                <div className="grid h-full gap-1.5 rounded-2xl border-2 border-dashed border-k-line p-4 text-k-soft">{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </main>
  );
}
