// @ts-check
import { defineConfig } from "astro/config";

import vercel from "@astrojs/vercel";

import mdx from "@astrojs/mdx";

import sitemap from "@astrojs/sitemap";

import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  site: "https://iammatthias.com",
  output: "static",
  adapter: vercel({}),
  image: {
    domains: ["silver-bitter-junglefowl-364.mypinata.cloud"],
  },

  prefetch: {
    prefetchAll: true,
  },

  vite: {
    define: {
      "process.env.NODE_DEBUG": "false",
      global: "globalThis",
    },
    build: {
      target: "esnext",
    },
    envPrefix: ["PINATA_"],
  },

  redirects: {
    "/post/1563778800000": {
      status: 302,
      destination: "/notes/1563778800000-flatframe",
    },
    "/post/1587970800000": {
      status: 302,
      destination: "/notes/1587970800000-sourdough",
    },
    "/post/1687071600000": {
      status: 302,
      destination: "/notes/1687071600000-feels-like-summer",
    },
    "/post/1681369200000": {
      status: 302,
      destination: "/posts/1681369200000-ai-legion-on-bluesky",
    },
    "/post/1670659200001": {
      status: 302,
      destination: "/posts/1670659200001-obsidian-as-a-cms",
    },
    "/post/1691436904927": {
      status: 302,
      destination: "/posts/1691436904927-deploy-html-on-replit",
    },
    "/post/1699332127006": {
      status: 302,
      destination: "/posts/1699332127006-revisiting-obsidian-as-a-cms",
    },
  },

  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes("/api/") && !page.includes("/onchain-analytics/"),
    }),
    svelte(),
  ],
});
