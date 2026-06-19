// @ts-check
import path from "node:path";
import { defineConfig, envField } from "astro/config";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
    site: "https://iammatthias.com",
    integrations: [
        sitemap(),
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
                },
            },
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
        // Old `/post/<timestamp>` URLs go to the all-content index —
        // readers land somewhere coherent instead of a 404. Legacy
        // `/content/...` URLs are handled by the catch-all route at
        // src/pages/content/[...legacy].astro rather than redirects
        // here: a `/content/[publication]/[slug]` config redirect also
        // captured `/content/page/N`, shadowing deep pagination.
        "/post/[id]": "/content",
    },
    adapter: cloudflare({
        // Astro 6 + @astrojs/cloudflare 13.x: prerender pass runs on
        // node, not in the workerd container, so build is faster and
        // doesn't require workerd-compatible code at build time.
        prerenderEnvironment: "node",
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
        optimizeDeps: {
            // Pre-declare every dep the dev-mode crawl would otherwise
            // discover lazily. Each late discovery triggers a deps
            // re-optimize, which bumps the browserHash on `?v=` query
            // strings. Pages mid-load end up with chunks from two
            // generations — two React copies, a null dispatcher, and
            // an "Invalid hook call" on the next render.
            //
            // jsx-runtime + jsx-dev-runtime sit next to React and are
            // imported by the JSX that Astro's React renderer emits.
            // @astrojs/react/client.js is the island hydration entry.
            // The dev-toolbar entrypoint is what triggers the second
            // reoptimize on the very first page that mounts an island.
            include: [
                "react",
                "react-dom",
                "react-dom/client",
                "react/jsx-runtime",
                "react/jsx-dev-runtime",
                "three",
                "@astrojs/react/client.js",
                "astro/runtime/client/dev-toolbar/entrypoint.js",
            ],
        },
    },
});
