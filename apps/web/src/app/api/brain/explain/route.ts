import { NextResponse } from "next/server";
import { EXPLAIN } from "@/content/ladder";
import { brainComplete } from "@/lib/brain/complete";
import { parseBrain } from "@/lib/brain/types";

export const dynamic = "force-dynamic";

interface ExplainResult {
  explanation: string;
  example: string;
  source: "ai" | "built-in";
}

/** Deterministic plain-language fallback that never introduces locked jargon. */
function buildFallbackExplain(topic: string, kids: boolean): ExplainResult {
  const known = EXPLAIN[topic.toLowerCase()];
  if (known) {
    return {
      explanation: known,
      example: kids
        ? `Try using "${topic}" while playing through the chapter again to see it in action.`
        : `Revisit the interactive step for "${topic}" and test a fresh input to see how the numbers change.`,
      source: "built-in",
    };
  }
  return {
    explanation: kids
      ? `"${topic}" is a pattern you can explore step by step by watching how letters turn into numbers and guesses.`
      : `"${topic}" works by turning text into small numbered pieces and counting which pieces follow which.`,
    example: kids
      ? `Write a short sentence with "${topic}" and trace each letter one by one.`
      : `Test a two-line sample containing "${topic}" in stage 1 and stage 2 to inspect the exact counts.`,
    source: "built-in",
  };
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const topic = typeof body.topic === "string" ? body.topic.trim().slice(0, 120) : "";
  if (!topic) {
    return NextResponse.json({ error: "Provide a word or question first." }, { status: 400 });
  }
  const kids = body.track === "kids";
  const brain = parseBrain(body.brain);

  const prompt = [
    kids
      ? "You are a warm, playful tutor explaining a concept to a 10-year-old building a tiny language model by hand."
      : "You are a clear, concise tutor explaining a concept to an adult building a tiny language model from scratch.",
    "Use plain everyday language only. Avoid unexplained jargon.",
    `Learner topic or question: ${topic}`,
    'Respond with JSON only: {"explanation": "2-3 crisp sentences", "example": "1 short hands-on example"}.',
  ].join("\n");

  try {
    const out = await brainComplete(brain, prompt, {
      maxTokens: 260,
      fallbackModel: "claude-haiku-5-5",
      signal: AbortSignal.timeout(15_000),
    });
    if (out) {
      const cleaned = out.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      try {
        const parsed = JSON.parse(cleaned) as { explanation?: unknown; example?: unknown };
        const explanation = typeof parsed.explanation === "string" ? parsed.explanation.trim() : "";
        const example = typeof parsed.example === "string" ? parsed.example.trim() : "";
        if (explanation) {
          return NextResponse.json({
            explanation,
            example: example || buildFallbackExplain(topic, kids).example,
            source: "ai",
          } satisfies ExplainResult);
        }
      } catch {
        return NextResponse.json({
          explanation: cleaned.slice(0, 600),
          example: buildFallbackExplain(topic, kids).example,
          source: "ai",
        } satisfies ExplainResult);
      }
    }
  } catch {
    // Never echo provider error text; fall back cleanly.
  }

  return NextResponse.json(buildFallbackExplain(topic, kids));
}
