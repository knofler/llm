"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { APP_VERSION, GIT_SHA } from "@/lib/version";

const DISMISS_KEY = "llm.pwa.install.dismissed";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

function remembered() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function remember() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* private mode: the hint may show again, harmless */
  }
}

export function PwaRegister() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      const v = encodeURIComponent(`${APP_VERSION}-${GIT_SHA}`);
      navigator.serviceWorker.register(`/sw.js?v=${v}`).catch(() => {
        /* no service worker (private mode, old browser): the site still works */
      });
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone || remembered()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const ua = navigator.userAgent;
    const iosSafari = /iP(hone|od|ad)/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    const timer = iosSafari ? window.setTimeout(() => setIos(true), 1500) : undefined;

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (!deferred && !ios) return null;

  const close = () => {
    remember();
    setDeferred(null);
    setIos(false);
  };
  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    close();
  };

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border bg-muted p-3 pl-4 text-sm text-foreground shadow-lg"
    >
      <p className="flex-1">
        {deferred ? (
          "Install llm on your device."
        ) : (
          <>
            Install: tap <b>Share</b>, then <b>Add to Home Screen</b>.
          </>
        )}
      </p>
      {deferred ? (
        <Button size="sm" onClick={install}>
          Install
        </Button>
      ) : null}
      <Button size="sm" variant="ghost" onClick={close} aria-label="Dismiss">
        {deferred ? "✕" : "Got it"}
      </Button>
    </div>
  );
}
