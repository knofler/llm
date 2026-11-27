// Stand-in for the learner's own hot-and-cold nudger (Stage 3).
// The real one is written by hand in Rust (crates/, compiled to wasm). Until
// then the lesson animates with this copy.
//
// The model is a grid of dials, one per (this letter, next letter). A row of
// dials turns into shares with softmax. The wrongness score (cross-entropy
// loss) is the average of -ln(share the model gave the letter that really came
// next). One nudge is one step of gradient descent on that score: for row a,
// the push on dial (a, b) is (times a was seen × share of b − times b followed
// a) ÷ pairs, and each dial moves against its push by `step`.

/** dials[i][j]: how strongly book[j] is favoured right after book[i]. */
export type Dials = number[][];

export const flat = (size: number): Dials => Array.from({ length: size }, () => new Array<number>(size).fill(0));

/** A row of dials as shares that add up to 1. */
export function sharesOf(row: number[]): number[] {
  const top = Math.max(...row);
  const ex = row.map((d) => Math.exp(d - top));
  const sum = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / sum);
}

/** How wrong one guess was: 0 when the real letter got everything, growing as its share shrinks. */
export const wrongOf = (share: number): number => -Math.log(Math.max(share, 1e-12));

/** Neighbour pairs of the text as [this, next] positions in the book. */
export function pairsOf(text: string, book: string[]): [number, number][] {
  const id = new Map(book.map((c, i) => [c, i]));
  const chars = [...text];
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < chars.length; i++) out.push([id.get(chars[i])!, id.get(chars[i + 1])!]);
  return out;
}

/** counts[i][j]: times book[j] came right after book[i]. */
export function countsOf(pairs: [number, number][], size: number): number[][] {
  const c = flat(size);
  for (const [a, b] of pairs) c[a][b]++;
  return c;
}

/** The average wrongness over every pair in the text. */
export function wrongness(dials: Dials, pairs: [number, number][]): number {
  if (pairs.length === 0) return 0;
  const shares = dials.map(sharesOf);
  return pairs.reduce((sum, [a, b]) => sum + wrongOf(shares[a][b]), 0) / pairs.length;
}

/** The push on every dial: positive means "turning this up makes it more wrong". */
export function pushOf(dials: Dials, counts: number[][], total: number): number[][] {
  return dials.map((row, i) => {
    const seen = counts[i].reduce((a, b) => a + b, 0);
    const shares = sharesOf(row);
    return row.map((_, j) => (total ? (seen * shares[j] - counts[i][j]) / total : 0));
  });
}

/** One nudge: every dial moves a little against its push. */
export function nudge(dials: Dials, counts: number[][], total: number, step: number): Dials {
  const push = pushOf(dials, counts, total);
  return dials.map((row, i) => row.map((d, j) => d - step * push[i][j]));
}

/** The lowest score possible: what the counted tally itself would score. */
export function floorOf(counts: number[][], total: number): number {
  if (!total) return 0;
  let sum = 0;
  for (const row of counts) {
    const seen = row.reduce((a, b) => a + b, 0);
    for (const n of row) if (n) sum += n * wrongOf(n / seen);
  }
  return sum / total;
}

// Kids' game: Pip walks a 0–100 track toward a hidden treasure. How wrong is
// (spot − treasure)²; the push is its slope, 2·(spot − treasure).
export const KID_STEPS = { tiny: 0.04, good: 0.3, giant: 0.96 } as const;
export type KidStep = keyof typeof KID_STEPS;

export const kidWrong = (spot: number, treasure: number): number => (spot - treasure) ** 2;

export function kidNudge(spot: number, treasure: number, size: KidStep): number {
  const next = spot - KID_STEPS[size] * 2 * (spot - treasure);
  return Math.min(100, Math.max(0, next));
}
