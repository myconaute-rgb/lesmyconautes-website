#!/usr/bin/env node
/**
 * npm run verifier — les contrôles qui empêchent de revenir en arrière sans le voir
 * (projet 08, rendu/07 § 8 et 09 § 3 n° 4).
 *
 *   1. Le schéma : chaque fichier de contenu/ est connu et valide.
 *   2. « Aucun texte en dur » : les composants migrés n'écrivent aucune phrase (règle R92).
 *   3. Chaque classe de src/contenu/formes.ts existe dans la feuille de style produite.
 *   4. Les tests du moteur de texte (src/contenu/texte.ts).
 *
 * Il construit le site d'abord (le contrôle 3 lit dist/). `--sans-construction` saute cette étape.
 * L'atelier lance la même vérification avant chaque publication.
 * Node lit les fichiers .ts directement (Node ≥ 22.18).
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import assert from "node:assert/strict";

const RACINE = process.cwd();
const resultats = [];
const controle = async (nom, fn) => {
  try {
    const erreurs = (await fn()) ?? [];
    resultats.push({ nom, erreurs });
  } catch (e) {
    resultats.push({ nom, erreurs: [e.stack ?? String(e)] });
  }
};

/* ── Composants migrés : leurs mots vivent dans contenu/ ──────────────
   Chaque lot ajoute ici ses composants. `verrouilles` liste les textes
   qui restent volontairement dans le code (verrouillés, hors éditeur). */
const COMPOSANTS_MIGRES = [
  // { fichier: "src/components/FaqCommune.astro", verrouilles: [] },   // lot L1
];

/** Les phrases restées dans le gabarit d'un composant .astro (hors frontmatter, scripts, expressions). */
function textesEnDur(source, verrouilles = []) {
  let s = source.replace(/^---\n[\s\S]*?\n---\n/, (m) => "\n".repeat(m.split("\n").length - 1));
  const blanchir = (m) => m.replace(/[^\n]/g, " ");
  s = s.replace(/<!--[\s\S]*?-->/g, blanchir);
  s = s.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, blanchir);
  // Expressions { … } (imbriquées) : du code, pas du texte.
  let out = "";
  let prof = 0;
  for (const c of s) {
    if (c === "{") prof++;
    out += prof > 0 && c !== "\n" ? " " : c;
    if (c === "}" && prof > 0) prof--;
  }
  s = out;
  const trouves = [];
  const ligne = (i) => s.slice(0, i).split("\n").length;
  // Attributs qui portent des mots lus par les visiteurs.
  for (const m of s.matchAll(/\b(alt|title|aria-label|placeholder|value)="([^"]*)"/g)) {
    if (/\p{L}/u.test(m[2]) && !verrouilles.includes(m[2])) trouves.push(`ligne ${ligne(m.index)} : ${m[1]}="${m[2]}"`);
  }
  // Une phrase passée en paramètre à un composant (<FAQItem question="…">).
  for (const tag of s.matchAll(/<[A-Z][A-Za-z0-9.]*\b[^>]*>/g)) {
    for (const m of tag[0].matchAll(/\s([a-zA-Z][\w-]*)="([^"]*)"/g)) {
      if (/\p{L}/u.test(m[2]) && /\s/.test(m[2].trim()) && !verrouilles.includes(m[2])) {
        trouves.push(`ligne ${ligne(tag.index)} : ${m[1]}="${m[2]}"`);
      }
    }
  }
  // Texte entre les balises.
  const sansBalises = s.replace(/<[^>]*>/g, blanchir);
  for (const m of sansBalises.matchAll(/[^\s][^\n]*/g)) {
    const t = m[0].trim();
    if (/\p{L}/u.test(t) && !verrouilles.includes(t)) trouves.push(`ligne ${ligne(m.index)} : « ${t} »`);
  }
  return trouves;
}

/** Échappe une classe Tailwind comme dans la feuille produite (`md:py-16` → `md\:py-16`). */
const echapperClasse = (c) => c.replace(/[^A-Za-z0-9_-]/g, (x) => `\\${x}`);
const reEchap = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ── 1. Le schéma ─────────────────────────────────────────────────── */
await controle("Schéma du contenu", async () => {
  const { verifierTout } = await import(join(RACINE, "src/contenu/charger.ts"));
  return verifierTout();
});

/* ── 2. Aucun texte en dur ────────────────────────────────────────── */
await controle(`Aucun texte en dur (${COMPOSANTS_MIGRES.length} composant${COMPOSANTS_MIGRES.length > 1 ? "s" : ""} migré${COMPOSANTS_MIGRES.length > 1 ? "s" : ""})`, () => {
  const erreurs = [];
  for (const { fichier, verrouilles = [] } of COMPOSANTS_MIGRES) {
    for (const t of textesEnDur(readFileSync(join(RACINE, fichier), "utf8"), verrouilles)) erreurs.push(`${fichier}, ${t}`);
  }
  // Le détecteur lui-même : il doit voir une phrase, et ignorer le code.
  assert.deepEqual(textesEnDur('---\nconst a = "Bonjour";\n---\n<p class="x">{a}</p>\n'), []);
  assert.equal(textesEnDur('<h2>Tout <em>savoir</em></h2>').length, 1);
  assert.equal(textesEnDur('<img alt="Une cagette" src={x} />').length, 1);
  assert.deepEqual(textesEnDur('<span aria-hidden="true">+</span>'), []);
  assert.equal(textesEnDur('<FAQItem variant="editorial" question="Faut-il les laver ?" />').length, 1);
  return erreurs;
});

/* ── 3. Chaque classe de formes.ts existe dans la feuille ─────────── */
if (!process.argv.includes("--sans-construction")) {
  process.stdout.write("Construction du site (astro build)… ");
  execSync("npx astro build", { stdio: "ignore" });
  console.log("faite.");
}
await controle("Classes de formes.ts présentes dans la feuille", async () => {
  const dossier = join(RACINE, "dist/_astro");
  if (!existsSync(dossier)) return ["dist/ absent : lance npm run build (ou retire --sans-construction)"];
  const css = readdirSync(dossier).filter((f) => f.endsWith(".css")).map((f) => readFileSync(join(dossier, f), "utf8")).join("\n");
  const { TOUTES_LES_FORMES } = await import(join(RACINE, "src/contenu/formes.ts"));
  const erreurs = [];
  let n = 0;
  for (const [liste, valeurs] of Object.entries(TOUTES_LES_FORMES)) {
    for (const [cle, classes] of Object.entries(valeurs)) {
      for (const c of classes.split(/\s+/).filter(Boolean)) {
        n++;
        const re = new RegExp(`\\.${reEchap(echapperClasse(c))}(?![A-Za-z0-9_\\\\-])`);
        if (!re.test(css)) erreurs.push(`${liste}.${cle} : la classe « ${c} » est absente de la feuille`);
      }
    }
  }
  if (n === 0) erreurs.push("aucune classe lue dans formes.ts");
  return erreurs;
});

/* ── 4. Le moteur de texte ────────────────────────────────────────── */
await controle("Tests du moteur de texte", async () => {
  const { analyserTexte, rendreTexte } = await import(join(RACINE, "src/contenu/texte.ts"));
  const tout = { italique: true, gras: true, liens: true, lignes: true, jetons: true };
  const liens = { "pour-de-bon": { adresse: "https://www.pourdebon.com/les-myconautes-s1527" } };
  const classeLien = "underline underline-offset-4 hover:text-violet";
  const cas = [
    // [nom, texte, règles, contexte, HTML attendu]
    ["texte simple", "Faut-il les laver ?", {}, {}, "Faut-il les laver ?"],
    ["italique d'aujourd'hui", "Tout *savoir* sur nos champignons", tout, {},
      'Tout <em class="italic">savoir</em> sur nos champignons'],
    ["italique classe vide", "*a*", tout, { classeItalique: "" }, "<em>a</em>"],
    ["gras", "**On a ce qu'il vous faut !**", tout, {}, "<strong>On a ce qu&#39;il vous faut !</strong>"],
    ["gras et italique imbriqués", "**très *bon***", tout, {}, '<strong>très <em class="italic">bon</em></strong>'],
    ["retour à la ligne", "Envie de\n*goûter ?*", tout, {}, 'Envie de<br><em class="italic">goûter ?</em>'],
    ["lien vers une page", "[contactez-nous](page:/contact) !", tout, { classeLien },
      `<a href="/contact" class="${classeLien}">contactez-nous</a> !`],
    ["lien avec ancre", "[la FAQ](page:/pros#faq)", tout, {}, '<a href="/pros#faq">la FAQ</a>'],
    ["lien vers une ancre", "[culture](ancre:culture)", tout, {}, '<a href="#culture">culture</a>'],
    ["lien externe", "boutique [Pour de Bon](externe:pour-de-bon).", tout, { liens, classeLien },
      `boutique <a href="https://www.pourdebon.com/les-myconautes-s1527" target="_blank" rel="noopener" class="${classeLien}">Pour de Bon</a>.`],
    ["jeton", "Tarif : {{tournee.tarif}}", tout, { donnee: (n) => (n === "tournee.tarif" ? "4,20 €" : undefined) }, "Tarif : 4,20 €"],
    ["variable permise", "Code envoyé à {email}", { variables: ["email"] }, { variables: { email: "a@b.fr" } }, "Code envoyé à a@b.fr"],
    ["accolades sans variables = texte", "{email}", {}, {}, "{email}"],
    ["<script> ressort en texte", '<script>alert("x")</script>', tout, {},
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"],
    ["& et balises échappés", "Retrait & livraison <b>", {}, {}, "Retrait &amp; livraison &lt;b&gt;"],
    ["crochets sans lien = texte", "[note] (voir)", tout, {}, "[note] (voir)"],
    ["emoji", "🍄 Nos produits", {}, {}, "🍄 Nos produits"],
  ];
  const erreurs = [];
  for (const [nom, s, r, ctx, attendu] of cas) {
    try {
      const obtenu = rendreTexte(s, r, ctx);
      if (obtenu !== attendu) erreurs.push(`${nom} : attendu ${JSON.stringify(attendu)}, obtenu ${JSON.stringify(obtenu)}`);
    } catch (e) {
      erreurs.push(`${nom} : ${e.message}`);
    }
  }
  // Les fautes : analyserTexte les rend, rendreTexte refuse.
  const fautes = [
    ["gras interdit dans un titre", "**a**", { italique: true }],
    ["italique interdit", "*a*", {}],
    ["lien interdit", "[a](page:/contact)", { italique: true }],
    ["retour à la ligne interdit", "a\nb", {}],
    ["astérisque non fermé", "a *b", tout],
    ["gras non fermé", "**a", tout],
    ["chevauchement", "*a **b* c**", tout],
    ["sorte de lien inconnue", "[a](http://x.fr)", tout],
    ["ancre mal écrite", "[a](ancre:Pas Bon)", tout],
    ["jeton interdit", "{{a.b}}", {}],
    ["variable non permise", "{nom}", { variables: ["email"] }],
  ];
  for (const [nom, s, r] of fautes) {
    if (analyserTexte(s, r).erreurs.length === 0) erreurs.push(`${nom} : aucune erreur trouvée dans ${JSON.stringify(s)}`);
    assert.throws(() => rendreTexte(s, r, { liens }), undefined, nom);
  }
  // Un lien externe hors liste échoue au rendu.
  assert.throws(() => rendreTexte("[x](externe:inconnu)", tout, { liens }));
  // Le schéma rejette une page ou un lien externe inconnus.
  const { Paragraphe } = await import(join(RACINE, "src/contenu/schema.ts"));
  if (Paragraphe.safeParse("[a](page:/nulle-part)").success) erreurs.push("schéma : page inconnue acceptée");
  if (Paragraphe.safeParse("[a](externe:twitter)").success) erreurs.push("schéma : lien externe inconnu accepté");
  if (!Paragraphe.safeParse("[a](page:/contact)").success) erreurs.push("schéma : lien vers /contact refusé");
  return erreurs;
});

/* ── Bilan ────────────────────────────────────────────────────────── */
let rouge = false;
for (const { nom, erreurs } of resultats) {
  console.log(`${erreurs.length ? "✗" : "✓"} ${nom}`);
  for (const e of erreurs) console.log(`    ${e.split("\n").join("\n    ")}`);
  if (erreurs.length) rouge = true;
}
console.log(rouge ? "\nROUGE" : "\nVERT");
process.exit(rouge ? 1 : 0);
