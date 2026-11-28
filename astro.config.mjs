// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import contenu from "./src/contenu/integration.ts";

// https://astro.build/config
export default defineConfig({
  site: "https://lesmyconautes.fr",
  // Aperçu de l'éditeur (projet 08, pas 2) : servi sous /site/apercu/. Absent = racine, construction publique inchangée.
  base: process.env.APERCU_BASE ?? "/",
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
