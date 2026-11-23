// Stand-in for the learner's own letter-to-number book.
// The real one is written by hand in Rust (crates/, compiled to wasm) during
// Stage 1. Until that passes its test, the lesson animates with this copy so
// the page works. It is deliberately the same ten lines the learner will type.

export const bookOf = (text: string): string[] => [...new Set(text)].sort();

export function encode(text: string, book: string[]): number[] {
  const id = new Map(book.map((c, i) => [c, i]));
  return [...text].map((c) => id.get(c) ?? -1);
}

export const decode = (nums: number[], book: string[]): string => nums.map((n) => book[n] ?? "?").join("");

/** Kids' code: a = 1 … z = 26, the cipher children already play with. */
export const kidCode = (c: string): number => c.toLowerCase().charCodeAt(0) - 96;

export const show = (c: string): string => (c === " " ? "␣" : c);
