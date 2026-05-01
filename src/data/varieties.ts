/**
 * Variétés cultivées — alignées sur la table DB `public.varieties`.
 * `varietyCode` = clé business identique à la DB (uppercase).
 * `slug` = clé URL (lowercase).
 *
 * Pour resync depuis la DB : SELECT variety_code, variety_name, latin_name, emoji
 *                            FROM varieties WHERE is_active = true;
 */

export type AccentColor = "lavande" | "terracotta" | "turquoise" | "violet-profond";

export interface Variety {
  slug: string;
  varietyCode: string;
  name: string;
  latin: string;
  emoji: string;
  /** Description courte vitrine (~100 chars). */
  blurb: string;
  /** Couleur d'accent et placeholder visuel. */
  accent: AccentColor;
  /** Dégradé Tailwind utilisé tant qu'on n'a pas de photo. */
  gradient: string;
  /** Optionnel — chemin photo dans /public (ex `/photos/pleurote.jpg`). Si absent, fallback dégradé+emoji. */
  imagePath?: string;
  /** Texte alternatif accessibilité. Recommandé si imagePath est défini. */
  imageAlt?: string;
}

export const VARIETIES: Variety[] = [
  {
    slug: "pleurote",
    varietyCode: "PLEUROTE",
    name: "Pleurote",
    latin: "Pleurotus ostreatus",
    emoji: "🦪",
    blurb: "L'incontournable. Cycle très court, grande tolérance — bon comestible, prix attractif, idéal pour démarrer en cuisine.",
    accent: "terracotta",
    gradient: "from-terracotta/80 via-terracotta/40 to-creme",
  },
  {
    slug: "eryngii",
    varietyCode: "ERYNGII",
    name: "Éryngii",
    latin: "Pleurotus eryngii",
    emoji: "🍄",
    blurb: "Pleurote du panicaut, dit « king oyster ». Texture proche des coquilles Saint-Jacques. Burger végétal, lasagnes, grillé.",
    accent: "terracotta",
    gradient: "from-brun-clair/70 via-terracotta/40 to-creme",
  },
  {
    slug: "hericium",
    varietyCode: "HERICIUM",
    name: "Hericium",
    latin: "Hericium erinaceus",
    emoji: "🦁",
    blurb: "Crinière de lion. Texture rappelant la chair de crabe ou de homard, parfum de fruits à coque. Études récentes sur la mémoire.",
    accent: "lavande",
    gradient: "from-creme via-lavande/30 to-ivoire",
  },
  {
    slug: "karabella",
    varietyCode: "KARABELLA",
    name: "Karabella",
    latin: "Pleurotus ostreatus karabella",
    emoji: "🍄",
    blurb: "Pleurote bleu-anthracite. Chair plus ferme que le classique, parfaite en poêlée nerveuse ou marinée.",
    accent: "violet-profond",
    gradient: "from-violet-profond/70 via-lavande/40 to-creme",
  },
  {
    slug: "purati",
    varietyCode: "PURATI",
    name: "Purati",
    latin: "Pleurotus ostreatus purati",
    emoji: "🍄",
    blurb: "Pleurote rose. Esthétique sur l'assiette, parfumé. Excellent cru en salade ou très peu cuit pour préserver la couleur.",
    accent: "lavande",
    gradient: "from-terracotta/50 via-lavande/40 to-creme",
  },
];
