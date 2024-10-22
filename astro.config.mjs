// @ts-check
import { defineConfig } from "astro/config";

import sitemap from "@astrojs/sitemap";

import robotsTxt from "astro-robots-txt";

import vercel from "@astrojs/vercel/static";

// https://astro.build/config
export default defineConfig({
  output: "static",
  integrations: [sitemap(), robotsTxt()],
  adapter: vercel(),
});
