// Stand-in for the learner's own letter map (Stage 4).
// The real one is written by hand in Rust (crates/, compiled to wasm). Until
// then the lesson animates with this copy.
//
// Every letter gets a spot: two numbers, so it can be drawn on a flat map
// (an embedding of size 2). To guess the next letter, the spots of the last
// two letters go into a small middle layer of dials that squashes them with
// tanh (a one-hidden-layer MLP), and that layer's output becomes shares with
// softmax. It learns with the Stage 3 nudge (gradient descent on the
// cross-entropy loss), but each nudge looks at only a small random handful of
// examples (a mini-batch), so it is quick even on long text.

export const BACK = 2; // how many letters back it reads
export const SIDE = 2; // numbers per spot: two, so the map is flat
export const MIDDLE = 24; // dials in the middle layer

export type Net = {
  spots: number[][]; // [letter][SIDE]
  w1: number[][]; // [BACK * SIDE][MIDDLE]
  b1: number[];
  w2: number[][]; // [MIDDLE][letters]
  b2: number[];
  seed: number; // the dice for picking handfuls, carried along so every run repeats
};

/** One example: the two letters before, and the letter that really came next. */
export type Example = [number, number, number];

/** A small repeatable dice: the same seed always rolls the same numbers. */
export function dice(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const grid = (rows: number, cols: number, roll: () => number, size: number) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => (roll() * 2 - 1) * size));

/** A fresh net: spots scattered at random, dials small. */
export function freshNet(letters: number, seed = 7): Net {
  const roll = dice(seed);
  return {
    spots: grid(letters, SIDE, roll, 1),
    w1: grid(BACK * SIDE, MIDDLE, roll, 0.6),
    b1: new Array<number>(MIDDLE).fill(0),
    w2: grid(MIDDLE, letters, roll, 0.3),
    b2: new Array<number>(letters).fill(0),
    seed: seed * 7919 + 1,
  };
}

/** How many numbers the net holds. */
export const sizeOf = (letters: number): number => letters * SIDE + BACK * SIDE * MIDDLE + MIDDLE + MIDDLE * letters + letters;

/** Every place in the text with two letters before it. */
export function examplesOf(text: string, book: string[]): Example[] {
  const id = new Map(book.map((c, i) => [c, i]));
  const n = [...text].map((c) => id.get(c)!);
  const out: Example[] = [];
  for (let i = BACK; i < n.length; i++) out.push([n[i - 2], n[i - 1], n[i]]);
  return out;
}

function sharesFrom(logits: number[]): number[] {
  const top = Math.max(...logits);
  const ex = logits.map((v) => Math.exp(v - top));
  const sum = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / sum);
}

/** Run the net forward on the two letters before. */
function forward(net: Net, a: number, b: number) {
  const x = [...net.spots[a], ...net.spots[b]];
  const h = net.b1.map((bias, j) => Math.tanh(x.reduce((s, xi, i) => s + xi * net.w1[i][j], bias)));
  const out = net.b2.map((bias, k) => h.reduce((s, hj, j) => s + hj * net.w2[j][k], bias));
  return { x, h, shares: sharesFrom(out) };
}

/** The net's shares for what comes after letters a, b. */
export const guessAfter = (net: Net, a: number, b: number): number[] => forward(net, a, b).shares;

/** The average wrongness over every example (the Stage 3 score). */
export function scoreOf(net: Net, examples: Example[]): number {
  if (!examples.length) return 0;
  return examples.reduce((s, [a, b, c]) => s - Math.log(Math.max(forward(net, a, b).shares[c], 1e-12)), 0) / examples.length;
}

/** What the Stage 2 tally scores on the same examples: it only looks one letter back. */
export function tallyScore(examples: Example[], letters: number): number {
  if (!examples.length) return 0;
  const counts = Array.from({ length: letters }, () => new Array<number>(letters).fill(0));
  for (const [, b, c] of examples) counts[b][c]++;
  const rows = counts.map((r) => r.reduce((x, y) => x + y, 0));
  return examples.reduce((s, [, b, c]) => s - Math.log(counts[b][c] / rows[b]), 0) / examples.length;
}

const zeros = (m: number[][]) => m.map((r) => r.map(() => 0));

/** One nudge, worked out from a random handful of `size` examples. */
export function trainStep(net: Net, examples: Example[], size: number, rate: number): Net {
  if (!examples.length) return net;
  const roll = dice(net.seed);
  const dSpots = zeros(net.spots);
  const dW1 = zeros(net.w1);
  const dB1 = net.b1.map(() => 0);
  const dW2 = zeros(net.w2);
  const dB2 = net.b2.map(() => 0);

  for (let n = 0; n < size; n++) {
    const [a, b, c] = examples[Math.floor(roll() * examples.length)];
    const { x, h, shares } = forward(net, a, b);
    // How each output should move: its share, minus 1 for the letter that really came.
    const dOut = shares.map((p, k) => (p - (k === c ? 1 : 0)) / size);
    const dMid = h.map((hj, j) => (1 - hj * hj) * dOut.reduce((s, d, k) => s + d * net.w2[j][k], 0));
    dOut.forEach((d, k) => {
      dB2[k] += d;
      h.forEach((hj, j) => (dW2[j][k] += hj * d));
    });
    dMid.forEach((d, j) => {
      dB1[j] += d;
      x.forEach((xi, i) => (dW1[i][j] += xi * d));
    });
    for (let i = 0; i < x.length; i++) {
      const push = dMid.reduce((s, d, j) => s + d * net.w1[i][j], 0);
      dSpots[i < SIDE ? a : b][i % SIDE] += push;
    }
  }

  const move = (m: number[][], d: number[][]) => m.map((r, i) => r.map((v, j) => v - rate * d[i][j]));
  return {
    spots: move(net.spots, dSpots),
    w1: move(net.w1, dW1),
    b1: net.b1.map((v, j) => v - rate * dB1[j]),
    w2: move(net.w2, dW2),
    b2: net.b2.map((v, k) => v - rate * dB2[k]),
    seed: Math.floor(roll() * 2 ** 31),
  };
}

/** Write `length` new letters, starting from the first two of `start`. */
export function writeFrom(net: Net, start: [number, number], length: number, roll: () => number = Math.random): number[] {
  const out = [...start];
  for (let i = 0; i < length; i++) {
    const shares = guessAfter(net, out.at(-2)!, out.at(-1)!);
    const r = roll();
    let edge = 0;
    let pick = shares.length - 1;
    for (let k = 0; k < shares.length; k++) {
      edge += shares[k];
      if (r < edge) {
        pick = k;
        break;
      }
    }
    out.push(pick);
  }
  return out;
}

/** The `n` letters whose spots sit closest to letter `i`. */
export function nearest(net: Net, i: number, n = 3): number[] {
  const [x, y] = net.spots[i];
  return net.spots
    .map(([u, v], j) => ({ j, d: (u - x) ** 2 + (v - y) ** 2 }))
    .filter((s) => s.j !== i)
    .sort((p, q) => p.d - q.d)
    .slice(0, n)
    .map((s) => s.j);
}

// Kids' game: Pip tidies a messy map. Each tidy moves every letter halfway
// to its home among its friends.
export type KidSpot = { c: string; x: number; y: number; hx: number; hy: number };

const KID_HOMES: Record<string, [number, number]> = {
  a: [22, 26], e: [32, 20], i: [26, 36], o: [36, 32], u: [18, 38],
  t: [70, 24], s: [80, 30], n: [72, 36], r: [84, 20],
  m: [26, 74], b: [36, 80], p: [20, 82],
  ".": [76, 76], "!": [84, 82], "?": [72, 84],
};

export function kidMess(seed = 3): KidSpot[] {
  const roll = dice(seed);
  return Object.entries(KID_HOMES).map(([c, [hx, hy]]) => ({ c, x: 8 + roll() * 84, y: 8 + roll() * 84, hx, hy }));
}

export const kidTidy = (spots: KidSpot[]): KidSpot[] => spots.map((s) => ({ ...s, x: (s.x + s.hx) / 2, y: (s.y + s.hy) / 2 }));

/** How messy the map still is: 1 at the start, falling to 0 when every letter is home. */
export function kidMessiness(spots: KidSpot[], start: KidSpot[]): number {
  const far = (list: KidSpot[]) => list.reduce((s, p) => s + Math.hypot(p.x - p.hx, p.y - p.hy), 0);
  const base = far(start);
  return base ? far(spots) / base : 0;
}
