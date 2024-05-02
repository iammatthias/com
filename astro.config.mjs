import { defineConfig } from "astro/config";
import alpine from "@astrojs/alpinejs";
import vercel from "@astrojs/vercel/serverless";
import metaTags from "astro-meta-tags";
import devtoolBreakpoints from "astro-devtool-breakpoints";
import embeds from "astro-embed/integration";
import playformCompress from "@playform/compress";

// https://astro.build/config
export default defineConfig({
  site: "https://iammatthias.com",
  integrations: [
    alpine(),
    embeds(),
    metaTags(),
    devtoolBreakpoints(),
    playformCompress(),
  ],
  output: "hybrid",
  adapter: vercel(),
  prefetch: {
    prefetchAll: true,
  },
  redirects: {
    "./post/1563778800000": {
      status: 302,
      destination: "./notes/1563778800000-flatframe",
    },
    "./post/1587970800000": {
      status: 302,
      destination: "./notes/1587970800000-sourdough",
    },
    "./post/1687071600000": {
      status: 302,
      destination: "./notes/1687071600000-feels-like-summer",
    },
    "./post/1681369200000": {
      status: 302,
      destination: "./posts/1681369200000-ai-legion-on-bluesky",
    },
    "./post/1670659200001": {
      status: 302,
      destination: "./posts/1670659200001-obsidian-as-a-cms",
    },
    "./post/1691436904927": {
      status: 302,
      destination: "./posts/1691436904927-deploy-html-on-replit",
    },
    "./post/1699332127006": {
      status: 302,
      destination: "./posts/1699332127006-revisiting-obsidian-as-a-cms",
    },
    "./post/*": {
      status: 302,
      destination: "./posts",
    },
  },
});
