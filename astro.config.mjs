// @ts-check
import path from "node:path";
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
    site: "https://iammatthias.com",
    integrations: [sitemap(), react()],
    redirects: {
        // /about merged into /now during the redesign — preserve any
        // inbound links from the old site / search results / RSS readers.
        "/about": "/now",
        // Legacy URL structure was `/content/<pub>/<slug>`; redesign
        // flattens to `/<pub>/<slug>`. Rather than remap each old slug
        // (rkeys differ between the old GH-CMS and the current PDS), we
        // send all `/content/...` and old `/post/<timestamp>` URLs to
        // the all-content index — readers land somewhere coherent
        // instead of a 404, and can navigate from there.
        "/content/[publication]/[slug]": "/content",
        "/content/[publication]": "/content",
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
