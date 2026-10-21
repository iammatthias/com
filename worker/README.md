# com-next worker

The server half of com-next: a plain TypeScript Cloudflare Worker (`com-next`)
that replaces the old Astro site's server. Ported, not rewritten — most of
`src/lib` is copied from `com/src/lib` with the Astro bindings removed.

- **Agent surface**, byte-for-byte where possible: `.md` twins, `/llms.txt`,
  `/llms-full.txt`, RSS ×4 + XSL, sitemap, robots, `/mcp`, `/.well-known/*`,
  `/openapi.json`, GraphQL, `/api/*`.
- **Middleware** (`src/index.ts`, `src/lib/redirects.ts`, `src/lib/negotiate.ts`):
  the old redirect table, `?mode=agent`, markdown negotiation, markdown 404s,
  security headers/CSP, `Link`, cache headers + `Cache-Tag`, `/api/revalidate`.
- **HTML**: every human route is Trunk's `../app/dist/index.html`, rewritten
  with per-route head/OG/JSON-LD and the full SSR content in `<main id="ssr">`
  under the pinned GPUI canvas (`src/lib/ssr.ts`, `src/lib/shell.ts`).
- **App API** for the wasm app: `/api/app/index`, `/api/app/route?path=`,
  `/api/app/ssr?path=` (the title/meta and `<main id="ssr">` HTML for a path,
  to keep the hidden SSR DOM in sync after in-app navigation),
  `/img/<cid>?w=`. Contract: `src/app-api.ts`; real payloads per kind in
  `fixtures/app-api/`.

## Develop

```bash
bun install
# secrets: CONTENT_READ_KEY, FEED_READ_KEY (+ CONTENT_API_KEY) in .dev.vars — gitignored
bun run dev           # wrangler dev on 127.0.0.1:8796 (scripts/dev.sh)
bun test              # redirect table, stamping, twins, app API shapes, ported lib tests
bun run agent:check   # the old agent-surface gate, against the dev server
bun run fixtures      # re-capture fixtures/app-api/*.json from the dev server
bun run vectors       # embed the corpus with ternlight into local KV
```

`bun run dev` serves a mirror of `../app/dist` without Trunk's `.stage/`
(an in-progress debug wasm can exceed the 25 MiB asset limit and stop
wrangler). The deployable assets directory is `../app/dist-deploy`; `bun run deploy` builds it (`trunk build --release --dist dist-deploy`, after the tests) and deploys
in `../app` if it is missing (the Worker answers 503 without it).

A deployed build keeps its code under `/b/<id>/` (`scripts/scope-build.ts`; the id
hashes the bytes moved): the wasm and its glue, dom.js and the other snippets, and the
modules loaded later (diagrams, search, embeds). A page only ever loads the build it booted
with, and the Worker caches every `/b/` file for a year. Nothing is carried across a deploy:
a tab left open over one finds its build gone and needs a reload.

## Before any deploy

Not deployed. `wrangler.toml` carries a placeholder `CONTENT_CACHE` id.

**Every deploy must purge the `shell` cache tag.** All HTML responses carry
`Cache-Tag: shell` because they reference hashed bundle names, and the
hand-written pages (`/about`, `/contact`, `/privacy`, `/developers`,
`/resume`, `/onchain-analytics`) are edge-cached for an hour with `shell` as
their only tag: their copy lives in `src/pages/static.ts`, so only a deploy
changes them. Pages that embed Farfield data carry the content tags as well,
so `/api/revalidate` keeps them fresh between deploys:

| Response | Cache-Tag |
| --- | --- |
| documents, listings, tags, `/menu` (+ their `/api/app/*` payloads) | `documents` (+ `shell` on HTML) |
| `/`, `/now` | `feed-entries`, `documents` (+ `shell`) |
| `/feed`, `/feed/<id>` | `feed-entries`, plus `documents` when a post embeds a series |
| `/api/search-corpus.json` | `documents`, `feed-entries` |

A `series` webhook purges `documents`, which is why a feed payload that
embeds a series carries that tag too.
