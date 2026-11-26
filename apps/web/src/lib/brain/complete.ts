/**
 * One-shot completion with a bring-your-own brain, else the server's own
 * ANTHROPIC_API_KEY. Server-only. The BYO key is used for this call only:
 * never stored, never logged. Callers MUST catch errors and fall back to a
 * non-AI path WITHOUT echoing the provider's error text to the client.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { Brain } from "./types";

export async function brainComplete(
  brain: Brain | null,
  prompt: string,
  opts: { maxTokens: number; fallbackModel: string; signal?: AbortSignal },
): Promise<string | null> {
  if (brain?.provider === "openai") {
    const r = await fetch(`${brain.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${brain.key}` },
      body: JSON.stringify({ model: brain.model, max_tokens: opts.maxTokens, messages: [{ role: "user", content: prompt }] }),
      signal: opts.signal,
      redirect: "error",
    });
    if (!r.ok) throw new Error(`brain http ${r.status}`);
    const j = (await r.json()) as { choices?: { message?: { content?: unknown } }[] };
    const c = j.choices?.[0]?.message?.content;
    return typeof c === "string" ? c : null;
  }
  const apiKey = brain?.key ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const res = await new Anthropic({ apiKey, maxRetries: 0 }).messages.create(
    { model: brain?.model ?? opts.fallbackModel, max_tokens: opts.maxTokens, messages: [{ role: "user", content: prompt }] },
    { signal: opts.signal },
  );
  return res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
}

export const serverHasBrain = () => !!process.env.ANTHROPIC_API_KEY;
