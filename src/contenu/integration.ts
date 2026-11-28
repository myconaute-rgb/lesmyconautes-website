/**
 * Branche le contrôle du contenu sur la construction : un fichier de contenu/
 * invalide ou inconnu arrête `astro build`, avec le fichier et le champ en clair.
 */
import type { AstroIntegration } from "astro";
import { verifierTout } from "./charger.ts";

export default function contenu(): AstroIntegration {
  return {
    name: "contenu-myconautes",
    hooks: {
      "astro:build:start": () => {
        const erreurs = verifierTout();
        if (erreurs.length) throw new Error(`\n${erreurs.join("\n")}\n`);
      },
    },
  };
}
