// Self-test for scripts/guard.mjs: proves the word-ladder and no-blue rules
// actually fail, so a broken regex can't let the guard pass everything.
// Runs as part of `npm run lint`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const app = new URL("..", import.meta.url).pathname;
const guard = join(app, "scripts", "guard.mjs");

function run(root) {
  const r = spawnSync(process.execPath, [guard], { env: { ...process.env, GUARD_ROOT: root }, encoding: "utf8" });
  return { code: r.status, out: r.stdout + r.stderr };
}

// A throwaway app folder with the real word ladder plus the given files.
function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), "guard-"));
  mkdirSync(join(root, "src", "content"), { recursive: true });
  copyFileSync(join(app, "src", "content", "ladder.ts"), join(root, "src", "content", "ladder.ts"));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), body);
  }
  return root;
}

function check(files, expectCode, expectText) {
  const root = fixture(files);
  try {
    const { code, out } = run(root);
    assert.equal(code, expectCode, out);
    if (expectText) assert.match(out, expectText);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("the real app passes", () => {
  const { code, out } = run(app);
  assert.equal(code, 0, out);
});

test("plain words on a shared page pass", () => {
  check({ "src/app/page.tsx": `export const t = "Turn letters into numbers and back";` }, 0);
});

test("a later stage's term in an earlier stage fails", () => {
  check({ "src/components/stage1/x.tsx": `export const t = "now add attention";` }, 1, /"attention" is a stage 5 word, but this file is stage 1/);
});

test("a term on a shared (stage 0) page fails", () => {
  check({ "src/app/page.tsx": `export const t = "Meet the tokenizer";` }, 1, /stage 1 word, but this file is stage 0/);
});

test("multi-word terms and plurals are caught", () => {
  check({ "src/app/learn/2/page.tsx": `export const t = "gradient   descent and embeddings";` }, 1, /stage 3 word[\s\S]*stage 4 word/);
});

test("a term in its own stage passes", () => {
  check({ "src/app/learn/5/page.tsx": `export const t = "you just built attention";` }, 0);
});

test("comments and imports are ignored", () => {
  check({ "src/app/page.tsx": `// the tokenizer arrives in stage 1\nexport const t = 1;` }, 0);
});

test("blue colours fail", () => {
  check({ "src/app/page.tsx": `export const c = "#1020ff";` }, 1, /is blue/);
  check({ "src/app/page.tsx": `export const c = "bg-sky-500";` }, 1, /blue palette class/);
  check({ "src/app/page.tsx": `export const c = "rgb(10, 20, 200)";` }, 1, /is blue/);
});

test("an unreadable ladder fails loudly", () => {
  const root = fixture({});
  try {
    writeFileSync(join(root, "src", "content", "ladder.ts"), "export const STAGES = [];");
    const { code, out } = run(root);
    assert.equal(code, 1, out);
    assert.match(out, /could not read the word ladder/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
