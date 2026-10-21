#!/bin/sh
# Build the preview into a fresh folder, then swap it in whole: the local Worker serving
# dist-preview never sees a half-written file (it hashes and caches what it reads).
set -e
cd "$(dirname "$0")/.."
rm -rf dist-build
trunk build --release --dist dist-build
rm -rf dist-preview.old
[ -d dist-preview ] && mv dist-preview dist-preview.old
mv dist-build dist-preview
rm -rf dist-preview.old
