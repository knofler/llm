# llm

Build a tiny GPT from scratch in Rust, one idea at a time, and publish each finished stage as an animated lesson in two tracks (adults and kids).

Status: Stage 0 (foundations). The full README arrives with the Rust scaffold.

## Run locally (Docker only)

```sh
docker compose up -d            # web shell on http://localhost:3320
docker compose run --rm rust cargo test
```

## Layout

- `apps/web`: Next.js + Tailwind v4 + shadcn/ui site (both track shells)
- `crates/`: the Rust engine, compiled to WASM for the browser (Stage 0 scaffold pending)
- `.github/workflows/ci.yml`: CI on the self-hosted runner, on PRs and manual runs only

Work lands on `test`; `main` is protected and is the production branch.
