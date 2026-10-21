#!/bin/bash
# Workers Builds' build step (Ubuntu 24.04, x86_64): the checks, then the release build of the app
# (unless app/ is unchanged since the build that's cached). The trigger's deploy command uploads
# or deploys what this leaves in app/dist-deploy. Each step prints its time.
set -euo pipefail
cd "$(dirname "$0")/../.."
t0=$(date +%s)
mark() { echo "ci: $1 at $(( $(date +%s) - t0 ))s"; }

# Workers Builds keeps only package managers' caches between builds, and restores them for about a
# minute (at 2 GB and 4 GB it gave up part way), so only what's slow to make and small rides in
# bun's: the tools built from source (naga, trunk) and the last built app. Rust itself installs
# in seconds, and the compiled crates are gigabytes.
cache="$HOME/.bun/install/cache/com-next"
mkdir -p "$cache/bin"
export CARGO_TARGET_DIR="$HOME/target"
export PATH="$cache/bin:$HOME/.cargo/bin:$HOME/.bun/bin:$PATH"
for d in bin app; do [ -d "$cache/$d" ] && du -sh "$cache/$d" | sed 's/^/ci: cached /'; done
mark "start"

(cd worker && bun install --frozen-lockfile)
(cd og && bun install --frozen-lockfile)
(cd worker && bun test && npx tsc --noEmit -p .)
(cd og && npx tsc --noEmit -p .)
mark "worker and og checked"
# (no cargo test: the app's tests build it natively, which links the desktop's X11 and Wayland
# libraries the build image lacks; deploy.sh runs them before a local deploy)

TRUNK=0.21.14
NAGA=30.0.1
# everything the built app depends on: its tree, the step that scopes it, and the tools' versions
key="$(git rev-parse HEAD:app):$(git rev-parse HEAD:worker/scripts/scope-build.ts):trunk-$TRUNK:naga-$NAGA"
if [ -f "$cache/app/key" ] && [ "$(cat "$cache/app/key")" = "$key" ]; then
    rm -rf app/dist-deploy
    cp -R "$cache/app/dist-deploy" app/dist-deploy
    mark "app unchanged: reused its last build"
else
    command -v rustup >/dev/null || curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain stable --target wasm32-unknown-unknown --no-modify-path
    mark "rust $(cd app && rustc --version)"
    trunk --version 2>/dev/null | grep -q "$TRUNK" || curl -sSfL "https://github.com/trunk-rs/trunk/releases/download/v$TRUNK/trunk-x86_64-unknown-linux-gnu.tar.gz" | tar xz -C "$cache/bin"
    naga --version 2>/dev/null | grep -q "$NAGA" || cargo install naga-cli --version "$NAGA" --locked --quiet --root "$cache"
    mark "trunk and naga"
    cd app
    rm -rf dist-deploy
    trunk build --release --dist dist-deploy
    mark "trunk build"
    bun ../worker/scripts/scope-build.ts dist-deploy
    cd ..
    rm -rf "$cache/app" && mkdir -p "$cache/app"
    cp -R app/dist-deploy "$cache/app/dist-deploy"
    echo "$key" > "$cache/app/key"
fi
rm -rf "$cache/cargo" "$cache/rustup" "$cache/.crates.toml" "$cache/.crates2.json"
# bun's own package downloads (wrangler, puppeteer...) come again from the network in seconds, but
# restoring them took most of a minute: the cache keeps only ours
find "$HOME/.bun/install/cache" -mindepth 1 -maxdepth 1 ! -name com-next -exec rm -rf {} +
du -sh "$HOME/.bun/install/cache" | sed 's/^/ci: bun cache now holds /'
du -sh "$cache" | sed 's/^/ci: cache now holds /'
mark "done"
