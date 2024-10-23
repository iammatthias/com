// @ts-check
import { defineConfig } from "astro/config";

import vercel from "@astrojs/vercel/static";

// https://astro.build/config
export default defineConfig({
  output: "static",

  adapter: vercel(),
});
