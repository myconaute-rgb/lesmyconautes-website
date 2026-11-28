#!/usr/bin/env node
/**
 * Vérifie un geste de l'éditeur (projet 08, pas 2 ; rendu/11 § 6.1 et § 6.5).
 *
 *   echo '{ "geste": {…}, "arbre": {…} }' | node scripts/champ.mjs
 *
 * L'atelier le lance dans un processus enfant, depuis sa copie du dernier main : c'est toujours
 * le schéma de ce main qui juge (04 § 9). L'atelier n'importe ni le schéma ni le moteur de texte.
 *
 * Entrée (JSON sur l'entrée standard) :
 *   geste : { geste: "changer", fichier: "site/partages/faq.json", sur: "/rubriques/@x/questions/@y/reponse", avant, apres }
 *   arbre : le contenu du fichier tel que l'atelier le connaît (dernier main + brouillon)
 * Sortie (une ligne JSON) :
 *   { etat: "ok", apres, corrections, signalements, cle, bloc, visibleAvant, visibleApres }
 *   { etat: "refuse", regle, raison }
 *   { etat: "pas_encore" }      un geste qui n'est pas « changer » (pas 6)
 *   { etat: "introuvable" }     le champ n'existe plus dans l'arbre (l'atelier en fait un conflit)
 * Code de sortie : 0 dans ces quatre cas ; 2 si l'entrée est illisible.
 */
import { join } from "node:path";

const RACINE = process.cwd();
const { FICHIERS, enFrancais } = await import(join(RACINE, "src/contenu/schema.ts"));
const { FICHES } = await import(join(RACINE, "src/contenu/edition.ts"));
const { verifierEcriture } = await import(join(RACINE, "src/contenu/ecriture.ts"));
const { analyserTexte } = await import(join(RACINE, "src/contenu/texte.ts"));

const repondre = (o) => {
  process.stdout.write(JSON.stringify(o) + "\n");
  process.exit(0);
};
const refuser = (regle, raison) => repondre({ etat: "refuse", regle, raison });

/* ── Les chemins : « /rubriques/@conservation/questions/@congeler/reponse » ── */
const RE_CLE = /^[A-Za-z][A-Za-z0-9]*$/;
const RE_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const RE_FICHIER = /^[a-z0-9-]+(\/[a-z0-9-]+)*\.json$/;

/** Découpe un chemin. Rend null s'il est mal écrit : une clé, puis des paires « liste / @id », une clé à la fin. */
function decouper(sur) {
  if (typeof sur !== "string" || !sur.startsWith("/") || sur.length > 300) return null;
  const morceaux = sur.slice(1).split("/");
  const out = [];
  for (const m of morceaux) {
    if (m.startsWith("@")) {
      if (!RE_ID.test(m.slice(1)) || !out.length || out.at(-1).id !== undefined) return null;
      out.push({ id: m.slice(1) });
    } else if (RE_CLE.test(m)) out.push({ cle: m });
    else return null;
  }
  return out.length && out.at(-1).cle ? out : null;
}

/** « rubriques[].questions[].reponse » : la clé de la fiche d'édition. */
const cleFiche = (segs) => segs.map((s) => (s.cle ?? "[]")).join(".").replace(/\.\[\]/g, "[]");

/** Lit la valeur au bout du chemin, ou undefined. */
function lire(arbre, segs) {
  let v = arbre;
  for (const s of segs) {
    if (s.cle !== undefined) {
      if (!v || typeof v !== "object" || Array.isArray(v) || !Object.hasOwn(v, s.cle)) return undefined;
      v = v[s.cle];
    } else {
      if (!Array.isArray(v)) return undefined;
      v = v.find((x) => x && x.id === s.id);
    }
  }
  return v;
}

function ecrire(arbre, segs, valeur) {
  const copie = structuredClone(arbre);
  let v = copie;
  segs.forEach((s, i) => {
    const dernier = i === segs.length - 1;
    if (s.cle !== undefined) {
      if (dernier) v[s.cle] = valeur;
      else v = v[s.cle];
    } else v = v.find((x) => x.id === s.id);
  });
  return copie;
}

/** Le schéma zod du champ : on descend objets, listes et facultatifs. */
function schemaDuChamp(schema, segs) {
  let s = schema;
  let facultatif = false;
  const deballer = () => {
    while (s?.def?.type === "optional") {
      facultatif = true;
      s = s.unwrap();
    }
  };
  for (const g of segs) {
    deballer();
    facultatif = false;
    if (g.cle !== undefined) s = s?.shape?.[g.cle];
    else s = s?.element;
  }
  deballer();
  return s ? { schema: s, facultatif } : null;
}

/** Le texte que l'on lira dans la page : les morceaux visibles, coupés aux retours à la ligne et aux jetons. */
function visible(s) {
  const morceaux = [""];
  const marcher = (noeuds) => {
    for (const n of noeuds) {
      if (n.t === "texte") morceaux[morceaux.length - 1] += n.v;
      else if (n.t === "ligne" || n.t === "jeton" || n.t === "variable") morceaux.push("");
      else if (n.enfants) marcher(n.enfants);
    }
  };
  marcher(analyserTexte(s, { italique: true, gras: true, liens: true, lignes: true, jetons: true }).noeuds);
  return morceaux.map((m) => m.replace(/\s+/g, " ").trim()).filter(Boolean);
}

/* ── Le programme ────────────────────────────────────────────────── */
let entree = "";
for await (const morceau of process.stdin) entree += morceau;
let geste, arbre;
try {
  ({ geste, arbre } = JSON.parse(entree));
  if (!geste || typeof geste !== "object") throw new Error("geste absent");
} catch (e) {
  process.stderr.write(`entrée illisible : ${e.message}\n`);
  process.exit(2);
}

if (geste.geste !== "changer") repondre({ etat: "pas_encore" });

const { fichier, sur, avant, apres } = geste;
if (typeof fichier !== "string" || !RE_FICHIER.test(fichier) || fichier.split("/").includes("..") || !Object.hasOwn(FICHIERS, fichier)) {
  refuser("fichier", "Ce fichier n'est pas un fichier de contenu du site");
}
const fiche = Object.values(FICHES).find((f) => f.fichier === fichier);
const segs = decouper(sur);
if (!segs) refuser("R1", "Ce champ n'existe pas");
const cle = cleFiche(segs);
if (!fiche || !Object.hasOwn(fiche.champs, cle)) refuser("R1", "Ce champ ne se change pas dans l'éditeur");
if (typeof avant !== "string" || typeof apres !== "string") refuser("R1", "Ce geste ne porte pas sur un texte");

const actuel = lire(arbre, segs);
if (actuel === undefined) repondre({ etat: "introuvable" });
if (typeof actuel !== "string") refuser("R1", "Ce champ n'est pas un texte");

const champ = schemaDuChamp(FICHIERS[fichier], segs);
if (!champ || typeof champ.schema.maxLength !== "number") refuser("R1", "Ce champ n'a pas de limite connue dans le schéma");

const verdict = verifierEcriture(avant, apres, { max: champ.schema.maxLength, obligatoire: !champ.facultatif });
if (verdict.etat === "refuse") repondre(verdict);

// Dernier mot au schéma : le fichier entier, avec ce texte, doit rester valide (signes permis, liens, etc.).
const r = FICHIERS[fichier].safeParse(ecrire(arbre, segs, verdict.apres), { error: enFrancais });
if (!r.success) {
  const ici = r.error.issues.filter((i) => i.path.length).map((i) => i.message);
  refuser("schema", [...new Set(ici.length ? ici : r.error.issues.map((i) => i.message))].join(" ; "));
}

repondre({
  etat: "ok",
  apres: verdict.apres,
  corrections: verdict.corrections,
  signalements: verdict.signalements,
  cle,
  bloc: fiche.type,
  libelle: fiche.champs[cle].libelle,
  visibleAvant: visible(avant),
  visibleApres: visible(verdict.apres),
});
