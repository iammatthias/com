# com-next

An experimental rebuild of iammatthias.com. People see a single GPUI app on WebGPU, built around the Burin plate. Agents and crawlers get the same agent surface the old site served. The app is a library first, so the same code can later ship as a desktop or mobile app.

## Verified (spike, `d5f915c`)

- gpui-ce @ `43dacc5` builds on **stable** Rust for `wasm32-unknown-unknown` with Trunk.
  - It runs on browser WebGPU. The WebGL2 fallback (ANGLE) renders the same plate; checked by forcing `WebBackendPreference::WebGl`.
  - It runs single-threaded, so no COOP/COEP headers are needed and cross-origin images keep working.
- **The shader lives inside GPUI.** With the `custom-gpu` feature, a view gets GPUI's own `wgpu` device. It renders WGSL into a `WgpuRenderTarget` and paints it with `target.surface()`. GPUI elements composite on top.
  - The same path exists on macOS and Linux, which is what makes the desktop port possible.
  - The surface element has no intrinsic size and needs `.size_full()`.
- The bundle is 12.7 MB raw, or 4.3 MB brotli. Most of that is the embedded IBM Plex, which the real font set replaces.

## Limits we design around

| gpui-ce on web | Consequence / answer |
|---|---|
| Single canvas: no DOM text, no a11y tree, no find-in-page, no text selection | The Worker serves real semantic HTML under the canvas for agents, no-JS clients and crawlers (see Server). Copy-link and copy-text are app affordances. |
| No browser history or routing | `web-sys` `pushState`/`popstate` router in the app. Mouse back and forward buttons already arrive as GPUI events. |
| `img(url)` uses `fetch`, so it needs CORS | Images go through the Worker (`/img/{cid}?w=`). That gives one origin, edge cache, and a wsrv resize behind it. |
| Empty font DB: only embedded fonts exist | Ship the plate's faces: IM Fell English, IM Fell English SC, Petit Formal Script, plus a mono and a small emoji subset. All are OFL. |
| `background_spawn` runs on the main thread | Markdown parsing and atlas rasterization are chunked across frames. |
| Fetch is GET-only with no headers | The app only reads public JSON from its own Worker. All keys stay server-side. |

## Shape

```
app/        Rust: the GPUI app (lib) + web bin (Trunk) + later a desktop bin (macos-wgpu)
  plate/    WGSL Burin plate: spiral, frame and intro modes, optics, glyph atlas
  route/    Route enum ⇄ URL, history
  content/  markdown → elements, series layouts, recipe grid, callouts, ff-* components
  seed/     hashSeed (FNV-1a over UTF-16) + mulberry32, golden-tested against com's fixtures
worker/     TypeScript Cloudflare Worker `com-next`, ported from com/src/lib (v0 done: agent surface, redirects, SSR shell, /api/app/*, /img)
```

### The plate (one shader, three modes)

The plate ports the artifact's GLSL to WGSL with the full uniform set. Its glyph atlas is rasterized CPU-side in Rust (swash) from the embedded script face, plus the segment table texture. One `mode` uniform blends between three line shapes:

1. **Intro (first visit).** The greeting "Hi, I am Matthias. This is my corner of the web, thank you for visiting." is written in script along a straight baseline. The line then curls into a tight spiral, collapses toward the centre, and grows back out into the full plate, revealing the line-drawn subject and the titles.
2. **Spiral (home).** The artifact as designed: titles written into the line, hover hit-testing mirrored in Rust, and click to navigate in the same tab. List view, sections, search, zoom and pan, and theme move into GPUI chrome.
3. **Frame (content pages).** The spiral unwinds into a rounded-rect band of engraved line around the content rect, passed in as a uniform each frame.
   - The band carries the page's own lettering: section, date, tags, prev/next.
   - The content sits on paper inside it.
   - Navigation animates the change between spiral and frame.

Aberration, flares, haze and halation are **always on**. They are seed-derived and masked off the reading rect so text stays crisp. The tuning panel goes away. The `#s<hex>` replay link stays as a hidden affordance.

### Seed and cookie

The app owns the seed, so HTML stays per-route and edge-cacheable (a per-visitor shell or a `Set-Cookie` would defeat `s-maxage` and the tag purges). On first run the app:

- computes `seed = fnv1a(UA | first-visit ms)`, as the artifact does
- writes the first-party cookie `burin=<hex>.<intro-done>` (1 year, `SameSite=Lax`) through `document.cookie`
- reads the cookie back on later visits. `#s<hex>` overrides it.

Everything visual derives from it: warp, morph, optics, flare orbits, face pick and intro choreography. Per-page variation uses `hashSeed(seed ⊕ cid)`, so a page is stable for one visitor and different between visitors.

There is no third-party fingerprinting. `/privacy` changes from "no cookies" to describing this one cookie.

### Content rendering (native, not HTML)

- **Articles:** pulldown-cmark → GPUI element tree.
  - Embeds use `blob://`/`series://`; callouts use `> [!NOTE]`.
  - Mermaid shows as source plus a link at first.
  - Code is monospace with no highlighting at first.
  - The drop cap becomes plate-engraved.
- **Series:** grid, flow (images + text), the `phosphene` triptych, and live tiles (still + video).
  - Video is a gap on the canvas. v1 shows the poster plus "play" and opens the blob. Native video via a WebCodecs texture comes later.
  - The lightbox is a GPUI overlay with keys and swipe.
- **Recipes:** the DAG grid, serves scaling, strike-off and step mode, ported from `recipe.ts`.
- **Feed:** a stream with infinite scroll, rendered in the same frame mode.
- **`ff-*` components:**
  - `ff-reveal` is native.
  - `ff-tuner` and `ff-nothing` link out in v1. Their wallet and iframe behaviour needs DOM, so a DOM overlay escape hatch comes later.

### Server: Worker `com` (TypeScript, ported, not reinvented)

The Worker is the only thing that talks to Farfield (content, feed, blobs), with the keys and with cache, ETag, SWR and KV, as `farfield.ts` does today. It:

- **Middleware:** keeps every existing route, redirect and fallback exactly:
  - trailing slash, `open-source`→`experiments`, `MOVED_ENTRIES`, unstamped→stamped rkey, `/post/*`, `/content/*`, `/sitemap-index.xml`
  - `?mode=agent`, markdown negotiation on `/` and `/feed*`, markdown 404s.
- **Browser HTML for any app route** returns the shell with:
  - per-route `<title>`, canonical, `lang`, OG/JSON-LD
  - the seed
  - **the full server-rendered semantic content of that route** (reusing `renderMarkdownBody`) in the document under the canvas. That covers is-agentic's `content-no-js`, crawlers, no-JS and screen-reader fallback.
- **App data:** `/api/app/route?path=` returns one JSON payload per route (doc + blob meta, listing page, home index). `/img/{cid}` is the image proxy.
- **Agent surface, ported as-is:**
  - `.md` twins, `llms.txt`, `llms-full.txt`, RSS ×4, `sitemap.xml`, `robots.txt`
  - `/mcp` + `/.well-known/*`, `/api/content.json`, `/api/search.json`, `/openapi.json`, `/graphql`, `/api/revalidate`
  - The `agent-check` gate.
- **is-agentic** currently scores 100 (80/80 essential). Target is ≥ that. Also close the open items: fix the `/.well-known/mcp` handshake, add Deprecation/Sunset policy headers, list dev resources in `llms.txt`.
- **OG** stays the separate `og` worker. Later it can render a plate thumbnail per seed.

### Search and intent

- Keep **ternlight** (already used, 384-d) for semantic search: a JS module behind `wasm-bindgen`, fed by the existing corpus and vector endpoints.
- A typed query is routed **ternlight-first**: a small linear head over the embedding picks the intent (open doc / filter section / switch view / search). The head is trained offline and evaluated in Rust.
- **blink** is not a fit as the language layer. By its own docs it does not read free text and sits at chance on selection. It is an optional later stage: a ~450 KB wasm chooser over a fixed action menu, fed a templated state string (view, section, top hit, similarity bucket) that ternlight produces. Adopt it only if routing turns out to depend on app state in ways rules can't cover.

## Milestones

1. **Plate parity:** the full Burin WGSL with atlas, segments, optics and hit-testing; seed module + golden tests; real fonts (drop IBM Plex). Driven by a static `llms.txt` index.
2. **Intro + modes:** the greeting → condense → bloom sequence; the spiral ⇄ frame transition; cookie seed.
3. **Worker v0:** Farfield proxy + `/api/app/*` + `/img`, the shell with SSR content, and all redirects. The app now loads live data and deep links work.
4. **Content:** articles → feed → series/lightbox → recipes → components.
5. **Agent surface port** and is-agentic check. Then cut over the `com` Worker route.
6. **Later:** desktop bin (`macos-wgpu`), WebCodecs video, DOM escape hatch for wallet/tuner, blink stage, mobile.

## Open questions

- **WebGL2 under the full plate:** the uniform limit is 16 KB and there are no storage buffers. The atlas and segment textures fit that, but this needs re-checking once the full shader lands.
- **Script atlas in Rust:** the artifact relies on Canvas2D `fillText` shaping a connected script. Here that is swash shaping + rasterization. This is the riskiest unproven piece, so it goes first in milestone 1 with a two-title atlas, checking joins in Petit Formal Script.
- **Optics vs reading:** you asked for the effects to be always present. The plan keeps them everywhere but masks them off the text rect so body copy stays crisp. That is a deliberate choice to confirm.
- **Shell mechanics:** gpui_web appends its canvas to `<body>`, so the shell pins it `position:fixed; inset:0`. The SSR content stays rendered under it (occluded, not sr-only).
- **Bundle budget** once the real fonts are in: aim for < 3 MB brotli, with the Worker shell painting paper + the static greeting while the wasm loads.
- **Reduced motion:** the intro becomes a still plate with the greeting lettered in.
