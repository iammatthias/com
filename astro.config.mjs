// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import rehypeUnwrapImages from "rehype-unwrap-images";

import sitemap from "@astrojs/sitemap";

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
    "/art/[...slug]": {
      status: 302,
      destination: "/content/art/[...slug]",
    },
    "/open-source": {
      status: 302,
      destination: "/content/open-source",
    },
    "/open-source/[...slug]": {
      status: 302,
      destination: "/content/open-source/[...slug]",
    },
    posts: {
      status: 302,
      destination: "/content/posts",
    },
    "/posts/[...slug]": {
      status: 302,
      destination: "/content/posts/[...slug]",
    },
    recipes: {
      status: 302,
      destination: "/content/recipes",
    },
    "/recipes/[...slug]": {
      status: 302,
      destination: "/content/recipes/[...slug]",
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
});
