/**
 * Catalogue substrat — page /agriculteurs.
 *
 * `varietyCode` est renseigné si l'espèce est en production active (cf. DB `public.varieties`).
 * `available: false` = catalogue commercial mais pas encore en DB / pas encore vendue.
 *
 * Aligner avec DB pour le sous-ensemble actif :
 *   SELECT v.variety_code FROM varieties v
 *   JOIN product_formats pf USING(variety_id)
 *   WHERE pf.format_code LIKE 'FMT-%-SUB-%' AND pf.is_active GROUP BY 1;
 */

export interface AgriSpecies {
  slug: string;
  /** Clé DB si l'espèce est en production active. */
  varietyCode?: string;
  name: string;
  latin: string;
  blurb: string;
  stats: [string, string, string];
  available: boolean;
  /** Optionnel — chemin photo dans /public. Si absent, fallback dégradé+emoji. */
  imagePath?: string;
  imageAlt?: string;
}

export const AGRI_SPECIES: AgriSpecies[] = [
  {
    slug: "pleurote",
    varietyCode: "PLEUROTE",
    name: "Pleurote",
    latin: "Pleurotus ostreatus",
    blurb: "Cycle très court, grande tolérance aux aléas de culture. Bonne espèce pour démarrer. Entailler le sac, maintenir humide — ça pousse vite.",
    stats: ["Cycle très court", "Haute tolérance", "Rendement élevé"],
    available: true,
  },
  {
    slug: "eryngii",
    varietyCode: "ERYNGII",
    name: "Éryngii",
    latin: "Pleurotus eryngii",
    blurb: "Chair ferme rappelant les coquilles Saint-Jacques, conservation longue. Cycle court, tolérance faible. Sensible aux bactéries — salles propres indispensables.",
    stats: ["Cycle court", "Tolérance faible", "3-4 récoltes"],
    available: true,
  },
  {
    slug: "hericium",
    varietyCode: "HERICIUM",
    name: "Hericium",
    latin: "Hericium erinaceus",
    blurb: "Crinière de lion. Texture de chair de crabe ou de homard, parfum de fruits à coque. Besoin d'air frais, ne tolère pas les espaces confinés. Rendement ~15%.",
    stats: ["Cycle court", "Tolérance faible", "2-3 récoltes"],
    available: true,
  },
  {
    slug: "shiitake",
    name: "Shiitaké",
    latin: "Lentinula edodes",
    blurb: "Champion des étals : conservation longue, chair moelleuse, parfum boisé, attrait gustatif majeur. Connu en médecine asiatique et des palais du monde entier.",
    stats: ["Cycle moyen", "Tolérance moyenne", "3-4 récoltes"],
    available: false,
  },
  {
    slug: "nameko",
    name: "Nameko",
    latin: "Pholiota nameko",
    blurb: "Cycle ~3 semaines. Attendre l'apparition des primordias dans le sac avant de l'ouvrir. Sensible au CO₂ et aux courants d'air.",
    stats: ["Cycle ~3 semaines", "Sensible CO₂", "Salles propres"],
    available: false,
  },
  {
    slug: "pleurote-jaune",
    name: "Pleurote jaune",
    latin: "Pleurotus citrinopileatus",
    blurb: "Chapeau jaune vif en éventail. Saveur douce, légèrement fruitée, notes boisées. Excellent sauté, grillé ou en papillote.",
    stats: ["Cycle court", "Tolérance très faible", "Rendement ~15%"],
    available: false,
  },
];

export interface SubstrateFormat {
  formatCode: string;
  label: string;
  weight: string;
  description: string;
}

/**
 * Conditionnements substrat actifs en DB pour les 3 variétés dispo.
 * Pas de prix public — tarif sur devis (cf. brief restaurateurs/agri).
 */
export const SUBSTRATE_FORMATS: SubstrateFormat[] = [
  {
    formatCode: "FMT-{VAR}-SUB-SAC",
    label: "Sac unitaire",
    weight: "2,5 kg",
    description: "Pour tester, démarrer une petite culture, ou compléter un volume.",
  },
  {
    formatCode: "FMT-{VAR}-SUB-DEMI-PAL",
    label: "Demi-palette",
    weight: "200 kg",
    description: "Production régulière à petite échelle. Tarif dégressif.",
  },
  {
    formatCode: "FMT-{VAR}-SUB-PAL",
    label: "Palette complète",
    weight: "500 kg",
    description: "Production professionnelle. Meilleur tarif unitaire.",
  },
];
