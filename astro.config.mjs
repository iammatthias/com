import { defineConfig } from "astro/config";
import alpine from "@astrojs/alpinejs";
import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  integrations: [alpine()],
  output: "server",
  adapter: vercel({
    isr: {
      // F16
      bypassToken: "01123581321345589144233377610987",
    },
  }),
});
