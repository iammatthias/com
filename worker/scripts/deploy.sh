#!/bin/sh
# Deploys iammatthias.com from this machine. Workers Builds does that on every push to main, so
# this is for when Builds can't: run it with --production.
#
# Release build of the app into its own folder (trunk serve rewrites dist/ with its dev
# build and live-reload client), then deploy the Workers with it.
set -e
if [ "${1:-}" != "--production" ]; then
    echo "deploy: this deploys iammatthias.com, which Workers Builds does on push; pass --production to do it from here" >&2
    exit 1
fi
cd "$(dirname "$0")/../../app"
# every check before the build
cargo fmt --check
cargo test --quiet
(cd ../worker && bun test && npx tsc --noEmit -p .)
(cd ../og && npx tsc --noEmit -p .)
rm -rf dist-deploy
trunk build --release --dist dist-deploy
# its code under /b/<id>/: a page only ever loads the build it booted with
bun ../worker/scripts/scope-build.ts dist-deploy
# the og Worker first: it shares lib/og-card.ts with the site, and cards must verify both ways
(cd ../og && ./node_modules/.bin/wrangler deploy)
# then the site, the way Workers Builds deploys main
WORKERS_CI_BRANCH=main bash ../worker/scripts/ci-deploy.sh
