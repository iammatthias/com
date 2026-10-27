#!/bin/bash
# Every browser check a change to the app must keep passing, against a running build
# (trunk serve, or the deployed site). Exits non-zero if any check fails.
#
#   e2e/gate.sh [base-url]
cd "$(dirname "$0")"
base=${1:-http://127.0.0.1:8080}
out=$(mktemp -d)
failed=()
for check in "sweep.mjs $out/sweep $base both" "embed.mjs $out/embed $base" "embed-nav.mjs $base" "find.mjs $base" "video.mjs $base" "video-shape.mjs $base" "taps.mjs $base" "boot.mjs $base" "boot-retry.mjs $base" "diagram.mjs $base" "diagram-engines.mjs $base" "skew.mjs $base" "loads.mjs $base" "embed-reads.mjs $base" "controls.mjs $base" "images.mjs $base" "select.mjs $base"; do
    echo "== ${check%% *}"
    bun $check || failed+=("${check%% *}")
done
if [ ${#failed[@]} -gt 0 ]; then
    echo "gate: failed ${failed[*]} (screenshots kept in $out)"
    exit 1
fi
rm -rf "$out"
echo "gate: all passed"
