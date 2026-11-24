#!/usr/bin/env node
// Two house rules, checked on every `npm run lint` (and so in CI):
//
//  1. Names come last. A real term (tokenizer, attention, …) may appear only in
//     files for its own stage or later. Stage files live in a `stageN/` folder
//     or under `app/learn/N/`; every other file counts as stage 0, so shared
//     pages never leak a name early. The ladder is read from src/content/ladder.ts.
//
//  2. No blue. Every colour literal must have red >= blue, and the cool
//     Tailwind palettes (blue, sky, indigo, …) are not used at all.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

// GUARD_ROOT: point the guard at another app folder (scripts/guard.test.mjs uses it).
const root = process.env.GUARD_ROOT ? resolve(process.env.GUARD_ROOT) : new URL("..", import.meta.url).pathname;
const src = join(root, "src");
const ladderFile = join(src, "content", "ladder.ts");
const ladder = readFileSync(ladderFile, "utf8");

// { n: 1, ..., terms: ["a", "b"] }
const stages = [...ladder.matchAll(/\{\s*n:\s*(\d+)[^}]*?terms:\s*\[([^\]]*)\]/g)].map((m) => ({
  n: Number(m[1]),
  terms: [...m[2].matchAll(/"([^"]+)"/g)].map((t) => t[1]),
}));
const common = new Set([...(ladder.match(/COMMON_WORDS\s*=\s*\[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((t) => t[1].toLowerCase()));
if (stages.length < 7) fail([`guard: could not read the word ladder from ${relative(root, ladderFile)}`]);

const skip = new Set([ladderFile, join(src, "lib", "utils.ts")]);
const files = walk(src).filter((f) => /\.(tsx?|css|mjs)$/.test(f) && !skip.has(f) && !f.includes(`${sep}components${sep}ui${sep}`));

const problems = [];
const COOL = /\b(?:bg|text|border|ring|from|via|to|fill|stroke|shadow|outline|decoration|accent|caret)-(?:blue|sky|indigo|cyan|violet|purple|teal|slate)-\d/;

for (const file of files) {
  const rel = relative(root, file);
  const raw = readFileSync(file, "utf8");
  const stage = stageOf(rel);
  const text = raw
    .replace(/[a-z]+-gradient\(/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/^\s*import .*$/gm, " ");

  // CSS carries no learner-facing words (and says "gradient" for its own reasons).
  for (const s of rel.endsWith(".css") ? [] : stages) {
    if (s.n <= stage) continue;
    for (const term of s.terms) {
      if (common.has(term.toLowerCase())) continue;
      const re = new RegExp(`\\b${term.replace(/ /g, "\\s+")}s?\\b`, "i");
      const hit = text.match(re);
      if (hit) problems.push(`${rel}: "${hit[0]}" is a stage ${s.n} word, but this file is stage ${stage}`);
    }
  }

  for (const m of raw.matchAll(/#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1].slice(0, 6);
    const [r, , b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    if (b > r) problems.push(`${rel}: ${m[0]} is blue (red ${r} < blue ${b})`);
  }
  for (const m of raw.matchAll(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/g)) {
    if (Number(m[3]) > Number(m[1])) problems.push(`${rel}: ${m[0]}) is blue`);
  }
  if (/\b(oklch|hsla?)\(/.test(raw)) problems.push(`${rel}: use hex colours (oklch/hsl can't be checked for blue)`);
  const cool = raw.match(COOL);
  if (cool) problems.push(`${rel}: ${cool[0]}… is a blue palette class`);
}

if (problems.length) fail(problems);
console.log(`guard: ${files.length} files clean (word ladder + no blue)`);

function stageOf(rel) {
  const m = rel.match(/(?:^|\/)stage(\d+)\//) || rel.match(/app\/learn\/(\d+)\//);
  return m ? Number(m[1]) : 0;
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

function fail(lines) {
  console.error(["guard failed:", ...lines.map((l) => `  ${l}`)].join("\n"));
  process.exit(1);
}
