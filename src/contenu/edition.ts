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

export const FICHES: Record<string, FicheEdition> = {};
