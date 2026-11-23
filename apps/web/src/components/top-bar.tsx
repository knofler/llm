"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTrack, type Track } from "@/lib/track";

export function TopBar() {
  const { track, setTrack } = useTrack();
  const kids = track === "kids";

  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b py-3.5 backdrop-blur-md",
        "pl-[max(20px,env(safe-area-inset-left,0px))] pr-[max(20px,env(safe-area-inset-right,0px))]",
        kids ? "border-k-line bg-k-paper/90" : "border-a-rule bg-a-page/90",
      )}
    >
      <Link href="/" className={cn("flex items-center gap-2.5 leading-none", kids ? "font-kid text-lg font-semibold" : "font-display text-[15px] font-semibold tracking-tight")}>
        <span aria-hidden="true" className="grid size-[22px] grid-cols-2 gap-0.5">
          <i className={cn("rounded-[2px] border", kids ? "border-k-tomato bg-k-tomato" : "border-a-acc bg-a-acc")} />
          <i className={cn("rounded-[2px] border", kids ? "border-k-ink" : "border-a-wire")} />
          <i className={cn("rounded-[2px] border", kids ? "border-k-ink" : "border-a-wire")} />
          <i className={cn("rounded-[2px] border", kids ? "border-k-ink" : "border-a-wire")} />
        </span>
        llm
        <small className={cn("text-xs font-normal", kids ? "font-kidbody text-k-soft" : "font-mono text-a-cap")}>by bluegreyboxes</small>
      </Link>

      <nav className="flex items-center gap-4">
        <Link href="/words" className={cn("text-sm underline-offset-4 hover:underline", kids ? "font-kid font-semibold text-k-soft" : "font-mono text-a-cap")}>
          {kids ? "My words" : "Word book"}
        </Link>
        <div
          role="group"
          aria-label="Choose a track"
          className={cn("inline-flex p-[3px]", kids ? "rounded-full border-2 border-k-ink bg-k-page" : "rounded-lg border border-a-rule bg-a-panel")}
        >
          {(["adults", "kids"] as Track[]).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={track === t}
              onClick={() => setTrack(t)}
              className={cn(
                "cursor-pointer px-3.5 py-1.5 leading-none capitalize",
                kids ? "rounded-full font-kid text-[15px] text-k-soft aria-pressed:bg-k-tomato aria-pressed:text-k-page" : "rounded-md font-display text-[13px] font-medium text-a-cap aria-pressed:bg-a-acc aria-pressed:text-a-acc-ink",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
