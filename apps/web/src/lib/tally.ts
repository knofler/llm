// Stand-in for the learner's own "what comes next" tally.
// The real one is written by hand in Rust (crates/, compiled to wasm) during
// Stage 2. Until then the lesson animates with this copy: count every pair of
// neighbouring characters, then roll a weighted die to pick what comes next.

/** counts.get(a).get(b) = how many times b came right after a. */
export type Tally = Map<string, Map<string, number>>;

export function tallyOf(text: string): Tally {
  const t: Tally = new Map();
  const chars = [...text];
  for (let i = 0; i + 1 < chars.length; i++) {
    const row = t.get(chars[i]) ?? new Map<string, number>();
    row.set(chars[i + 1], (row.get(chars[i + 1]) ?? 0) + 1);
    t.set(chars[i], row);
  }
  return t;
}

/** What followed `c`, most often first, with each one's share of the row. */
export function nextOf(t: Tally, c: string): { next: string; count: number; share: number }[] {
  const row = t.get(c);
  if (!row) return [];
  const total = [...row.values()].reduce((a, b) => a + b, 0);
  return [...row.entries()]
    .map(([next, count]) => ({ next, count, share: count / total }))
    .sort((a, b) => b.count - a.count || a.next.localeCompare(b.next));
}

/** Weighted die: a side comes up as often as it was counted. `r` is in [0, 1). */
export function roll(t: Tally, c: string, r: number = Math.random()): string | null {
  const sides = nextOf(t, c);
  let edge = 0;
  for (const s of sides) {
    edge += s.share;
    if (r < edge) return s.next;
  }
  return sides.at(-1)?.next ?? null;
}

/** Keep rolling from `start` until `length` characters or a dead end. */
export function babble(t: Tally, start: string, length: number, rand: () => number = Math.random): string {
  let out = start;
  let c = start;
  while (out.length < length) {
    const n = roll(t, c, rand());
    if (n === null) break;
    out += n;
    c = n;
  }
  return out;
}
