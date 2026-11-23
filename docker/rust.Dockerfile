# Rust + wasm build service for llm (crates/ → WASM for apps/web).
# Local development only; CI uses scripts/ci-rust.sh on the self-hosted runner.
FROM rust:1.91-slim-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl pkg-config \
    && rm -rf /var/lib/apt/lists/*

RUN rustup target add wasm32-unknown-unknown \
    && cargo install wasm-pack --locked --version 0.13.1 \
    && rm -rf /usr/local/cargo/registry

WORKDIR /app
