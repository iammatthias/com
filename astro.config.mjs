// @ts-check
import path from "node:path";
import { readFile } from "node:fs/promises";
import { defineConfig, envField, fontProviders } from "astro/config";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
    server: {
        allowedHosts: ["mattbook.tailcf0ef1.ts.net", ".tailcf0ef1.ts.net"],
    },
    site: "https://iammatthias.com",
    build: {
        format: "file",
    },
    prefetch: {
        prefetchAll: true,
    },
    security: {
        checkOrigin: false,
    },
    experimental: {
        incrementalBuild: true,
    },
    integrations: [
        react(),
        {
            name: "dev-only-internal-routes",
            hooks: {
                "astro:config:setup": ({ command, injectRoute, updateConfig }) => {
                    if (command !== "dev") return;
                    updateConfig({
                        vite: {
                            plugins: [
                                {
                                    name: "doc-probe-source",
                                    enforce: "pre",
                                    configureServer(server) {
                                        server.middlewares.use(
                                            "/internal/doc-source",
                                            async (req, res) => {
                                                const file =
                                                    new URL(req.url ?? "", "http://localhost")
                                                        .searchParams.get("file") ?? "";
                                                if (!file.endsWith(".md")) {
                                                    res.statusCode = 400;
                                                    res.end("file must be a .md path");
                                                    return;
                                                }
                                                try {
                                                    const text = await readFile(file, "utf8");
                                                    res.setHeader("content-type", "text/markdown; charset=utf-8");
                                                    res.end(text);
                                                } catch (err) {
                                                    res.statusCode = 404;
                                                    res.end(String(err));
                                                }
                                            },
                                        );
                                    },
                                },
                            ],
                        },
                    });
                    injectRoute({
                        pattern: "/internal/azulejo/[seed]",
                        entrypoint: "./src/dev-routes/azulejo-seed.astro",
                    });
                    injectRoute({
                        pattern: "/internal/terrazzo/[seed]",
                        entrypoint: "./src/dev-routes/terrazzo-seed.astro",
                    });
                    injectRoute({
                        pattern: "/internal/doc",
                        entrypoint: "./src/dev-routes/doc-probe.astro",
                    });
                },
            },
        },
    ],
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
            CONTENT_READ_KEY: envField.string({
                context: "server",
                access: "secret",
                optional: true,
            }),
            CONTENT_API_KEY: envField.string({
                context: "server",
                access: "secret",
                optional: true,
            }),
            FEED_READ_KEY: envField.string({
                context: "server",
                access: "secret",
                optional: true,
            }),
        },
    },
    redirects: {
        "/sitemap-index.xml": "/sitemap.xml",
    },
    adapter: cloudflare({
        prerenderEnvironment: "node",
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
            dedupe: ["react", "react-dom"],
        },
        worker: {
            format: "es",
        },
        optimizeDeps: {
            exclude: ["@ternlight/base"],
            include: [
                "react",
                "react-dom/client",
                "react/jsx-runtime",
                "react/jsx-dev-runtime",
                "mermaid",
            ],
        },
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
        server: {
            warmup: {
                ssrFiles: [
                    "./src/pages/[publication]/[slug].astro",
                    "./src/pages/index.astro",
                ],
                clientFiles: [
                    "./src/scripts/terrazzo.ts",
                    "./src/scripts/azulejo-tile.ts",
                ],
            },
        },
    },
});
