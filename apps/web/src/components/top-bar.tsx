"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrainButton } from "@/components/brain/brain-panel";
import { cn } from "@/lib/utils";
import { useTrack, type Track } from "@/lib/track";
import { signInWithAuth0, signOutAccount } from "@/app/auth-actions";

export interface TopBarProps {
  authEnabled?: boolean;
  userLabel?: string | null;
}

export function TopBar({ authEnabled = false, userLabel = null }: TopBarProps) {
  const { track, setTrack } = useTrack();
  const kids = track === "kids";
  const [serverBrain, setServerBrain] = useState(false);

  useEffect(() => {
    fetch("/api/brain")
      .then((r) => (r.ok ? r.json() : { brain: false }))
      .then((j: { brain?: boolean }) => setServerBrain(Boolean(j.brain)))
      .catch(() => undefined);
  }, []);

  // The bar is pinned with position: fixed, not sticky. Sticky stopped
  // holding in the installed iPhone PWA, so the bar scrolled away. A spacer
  // the same height as the bar keeps the page from sliding under it; the
  // height is measured because the bar wraps to two rows on narrow phones.
  const bar = useRef<HTMLElement>(null);
  const [tall, setTall] = useState<number | null>(null);
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const fit = () => setTall(el.offsetHeight);
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(el);
    return () => watch.disconnect();
  }, []);

  return (
    <>
    <div aria-hidden="true" style={tall === null ? undefined : { height: tall }} className="h-[calc(59px+var(--inset-top,env(safe-area-inset-top,0px)))]" />
    <header
      ref={bar}
      data-testid="top-bar"
      className={cn(
        // The installed PWA uses statusBarStyle "default", so iOS keeps the page below the clock and the
        // top inset is 0. The inset padding stays as a fallback for any mode that draws under the status
        // bar. --inset-top lets the e2e test simulate a 59px inset (env() can't be faked in a browser).
        // The background is solid: a see-through one needs color-mix, which older iOS drops.
        "fixed inset-x-0 top-0 z-50 flex flex-wrap items-center justify-between gap-4 border-b pb-3.5 pt-[calc(14px+var(--inset-top,env(safe-area-inset-top,0px)))]",
        "pl-[max(20px,env(safe-area-inset-left,0px))] pr-[max(20px,env(safe-area-inset-right,0px))]",
        kids ? "border-k-line bg-k-paper" : "border-a-rule bg-a-page",
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
        <BrainButton serverBrain={serverBrain} />
        {authEnabled &&
          (userLabel ? (
            <form action={signOutAccount} className="flex items-center gap-2">
              <span className={cn("hidden max-w-[140px] truncate text-xs sm:inline", kids ? "font-kidbody text-k-soft" : "font-mono text-a-cap")}>
                {userLabel}
              </span>
              <button
                type="submit"
                className={cn(
                  "cursor-pointer border px-3 py-1.5 text-xs leading-none transition-colors",
                  kids
                    ? "rounded-full border-k-ink bg-k-paper font-kid font-semibold text-k-ink hover:bg-k-page"
                    : "rounded-md border-a-rule bg-a-panel font-mono text-a-cap hover:text-a-ink",
                )}
              >
                Sign out
              </button>
            </form>
          ) : (
            <form action={signInWithAuth0}>
              <button
                type="submit"
                className={cn(
                  "cursor-pointer border px-3 py-1.5 text-xs leading-none transition-colors",
                  kids
                    ? "rounded-full border-k-ink bg-k-paper font-kid font-semibold text-k-ink hover:bg-k-page"
                    : "rounded-md border-a-rule bg-a-panel font-mono text-a-cap hover:text-a-ink",
                )}
              >
                Sign in
              </button>
            </form>
          ))}
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
    </>
  );
}
