# AGENTS.md

Instructions for AI coding agents working in this repository, and for
agents consuming the site it builds.

## What this is

The source of [iammatthias.com](https://iammatthias.com) — Matthias
Jordan's personal site: photography, generative art, essays on building
software, and recipes. Astro 7 on Cloudflare Workers, reading a
self-hosted content backend called Farfield.

**Content does not live in this repo.** Posts, images, and recipes come
from `content.farfield.systems` / `feed.farfield.systems` at build time.
Editing content means editing Farfield, not files here.

## Consuming the site as an agent

You probably want the published surfaces, not this source:

- `https://iammatthias.com/llms.txt` — index of everything
- `https://iammatthias.com/llms-full.txt` — the whole corpus, one fetch
- `https://iammatthias.com/mcp` — MCP server (search, read documents)
- `https://iammatthias.com/openapi.json` — the JSON endpoints
- Any page plus `.md` — that page's markdown source

All public, no authentication. See `/auth.md` and `/developers.md`.

## Working in this repo

```bash
bun install
bun run dev          # localhost:4321
bun run build        # builds, then runs the agent-surface gate
bun run agent:check  # the gate alone, against ./dist
```

Requires `CONTENT_READ_KEY` and `FEED_READ_KEY` in `.env` — without
them the content API returns 401 and the site builds empty.

### Rules that will bite you

1. **Never `rm -rf node_modules/.astro` in the build script.** It holds
   the incremental-build cache; deleting it turns an 8-second rebuild
   into a 35-second one. Use `bun run build:force` when you genuinely
   need a cold build.
2. **`ASTRO_KEY` must stay stable.** A fresh key each build invalidates
   the entire incremental cache.
3. **Never start a build while `bun run dev` is running** — it poisons
   the Vite dep cache and the dev server starts throwing connection
   errors.
4. **Bump `RENDER_VERSION`** in `src/lib/render-cache.ts` if you change
   markdown → HTML output for the SSR feed surfaces.
5. **Don't hold a `Response` body across an `await`** in
   `src/lib/farfield.ts`. workerd's stall-reaper cancels it and the
   next read throws "Response closed due to connection limit". Buffer
   or cancel first.
6. **The agent surface is generated, not hand-written.** Add
   capabilities to `src/lib/agent-surface.ts`; the OpenAPI spec, MCP
   tools, well-known documents, and `/developers` all derive from it.
   Only declare things that actually exist — an agent that trusts a
   fabricated catalog entry stops trusting the whole catalog.

### Layout

```
src/lib/agent-surface.ts   single source of truth for the agent surface
src/lib/agent-data.ts      queries behind /api/* and the MCP tools
src/pages/mcp.ts           MCP server (Streamable HTTP, JSON-RPC)
src/lib/farfield.ts        HTTP layer: caching, ETags, retries
src/lib/farfield-content-loader.ts   build-time content collections
src/lib/doc-render.ts      markdown → HTML with blob/series embeds
src/lib/azulejo-cap.ts     cid-seeded drop-cap tile generator
scripts/agent-check.mjs    the pre-deploy gate
```

### Before you commit

`bun run build` must pass — it runs the agent gate, which fails on a
broken discovery document, a dead `llms.txt` link, a missing `<h1>`, or
an OpenAPI path that 404s. Do not weaken a check to make it pass; fix
the surface.
