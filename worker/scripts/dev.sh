#!/usr/bin/env bash
# wrangler dev against a mirror of ../app/dist. Trunk stages rebuilds in
# dist/.stage (unoptimized wasm can exceed the 25 MiB asset limit), and
# wrangler's asset watcher exits on that. The mirror skips .stage, writes
# rsync temp files outside the watched tree, and wrangler is restarted if
# it exits anyway.
set -uo pipefail
cd "$(dirname "$0")/.."
SRC=../app/dist
MIRROR=.dist-mirror
TMP="$PWD/.dist-mirror-tmp"
PORT="${PORT:-8796}"
sync() {
    mkdir -p "$MIRROR" "$TMP"
    rsync -a --delete --exclude '.stage' --temp-dir="$TMP" "$SRC/" "$MIRROR/"
}
sync
( while sleep 2; do [ -f "$SRC/index.html" ] && sync 2>/dev/null || true; done ) &
SYNC_PID=$!
trap 'kill $SYNC_PID 2>/dev/null' EXIT
while true; do
    ./node_modules/.bin/wrangler dev --port "$PORT" --ip 127.0.0.1 --assets "$MIRROR"
    echo "[dev.sh] wrangler exited ($?); restarting in 2s" >&2
    sleep 2
done
