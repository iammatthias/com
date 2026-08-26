// @ts-check
import path from "node:path";
import { defineConfig, envField, fontProviders } from "astro/config";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
    site: "https://iammatthias.com",
    // Prerendered pages emit `resume.html` instead of `resume/index.html`,
    // so Cloudflare's asset layer serves `/resume` directly instead of
    // 307-redirecting to `/resume/`. Keeps the served URL identical to
    // internal links and rel=canonical (one URL form site-wide; the SSR
    // half is enforced by src/middleware.ts).
    build: {
        format: "file",
    },
    // Prefetch links on hover — with the 60s edge cache on rendered HTML,
    // the next page is usually in the browser before the click lands.
    prefetch: {
        prefetchAll: true,
    },
    // Astro's CSRF origin check rejects POSTs whose Content-Type looks
    // like a form submission — including requests that send no
    // Content-Type at all — with "Cross-site POST form submissions are
    // forbidden", before any route handler runs. That silently broke
    // the MCP handshake for clients that omit the header, and it buys
    // nothing here: the site has no cookies, no sessions, no auth, and
    // no state-changing endpoint. There is no request to forge. Every
    // POST route (/mcp, /graphql) is deliberately cross-origin.
    security: {
        checkOrigin: false,
    },
    // Incremental static builds (7.2 experimental): prerendered pages
    // whose getStaticPaths() rows carry a `cacheKey` are skipped when
    // both the key and the page's module graph are unchanged since the
    // last build. Our cacheKeys are Farfield cids, so a publish-hook
    // rebuild renders only what actually changed. The cache lives in
    // node_modules/.astro — Workers Builds' build cache persists it
    // (enable Build cache in the dashboard), and the build script must
    // never rm it. Escape hatch: `astro build --force`.
    experimental: {
        incrementalBuild: true,
    },
    integrations: [
        react(),
        // Dev-only internal routes — injected only under `astro dev`, so
        // they never ship in the production build. The azulejo snapshot
        // page is tooling (scripts/snapshot-azulejos.mjs captures it from
        // the dev server); it lives outside `src/pages/` so it isn't
        // auto-routed, and is mounted here for `command === 'dev'`.
        {
            name: "dev-only-internal-routes",
            hooks: {
                "astro:config:setup": ({ command, injectRoute }) => {
                    if (command !== "dev") return;
                    injectRoute({
                        pattern: "/internal/azulejo/[seed]",
                        entrypoint: "./src/dev-routes/azulejo-seed.astro",
                    });
                    injectRoute({
                        pattern: "/internal/terrazzo/[seed]",
                        entrypoint: "./src/dev-routes/terrazzo-seed.astro",
                    });
                },
            },
        },
    ],
    // Astro Fonts API replaces the old manual setup (@fontsource CSS
    // import + hand-written preload <link> in BaseLayout). It serves
    // the same files but adds a metric-adjusted fallback font, so text
    // set in Metamorphous doesn't shift when the webfont swaps in —
    // Metamorphous is metrically nothing like the generic serif that
    // used to stand in for it. Font files are downloaded at build time
    // and self-hosted under /_astro/fonts (immutable-cached via the
    // adapter's _headers). The fontsource provider (vs npm) carries
    // per-subset metadata, which the latin-only preload in BaseLayout
    // filters on.
    fonts: [
        {
            provider: fontProviders.fontsource(),
            name: "Metamorphous",
            cssVariable: "--font-metamorphous",
            weights: [400],
            styles: ["normal"],
            subsets: ["latin"],
            fallbacks: ["serif"],
        },
    ],
    env: {
        schema: {
            // Bearer token for content.farfield.systems, which now gates
            // reads (feed + blobs stay public). Server-only secret —
            // never exposed to the client. Optional so builds without the
            // key don't hard-fail at schema validation; a missing key
            // simply yields 401s the loaders surface as empty content.
            // Dev reads it from .env; prod from a Cloudflare secret.
            CONTENT_READ_KEY: envField.string({
                context: "server",
                access: "secret",
                optional: true,
            }),
            // Privileged write/admin key. The content API only returns
            // drafts (`?status=all`) to this key, so it's used *only* by
            // dev preview mode — and only on GET reads, never to mutate.
            // Never set it in production; the preview gate is dev-only,
            // so prod never reaches for it and the powerful key stays
            // confined to local machines.
            CONTENT_API_KEY: envField.string({
                context: "server",
                access: "secret",
                optional: true,
            }),
            // Read token for feed.farfield.systems, which (like content)
            // now gates reads. Production needs this set as a Cloudflare
            // secret or the feed surfaces (/now, /feed, feed RSS) go empty.
            FEED_READ_KEY: envField.string({
                context: "server",
                access: "secret",
                optional: true,
            }),
        },
    },
    redirects: {
        // (/about used to redirect to /now. It's a real page again —
        // durable biography there, "lately" on /now — because agents
        // check /about, /contact and /privacy to decide whether a site
        // is a real entity worth citing.)
        // @astrojs/sitemap used to serve the index here; the dynamic
        // endpoint (src/pages/sitemap.xml.ts) replaced it so SSR'd
        // content pages are included. Preserve the registered URL.
        "/sitemap-index.xml": "/sitemap.xml",
        // Old `/post/<timestamp>` and `/content/...` URLs are handled
        // by catch-all routes (src/pages/post/[...legacy].astro and
        // src/pages/content/[...legacy].astro) rather than redirects
        // here: Astro 7 requires a dynamic redirect's destination to
        // carry the source params, so many-to-one collapses must be
        // routes. (The /content one also predates that — a config
        // redirect there shadowed /content/page/N pagination.)
    },
    adapter: cloudflare({
        // Prerender pass runs on node, not in the workerd container,
        // so build is faster and doesn't require workerd-compatible
        // code at build time.
        prerenderEnvironment: "node",
        // The site never uses astro:assets — every image is either a
        // static /azulejo asset or proxied through wsrv.nl. Adapter 14
        // defaults to 'cloudflare-binding', which wants an IMAGES
        // binding provisioned at deploy; passthrough skips all that.
        imageService: "passthrough",
    }),
    vite: {
        resolve: {
            alias: {
                "@src": path.resolve("./src"),
                "@layouts": path.resolve("./src/layouts"),
                "@components": path.resolve("./src/components"),
                "@lib": path.resolve("./src/lib"),
                "@styles": path.resolve("./src/styles"),
            },
            // Force a single resolution for React across the dep graph.
            // Without this, Vite's dev server can hand different modules
            // each their own copy of react, which trips "Invalid hook
            // call" and "Cannot read properties of null (reading
            // 'useRef')" inside React-island components.
            //
            // `three` is here for the same reason: it holds internal
            // singletons (WebGLState, the global Object3D registry).
            // If HMR ever surfaces two copies, AzulejoTile and
            // TerrazzoBanner stop sharing those caches and components
            // lose state in confusing ways across edits.
            dedupe: ["react", "react-dom", "three"],
        },
        // The search worker (src/scripts/search-worker.ts) imports the
        // ternlight WASM module, whose bundler glue uses top-level await.
        // Vite's default worker format is iife, which can't express that
        // — emit workers as ES modules instead (the worker is already
        // spawned with { type: "module" }).
        worker: {
            format: "es",
        },
        // NOTE: this config used to carry an `optimizeDeps.include` list
        // (React + astro dev-toolbar entries) working around a Vite 5/6
        // dev bug where late dep discovery re-optimized mid-load and
        // produced two React copies ("Invalid hook call"). Under Astro 7
        // / Vite 8's per-environment optimizer the list backfired: it
        // pulled astro internals into the workerd SSR dep cache, whose
        // hashed chunks went stale on re-optimize ("The file does not
        // exist at …/deps_ssr/errors-data-*.js"). Removed — if the
        // two-React dev bug ever resurfaces, prefer per-environment
        // includes over resurrecting the old list.
        optimizeDeps: {
            // Keep the ternlight engine OUT of dev pre-bundling. The
            // optimizer separates the wasm-bindgen glue from its .wasm
            // sidecar, so the engine dies at init in the search worker
            // ("Cannot read … '__wbindgen_externrefs'") and dev search
            // reports unavailable. Excluding it serves the glue
            // unbundled, with the .wasm resolved relative to the real
            // module path — same as the production build. (`exclude`
            // is safe where the old `include` list wasn't: it only
            // opts this one package out of prebundling.)
            exclude: ["@ternlight/base"],
            // Pre-bundle the React family (and mermaid, the one big
            // lazy import) at startup so a cold/invalidated dep cache
            // never discovers them mid-render. Lazy discovery is what
            // produced the two-React "Invalid hook call" /
            // "Cannot read properties of null (reading 'useRef')"
            // errors: an island rendering while react re-optimized got
            // react and react-dom from different optimizer snapshots.
            // Unlike the old blanket list (see NOTE above), these are
            // plain npm packages — no astro internals, so no stale
            // deps_ssr chunks on re-optimize.
            include: [
                "react",
                "react-dom/client",
                "react/jsx-runtime",
                "react/jsx-dev-runtime",
                "mermaid",
            ],
        },
        // Per-environment include for the workerd SSR env (vite 8
        // environments API — the `vite.ssr.*` legacy path does not
        // reach the cloudflare plugin's environment). Pre-optimizing
        // the react family plus the astro internals that were being
        // discovered lazily (each discovery = a program reload = a
        // chance to strand an in-flight render) aims for zero mid-boot
        // re-optimizations. Scoped to this env only — the unscoped
        // include list of old is what backfired (see NOTE above).
        environments: {
            ssr: {
                optimizeDeps: {
                    include: [
                        "react",
                        "react-dom/server",
                        "react/jsx-runtime",
                        "react/jsx-dev-runtime",
                        "astro/zod",
                        "astro/virtual-modules/live-config",
                        "astro/env/runtime",
                        "astro/assets/services/noop",
                    ],
                },
            },
        },
        // Warm the heavy module chains at boot. Dep discovery is lazy —
        // driven by the first *request* — so after any cache
        // invalidation (config edit, new dep) the first page load used
        // to ride the re-optimization storm and could catch react and
        // react-dom in different optimizer snapshots mid-render
        // ("Invalid hook call" / "null (reading 'useRef')" from the
        // deps_ssr chunks). Warming a doc page + the islands makes the
        // storm run during startup idle instead, so it has settled
        // before a human first navigates. (`ssr.optimizeDeps` can't do
        // this: the workerd environment is owned by the cloudflare
        // plugin and doesn't read it.)
        server: {
            warmup: {
                ssrFiles: [
                    "./src/pages/[publication]/[slug].astro",
                    "./src/pages/index.astro",
                ],
                clientFiles: [
                    "./src/components/TerrazzoBanner/index.tsx",
                    "./src/components/AzulejoTile/index.tsx",
                ],
            },
        },
    },
});
