/**
 * Le chargeur du contenu : lit, valide, résout (projet 08, lot L0).
 *
 * - Lit les fichiers JSON de contenu/ (à la racine du dépôt).
 * - Les valide par le schéma. Une erreur arrête la construction, avec le fichier
 *   et le champ en clair : « contenu/site/partages/faq.json, champ rubriques[0].titre : … ».
 * - Résout : donne aux composants le contexte du moteur de texte (liens externes).
 *
 * Il tourne à la construction (Node), jamais dans le navigateur.
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { z } from "astro/zod";
import { FICHIERS, enFrancais, type Faq, type Liens } from "./schema.ts";
import type { Contexte } from "./texte.ts";

/** La racine de contenu/. La construction part toujours de la racine du dépôt. */
export const RACINE_CONTENU = join(process.cwd(), "contenu");

type Chemin = keyof typeof FICHIERS;

export class ErreurContenu extends Error {
  fichier: string;
  details: string[];
  constructor(fichier: string, details: string[]) {
    super(`Contenu invalide — contenu/${fichier}\n${details.map((d) => `  • ${d}`).join("\n")}`);
    this.name = "ErreurContenu";
    this.fichier = fichier;
    this.details = details;
  }
}

const champ = (chemin: readonly PropertyKey[]) =>
  chemin.reduce<string>((s, k) => (typeof k === "number" ? `${s}[${k}]` : s ? `${s}.${String(k)}` : String(k)), "") || "(racine)";

/** Chaque liste d'objets à `id` a des id uniques (règle R93 : un id ne se réutilise pas). */
function idsEnDouble(v: unknown, chemin = ""): string[] {
  const out: string[] = [];
  if (Array.isArray(v)) {
    const vus = new Set<string>();
    v.forEach((x, i) => {
      const id = (x as { id?: unknown })?.id;
      if (typeof id === "string") {
        if (vus.has(id)) out.push(`champ ${chemin}[${i}].id : « ${id} » est déjà pris dans cette liste`);
        vus.add(id);
      }
      out.push(...idsEnDouble(x, `${chemin}[${i}]`));
    });
  } else if (v && typeof v === "object") {
    for (const [k, x] of Object.entries(v)) out.push(...idsEnDouble(x, chemin ? `${chemin}.${k}` : k));
  }
  return out;
}

/** Lit et valide un fichier. Lève ErreurContenu au moindre écart. Pas de cache : en mode dev, un fichier changé se relit. */
export function lireFichier<C extends Chemin>(chemin: C): z.infer<(typeof FICHIERS)[C]> {
  const complet = join(RACINE_CONTENU, chemin);
  if (!existsSync(complet)) throw new ErreurContenu(chemin, ["fichier absent"]);
  let brut: unknown;
  try {
    brut = JSON.parse(readFileSync(complet, "utf8"));
  } catch (e) {
    throw new ErreurContenu(chemin, [`JSON illisible : ${(e as Error).message}`]);
  }
  const r = FICHIERS[chemin].safeParse(brut, { error: enFrancais });
  // Toutes les fautes d'un coup : celles du schéma, puis les id en double.
  const fautes = r.success ? [] : r.error.issues.map((i) => `champ ${champ(i.path)} : ${i.message}`);
  fautes.push(...idsEnDouble(brut));
  if (fautes.length || !r.success) throw new ErreurContenu(chemin, fautes);
  return r.data as never;
}

/** Les fichiers partagés, par leur nom (« faq » → contenu/site/partages/faq.json). */
const PARTAGES = { faq: "site/partages/faq.json" } as const satisfies Record<string, Chemin>;

export function chargerPartage(nom: "faq"): Faq;
export function chargerPartage(nom: keyof typeof PARTAGES) {
  return lireFichier(PARTAGES[nom]);
}

export function chargerLiens(): Liens {
  return lireFichier("site/partages/liens.json");
}

/** Le contexte du moteur de texte. La classe des liens vient du composant, jamais du contenu. */
export function contexteTexte(options: Omit<Contexte, "liens"> = {}): Contexte {
  return { ...options, liens: chargerLiens() };
}

/**
 * Valide TOUT contenu/ : chaque fichier présent doit être connu du schéma et valide.
 * Rend la liste des erreurs (vide = tout va bien). Appelée au début de chaque construction
 * (integration.ts) et par `npm run verifier`.
 */
export function verifierTout(): string[] {
  const erreurs: string[] = [];
  if (!existsSync(RACINE_CONTENU)) return ["dossier contenu/ absent"];
  const presents: string[] = [];
  const marcher = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) marcher(p);
      else presents.push(relative(RACINE_CONTENU, p).split(sep).join("/"));
    }
  };
  marcher(RACINE_CONTENU);
  for (const f of presents.sort()) {
    if (!(f in FICHIERS)) {
      erreurs.push(`contenu/${f} : fichier inconnu du schéma (src/contenu/schema.ts, FICHIERS)`);
      continue;
    }
    try {
      lireFichier(f as Chemin);
    } catch (e) {
      erreurs.push((e as Error).message);
    }
  }
  return erreurs;
}
