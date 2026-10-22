# app architecture

A GPUI app compiled to wasm (Trunk), drawn on one canvas. It reads the `com` Worker's
`/api/app/*` JSON and renders everything natively; the plate (a WGSL pass) engraves the
site's titles as one spiralling line and frames each page.

## Modules (`src/`)

- `main.rs` - entry: fetches the fonts, then opens the window on `Site`; `mark()` timings.
- `site.rs` - the root view: intro, plate, page, drawers; routing, fetching, search wiring.
- `home.rs` - `Home` state (section, open panel, plain, query) and the plain-paper index list/deck.
- `drawers.rs` - the corner controls: `Drawer`, `Drawers` (each panel's easing, measures and glass;
  `Site` owns one), `MenuAnim`, `pill`, `drawer()` (the card, reading `PanelInputs`) with
  one body per panel (`menu_body`, `site_body`, `find_body`), and their widgets.
- `design.rs` - design tokens: control/layout measures, breakpoints, `is_phone`, type sizes.
- `theme.rs` - colours (paper, ink, accent, section stops), face names, light/dark choice.
- `page.rs` - the scrolling reading column as a cached view, and the probe the plate frames.
- `plate/` / `plate.wgsl` - the engraved spiral and page frame. `mod.rs` holds the `Plate` entity,
  its state, clocks, input and render, and the glass and frame probes.
  - `title.rs` - `Title` and its `Mark` (heading, section colour or ink): what the plate writes, for the index or a page's frame.
  - `atlas.rs` - `TitleAtlas`: titles shaped in script into a signed-distance RG8 atlas and
    segment table on the CPU; `mips`, which the intro's atlas uses too.
  - `geom.rs` - the shader's geometry mirrored on the CPU: `hit`, `line_at`, `point_on_line`,
    the portrait's tone.
  - `gpu.rs` - pipelines, atlas upload, the per-frame `Uniforms` and the two draw passes.
- `intro.rs` / `intro.wgsl` - the first-visit greeting that becomes the line.
- `api.rs` - serde types for the Worker's index, timeline and route payloads.
- `route.rs` - URL to `Route`, history, document title, safe-area insets, JS bridges.
- `search.rs` - the semantic search Web Worker (`/search/search-worker.js`) and its replies.
- `seed.rs` - the visitor's seed (`Rng`), and the cookie that remembers the intro was seen.
- `prefs.rs` - localStorage preferences (theme, engraving, motion).
- `fonts.rs` - the font files: fetched from `fonts::DIR` on the web, built in natively.
- `dom_video.rs` - real `<video>` elements laid over the canvas where a clip is painted.
- `dom_embed.rs` - web components (`<ff-tuner>`, `<ff-onchain-analytics>`) laid over the column the same way, at their measured height. Add one with an entry in `EMBEDS` and its module as `assets/embeds/<component>.js` (copies of @com's, kept in step by hand; a module that imports nothing, so a failed load can be retried).
- Code loaded after boot (diagrams, embeds, the search worker) is named with dom.js's `buildUrl` and imported with its `buildModule`: from the page's own build under `/b/<id>/` (worker/README.md), retried under a fresh URL.
- `content/` - route payload to elements; its module map is at the top of `content/mod.rs`.

## How a route flows

1. `Site::go(path)` (link, back/forward, or first load) parses a `Route` and calls `fetch`.
2. `fetch` GETs `/api/app/route?path=<path>` (or reuses a cached/prefetched payload).
3. The JSON deserializes into `api::RoutePayload`, discriminated on `kind`.
4. `Site::apply` sets the document title (`title_for`), the frame's lettering
   (`Title::for_page`), and hands the payload to `Page` (`Load::Ready`).
5. `Page::render` calls `content::view`, whose `body()` dispatches each variant to a renderer
   in `content/pages.rs` or `content/special.rs`; markdown goes through `md` -> `cache` -> `render`.

The home route has no payload: it is the plate (or, on plain paper, `home::list`).

## How the plate is fed

- `/api/app/timeline?page=N` (40 per page) -> `api::Timeline` -> `Site::timeline_titles()`:
  every entry newest first with year headings. Narrowed to a section or a search, the plate
  uses `/api/app/index` instead (`Title::from_index_in`, filtered by `filter_titles`).
- On a page, `Title::for_page(payload)` letters the frame with where the page sits.
- `Site::retitle` -> `Plate::set_titles` -> `TitleAtlas::build` shapes every title in the
  script face into an RG8 atlas and segment table, uploaded as textures to `plate.wgsl`,
  which draws the line along the spiral (or the frame round the page probe) each frame.
- Theme colours go in as uniforms (`ink`, `paper`, `accent`, `stops`); the controls' glass
  panes come from `Site.glass` via `Plate::set_panes`, rounded to `design::CONTROL_RADIUS`.

## Design tokens

`src/design.rs`: `CONTROL_RADIUS`, `CONTROL_H`, `INSET`, `PANEL_W`, `COLUMN_MAX_W`; the
breakpoints `PHONE_W` (600, with `is_phone(window)`), `NARROW_CONTROLS_W` (760),
`PLATE_SMALL_W` (520), `BANNER_SMALL_W` (640); and type: `LABEL_*`, `BODY_*`, `TITLE_*`,
`SCRIPT_BUTTON_SIZE`. Values are `f32` CSS px: wrap them in `gpui::px`. The reading column
is laid out once at its final size; only the frame animates round it.
Colours and faces are in `src/theme.rs`.

## Adding a page kind

1. Worker: add the kind to `worker/src/app-api.ts` and answer it from `/api/app/route`.
2. `api.rs`: add a `RoutePayload` variant (serde `kind` tag; default every optional field).
3. `content/`: write the renderer (in `pages.rs`, `special.rs`, or a new module) and add the
   arm in `content/mod.rs` `body()`.
4. `api.rs` `RoutePayload::name`: what the page is called, which `site.rs` `title_for` (the
   document title) and `plate/title.rs` `Title::for_page` (the frame's lettering) are made from.
   `for_page` also needs the arm for what else the frame says.
5. The `match`es are exhaustive, so the compiler lists anything missed. Add a fixture in
   `content/fixtures.rs` (and `NAMES`) so the tests build it.

## Adding a font

1. Put the file in `assets/fonts/` and add it to `fonts::FILES` (and `built_in`) in `src/fonts.rs`.
2. Add a `<link rel="preload" href="/fonts-vN/...">` for it in `index.html`.
3. Bump the version in both `fonts::DIR` and index.html (`fonts-v1` -> `fonts-v2`, including
   the `copy-dir` target), so browsers fetch the new set. Name the family in `theme.rs`.

## Debug flags (in the URL)

- `#perf` - startup timings in the console (`main::mark`).
- `#s<hex>` - replay a plate by seed (shown in the site panel).
- `?intro` - replay the greeting for a returning visitor.
- `#t=5.2` - freeze the greeting's clock at that second; `#slow=4` - stretch it 4x.
- `#slowui` - the panels open and close at a tenth of the speed.
- `#lite` - the plate without its optics (flare, haze, aberration).
- `#half` - the plate at half resolution.
- `#z=4&px=-900&py=300` - start the plate zoomed in (and panned, device px): close-ups for screenshots.

Hash flags combine with `&`, e.g. `#perf&lite`, except `#s<hex>`, which must stand alone.

## End-to-end scripts (`e2e/`, run with bun + Playwright)

- `mobile.mjs [chromium|webkit] [base-url]` - an emulated iPhone runs the main flows with
  real touch; screenshots to `shots/`, non-zero exit on console errors.
- `sweep.mjs <out-dir> [base-url] [desktop|phone|both]` - a screenshot of every kind of page;
  run before and after a refactor and compare the folders.
- `loadperf.mjs [base-url] [runs] [path]` - time to app up and plate drawn, throttled and not.
- `memory.mjs [chromium|webkit] [base-url]` - wasm and JS heap high-water marks over a tour.

## Checks

`cargo check --target wasm32-unknown-unknown`, `cargo test --release` (host; md, recipe,
series, fixtures, atlas), `cargo clippy --target wasm32-unknown-unknown`.

## Trimming gpui-ce for the web

The web build leaves out what only a desktop app needs, without forking gpui-ce. A
native build gets everything back.

- **Default features off** (`Cargo.toml`). gpui-ce's defaults are every image codec and the
  Linux/macOS font backends. The web build turns them off and keeps the formats the site
  serves (WebP, JPEG, PNG, GIF); a non-wasm target dependency turns them back on.
- **`shims/wgpu`**, swapped in by `[patch.crates-io]`, is a stand-in for wgpu. On the web it
  builds real wgpu (from its git tag) with only WebGPU, and ignores gpui-ce's request for
  WebGL, which would bring wgpu-core, wgpu-hal and naga (~1.1MB). Off the web it passes
  everything through. Browsers without WebGPU get the plain server-rendered page
  (`index.html` checks `navigator.gpu`).
  - **Upgrading gpui-ce:** keep the stand-in's `version` and `tag` at the wgpu it resolves
    (`cargo tree -i wgpu`). The test `build_guards::web_build_has_no_webgl` fails if the
    stand-in stops applying.
  - **Removing it:** delete `shims/wgpu` and its `[patch]` line.
- **`shims/usvg`, `shims/resvg`**: stand-ins for gpui-ce's SVG parser and renderer. On the
  web they parse nothing, so the SVG stack and its emoji regex (~2MB with Unicode tables) leave
  the build. The browser draws what SVG the site has (mermaid diagrams in `js/dom.js`, the
  web components). Off the web they
  are the real crates. `build_guards::web_build_has_no_svg_renderer` checks they still apply.
- **`vendor/parley`** turns off parley's complex-script line breaking (ICU dictionaries for
  Thai, Khmer and CJK). The site is English. It also breaks a word too long for its line
  (`overflow-wrap: break-word`), which gpui has no style for.
