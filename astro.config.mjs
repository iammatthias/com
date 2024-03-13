import { defineConfig } from "astro/config";
import alpine from "@astrojs/alpinejs";
import vercel from "@astrojs/vercel/serverless";

import db from "@astrojs/db";

// https://astro.build/config
export default defineConfig({
  integrations: [alpine(), db()],
  output: "server",
  adapter: vercel({
    isr: {
      // A secret random string that you create.
      // bypassToken: "005556d774a8",
      // expiration: 60 * 60 * 24,
      expiration: 60
    }
  })
});