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
  /** Optionnel — badge affiché sur la card si la variété n'est pas dispo cette saison
   *  (ex "Bientôt de retour", "À venir"). Si absent, pas de badge. */
  tag?: string;
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
    imagePath: "/photos/pleurote.jpg",
    imageAlt: "Pleurote fraîche cultivée par Les Myconautes",
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
    imagePath: "/photos/eryngii.jpg",
    imageAlt: "Éryngii frais cultivé par Les Myconautes",
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
    imagePath: "/photos/hericium.jpg",
    imageAlt: "Hericium (crinière de lion) cultivé par Les Myconautes",
    tag: "Bientôt de retour",
  },
  {
    slug: "black-pearl",
    varietyCode: "BLACK_PEARL",
    name: "Black Pearl",
    latin: "Pleurotus ostreatus var. Black Pearl",
    emoji: "🐚",
    blurb: "Pleurote noire, chair dense et fumée naturellement. Sublime grillée, magnifique sur l'assiette.",
    accent: "violet-profond",
    gradient: "from-brun/60 via-violet-profond/40 to-creme",
    imagePath: "/photos/black-pearl.jpg",
    imageAlt: "Pleurote Black Pearl cultivée par Les Myconautes",
    tag: "Bientôt de retour",
  },
  // Karabella et Purati restent gérées en DB (production) mais ne sont pas exposées
  // sur la vitrine — ce sont des sous-variétés de pleurote, trop spécifiques pour le grand public.
];
