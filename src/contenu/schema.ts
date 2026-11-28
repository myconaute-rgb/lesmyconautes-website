/**
 * Le schéma du contenu (projet 08, rendu/03 § 8, avec la correction K23).
 *
 * Il bloque à la construction : un fichier de contenu/ invalide arrête le build,
 * avec le fichier et le champ en clair (voir charger.ts).
 * Il doit accepter tout le contenu d'aujourd'hui, sinon la migration changerait le site.
 *
 * Lot L0 : les briques (Id, textes, Lien, Forme), les liens externes et la FAQ commune.
 * Les autres types de blocs arrivent avec leur lot (règle R96 : schéma, fiche d'édition, exemple).
 */
import { z } from "astro/zod";
import { analyserTexte, type Noeud, type Regles } from "./texte.ts";
import { TAILLE_TITRE, TAILLE_SCRIPT, TAILLE_TEXTE, ALIGNEMENT, LARGEUR, ESPACEMENT,
         COULEUR_TITRE, POLICE, CASSE } from "./formes.ts";

const cles = <T extends Record<string, unknown>>(o: T) =>
  Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];

/* ── 1. Les briques ─────────────────────────────────────────────── */
export const Id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(40);

export const PAGES = ["/", "/particuliers", "/pros", "/agriculteurs", "/myconautes", "/contact",
  "/substrat-pleurote-pro", "/substrat-eryngii-panicaut", "/substrat-hericium-pro",
  "/substrat-incube-pret-fructifier", "/cgv", "/cgv-substrat-pro",
  "/mentions-legales", "/politique-confidentialite"] as const;
export const EXTERNES = ["pour-de-bon", "instagram", "facebook"] as const;

/** Les liens d'un texte visent une page du site ou un lien externe de la liste fermée. */
function ciblesInconnues(noeuds: Noeud[], out: string[] = []): string[] {
  for (const n of noeuds) {
    if (n.t === "lien") {
      const c = n.cible;
      if ("page" in c && !(PAGES as readonly string[]).includes(c.page)) out.push(`page inconnue : « ${c.page} »`);
      if ("externe" in c && !(EXTERNES as readonly string[]).includes(c.externe)) out.push(`lien externe inconnu : « ${c.externe} »`);
    }
    if ("enfants" in n) ciblesInconnues(n.enfants, out);
  }
  return out;
}

export const texte = (r: Regles & { max: number }) =>
  z.string().min(1).max(r.max).superRefine((s, ctx) => {
    const a = analyserTexte(s, r);
    for (const e of [...a.erreurs, ...ciblesInconnues(a.noeuds)]) ctx.addIssue({ code: "custom", message: e });
  });

/** Les règles de chaque sorte de texte : le schéma valide avec, le composant rend avec. */
export const REGLES = {
  libelle:    { max: 60 },
  titre:      { max: 120, italique: true, lignes: true },        // jamais de gras
  script:     { max: 60 },                                       // jamais de gras
  phrase:     { max: 320, italique: true, gras: true, liens: true, jetons: true },
  paragraphe: { max: 900, italique: true, gras: true, liens: true, jetons: true, lignes: true },
  alt:        { max: 200 },
  question:   { max: 120 },
} as const satisfies Record<string, Regles & { max: number }>;

export const Libelle    = texte(REGLES.libelle);
export const Titre      = texte(REGLES.titre);
export const Script     = texte(REGLES.script);
export const Phrase     = texte(REGLES.phrase);
export const Paragraphe = texte(REGLES.paragraphe);
export const Alt        = texte(REGLES.alt);

export const Lien = z.union([
  z.object({ page: z.enum(PAGES), ancre: Id.optional() }).strict(),
  z.object({ ancre: Id }).strict(),
  z.object({ externe: z.enum(EXTERNES) }).strict(),
]);

/* ── 2. La forme : rien que des listes fermées ──────────────────── */
const align = z.enum(cles(ALIGNEMENT)).optional();
export const Forme = z.object({
  bloc:      z.object({ espacement: z.enum(cles(ESPACEMENT)) }).partial().strict(),
  titre:     z.object({ taille: z.enum(cles(TAILLE_TITRE)), couleur: z.enum(cles(COULEUR_TITRE)),
                        alignement: align, ligne2: z.enum(["alignee", "decalee"]) }).partial().strict(),
  sousTitre: z.object({ taille: z.enum(cles(TAILLE_SCRIPT)), casse: z.enum(cles(CASSE)),
                        place: z.enum(["avant", "apres"]) }).partial().strict(),
  accroche:  z.object({ police: z.enum(cles(POLICE)), taille: z.enum(cles(TAILLE_TITRE)),
                        casse: z.enum(cles(CASSE)), alignement: align }).partial().strict(),
  texte:     z.object({ taille: z.enum(cles(TAILLE_TEXTE)), alignement: align,
                        largeur: z.enum(cles(LARGEUR)) }).partial().strict(),
  boutons:   z.object({ alignement: align }).partial().strict(),
}).partial().strict();

const entete = { titre: Titre, sousTitre: Script.optional() };   // titre Anton + sous-titre Chewy

/* ── 3. Les fichiers partagés ───────────────────────────────────── */

/** contenu/site/partages/liens.json — verrouillé : il se change par une session, jamais par l'éditeur. */
const LienExterne = z.object({
  nom: Libelle,
  adresse: z.string().regex(/^https:\/\/[^\s"'<>]+$/),
}).strict();
export const Liens = z.object({
  schema: z.literal(1),
  verrou: z.literal("code"),
  ...Object.fromEntries(EXTERNES.map((e) => [e, LienExterne])) as Record<(typeof EXTERNES)[number], typeof LienExterne>,
}).strict();

/** contenu/site/partages/faq.json — la FAQ commune (accueil, particuliers, pros, myconautes). */
export const Faq = z.object({ schema: z.literal(1), type: z.literal("faq"), nom: Libelle, ...entete,
  forme: Forme.optional(),
  rubriques: z.array(z.object({ id: Id, titre: Libelle,
    questions: z.array(z.object({ id: Id, question: texte(REGLES.question), reponse: Paragraphe }).strict())
                .min(1).max(10) }).strict()).min(1).max(6) }).strict();

export type Liens = z.infer<typeof Liens>;
export type Faq = z.infer<typeof Faq>;

/** Chaque fichier de contenu/ et son schéma. Un fichier absent de cette liste est refusé. */
export const FICHIERS = {
  "site/partages/liens.json": Liens,
  "site/partages/faq.json": Faq,
} as const;

/** Les messages d'erreur, en français. */
export const enFrancais = z.locales.fr().localeError;
