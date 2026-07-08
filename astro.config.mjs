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
        // /about merged into /now during the redesign — preserve any
        // inbound links from the old site / search results / RSS readers.
        "/about": "/now",
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
                "@pages": path.resolve("./src/pages"),
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
    },
});
