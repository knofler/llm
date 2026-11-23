#!/usr/bin/env bash
# ci-rust.sh — run the Rust tests on the self-hosted CI runner.
#
# The runner is a non-root Ubuntu container with no C compiler, so this script
# installs a user-local Rust toolchain (rustup, into $HOME) and uses Zig
# (scripts/zig.sh) as the linker. Locally, use the Docker service instead:
#   docker compose run --rm rust cargo test
#
# Runs the native tests, then checks the engine compiles for wasm32 (the browser
# target). wasm-pack itself runs only in Docker locally; wasm32 links with
# rust-lld, so this step needs no C toolchain.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f Cargo.toml ]; then
  echo "ci-rust: no Cargo.toml yet; nothing to test"
  exit 0
fi

RUST_TOOLCHAIN="1.91.0"
export RUSTUP_HOME="${RUSTUP_HOME:-$HOME/.rustup}"
export CARGO_HOME="${CARGO_HOME:-$HOME/.cargo}"
export PATH="$CARGO_HOME/bin:$PATH"

if ! command -v rustup >/dev/null 2>&1; then
  curl -fsSL https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain "$RUST_TOOLCHAIN" --no-modify-path
fi
rustup toolchain install "$RUST_TOOLCHAIN" --profile minimal
rustup default "$RUST_TOOLCHAIN"
rustup target add wasm32-unknown-unknown

# Zig as cc + linker for the native target (build scripts, tests).
ZIG="$("$ROOT/scripts/zig.sh")"
mkdir -p "$ROOT/.tools/bin"
cat > "$ROOT/.tools/bin/zigcc" <<EOF
#!/usr/bin/env bash
exec "$ZIG" cc -target aarch64-linux-gnu "\$@"
EOF
chmod +x "$ROOT/.tools/bin/zigcc"
case "$(uname -m)" in
  aarch64|arm64) export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER="$ROOT/.tools/bin/zigcc" ;;
  *) sed -i "s/aarch64-linux-gnu/$(uname -m)-linux-gnu/" "$ROOT/.tools/bin/zigcc"
     export CARGO_TARGET_X86_64_UNKNOWN_LINUX_GNU_LINKER="$ROOT/.tools/bin/zigcc" ;;
esac
export CC="$ROOT/.tools/bin/zigcc"

cargo test --workspace

# Ignored tests are the stage targets the operator writes by hand; list them so
# the CI log shows what is still open.
cargo test --workspace -- --ignored --list 2>/dev/null | grep ': test$' || true

cargo build -p engine --target wasm32-unknown-unknown --release
