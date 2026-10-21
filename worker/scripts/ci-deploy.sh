#!/bin/bash
# Workers Builds' deploy command, after ci-build.sh. A push to main deploys the site, purges its
# pages (best effort: a new version starts with a cache of its own), then embeds the live corpus
# for search, so a Farfield publish (its deploy hook runs this build) is searchable. Any other
# branch only uploads a version, which takes no traffic.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ "${WORKERS_CI_BRANCH:-}" != "main" ]; then
    exec npx wrangler versions upload
fi
npx wrangler deploy
curl -fsS -X POST -H "Authorization: Bearer ${CONTENT_READ_KEY:-}" -H "Content-Type: application/json" \
    -d '{"kind":"deploy"}' https://iammatthias.com/api/revalidate && echo \
    || echo "ci: the purge didn't answer; the new version's cache starts empty anyway"
bun scripts/build-search-vectors.ts https://iammatthias.com --remote
