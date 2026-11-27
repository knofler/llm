// Stand-in for the learner's own take-home file (Stage 7).
// The real one is written by hand in Rust (crates/, compiled to wasm). Until
// then the lesson animates with this copy.
//
// The file is laid out like a safetensors file: 8 bytes giving the header's
// length (little-endian), then a JSON header naming every table with its
// number type, shape and where its bytes start and end, then the raw numbers
// back to back. The header's "__metadata__" also carries the letter book and
// the block count, so the file alone is enough to run the model again
// (inference). GGUF files do that too, and usually store each number in fewer
// bits (quantization); the 8- and 4-bit options imitate that. Each table keeps
// one scale, and every number is rounded to the nearest of 127 (or 7) steps
// either side of zero.

import { HEADS, SIDE, THINK, WINDOW, type Block, type Bot } from "@/lib/stack";

export const BITS = [32, 8, 4] as const;
export type Bits = (typeof BITS)[number];

export type Table = { name: string; shape: number[]; values: number[] };

const KEYS = ["ask", "tag", "say", "mix", "w1", "b1", "w2", "b2"] as const;

/** Every table of numbers in the model, in file order, flattened row by row. */
export function tablesOf(bot: Bot): Table[] {
  const grid = (name: string, m: number[][]): Table => ({ name, shape: [m.length, m[0].length], values: m.flat() });
  const row = (name: string, v: number[]): Table => ({ name, shape: [v.length], values: [...v] });
  return [
    grid("spots", bot.spots),
    grid("places", bot.places),
    ...bot.blocks.flatMap((b, i) => KEYS.map((k) => (k === "b1" || k === "b2" ? row(`block${i + 1}.${k}`, b[k]) : grid(`block${i + 1}.${k}`, b[k])))),
    grid("out", bot.out),
    row("bias", bot.bias),
  ];
}

const STEPS: Record<Exclude<Bits, 32>, number> = { 8: 127, 4: 7 };
const TYPE: Record<Bits, string> = { 32: "F32", 8: "I8", 4: "I4" };

/** Pack the model and its letter book into one file. */
export function pack(bot: Bot, book: string[], bits: Bits): Uint8Array<ArrayBuffer> {
  const header: Record<string, unknown> = {};
  const meta: Record<string, string> = { book: JSON.stringify(book), blocks: String(bot.blocks.length), bits: String(bits) };
  const chunks: Uint8Array[] = [];
  let at = 0;
  for (const t of tablesOf(bot)) {
    let bytes: Uint8Array;
    if (bits === 32) {
      bytes = new Uint8Array(t.values.length * 4);
      const view = new DataView(bytes.buffer);
      t.values.forEach((v, i) => view.setFloat32(i * 4, v, true));
    } else {
      const steps = STEPS[bits];
      const top = t.values.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
      const scale = top / steps || 1;
      meta[`scale.${t.name}`] = String(scale);
      const q = t.values.map((v) => Math.max(-steps, Math.min(steps, Math.round(v / scale))));
      if (bits === 8) bytes = Uint8Array.from(q, (n) => n & 0xff);
      else {
        bytes = new Uint8Array(Math.ceil(q.length / 2));
        q.forEach((n, i) => (bytes[i >> 1] |= (n + 8) << ((i & 1) * 4)));
      }
    }
    header[t.name] = { dtype: TYPE[bits], shape: t.shape, data_offsets: [at, at + bytes.length] };
    chunks.push(bytes);
    at += bytes.length;
  }
  header.__metadata__ = meta;

  let head = new TextEncoder().encode(JSON.stringify(header));
  const padded = Math.ceil(head.length / 8) * 8;
  if (padded > head.length) {
    const p = new Uint8Array(padded).fill(0x20);
    p.set(head);
    head = p;
  }
  const file = new Uint8Array(8 + head.length + at);
  const view = new DataView(file.buffer);
  view.setUint32(0, head.length, true);
  view.setUint32(4, 0, true);
  file.set(head, 8);
  let o = 8 + head.length;
  for (const c of chunks) {
    file.set(c, o);
    o += c.length;
  }
  return file;
}

type Entry = { dtype: string; shape: number[]; data_offsets: [number, number] };

/** Read a file made by `pack` back into a model you can run. Throws if the bytes aren't one. */
export function unpack(file: Uint8Array): { bot: Bot; book: string[]; bits: Bits; header: string } {
  const bad = () => new Error("not a take-home file");
  if (file.length < 8) throw bad();
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
  const len = view.getUint32(0, true);
  if (view.getUint32(4, true) !== 0 || 8 + len > file.length) throw bad();
  const text = new TextDecoder().decode(file.subarray(8, 8 + len));
  let header: Record<string, Entry> & { __metadata__?: Record<string, string> };
  try {
    header = JSON.parse(text);
  } catch {
    throw bad();
  }
  const meta = header.__metadata__;
  if (!meta) throw bad();
  const book = JSON.parse(meta.book ?? "[]") as string[];
  const blocks = Number(meta.blocks);
  const bits = Number(meta.bits) as Bits;
  if (!book.length || !(blocks >= 1) || !BITS.includes(bits)) throw bad();
  const base = 8 + len;

  const read = (name: string, shape: number[]): number[] => {
    const e = header[name];
    const count = shape.reduce((a, b) => a * b, 1);
    if (!e || e.shape.join() !== shape.join()) throw bad();
    const [from, to] = e.data_offsets;
    if (base + to > file.length) throw bad();
    const at = base + from;
    if (bits === 32) return Array.from({ length: count }, (_, i) => view.getFloat32(at + i * 4, true));
    const scale = Number(meta[`scale.${name}`]);
    if (bits === 8) return Array.from({ length: count }, (_, i) => view.getInt8(at + i) * scale);
    return Array.from({ length: count }, (_, i) => (((file[at + (i >> 1)] >> ((i & 1) * 4)) & 15) - 8) * scale);
  };
  const grid = (name: string, rows: number, cols: number) => {
    const v = read(name, [rows, cols]);
    return Array.from({ length: rows }, (_, r) => v.slice(r * cols, (r + 1) * cols));
  };

  const letters = book.length;
  const bot: Bot = {
    spots: grid("spots", letters, SIDE),
    places: grid("places", WINDOW, SIDE),
    blocks: Array.from({ length: blocks }, (_, i): Block => {
      const n = `block${i + 1}`;
      return {
        ask: grid(`${n}.ask`, SIDE, SIDE),
        tag: grid(`${n}.tag`, SIDE, SIDE),
        say: grid(`${n}.say`, SIDE, SIDE),
        mix: grid(`${n}.mix`, SIDE, SIDE),
        w1: grid(`${n}.w1`, SIDE, THINK),
        b1: read(`${n}.b1`, [THINK]),
        w2: grid(`${n}.w2`, THINK, SIDE),
        b2: read(`${n}.b2`, [SIDE]),
      };
    }),
    out: grid("out", SIDE, letters),
    bias: read("bias", [letters]),
    seed: 7 * HEADS + blocks,
  };
  return { bot, book, bits, header: text.trimEnd() };
}
