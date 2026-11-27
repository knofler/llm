# llm

Build a tiny language model from scratch in Rust, one idea at a time, and turn each finished stage into an animated public lesson at **[llm.bluegreyboxes.com](https://llm.bluegreyboxes.com/)**.

The goal is to make AI stop being a black box. The model is a character-level tiny GPT (about 1M parameters). It is small enough to train in a browser tab, and every part of it is something you can watch work.

## Two tracks, one engine

Each lesson comes in two tracks that share one engine and one lesson script:

- **Adults:** a professional look, with the model drawn as a diagram of boxes that gains one box per stage. A code and maths drawer is available but closed by default.
- **Kids:** an open storybook with Pip the robot as a guide, plus flip cards, a puzzle and a sticker for each chapter. There is no code.

The engine is compiled to WebAssembly, so visitors train and chat with their own model in the browser, with no server and no account.

## The engine is hand-written

**Everything in `crates/engine` is written by hand by the project owner, to learn it.** Tools and agents may scaffold around it (crates, build, CI, Docker, the website), but they never implement engine logic.

Each stage starts as a `todo!()` stub plus one failing test. The stage is done when that test passes, written by hand. Failing stage tests are marked `#[ignore]` so CI stays green in the meantime; see what's still open with:

```sh
docker compose run --rm rust cargo test -- --ignored
```

## Names come last

Every idea is built first and named afterwards: do it by hand, build it, watch it work, rebuild it from a blank page, and only then unlock its real name (for example, "you just built what engineers call a *tokenizer*"). The name then goes into the learner's word book.

| Stage | Plain name | Name unlocked |
|---|---|---|
| 1 | Letter-to-number book | tokenizer · token · vocabulary |
| 2 | "What comes next" tally + dice roll | bigram · probability · sampling |
| 3 | Wrongness score + nudging | loss · gradient · gradient descent · backprop |
| 4 | Letter map | embedding · MLP · batch |
| 5 | Who listens to whom | attention · head · transformer block |
| 6 | Stack it, practise, let it write | GPT · training · parameters · temperature |
| 7 | Pack it into a file | weights · safetensors · GGUF · inference |

A lint check (`apps/web/scripts/guard.mjs`) fails the build if a term appears on the site before its stage.

## Run locally (Docker only)

Everything runs in Docker; nothing needs to be installed on the host.

```sh
docker compose up -d                                                  # website on http://localhost:3320
docker compose run --rm rust cargo test                               # engine tests
docker compose run --rm rust wasm-pack build crates/engine --target web   # engine → WebAssembly
docker compose --profile e2e run --rm e2e                             # browser smoke tests, both tracks
docker compose --profile build run --rm build                         # production build check
```

Run `next build` only through the `build` service. It keeps its own `.next` volume, so it can't overwrite the dev server's output and break hydration for the e2e tests.

## Layout

```
apps/web/            Next.js + Tailwind v4 + shadcn/ui site (both tracks)
  src/app/learn/N/   the lesson for stage N
  src/app/words/     the word book
  src/content/       the word ladder (which term unlocks at which stage)
  scripts/guard.mjs  lint: names come last, and the colour rules
  e2e/               Playwright smoke tests
crates/engine/       the hand-written Rust engine (→ WASM)
  src/               one module per stage, stubs until written
  tests/             one stage-target test per stage
docker/              Rust + wasm-pack build image
scripts/             CI helpers (Rust toolchain + Zig linker on the CI runner)
.github/workflows/   CI on a self-hosted runner, pull requests only
```

## Branches

Work lands on `test` through pull requests. `main` is protected and is production: merging into it deploys the site.
