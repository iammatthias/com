// @ts-check
import { defineConfig } from "astro/config";
import fs from 'node:fs';
import path from 'node:path';

import react from "@astrojs/react";
import rehypeUnwrapImages from "rehype-unwrap-images";

import sitemap from "@astrojs/sitemap";

import cloudflare from "@astrojs/cloudflare";

/**
 * @param {string[]} extensions
 * @returns {import('vite').Plugin}
 */
function rawFonts(extensions) {
  return {
    name: 'vite-plugin-raw-fonts',
    enforce: /** @type {const} */ ('pre'),
    resolveId(id, importer) {
      if (extensions.some(ext => id.includes(ext))) {
        if (id.startsWith('.')) {
          const resolvedPath = path.resolve(path.dirname(importer || ''), id);
          return resolvedPath;
        }
        return id;
      }
    },
    load(id) {
      if (extensions.some(ext => id.includes(ext))) {
        try {
          const buffer = fs.readFileSync(id);
          return `export default new Uint8Array([${Array.from(buffer).join(',')}]);`;
        } catch (error) {
          const err = /** @type {Error} */ (error);
          console.error('Error loading font:', err.message);
          throw error;
        }
      }
    }
  };
}

// https://astro.build/config
export default defineConfig({
  site: "https://iammatthias.com",
  integrations: [react(), sitemap()],

  markdown: {
    rehypePlugins: [rehypeUnwrapImages],
  },

  redirects: {
    "/art": {
      status: 302,
      destination: "/content/art",
    },
    "/open-source": {
      status: 302,
      destination: "/content/open-source",
    },
    "/posts": {
      status: 302,
      destination: "/content/posts",
    },
    "/recipes": {
      status: 302,
      destination: "/content/recipes",
    },
    "/post/1563778800000": {
      status: 302,
      destination: "/content/notes/1563778800000-flatframe",
    },
    "/post/1587970800000": {
      status: 302,
      destination: "/content/notes/1587970800000-sourdough",
    },
    "/post/1687071600000": {
      status: 302,
      destination: "/content/notes/1687071600000-feels-like-summer",
    },
    "/post/1681369200000": {
      status: 302,
      destination: "/content/posts/1681369200000-ai-legion-on-bluesky",
    },
    "/post/1670659200001": {
      status: 302,
      destination: "/content/posts/1670659200001-obsidian-as-a-cms",
    },
    "/post/1691436904927": {
      status: 302,
      destination: "/content/posts/1691436904927-deploy-html-on-replit",
    },
    "/post/1699332127006": {
      status: 302,
      destination: "/content/posts/1699332127006-revisiting-obsidian-as-a-cms",
    },
  },

  adapter: cloudflare({
    platformProxy: {
      enabled: false,
    },
    wasmModuleImports: true,
  }),

  vite: {
    plugins: [rawFonts(['.ttf'])],
    assetsInclude: ['**/*.wasm'],
    resolve: {
      alias: {
        '@src': path.resolve('./src'),
        '@styles': path.resolve('./src/styles'),
        '@components': path.resolve('./src/components'),
        '@layouts': path.resolve('./src/layouts'),
        '@pages': path.resolve('./src/pages'),
        '@mastra': path.resolve('./src/mastra'),
        '@actions': path.resolve('./src/actions'),
        '@lib': path.resolve('./src/lib'),
      },
    },
    ssr: {
      external: ["buffer", "path", "fs"].map((i) => `node:${i}`),
      noExternal: ['@cf-wasm/resvg'],
    },
  },
});