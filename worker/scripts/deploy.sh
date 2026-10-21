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
# The purge below needs the site's read key: settled before anything ships
KEY="${CONTENT_READ_KEY:-}"
if [ -z "$KEY" ] && [ -f ../worker/.dev.vars ]; then
    KEY=$(grep '^CONTENT_READ_KEY=' ../worker/.dev.vars | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//')
fi
if [ -z "$KEY" ]; then
    echo "deploy: CONTENT_READ_KEY is not set (env or .dev.vars); the purge after deploy needs it" >&2
    exit 1
fi
rm -rf dist-deploy
trunk build --release --dist dist-deploy
# its code under /b/<id>/: a page only ever loads the build it booted with
bun ../worker/scripts/scope-build.ts dist-deploy
cd ../worker
# the og Worker first: it shares lib/og-card.ts with the site, and cards must verify both ways
(cd ../og && ./node_modules/.bin/wrangler deploy)
./node_modules/.bin/wrangler deploy
# Cached pages name the last build's files, which are gone now: purge every page's HTML so
# no one is handed a page whose app no longer exists (the "shell" tag, lib/cache.ts).
ORIGIN=iammatthias.com
purge() {
    for i in 1 2 3; do
        if curl -fsS -X POST -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
            -d '{"kind":"deploy"}' "https://$ORIGIN/api/revalidate"; then echo; return 0; fi
        sleep 5
    done
    return 1
}
# Again once the rollout has settled: a location still running the old Worker for its first
# seconds caches the old page anew, after the first purge
purged=0
if purge; then sleep 60 && purge && purged=1; fi
unset KEY
if [ "$purged" -ne 1 ]; then
    echo "deploy: the Workers are live but a purge of cached pages failed three times; run it by hand:" >&2
    echo "  curl -X POST -H 'Authorization: Bearer \$CONTENT_READ_KEY' -H 'Content-Type: application/json' -d '{\"kind\":\"deploy\"}' https://$ORIGIN/api/revalidate" >&2
    exit 1
fi
