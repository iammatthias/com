// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import rehypeUnwrapImages from "rehype-unwrap-images";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), sitemap()],
  markdown: {
    rehypePlugins: [rehypeUnwrapImages],
  },
});