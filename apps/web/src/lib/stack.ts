// Stand-in for the learner's own full stack (Stage 6).
// The real one is written by hand in Rust (crates/, compiled to wasm). Until
// then the lesson animates with this copy.
//
// This is a tiny GPT: a decoder-only transformer. Every letter in a window of
// up to WINDOW letters gets a spot (token embedding) plus a spot for its place
// (position embedding). Then 1 to MAX_BLOCKS blocks run in a row. Each block
// is a listening layer with HEADS heads (causal multi-head self-attention,
// with an output projection), then a thinking layer (a tanh MLP), and each
// layer's output is added back onto its input (residual connections). The
// last spot goes through the guess dials (the unembedding) to softmax shares.
// No layer norm, to keep the sums readable; the small starting dials on the
// way out of each layer keep a stack of three steady without it.
//
// It learns with plain gradient descent on handfuls (mini-batches) of
// windows; the backward pass is worked out by hand below. Writing divides the
// scores by a boldness setting before the shares (sampling temperature).

import { dice } from "@/lib/map";

export const WINDOW = 16; // how far back a letter can look
export const SIDE = 16; // numbers per spot (model width)
export const HEADS = 2; // listeners per block
export const KEY = SIDE / HEADS; // numbers per question, label and message, per listener
export const THINK = 32; // dials in the middle of each thinking layer
export const MAX_BLOCKS = 3;

type M = number[][];

export type Block = {
  ask: M; // [SIDE][SIDE], every listener's question side by side
  tag: M; // [SIDE][SIDE]
  say: M; // [SIDE][SIDE]
  mix: M; // [SIDE][SIDE], blends the listeners' messages back into one spot
  w1: M; // [SIDE][THINK]
  b1: number[];
  w2: M; // [THINK][SIDE]
  b2: number[];
};

export type Bot = {
  spots: M; // [letter][SIDE]
  places: M; // [WINDOW][SIDE]
  blocks: Block[];
  out: M; // [SIDE][letters]
  bias: number[];
  seed: number;
};

const grid = (rows: number, cols: number, roll: () => number, size: number): M =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => (roll() * 2 - 1) * size));
const zeros = (m: M): M => m.map((r) => r.map(() => 0));
const dot = (a: number[], b: number[]) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
};
/** Each row of x times m. */
function times(x: M, m: M): M {
  const cols = m[0].length;
  return x.map((r) => {
    const o = new Array<number>(cols).fill(0);
    for (let i = 0; i < r.length; i++) {
      const ri = r[i];
      if (ri === 0) continue;
      const mi = m[i];
      for (let j = 0; j < cols; j++) o[j] += ri * mi[j];
    }
    return o;
  });
}
/** Each row of d times m turned on its side: carries a push back through m. */
const back = (d: M, m: M): M => d.map((r) => m.map((mi) => dot(mi, r)));
/** g += x turned on its side, times d: every dial's push from every row. */
function gather(g: M, x: M, d: M) {
  for (let t = 0; t < x.length; t++) {
    const xt = x[t];
    const dt = d[t];
    for (let i = 0; i < xt.length; i++) {
      const xi = xt[i];
      if (xi === 0) continue;
      const gi = g[i];
      for (let j = 0; j < dt.length; j++) gi[j] += xi * dt[j];
    }
  }
}
const plus = (a: M, b: M): M => a.map((r, t) => r.map((v, i) => v + b[t][i]));

function sharesFrom(v: number[]): number[] {
  let top = -Infinity;
  for (const x of v) if (x > top) top = x;
  const ex = v.map((x) => Math.exp(x - top));
  const sum = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / sum);
}

function freshBlock(roll: () => number): Block {
  return {
    ask: grid(SIDE, SIDE, roll, 0.4),
    tag: grid(SIDE, SIDE, roll, 0.4),
    say: grid(SIDE, SIDE, roll, 0.4),
    mix: grid(SIDE, SIDE, roll, 0.1),
    w1: grid(SIDE, THINK, roll, 0.4),
    b1: new Array<number>(THINK).fill(0),
    w2: grid(THINK, SIDE, roll, 0.1),
    b2: new Array<number>(SIDE).fill(0),
  };
}

export function freshBot(letters: number, blocks: number, seed = 6): Bot {
  const roll = dice(seed);
  return {
    spots: grid(letters, SIDE, roll, 0.5),
    places: grid(WINDOW, SIDE, roll, 0.5),
    blocks: Array.from({ length: blocks }, () => freshBlock(roll)),
    out: grid(SIDE, letters, roll, 0.2),
    bias: new Array<number>(letters).fill(0),
    seed: seed * 7919 + 3,
  };
}

/** How many numbers the model holds, and how they split. */
export function partsOf(letters: number, blocks: number) {
  const spots = letters * SIDE + WINDOW * SIDE;
  const listen = 4 * SIDE * SIDE;
  const think = SIDE * THINK + THINK + THINK * SIDE + SIDE;
  const guess = SIDE * letters + letters;
  return { spots, listen: blocks * listen, think: blocks * think, guess, total: spots + blocks * (listen + think) + guess };
}

type Seen = { x: M; q: M; k: M; v: M; a: M[]; z: M; x1: M; h: M };

/** Run a window of letter ids forward through every block. */
function forward(bot: Bot, ids: number[]) {
  let x = ids.map((c, t) => bot.spots[c].map((v, i) => v + bot.places[t][i]));
  const seen: Seen[] = [];
  const root = Math.sqrt(KEY);
  for (const b of bot.blocks) {
    const q = times(x, b.ask);
    const k = times(x, b.tag);
    const v = times(x, b.say);
    const a: M[] = [];
    const z = x.map(() => new Array<number>(SIDE).fill(0));
    for (let h = 0; h < HEADS; h++) {
      const lo = h * KEY;
      const ah = q.map((qt, t) => {
        const s: number[] = [];
        for (let i = 0; i <= t; i++) {
          let d = 0;
          for (let j = lo; j < lo + KEY; j++) d += qt[j] * k[i][j];
          s.push(d / root);
        }
        return sharesFrom(s);
      });
      ah.forEach((row, t) => row.forEach((w, i) => { for (let j = lo; j < lo + KEY; j++) z[t][j] += w * v[i][j]; }));
      a.push(ah);
    }
    const x1 = plus(x, times(z, b.mix));
    const h = times(x1, b.w1).map((r) => r.map((s, j) => Math.tanh(s + b.b1[j])));
    const x2 = plus(x1, times(h, b.w2).map((r) => r.map((s, j) => s + b.b2[j])));
    seen.push({ x, q, k, v, a, z, x1, h });
    x = x2;
  }
  const scores = times(x, bot.out).map((r) => r.map((s, c) => s + bot.bias[c]));
  return { seen, last: x, scores, p: scores.map(sharesFrom) };
}

/** What the last letter of `ids` guesses next (shares adding to 1), and whom each listener in each block listens to. */
export function look(bot: Bot, ids: number[], bold = 1): { guess: number[]; ears: number[][][] } {
  const f = forward(bot, ids.slice(-WINDOW));
  return { guess: sharesFrom(f.scores.at(-1)!.map((s) => s / bold)), ears: f.seen.map((s) => s.a.map((ah) => ah.at(-1)!)) };
}

export function idsOf(text: string, book: string[]): number[] {
  const id = new Map(book.map((c, i) => [c, i]));
  return [...text].map((c) => id.get(c)!);
}

/** Average wrongness over every letter after the first, read in back-to-back windows of WINDOW letters. */
export function scoreOf(bot: Bot, ids: number[]): number {
  if (ids.length < 2) return 0;
  let sum = 0;
  let n = 0;
  for (let s = 0; s < ids.length - 1; s += WINDOW) {
    const win = ids.slice(s, Math.min(s + WINDOW, ids.length - 1));
    const { p } = forward(bot, win);
    p.forEach((pt, t) => {
      sum -= Math.log(Math.max(pt[ids[s + t + 1]], 1e-12));
      n++;
    });
  }
  return sum / n;
}

type Push = Omit<Bot, "seed">;

/** One nudge from a random handful of `size` windows. If all the pushes together are longer than `cap`, they are shrunk to that length first. */
export function trainStep(bot: Bot, ids: number[], size: number, rate: number, cap = 1): Bot {
  if (ids.length < 2) return bot;
  const roll = dice(bot.seed);
  const g: Push = {
    spots: zeros(bot.spots),
    places: zeros(bot.places),
    blocks: bot.blocks.map((b) => ({ ask: zeros(b.ask), tag: zeros(b.tag), say: zeros(b.say), mix: zeros(b.mix), w1: zeros(b.w1), b1: b.b1.map(() => 0), w2: zeros(b.w2), b2: b.b2.map(() => 0) })),
    out: zeros(bot.out),
    bias: bot.bias.map(() => 0),
  };
  const len = Math.min(WINDOW, ids.length - 1);
  const count = size * len;
  const root = Math.sqrt(KEY);

  for (let n = 0; n < size; n++) {
    const s = Math.floor(roll() * (ids.length - len));
    const win = ids.slice(s, s + len);
    const next = ids.slice(s + 1, s + len + 1);
    const { seen, last, p } = forward(bot, win);

    // The guess dials.
    const dl = p.map((pt, t) => pt.map((pc, c) => (pc - (c === next[t] ? 1 : 0)) / count));
    dl.forEach((d) => d.forEach((dc, c) => (g.bias[c] += dc)));
    gather(g.out, last, dl);
    let dx = back(dl, bot.out);

    // Back through each block, last one first.
    for (let bi = bot.blocks.length - 1; bi >= 0; bi--) {
      const b = bot.blocks[bi];
      const gb = g.blocks[bi];
      const { x, q, k, v, a, z, x1, h } = seen[bi];

      // Thinking layer: its input was added onto its output, so the push passes straight through as well.
      dx.forEach((d) => d.forEach((dj, j) => (gb.b2[j] += dj)));
      gather(gb.w2, h, dx);
      const dpre = back(dx, b.w2).map((r, t) => r.map((d, j) => d * (1 - h[t][j] * h[t][j])));
      dpre.forEach((d) => d.forEach((dj, j) => (gb.b1[j] += dj)));
      gather(gb.w1, x1, dpre);
      const dx1 = plus(dx, back(dpre, b.w1));

      // Listening layer: the same pass-through, then each listener's blend, then the scores behind its shares.
      gather(gb.mix, z, dx1);
      const dz = back(dx1, b.mix);
      const dq = q.map((r) => r.map(() => 0));
      const dk = k.map((r) => r.map(() => 0));
      const dv = v.map((r) => r.map(() => 0));
      for (let hh = 0; hh < HEADS; hh++) {
        const lo = hh * KEY;
        a[hh].forEach((row, t) => {
          const da = row.map((_, i) => {
            let d = 0;
            for (let j = lo; j < lo + KEY; j++) d += dz[t][j] * v[i][j];
            return d;
          });
          let mean = 0;
          row.forEach((w, i) => {
            mean += w * da[i];
            for (let j = lo; j < lo + KEY; j++) dv[i][j] += w * dz[t][j];
          });
          row.forEach((w, i) => {
            const ds = (w * (da[i] - mean)) / root;
            for (let j = lo; j < lo + KEY; j++) {
              dq[t][j] += ds * k[i][j];
              dk[i][j] += ds * q[t][j];
            }
          });
        });
      }
      gather(gb.ask, x, dq);
      gather(gb.tag, x, dk);
      gather(gb.say, x, dv);
      dx = plus(plus(dx1, back(dq, b.ask)), plus(back(dk, b.tag), back(dv, b.say)));
    }

    dx.forEach((d, t) =>
      d.forEach((di, i) => {
        g.spots[win[t]][i] += di;
        g.places[t][i] += di;
      }),
    );
  }

  // A stack of blocks can give a sudden huge push that throws every dial off
  // (an exploding gradient); capping the push's length keeps each step sane
  // (gradient clipping by global norm).
  const all: M[] = [g.spots, g.places, g.out, [g.bias], ...g.blocks.flatMap((b) => [b.ask, b.tag, b.say, b.mix, b.w1, [b.b1], b.w2, [b.b2]])];
  const length = Math.sqrt(all.reduce((acc, m) => acc + m.reduce((a, r) => a + dot(r, r), 0), 0));
  const r = rate * Math.min(1, cap / (length || 1));
  const move = (m: M, d: M) => m.map((row, i) => row.map((val, j) => val - r * d[i][j]));
  const step = (m: number[], d: number[]) => m.map((val, j) => val - r * d[j]);
  return {
    spots: move(bot.spots, g.spots),
    places: move(bot.places, g.places),
    blocks: bot.blocks.map((b, i) => {
      const d = g.blocks[i];
      return { ask: move(b.ask, d.ask), tag: move(b.tag, d.tag), say: move(b.say, d.say), mix: move(b.mix, d.mix), w1: move(b.w1, d.w1), b1: step(b.b1, d.b1), w2: move(b.w2, d.w2), b2: step(b.b2, d.b2) };
    }),
    out: move(bot.out, g.out),
    bias: step(bot.bias, g.bias),
    seed: Math.floor(roll() * 2 ** 31),
  };
}

/** Write `length` new letters after `start`, with scores divided by `bold` before the shares. */
export function writeFrom(bot: Bot, start: number[], length: number, bold: number, roll: () => number = Math.random): number[] {
  const out = [...start];
  for (let i = 0; i < length; i++) {
    const { guess } = look(bot, out, bold);
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

// Kids' game: each brain layer Pip adds makes the robot talk a little better,
// and the silly dial sets how daring its next word is.
export const ROBOT_SAYS = ["blorp zzk qa… vvv?", "pip sa a cot. pip pip.", "Pip saw a cat. Pip saw a dag.", "Pip saw a cat and a dog in the sun!"];
export const DIAL = [
  { id: "calm", label: "Calm", says: "Pip saw a cat. Pip saw a cat. Pip saw a cat." },
  { id: "right", label: "Just right", says: "Pip saw a cat and a dog in the sun!" },
  { id: "silly", label: "Silly", says: "Pip saw a dog in a hat ride the moon!" },
] as const;
