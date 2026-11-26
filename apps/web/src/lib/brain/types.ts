/**
 * "Give it a brain": the user brings their own AI key + model. Shared by the
 * client (stores it in this browser only) and the server (uses it for one
 * request, never stores or logs it).
 */
export type BrainProvider = "anthropic" | "openai";

export interface Brain {
  provider: BrainProvider;
  key: string;
  model: string;
  /** OpenAI-compatible base URL (OpenAI, OpenRouter, Groq, DeepSeek, ...). */
  baseUrl?: string;
}

export interface BrainPreset {
  id: string;
  label: string;
  provider: BrainProvider;
  baseUrl?: string;
  models: string[];
  keyHint: string;
}

export const BRAIN_PRESETS: BrainPreset[] = [
  { id: "anthropic", label: "Claude (Anthropic)", provider: "anthropic", models: ["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5"], keyHint: "sk-ant-…" },
  { id: "openai", label: "OpenAI", provider: "openai", baseUrl: "https://api.openai.com/v1", models: [], keyHint: "sk-…" },
  { id: "openrouter", label: "OpenRouter (any model)", provider: "openai", baseUrl: "https://openrouter.ai/api/v1", models: [], keyHint: "sk-or-…" },
  { id: "groq", label: "Groq", provider: "openai", baseUrl: "https://api.groq.com/openai/v1", models: [], keyHint: "gsk_…" },
  { id: "deepseek", label: "DeepSeek", provider: "openai", baseUrl: "https://api.deepseek.com/v1", models: ["deepseek-chat"], keyHint: "sk-…" },
  { id: "custom", label: "Other (OpenAI-compatible)", provider: "openai", models: [], keyHint: "API key" },
];

const MAX_KEY = 400;
const MAX_MODEL = 120;
const MAX_URL = 300;

function publicHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (!h.includes(".") || h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return false;
  if (/^[\d.]+$/.test(h) || h.includes(":")) return false;
  return true;
}

/** SSRF guard: validate an untrusted brain from a request body. Null when absent or bad. */
export function parseBrain(v: unknown): Brain | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const provider = o.provider;
  if (provider !== "anthropic" && provider !== "openai") return null;
  const key = typeof o.key === "string" ? o.key.trim() : "";
  const model = typeof o.model === "string" ? o.model.trim() : "";
  if (!key || key.length > MAX_KEY || /\s/.test(key)) return null;
  if (!model || model.length > MAX_MODEL || !/^[\w.:/@-]+$/.test(model)) return null;
  if (provider === "anthropic") return { provider, key, model };
  const raw = typeof o.baseUrl === "string" ? o.baseUrl.trim().replace(/\/+$/, "") : "";
  if (!raw || raw.length > MAX_URL) return null;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || u.username || u.password || !publicHost(u.hostname)) return null;
  return { provider, key, model, baseUrl: u.toString().replace(/\/+$/, "") };
}
