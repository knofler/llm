#!/usr/bin/env bash
# zig.sh — fetch the pinned Zig toolchain into .tools/zig (no root, no system
# install) and print its path. Zig is the only C toolchain llm needs: it is the
# linker for Rust on the self-hosted CI runner, which has no cc and no root.
#
# Usage: scripts/zig.sh            → prints the zig binary path (fetches once)
set -euo pipefail

ZIG_VERSION="0.13.0"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/.tools/zig-$ZIG_VERSION"

case "$(uname -s)-$(uname -m)" in
  Linux-x86_64)         ARCH=x86_64;  SHA=d45312e61ebcc48032b77bc4cf7fd6915c11fa16e4aad116b66c9468211230ea ;;
  Linux-aarch64|Linux-arm64) ARCH=aarch64; SHA=041ac42323837eb5624068acd8b00cd5777dac4cf91179e8dad7a7e90dd0c556 ;;
  *) echo "zig.sh: builds run on Linux (Docker or the CI runner), not $(uname -s)-$(uname -m)." >&2; exit 2 ;;
esac

if [ ! -x "$DIR/zig" ]; then
  mkdir -p "$ROOT/.tools"
  tmp="$(mktemp "$ROOT/.tools/zig.XXXXXX")"
  trap 'rm -f "$tmp"' EXIT
  curl -fsSL -o "$tmp" "https://ziglang.org/download/$ZIG_VERSION/zig-linux-$ARCH-$ZIG_VERSION.tar.xz"
  got="$(sha256sum "$tmp" | cut -d' ' -f1)"
  if [ "$got" != "$SHA" ]; then
    echo "zig.sh: checksum mismatch for zig $ZIG_VERSION ($ARCH): got $got, want $SHA" >&2
    exit 1
  fi
  mkdir -p "$DIR"
  tar -xJf "$tmp" -C "$DIR" --strip-components=1
fi
printf '%s\n' "$DIR/zig"
