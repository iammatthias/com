#!/bin/bash
# Workers Builds' build step (Ubuntu 24.04, x86_64): the checks, then the release build of the app
# (unless app/ is unchanged since the build that's cached). The trigger's deploy command uploads
# or deploys what this leaves in app/dist-deploy. Each step prints its time.
set -euo pipefail
cd "$(dirname "$0")/../.."
t0=$(date +%s)
mark() { echo "ci: $1 at $(( $(date +%s) - t0 ))s"; }
# only a build of main writes a cache: a branch's would evict main's, which every publish reads
main=0; [ "${WORKERS_CI_BRANCH:-}" = main ] && main=1
token=${CLOUDFLARE_API_TOKEN:+set}
echo "ci: branch ${WORKERS_CI_BRANCH:-unset}, CLOUDFLARE_API_TOKEN ${token:-unset}"

# Workers Builds keeps only package managers' caches between builds, and restores them for about a
# minute (at 2 GB and 4 GB it gave up part way), so only what's slow to make and small rides in
# bun's: the tools (naga and trunk, with the wasm-bindgen and wasm-opt trunk downloads) and the
# last built app. Rust itself installs in seconds. The compiled crates are gigabytes: those wait
# in R2 (com-build-cache), fetched only by a build that compiles the app.
cache="$HOME/.bun/install/cache/com-next"
mkdir -p "$cache/bin" "$cache/trunk" "$HOME/.cache"
ln -sfn "$cache/trunk" "$HOME/.cache/trunk"
export CARGO_TARGET_DIR="$HOME/target"
export PATH="$cache/bin:$HOME/.cargo/bin:$HOME/.bun/bin:$PATH"
for d in bin trunk app; do [ -d "$cache/$d" ] && du -sh "$cache/$d" | sed 's/^/ci: cached /'; done
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
# everything the built app depends on: its tree, the steps that build and scope it, the tools
key="$(git rev-parse HEAD:app):$(git rev-parse HEAD:worker/scripts/scope-build.ts):$(git rev-parse HEAD:worker/scripts/ci-build.sh):trunk-$TRUNK:naga-$NAGA"
if [ -f "$cache/app/key" ] && [ "$(cat "$cache/app/key")" = "$key" ]; then
    rm -rf app/dist-deploy
    cp -R "$cache/app/dist-deploy" app/dist-deploy
    mark "app unchanged: reused its last build"
else
    cd app
    # rust-toolchain.toml names the toolchain; rustup installs it on the first rustc or cargo call
    command -v rustup >/dev/null || curl --proto '=https' --tlsv1.2 -sSf --retry 3 --retry-all-errors https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain none --no-modify-path
    mark "rust $(rustc --version)"

    # the crates and their compiled artifacts, keyed on what decides them; nothing there is fine
    ckey=$(cat Cargo.lock Cargo.toml rust-toolchain.toml | sha256sum | cut -c1-16)
    cargo_cache="com-build-cache/cargo-$ckey"
    r2() { (cd ../worker && npx wrangler r2 object "$@" --remote); }
    parts=$(mktemp -d)
    # the parts, then a count that's only written once they all are
    restore() {
        r2 get "$cargo_cache.parts" --file "$parts/n" || return 1
        n=$(cat "$parts/n")
        for i in $(seq 0 $((n - 1))); do r2 get "$cargo_cache.tar.zst.$i" --file "$parts/$i" || return 1; done
        for i in $(seq 0 $((n - 1))); do cat "$parts/$i"; done | tar -I zstd -xf - -C "$HOME"
    }
    upload() {
        tar -C "$HOME" -cf - .cargo/registry .cargo/git target/release target/wasm32-unknown-unknown/release | zstd -T0 | split -d -b 250m - "$parts/part."
        n=$(ls "$parts" | wc -l)
        for i in $(seq 0 $((n - 1))); do r2 put "$cargo_cache.tar.zst.$i" --file "$parts/part.$(printf %02d "$i")" || return 1; done
        echo "$n" > "$parts/n" && r2 put "$cargo_cache.parts" --file "$parts/n"
    }
    restored=0
    if restore; then
        restored=1
        mark "cargo cache $ckey restored, $(du -sh "$parts" | cut -f1) in $n parts"
    else
        # a cache that isn't there, or one that didn't extract whole: cargo starts from crates.io
        rm -rf "$HOME/.cargo/registry" "$HOME/.cargo/git" "$CARGO_TARGET_DIR"
        mark "no cargo cache $ckey"
    fi
    rm -rf "${parts:?}"/*

    trunk --version 2>/dev/null | grep -q "$TRUNK" || curl -sSfL --retry 3 --retry-all-errors "https://github.com/trunk-rs/trunk/releases/download/v$TRUNK/trunk-x86_64-unknown-linux-gnu.tar.gz" | tar xz -C "$cache/bin"
    naga --version 2>/dev/null | grep -q "$NAGA" || cargo install naga-cli --version "$NAGA" --locked --quiet --force --root "$cache"
    mark "trunk and naga"
    rm -rf dist-deploy
    trunk build --release --dist dist-deploy
    mark "trunk build"
    id=$(bun ../worker/scripts/scope-build.ts dist-deploy)
    # The two builds before this one ride along, so a tab open across a deploy still finds the
    # modules it loads later (diagrams, search, embeds: app/js/dom.js buildModule). Two, or every
    # deploy would grow by a build. (A cache from before ids were kept holds one build: that one.)
    prev=$({ cat "$cache/app/ids" 2>/dev/null || ls "$cache/app/dist-deploy/b" 2>/dev/null; } | grep -vx "$id" | head -2 || true)
    for p in $prev; do [ -d "$cache/app/dist-deploy/b/$p" ] && cp -R "$cache/app/dist-deploy/b/$p" "dist-deploy/b/$p"; done
    echo "ci: build $id, carrying" ${prev:-none}
    cd ..

    if [ $main = 1 ]; then
        rm -rf "$cache/app" && mkdir -p "$cache/app"
        cp -R app/dist-deploy "$cache/app/dist-deploy"
        { echo "$id"; echo "$prev"; } | grep . > "$cache/app/ids"
        # the key last: a build cut off before here is a miss, not a half cache
        echo "$key" > "$cache/app/key"
    fi
    # TEMPORARY: deploy-speed uploads too, to prove the restore on a branch; the next commit removes it
    if { [ $main = 1 ] || [ "${WORKERS_CI_BRANCH:-}" = deploy-speed ]; } && [ $restored = 0 ]; then
        (cd app && upload) && mark "cargo cache $ckey uploaded, $(du -sh "$parts" | cut -f1) in $n parts" \
            || echo "ci: the cargo cache upload failed; the next app build compiles from crates.io"
    fi
    rm -rf "$parts"
fi
# bun's own package downloads (wrangler, puppeteer...) come again from the network in seconds, but
# restoring them took most of a minute: the cache keeps only ours
find "$HOME/.bun/install/cache" -mindepth 1 -maxdepth 1 ! -name com-next -exec rm -rf {} +
du -sh "$HOME/.bun/install/cache" | sed 's/^/ci: bun cache now holds /'
du -sh "$cache" | sed 's/^/ci: cache now holds /'
mark "done"
