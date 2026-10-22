#!/bin/bash
# Workers Builds' deploy command, after ci-build.sh. A push to main deploys the site, then embeds
# the live corpus for search, so a Farfield publish (its deploy hook runs this build) is
# searchable. Any other branch only uploads a version, which takes no traffic. No purge: the
# Worker's version is part of its cache key, so a new version starts with a cache of its own.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ "${WORKERS_CI_BRANCH:-}" != "main" ]; then
    exec npx wrangler versions upload
fi
npx wrangler deploy
# the site is live from here: vectors that can't be made leave the last ones standing
vectors() { bun scripts/build-search-vectors.ts https://iammatthias.com --remote; }
vectors || vectors || echo "ci: WARNING: the search vectors weren't refreshed (the last ones stand); rerun: cd worker && bun scripts/build-search-vectors.ts https://iammatthias.com --remote"
