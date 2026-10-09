---
name: verify-site
description: Prove a change to iammatthias.com works before and after it ships — pick the right local check (tests, agent gate, smoke, overflow, perf budget, art goldens) and the right live check (content freshness, cache, negotiation). Use when finishing any change in this repo, before pushing, after a deploy, or when content "isn't showing up" on the live site.
---

# Verify the site

Done means the check that matches the change passed, and for anything cache-, edge- or content-related, the live site was checked after Workers Builds deployed it.

## Pick the check

| Change touches | Run |
|---|---|
| Any code | `bun run build` (runs `bun test` + the agent gate) |
| Agent surface, middleware, negotiation, on-demand routes | gate against a running preview: `node scripts/agent-check.mjs --url http://localhost:4399` |
| Layout, CSS, components | `bun run smoke` and `bun run overflow` (1440/1512, full page) — then show the owner before pushing |
| Anything on the critical path (fonts, scripts, images, homepage) | `bun run perf`; only `bun run perf:budget` when a regression is intended and approved |
| Azulejo / terrazzo / shaders | `bun run art:verify`; `art:golden` only for an intended change |
| Cache keys, edge cache, `Vary`, content freshness | the live checks below — local runs cannot prove these |

## Live checks (after deploy)

- Deployed yet: `bunx wrangler deployments list | grep ^Created | tail -1` — compare to the push time.
- Content current: compare `cid`s from `https://iammatthias.com/api/content.json?limit=200` with `content.farfield.systems/api/entries` (Bearer `CONTENT_READ_KEY` from `.env`).
- A page's images: `curl -s "https://iammatthias.com/<path>.md?cb=$RANDOM" | grep -o 'bafkrei[a-z0-9]*' | sort -u`.
- Negotiation: the same URL with a browser UA must be `text/html`, with `-A ClaudeBot/1.0` or `-H 'Accept: text/markdown'` must be `text/markdown`. Check `/`, `/feed`, and one `/feed/<rkey>`.
- Edge cache keys: use a fresh `?z=$RANDOM` per experiment, request the *rarer* representation first, then the other; a `HIT` with the wrong content type means the key does not separate them.

## Gotchas

- `astro preview` is a daemon that always binds 4399 and can leave a zombie workerd answering 500 for a rebuilt `dist`. Before starting one: `bunx astro preview stop; lsof -ti tcp:4399 | xargs kill`. The scripts do this themselves unless `BASE_URL` is set.
- Never build while `bun run dev` is running.
- The Workers cache is not emulated locally, and the middleware falls back to header negotiation, so a local pass says nothing about cache keys. `ctx.props` through `ctx.exports` did not partition the cache in production (2026-10-09, reverted).
- A bare `curl` of a blob or page can return a cached 200 for something that is gone — add `?cb=$RANDOM` when checking deletions.
- Prerendered pages (`/art/...`, `/posts/...`) are served by the asset layer before the Worker; they do not negotiate markdown. Only `/`, `/feed*`, and on-demand routes do.
- Deploys are push-to-main via Workers Builds. Never `wrangler deploy`. To force a content rebuild, push an empty commit.
- Farfield's `content import-vault`, `import-series`, `reslug-entries` and `reslug-series` CLI subcommands write the database directly and never fire the deploy hook — push an empty commit after them (until farfield persists a last-fired fingerprint).
- `blobs.farfield.systems/blobs/<cid>/meta` answers `If-None-Match: "<cid>"` with 304 even after the blob is deleted (being fixed upstream); never use revalidation to detect a deletion. A meta 404 can later become 200; a 200 never changes; width 0 means "dimensions unknown" (uploads over 32 MiB, non-images).
- Blobs rate-limits 600 req/min per IP, shared by every Workers Build. Setting `BLOBS_READ_KEY` (a read-scope `ffk_` key) in the build env bypasses it.
- If a doc edit didn't appear: check the deploy hook fired (`ssh iam@homelab.local 'docker logs --since 2h farfield-content-1 | grep "deploy hook"'`), then whether the build re-rendered the page (its `cacheKey` must cover every input).
