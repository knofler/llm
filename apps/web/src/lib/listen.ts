// Stand-in for the learner's own listening layer (Stage 5).
// The real one is written by hand in Rust (crates/, compiled to wasm). Until
// then the lesson animates with this copy.
//
// Each letter in a window of up to WINDOW letters gets a spot (its
// embedding) plus a spot for where it sits in the window. From that, every
// letter makes three short lists of numbers: a question (query), a label
// (key) and a message (value). A letter scores every letter before it, and
// itself, by how well its question matches their label (a dot product),
// turns the scores into shares with softmax, and blends their messages by
// those shares. That is one head of causal self-attention. The guess for the
// next letter comes from the letter's own spot plus the blended message.
// It learns with the Stage 3 nudge on Stage 4 handfuls (mini-batches).

import { dice } from "@/lib/map";

export const WINDOW = 12; // how far back a letter can look
export const SIDE = 8; // numbers per spot
export const KEY = 8; // numbers per question, label and message

type M = number[][];

export type Ear = {
  spots: M; // [letter][SIDE]
  places: M; // [WINDOW][SIDE]
  ask: M; // [SIDE][KEY]
  tag: M; // [SIDE][KEY]
  say: M; // [SIDE][KEY]
  out: M; // [SIDE + KEY][letters]
  bias: number[];
  seed: number;
};

const grid = (rows: number, cols: number, roll: () => number, size: number): M =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => (roll() * 2 - 1) * size));
const zeros = (m: M): M => m.map((r) => r.map(() => 0));
const times = (x: number[], m: M): number[] => m[0].map((_, j) => x.reduce((s, xi, i) => s + xi * m[i][j], 0));
const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);

function sharesFrom(v: number[]): number[] {
  const top = Math.max(...v);
  const ex = v.map((x) => Math.exp(x - top));
  const sum = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / sum);
}

export function freshEar(letters: number, seed = 5): Ear {
  const roll = dice(seed);
  return {
    spots: grid(letters, SIDE, roll, 1),
    places: grid(WINDOW, SIDE, roll, 1),
    ask: grid(SIDE, KEY, roll, 0.5),
    tag: grid(SIDE, KEY, roll, 0.5),
    say: grid(SIDE, KEY, roll, 0.5),
    out: grid(SIDE + KEY, letters, roll, 0.3),
    bias: new Array<number>(letters).fill(0),
    seed: seed * 7919 + 3,
  };
}

/** How many numbers the model holds. */
export const sizeOf = (letters: number): number => letters * SIDE + WINDOW * SIDE + 3 * SIDE * KEY + (SIDE + KEY) * letters + letters;

/** Run a window of letter ids forward. */
function forward(ear: Ear, ids: number[]) {
  const x = ids.map((c, t) => ear.spots[c].map((v, i) => v + ear.places[t][i]));
  const q = x.map((r) => times(r, ear.ask));
  const k = x.map((r) => times(r, ear.tag));
  const v = x.map((r) => times(r, ear.say));
  const root = Math.sqrt(KEY);
  const a = q.map((qt, t) => sharesFrom(k.slice(0, t + 1).map((ki) => dot(qt, ki) / root)));
  const z = a.map((row) => Array.from({ length: KEY }, (_, h) => row.reduce((s, w, i) => s + w * v[i][h], 0)));
  const u = x.map((r, t) => [...r, ...z[t]]);
  const p = u.map((r) => sharesFrom(times(r, ear.out).map((s, c) => s + ear.bias[c])));
  return { x, q, k, v, a, z, u, p };
}

/** Who the last letter of `ids` listens to (one share per letter, adding to 1), and its guess for what comes next. */
export function listen(ear: Ear, ids: number[]): { shares: number[]; guess: number[] } {
  const f = forward(ear, ids.slice(-WINDOW));
  return { shares: f.a.at(-1)!, guess: f.p.at(-1)! };
}

export function idsOf(text: string, book: string[]): number[] {
  const id = new Map(book.map((c, i) => [c, i]));
  return [...text].map((c) => id.get(c)!);
}

/** Average wrongness over every letter after the first, each read with up to WINDOW letters before it. */
export function scoreOf(ear: Ear, ids: number[]): number {
  if (ids.length < 2) return 0;
  let sum = 0;
  let n = 0;
  for (let j = 1; j < ids.length; j++) {
    const ctx = ids.slice(Math.max(0, j - WINDOW), j);
    sum -= Math.log(Math.max(forward(ear, ctx).p.at(-1)![ids[j]], 1e-12));
    n++;
  }
  return sum / n;
}

/** One nudge from a random handful of `size` windows. */
export function trainStep(ear: Ear, ids: number[], size: number, rate: number): Ear {
  if (ids.length < 2) return ear;
  const roll = dice(ear.seed);
  const g = {
    spots: zeros(ear.spots),
    places: zeros(ear.places),
    ask: zeros(ear.ask),
    tag: zeros(ear.tag),
    say: zeros(ear.say),
    out: zeros(ear.out),
    bias: ear.bias.map(() => 0),
  };
  const len = Math.min(WINDOW, ids.length - 1);
  const count = size * len;
  const root = Math.sqrt(KEY);

  for (let n = 0; n < size; n++) {
    const s = Math.floor(roll() * (ids.length - len));
    const win = ids.slice(s, s + len);
    const next = ids.slice(s + 1, s + len + 1);
    const { x, q, k, v, a, u, p } = forward(ear, win);
    const dx = x.map((r) => r.map(() => 0));
    const dq = q.map((r) => r.map(() => 0));
    const dk = k.map((r) => r.map(() => 0));
    const dv = v.map((r) => r.map(() => 0));

    for (let t = 0; t < len; t++) {
      const dl = p[t].map((pc, c) => (pc - (c === next[t] ? 1 : 0)) / count);
      dl.forEach((d, c) => {
        g.bias[c] += d;
        u[t].forEach((ui, i) => (g.out[i][c] += ui * d));
      });
      const du = u[t].map((_, i) => dot(ear.out[i], dl));
      for (let i = 0; i < SIDE; i++) dx[t][i] += du[i];
      const dz = du.slice(SIDE);
      // Back through the blend: each share, then the scores behind the shares.
      const da = a[t].map((_, i) => dot(dz, v[i]));
      a[t].forEach((w, i) => dz.forEach((d, h) => (dv[i][h] += w * d)));
      const mean = a[t].reduce((acc, w, i) => acc + w * da[i], 0);
      a[t].forEach((w, i) => {
        const ds = (w * (da[i] - mean)) / root;
        for (let h = 0; h < KEY; h++) {
          dq[t][h] += ds * k[i][h];
          dk[i][h] += ds * q[t][h];
        }
      });
    }

    for (let t = 0; t < len; t++) {
      for (const [m, d, dm] of [
        [ear.ask, dq[t], g.ask],
        [ear.tag, dk[t], g.tag],
        [ear.say, dv[t], g.say],
      ] as [M, number[], M][]) {
        for (let i = 0; i < SIDE; i++) {
          dx[t][i] += dot(m[i], d);
          d.forEach((dh, h) => (dm[i][h] += x[t][i] * dh));
        }
      }
      dx[t].forEach((d, i) => {
        g.spots[win[t]][i] += d;
        g.places[t][i] += d;
      });
    }
  }

  const move = (m: M, d: M) => m.map((r, i) => r.map((val, j) => val - rate * d[i][j]));
  return {
    spots: move(ear.spots, g.spots),
    places: move(ear.places, g.places),
    ask: move(ear.ask, g.ask),
    tag: move(ear.tag, g.tag),
    say: move(ear.say, g.say),
    out: move(ear.out, g.out),
    bias: ear.bias.map((val, c) => val - rate * g.bias[c]),
    seed: Math.floor(roll() * 2 ** 31),
  };
}

/** Write `length` new letters after `start`. */
export function writeFrom(ear: Ear, start: number[], length: number, roll: () => number = Math.random): number[] {
  const out = [...start];
  for (let i = 0; i < length; i++) {
    const { guess } = listen(ear, out);
    const r = roll();
    let edge = 0;
    let pick = guess.length - 1;
    for (let c = 0; c < guess.length; c++) {
      edge += guess[c];
      if (r < edge) {
        pick = c;
        break;
      }
    }
    out.push(pick);
  }
  return out;
}

// Kids' game: in each sentence one word is lit up, and the child taps the word
// it should listen to most.
export type KidRound = { words: string[]; lit: number; friend: number };

export const KID_ROUNDS: KidRound[] = [
  { words: ["The", "dog", "ate", "fast", "because", "it", "was", "hungry."], lit: 5, friend: 1 },
  { words: ["The", "big", "red", "apple", "fell", "off", "the", "tree."], lit: 2, friend: 3 },
  { words: ["The", "cake", "was", "so", "yummy", "that", "Pip", "ate", "all", "of", "it."], lit: 10, friend: 1 },
];
