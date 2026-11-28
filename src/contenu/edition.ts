/**
 * Les fiches d'édition : ce que l'éditeur montre à Aline pour chaque fichier de contenu/
 * (projet 08, rendu/03 § 7). L'app ne connaît pas les types de blocs : elle lit ces fiches.
 *
 * Règle R96 : un nouveau type de bloc arrive avec son schéma, sa fiche d'édition et son exemple.
 * Lot L0 : le type seul. Les fiches arrivent avec leur lot (L1 : la FAQ commune).
 */

/** Un champ tel qu'Aline le voit. */
export type ChampEdition = {
  /** Le libellé à l'écran, en français simple. */
  libelle: string;
  /** Une phrase d'aide, facultative. */
  aide?: string;
  /** Limite de confort : au-delà, l'éditeur prévient (le schéma, lui, bloque à sa propre limite). */
  confort?: number;
};

/** La fiche d'un fichier de contenu/. Les clés de `champs` suivent le chemin du champ (« rubriques[].titre »). */
export type FicheEdition = {
  /** Le fichier, depuis contenu/ (« site/partages/faq.json »). */
  fichier: string;
  /** Le type, tel que le schéma le connaît (« faq »). */
  type: string;
  /** Le nom du bloc pour Aline (« Questions fréquentes »). */
  nom: string;
  champs: Record<string, ChampEdition>;
};

// Limites de confort : au-dessus des textes d'aujourd'hui (titre 33 signes, question 48,
// réponse 315), bien en dessous des limites du schéma (120, 120, 900).
export const FICHES: Record<string, FicheEdition> = {
  faq: {
    fichier: "site/partages/faq.json",
    type: "faq",
    nom: "Questions fréquentes",
    champs: {
      titre: {
        libelle: "Titre du bloc",
        aide: "Le mot en italique se met en valeur. Affiché sur l'accueil, particuliers, pros et myconautes.",
        confort: 50,
      },
      sousTitre: { libelle: "Petit titre manuscrit", confort: 30 },
      "rubriques[].titre": { libelle: "Nom de la rubrique", aide: "Un emoji au début, comme aujourd'hui.", confort: 30 },
      "rubriques[].questions[].question": { libelle: "Question", confort: 70 },
      "rubriques[].questions[].reponse": {
        libelle: "Réponse",
        aide: "Italique, gras et liens permis. Un lien vers la boutique ou une page du site se choisit dans la liste.",
        confort: 400,
      },
    },
  },
};
