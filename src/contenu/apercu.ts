/**
 * Le mode aperçu de l'éditeur du site (projet 08, pas 2 ; rendu/04 § 4.2).
 *
 * L'atelier construit l'aperçu avec APERCU_BASE=/site/apercu/ : même `astro build`, même arbre,
 * plus des repères d'édition et le petit script d'édition. Sans cette variable (Cloudflare, sessions),
 * tout ce fichier ne rend rien : la construction publique est celle de main, à l'octet.
 *
 * Trois attributs, et seulement ceux-là (le comparateur, mode --apercu, les ignore) :
 *   data-bloc="faq"                      sur l'élément qui porte un bloc ;
 *   data-repere="site/partages/faq.json" sur ce même élément : le fichier de contenu/ du bloc ;
 *   data-champ="/rubriques/@conservation/questions/@congeler/reponse" sur chaque texte éditable.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** La base de l'aperçu, ou rien. Une seule façon de construire l'aperçu : la variable seule le déclenche. */
const BASE = process.env.APERCU_BASE?.trim() || "";

export const APERCU = BASE !== "";

type Attributs = Record<string, string>;

/** Le repère d'un champ éditable : `{ "data-champ": chemin }` en aperçu, rien sinon. */
export function repere(chemin: string): Attributs {
  return APERCU ? { "data-champ": chemin } : {};
}

/** Le repère d'un bloc : son nom et son fichier de contenu/, en aperçu seulement. */
export function repereBloc(nom: string, fichier: string): Attributs {
  return APERCU ? { "data-bloc": nom, "data-repere": fichier } : {};
}

/**
 * Le script d'édition, lu à la construction et posé en ligne en bas de page (aperçu seulement).
 * Il ne passe jamais par public/ ni par un fichier de _astro/ : il partirait sur le site public.
 */
export function scriptEdition(): { code: string; base: string } | null {
  if (!APERCU) return null;
  return { code: readFileSync(join(process.cwd(), "src/contenu/apercu/edition.js"), "utf8"), base: BASE };
}
