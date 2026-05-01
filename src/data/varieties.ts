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
}

export const VARIETIES: Variety[] = [
  {
    slug: "pleurote",
    varietyCode: "PLEUROTE",
    name: "Pleurote",
    latin: "Pleurotus ostreatus",
    emoji: "🦪",
    blurb: "Le grand classique, charnu et facile en cuisine. Saveur boisée, texture moelleuse.",
    accent: "terracotta",
    gradient: "from-terracotta/80 via-terracotta/40 to-creme",
  },
  {
    slug: "eryngii",
    varietyCode: "ERYNGII",
    name: "Éryngii",
    latin: "Pleurotus eryngii",
    emoji: "🍄",
    blurb: "Le pleurote du panicaut, dit « king oyster ». Tige dense, parfait grillé ou rôti.",
    accent: "terracotta",
    gradient: "from-brun-clair/70 via-terracotta/40 to-creme",
  },
  {
    slug: "hericium",
    varietyCode: "HERICIUM",
    name: "Hericium",
    latin: "Hericium erinaceus",
    emoji: "🦁",
    blurb: "La crinière de lion. Texture proche de la chair de crustacé, goût subtil et iodé.",
    accent: "lavande",
    gradient: "from-creme via-lavande/30 to-ivoire",
  },
  {
    slug: "karabella",
    varietyCode: "KARABELLA",
    name: "Karabella",
    latin: "Pleurotus ostreatus karabella",
    emoji: "🍄",
    blurb: "Pleurote bleu-anthracite. Plus ferme que le classique, idéal en poêlée.",
    accent: "violet-profond",
    gradient: "from-violet-profond/70 via-lavande/40 to-creme",
  },
  {
    slug: "purati",
    varietyCode: "PURATI",
    name: "Purati",
    latin: "Pleurotus ostreatus purati",
    emoji: "🍄",
    blurb: "Pleurote rose. Esthétique, parfumé, parfait cru en salade ou très peu cuit.",
    accent: "lavande",
    gradient: "from-terracotta/50 via-lavande/40 to-creme",
  },
];
