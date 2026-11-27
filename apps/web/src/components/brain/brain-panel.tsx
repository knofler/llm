"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { Brain as BrainIcon, Check, Trash2 } from "lucide-react";
import { BRAIN_PRESETS, type Brain } from "@/lib/brain/types";
import { useTrack } from "@/lib/track";
import { cn } from "@/lib/utils";

/** localStorage key scoped to llm. Warm palette only — zero blue, zero locked terms. */
const STORE = "llm.brain";
const EVT = "llm-brain";
let current: Brain | null | undefined;

export function loadBrain(): Brain | null {
  if (current !== undefined) return current;
  try {
    const v = JSON.parse(localStorage.getItem(STORE) ?? "null") as Brain | null;
    current = v && v.key && v.model ? v : null;
  } catch {
    current = null;
  }
  return current;
}
function saveBrain(b: Brain | null) {
  current = b;
  try {
    if (b) localStorage.setItem(STORE, JSON.stringify(b));
    else localStorage.removeItem(STORE);
  } catch {
    /* not persisted; still used for this session */
  }
  window.dispatchEvent(new Event(EVT));
}
function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
}
export function useBrain(): Brain | null {
  return useSyncExternalStore(subscribe, loadBrain, () => null);
}

export function brainLabel(b: Brain): string {
  const p = BRAIN_PRESETS.find((x) => x.provider === b.provider && (x.provider === "anthropic" || x.baseUrl === b.baseUrl));
  return `${p?.label.split(" (")[0] ?? new URL(b.baseUrl ?? "https://x").hostname} · ${b.model}`;
}

export function BrainBadge({ source, className }: { source: "ai" | "built-in"; className?: string }) {
  const { track } = useTrack();
  const kids = track === "kids";
  return (
    <span
      data-testid="brain-badge"
      data-source={source}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        source === "ai"
          ? kids
            ? "border-k-tomato bg-k-tomato text-k-page"
            : "border-a-acc bg-a-acc text-a-acc-ink"
          : kids
            ? "border-k-line bg-k-paper text-k-soft"
            : "border-a-rule bg-a-panel text-a-cap",
        className,
      )}
    >
      {source === "ai" && <BrainIcon aria-hidden className="size-3" />}
      {source === "ai" ? "AI" : "Built-in"}
    </span>
  );
}

interface Props {
  brain: Brain | null;
  onChange?: (b: Brain | null) => void;
  onDone: () => void;
}

export function BrainPanel({ brain, onChange, onDone }: Props) {
  const { track } = useTrack();
  const kids = track === "kids";
  const initial =
    BRAIN_PRESETS.find((p) => brain && p.provider === brain.provider && (p.provider === "anthropic" || p.baseUrl === brain.baseUrl)) ??
    (brain ? BRAIN_PRESETS.at(-1)! : BRAIN_PRESETS[0]!);
  const [presetId, setPresetId] = useState(initial.id);
  const preset = BRAIN_PRESETS.find((p) => p.id === presetId)!;
  const [key, setKey] = useState(brain?.key ?? "");
  const [model, setModel] = useState(brain?.model ?? initial.models[0] ?? "");
  const [baseUrl, setBaseUrl] = useState(brain?.baseUrl ?? initial.baseUrl ?? "");
  const ids = { key: useId(), model: useId(), url: useId(), list: useId() };

  const ok = key.trim() && model.trim() && (preset.provider === "anthropic" || /^https:\/\//.test(baseUrl.trim()));
  const save = () => {
    if (!ok) return;
    const b: Brain = { provider: preset.provider, key: key.trim(), model: model.trim(), ...(preset.provider === "openai" ? { baseUrl: baseUrl.trim() } : {}) };
    saveBrain(b);
    onChange?.(b);
    onDone();
  };

  const field = cn(
    "rounded-lg border px-3 py-2 text-sm focus:outline-none",
    kids ? "border-k-line bg-k-white text-k-ink placeholder:text-k-soft" : "border-a-rule bg-a-page text-a-ink placeholder:text-a-cap",
  );

  return (
    <div data-testid="brain-panel" className={cn("flex flex-col gap-3 rounded-xl border p-3", kids ? "border-k-line bg-k-paper" : "border-a-rule bg-a-panel")}>
      <div className="flex flex-wrap gap-2" role="group" aria-label="AI provider">
        {BRAIN_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={presetId === p.id}
            onClick={() => {
              setPresetId(p.id);
              setModel(p.models[0] ?? "");
              if (p.id !== "custom") setBaseUrl(p.baseUrl ?? "");
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              presetId === p.id
                ? kids
                  ? "border-k-tomato bg-k-tomato text-k-page"
                  : "border-a-acc bg-a-acc text-a-acc-ink"
                : kids
                  ? "border-k-line bg-k-white text-k-ink"
                  : "border-a-rule bg-a-page text-a-stand hover:text-a-ink",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset.id === "custom" && (
        <input id={ids.url} aria-label="Base URL" className={field} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.example.com/v1" />
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          id={ids.key}
          data-testid="brain-key"
          aria-label="API key"
          type="password"
          autoComplete="off"
          className={field}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={preset.keyHint}
        />
        <input
          id={ids.model}
          data-testid="brain-model"
          aria-label="Model"
          list={ids.list}
          className={field}
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="model id"
        />
        <datalist id={ids.list}>
          {preset.models.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </div>
      <p className={cn("text-xs", kids ? "text-k-soft" : "text-a-cap")}>
        Your key stays in this browser. It is sent only with a request that uses it, used once, and never stored on our server.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="brain-save"
          disabled={!ok}
          onClick={save}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-50",
            kids ? "bg-k-tomato text-k-page" : "bg-a-acc text-a-acc-ink",
          )}
        >
          <Check aria-hidden className="size-3.5" /> Plug in brain
        </button>
        {brain && (
          <button
            type="button"
            onClick={() => {
              saveBrain(null);
              onChange?.(null);
              onDone();
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs",
              kids ? "border-k-line text-k-ink" : "border-a-rule text-a-stand hover:text-a-ink",
            )}
          >
            <Trash2 aria-hidden className="size-3.5" /> Remove
          </button>
        )}
        <button type="button" onClick={onDone} className={cn("rounded-full px-3 py-1.5 text-xs", kids ? "text-k-soft" : "text-a-cap")}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function BrainNudge({ onAdd, children }: { onAdd: () => void; children?: React.ReactNode }) {
  const { track } = useTrack();
  const kids = track === "kids";
  return (
    <button
      type="button"
      data-testid="brain-nudge"
      onClick={onAdd}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border-2 border-dashed p-3 text-left transition-colors",
        kids ? "border-k-line bg-k-paper hover:bg-k-white" : "border-a-wire bg-a-panel hover:border-a-cap",
      )}
    >
      <BrainIcon aria-hidden className={cn("mt-0.5 size-5 shrink-0", kids ? "text-k-tomato" : "text-a-acc")} />
      <span>
        <span className={cn("block text-sm font-bold", kids ? "font-kid text-k-ink" : "font-display text-a-ink")}>Give it a brain</span>
        <span className={cn("block text-xs", kids ? "text-k-soft" : "text-a-stand")}>
          {children ?? "Plug in any AI key (Claude, OpenAI, OpenRouter, Groq…) for custom explanations. Without one, the app uses its built-in guide."}
        </span>
      </span>
    </button>
  );
}

export function BrainButton({ serverBrain = false, className }: { serverBrain?: boolean; className?: string }) {
  const { track } = useTrack();
  const kids = track === "kids";
  const brain = useBrain();
  const [open, setOpen] = useState(false);
  const on = !!brain || serverBrain;
  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        data-testid="brain-button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold leading-none transition-colors",
          kids ? "rounded-full font-kid" : "rounded-md font-mono",
          on
            ? kids
              ? "border-k-ink bg-k-paper text-k-ink"
              : "border-a-rule bg-a-panel text-a-stand hover:text-a-ink"
            : kids
              ? "animate-pulse border-k-tomato bg-k-tomato text-k-page hover:animate-none"
              : "animate-pulse border-a-acc bg-a-acc text-a-acc-ink hover:animate-none",
        )}
      >
        <BrainIcon aria-hidden className="size-3.5" />
        {brain ? <span className="max-w-[9rem] truncate">Brain: {brain.model}</span> : serverBrain ? "Brain on" : "Give it a brain"}
      </button>
      {open && (
        <div
          className={cn(
            "absolute right-0 top-full z-40 mt-2 max-h-[calc(100dvh-8rem)] w-[min(32rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-2xl border p-4 shadow-2xl",
            kids ? "border-2 border-k-ink bg-k-white text-k-ink" : "border-a-rule bg-a-page text-a-ink",
          )}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        >
          <p className="mb-1 text-base font-bold">Give it a brain</p>
          <p className={cn("mb-3 text-xs", kids ? "text-k-soft" : "text-a-stand")}>
            Bring a key from Claude, OpenAI, OpenRouter, Groq, DeepSeek or any OpenAI-compatible service. It stays in this browser.
          </p>
          <BrainPanel brain={brain} onDone={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
