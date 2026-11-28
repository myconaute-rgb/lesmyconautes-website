/**
 * Les règles d'écriture d'un geste (projet 08, pas 2 ; rendu/05 § 3, rendu/11 § 6.1).
 *
 * L'atelier les fait jouer à chaque geste, par scripts/champ.mjs. Elles comparent avant et après :
 * chaque règle ne juge que ce que le geste AJOUTE. Un texte ancien qui contient déjà « Chef.fe »
 * ne bloque rien (05 § 3, après R28).
 *
 *   R27  espaces au début, à la fin, en double ; lignes vides en trop        corrigé seul
 *   R14  champ obligatoire vidé                                              refus
 *   R12  longueur maximale du champ (celle du schéma)                        refus
 *   R16  point médian entre deux lettres (« Nombre de sacs · fréquence » passe) refus
 *   R18  prix tapé à la main (un nombre suivi de « € » ou « euros »)         refus
 *   R19  toute écriture « FR-BIO… » est exactement « FR-BIO-01 »             refus
 *   R23  adresse mail tapée                                                  refus
 *   R17  forme « .e », « .se » (Chef.fe)                                     signalement, pas refus
 *
 * Les phrases sont celles du 05 quand il en donne une. Ce fichier ne lit rien sur le disque.
 */

export type Signalement = { regle: string; message: string };

export type Verdict =
  | { etat: "ok"; apres: string; corrections: string[]; signalements: Signalement[] }
  | { etat: "refuse"; regle: string; raison: string };

/** Ce que l'atelier sait du champ : sa limite (schéma) et s'il est obligatoire. */
export type Champ = { max: number; obligatoire: boolean };

/** R27 : espaces au début, à la fin, en double ; lignes vides en trop. Les espaces insécables restent. */
export function nettoyer(s: string): string {
  return s
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const longueur = (s: string) => [...s].length;

/** Les occurrences d'un motif que `apres` a en plus de `avant` (multiensembles). */
function ajoutees(motif: RegExp, avant: string, apres: string, garder: (m: string) => boolean = () => true): string[] {
  const compter = (s: string) => {
    const n = new Map<string, number>();
    for (const m of s.matchAll(motif)) if (garder(m[0])) n.set(m[0], (n.get(m[0]) ?? 0) + 1);
    return n;
  };
  const a = compter(avant);
  const out: string[] = [];
  for (const [m, k] of compter(apres)) for (let i = a.get(m) ?? 0; i < k; i++) out.push(m);
  return out;
}

/** Les règles, dans l'ordre où elles jouent. Chaque motif est global (`g`), et Unicode quand il parle de lettres. */
export const MOTIFS = {
  R16: /\p{L}[·⋅•]\p{L}/gu,
  R18: /(?:\d+(?:[.,]\d+)?\s*(?:€|euros?(?!\p{L}))|€\s*\d)/giu,
  // « FR-BIO-1 », « FR BIO 01 », « fr-bio-01 », « FR-BIO-01-123 » : refusés. Seul un tiret prolonge le numéro.
  R19: /FR[\s\-‐‑–]*BIO(?:[\-‐‑–][0-9A-Z]+)*/giu,
  R23: /[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}/g,
  R17: /\p{L}+\.(?:e|es|se|ses|fe|fes|ne|nes|le|les|te|tes|euse|euses|rice|rices|ère|ères)(?!\p{L})/gu,
} as const;

export const RAISONS = {
  R12: (max: number) => `Ce texte est trop long pour son cadre : ${max} signes au plus`,
  R14: "Ce champ ne peut pas rester vide",
  R14facultatif: "Ce champ peut être masqué plutôt que vidé : ce geste arrive plus tard",
  R16: "Pas de point médian chez nous. Essaie “cheffes et chefs”, ou un mot collectif",
  R18: "Un prix ne s'écrit pas dans un texte. Il se change dans “Données affichées”",
  R19: "Le label s'écrit exactement « FR-BIO-01 ». Le numéro complet du certificat n'existe que comme pastille",
  R23: "Pas d'adresse mail dans un texte : le site masque ses adresses, et son dépôt est public",
  R17: (m: string) => `« ${m} » se lit mal. Préfère un mot collectif, ou les deux mots en entier`,
} as const;

/** Juge un geste « changer » sur un texte. `avant` est la valeur que l'atelier connaît. */
export function verifierEcriture(avant: string, brut: string, champ: Champ): Verdict {
  const apres = nettoyer(brut);
  const corrections = apres !== brut ? ["R27"] : [];
  const refus = (regle: string, raison: string): Verdict => ({ etat: "refuse", regle, raison });

  if (apres === "") return refus("R14", champ.obligatoire ? RAISONS.R14 : RAISONS.R14facultatif);
  if (longueur(apres) > champ.max) return refus("R12", RAISONS.R12(champ.max));
  if (ajoutees(MOTIFS.R16, avant, apres).length) return refus("R16", RAISONS.R16);
  if (ajoutees(MOTIFS.R18, avant, apres).length) return refus("R18", RAISONS.R18);
  if (ajoutees(MOTIFS.R19, avant, apres, (m) => m !== "FR-BIO-01").length) return refus("R19", RAISONS.R19);
  if (ajoutees(MOTIFS.R23, avant, apres).length) return refus("R23", RAISONS.R23);

  const signalements: Signalement[] = ajoutees(MOTIFS.R17, avant, apres)
    .map((m) => ({ regle: "R17", message: RAISONS.R17(m) }));
  return { etat: "ok", apres, corrections, signalements };
}
