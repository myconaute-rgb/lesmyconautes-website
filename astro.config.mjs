// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import contenu from "./src/contenu/integration.ts";

// https://astro.build/config
export default defineConfig({
  site: "https://lesmyconautes.fr",
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    contenu(),
    sitemap({
      changefreq: "weekly",
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
});
