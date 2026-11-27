"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { THEME_COLOR } from "@/lib/theme-color";

export type Track = "adults" | "kids";

const TrackContext = createContext<{ track: Track; setTrack: (t: Track) => void }>({
  track: "adults",
  setTrack: () => {},
});

const KEY = "llm-track";

export function TrackProvider({ children }: { children: React.ReactNode }) {
  const [track, setState] = useState<Track>("adults");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "kids" || saved === "adults") setState(saved);
    } catch {}
  }, []);

  const setTrack = useCallback((t: Track) => {
    setState(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {}
  }, []);

  return <TrackContext.Provider value={{ track, setTrack }}>{children}</TrackContext.Provider>;
}

export const useTrack = () => useContext(TrackContext);

/** Whole-page wrapper: paints the track's ground and exposes data-track for focus styles. */
export function TrackSurface({ children }: { children: React.ReactNode }) {
  const { track } = useTrack();

  // Keep <meta name="theme-color"> on the track's page colour, so the strip
  // iOS reserves above the page matches the top bar under it.
  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = THEME_COLOR[track];
  }, [track]);

  return (
    <div
      data-track={track}
      className={
        track === "kids"
          ? "min-h-dvh bg-k-paper text-k-ink font-kidbody [color-scheme:light] transition-colors duration-300"
          : "min-h-dvh bg-a-page text-a-fg font-serif transition-colors duration-300"
      }
    >
      {children}
    </div>
  );
}
