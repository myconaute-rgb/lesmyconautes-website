/**
 * Les réglages de forme : des listes fermées (projet 08, rendu/03 § 6).
 *
 * Aline choisit un mot (« serré », « violet »). Le code connaît la classe.
 *
 * Règle R95 : chaque classe est écrite EN ENTIER ici. Tailwind lit ce fichier,
 * donc chaque classe existe dans la feuille de style. Ne jamais fabriquer une
 * classe par collage de morceaux : Tailwind ne la verrait pas.
 *
 * `npm run verifier` contrôle que chaque classe de ce fichier existe dans la
 * feuille produite.
 */

export const TAILLE_TITRE = {
  xs:      "text-[clamp(1.6rem,3.5vw,2.8rem)]",
  s:       "text-[clamp(1.8rem,4vw,3.4rem)]",
  m:       "text-[clamp(2rem,5vw,4rem)]",
  l:       "text-[clamp(2.2rem,5vw,4.2rem)]",
  xl:      "text-[clamp(2.4rem,5.5vw,4.5rem)]",
  xxl:     "text-[clamp(2.4rem,6.5vw,5.5rem)]",
  affiche: "text-[clamp(2.6rem,7.5vw,6.5rem)]",
} as const;

// Valeur héritée : gardée pour ne pas bouger un pixel. Jamais proposée dans le panneau.
export const TAILLE_TITRE_HERITEE = { contact: "text-[clamp(2.2rem,5vw,4rem)]" } as const;

export const TAILLE_SCRIPT = {
  s: "text-[clamp(1.6rem,3vw,2.2rem)]",
  m: "text-[clamp(1.8rem,3.5vw,2.6rem)]",
  l: "text-[clamp(1.6rem,3vw,2.4rem)]",   // valeur actuelle de PageHero, gardée telle quelle
} as const;

export const TAILLE_TEXTE = { petit: "text-sm", normal: "text-base", grand: "text-base md:text-lg" } as const;
export const ALIGNEMENT   = { gauche: "text-left", centre: "text-center", droite: "text-right" } as const;
export const ALIGN_BOUTONS= { gauche: "justify-start", centre: "justify-center", droite: "justify-end" } as const;
export const LARGEUR      = { colonne: "max-w-md", large: "max-w-3xl", pleine: "" } as const;
export const ESPACEMENT   = { serre: "py-12 md:py-16", normal: "py-14 md:py-20", aere: "py-20 md:py-28" } as const;
export const COULEUR_TITRE= { violet: "text-violet", cacao: "text-cacao", anis: "text-anis" } as const;
export const FOND_CARTE   = { mauve: "bg-lilas", jaune: "bg-jaune", bleu: "bg-bleu", sable: "bg-sable",
                              rose: "bg-rose", orange: "bg-orange", anis: "bg-anis" } as const;
export const POLICE       = { titre: "font-title", script: "font-script", texte: "font-body" } as const;
export const CASSE        = { capitales: "uppercase", normale: "normal-case" } as const;
export const POSITION     = { centre: "object-center", haut: "object-top", bas: "object-bottom",
                              gauche: "object-left", droite: "object-right" } as const;

/** Toutes les listes, pour le contrôle « chaque classe existe dans la feuille ». */
export const TOUTES_LES_FORMES = {
  TAILLE_TITRE, TAILLE_TITRE_HERITEE, TAILLE_SCRIPT, TAILLE_TEXTE, ALIGNEMENT, ALIGN_BOUTONS,
  LARGEUR, ESPACEMENT, COULEUR_TITRE, FOND_CARTE, POLICE, CASSE, POSITION,
} as const;
