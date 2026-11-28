#!/usr/bin/env node
/**
 * Comparateur de deux constructions du site (dossiers dist).
 *
 *   node scripts/comparer-html.mjs <avant> <apres>
 *   npm run comparer -- <avant> <apres>
 *
 * Il prouve qu'un changement « sans effet visible » l'est vraiment.
 * Six règles (projet 08, rendu/07 § 2) :
 *   1. La liste des fichiers produits est la même.
 *   2. Chaque page HTML, lue comme un arbre : mêmes balises, mêmes attributs,
 *      mêmes valeurs, mêmes textes, dans le même ordre. Aucune tolérance sur les espaces.
 *   3. Les fichiers liés (images, scripts, polices) : même contenu, à l'octet.
 *   4. La feuille de style : aucune règle d'avant modifiée, perdue ou déplacée.
 *      Des règles en plus sont permises (elles sont comptées et listées).
 *   5. _headers, _redirects, robots.txt, favicons : identiques à l'octet (couvert par la règle 3).
 *   6. Le plan du site : identique, hors date de mise à jour (<lastmod>).
 *
 * Différences admises, et seulement celles-là :
 *   - le nom de la feuille de style (elle grossit, donc son nom change) ;
 *   - la date du plan du site ;
 *   - version.json (il apparaît au lot L0 et change à chaque construction).
 *
 * Si un écart apparaît, on corrige le composant, jamais ce comparateur.
 * Sortie : 0 si identique, 1 si au moins une différence, 2 si erreur d'usage.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep, basename } from "node:path";
import { parse } from "parse5";
import postcss from "postcss";

const ADMIS = new Set(["version.json"]);
const EST_CSS = (f) => f.endsWith(".css");
const EST_HTML = (f) => f.endsWith(".html");
const EST_PLAN = (f) => /^sitemap.*\.xml$/.test(basename(f));

/* ── Fichiers ─────────────────────────────────────────────────────── */
function lister(racine) {
  const out = [];
  const marcher = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) marcher(p);
      else out.push(relative(racine, p).split(sep).join("/"));
    }
  };
  marcher(racine);
  return out.sort();
}

/** Nom de feuille sans son empreinte : « _astro/BaseLayout.Bwb1sqwy.css » → « _astro/BaseLayout.css ». */
const familleCss = (f) => f.replace(/\.[A-Za-z0-9_-]{6,}\.css$/, ".css");

/* ── Règle 2 : l'arbre HTML ───────────────────────────────────────── */
function aplatir(noeud, chemin, out, renommer) {
  for (const [i, n] of (noeud.childNodes ?? []).entries()) {
    if (n.nodeName === "#text") {
      out.push({ chemin: `${chemin} › texte[${i}]`, v: `texte:${JSON.stringify(n.value)}` });
    } else if (n.nodeName === "#comment") {
      out.push({ chemin: `${chemin} › commentaire[${i}]`, v: `commentaire:${JSON.stringify(n.data)}` });
    } else if (n.nodeName === "#documentType") {
      out.push({ chemin: "doctype", v: `doctype:${n.name}` });
    } else if (n.tagName) {
      const attrs = n.attrs.map((a) => `${a.name}=${JSON.stringify(renommer(a.value))}`).join(" ");
      const ici = `${chemin} › ${n.tagName}[${i}]`;
      out.push({ chemin: ici, v: `<${n.tagName} ${attrs}>` });
      // <template> range ses enfants à part.
      aplatir(n.content ?? n, ici, out, renommer);
      out.push({ chemin: ici, v: `</${n.tagName}>` });
    }
  }
  return out;
}

function comparerHtml(a, b, renommer) {
  const ga = aplatir(parse(a), "", [], (v) => v);
  const gb = aplatir(parse(b), "", [], renommer);
  const n = Math.max(ga.length, gb.length);
  for (let i = 0; i < n; i++) {
    if (ga[i]?.v !== gb[i]?.v) {
      return [
        `premier écart au nœud ${i + 1} (${ga[i]?.chemin ?? gb[i]?.chemin})`,
        `  avant : ${court(ga[i]?.v ?? "(rien)")}`,
        `  après : ${court(gb[i]?.v ?? "(rien)")}`,
      ];
    }
  }
  return [];
}
const court = (s) => (s.length > 300 ? s.slice(0, 300) + "…" : s);

/* ── Règle 4 : la feuille de style ────────────────────────────────── */
/** Liste ordonnée des règles : « contexte ‖ sélecteur ‖ déclarations ». */
function regles(css) {
  const out = [];
  const contexte = (n) => {
    const c = [];
    for (let p = n.parent; p && p.type !== "root"; p = p.parent) {
      if (p.type === "atrule") c.unshift(`@${p.name} ${p.params}`);
      else if (p.type === "rule") c.unshift(p.selector);
    }
    return c.join(" › ");
  };
  const decls = (n) =>
    (n.nodes ?? [])
      .filter((d) => d.type === "decl")
      .map((d) => `${d.prop}:${d.value}${d.important ? "!important" : ""}`)
      .join(";");
  postcss.parse(css).walk((n) => {
    if (n.type === "rule") {
      out.push({ cle: `${contexte(n)} ‖ ${n.selector}`, v: decls(n) });
    } else if (n.type === "atrule") {
      const aDecls = (n.nodes ?? []).some((d) => d.type === "decl");
      if (!n.nodes || aDecls) out.push({ cle: `${contexte(n)} ‖ @${n.name} ${n.params}`, v: decls(n) });
    }
  });
  return out;
}

function comparerCss(a, b) {
  const ra = regles(a);
  const rb = regles(b);
  const ecarts = [];
  // On cherche chaque règle d'avant dans après, dans l'ordre (sous-suite).
  let j = 0;
  const ajoutees = [];
  for (const r of ra) {
    let k = j;
    while (k < rb.length && !(rb[k].cle === r.cle && rb[k].v === r.v)) k++;
    if (k === rb.length) {
      const meme = rb.find((x) => x.cle === r.cle);
      if (meme) ecarts.push(`règle modifiée ou déplacée : ${r.cle}\n    avant : ${r.v}\n    après : ${meme.v}`);
      else ecarts.push(`règle perdue : ${r.cle} { ${r.v} }`);
      continue;
    }
    ajoutees.push(...rb.slice(j, k));
    j = k + 1;
  }
  ajoutees.push(...rb.slice(j));
  // Une règle modifiée n'est pas comptée en plus comme « ajoutée ».
  const clesAvant = new Set(ra.map((r) => r.cle));
  const vraimentAjoutees = ajoutees.filter((r) => !clesAvant.has(r.cle));
  return { ecarts, ajoutees: vraimentAjoutees, total: { avant: ra.length, apres: rb.length } };
}

/* ── Règle 6 : le plan du site ────────────────────────────────────── */
const sansDate = (xml) => xml.replace(/<lastmod>[^<]*<\/lastmod>/g, "<lastmod/>");

/* ── Programme ────────────────────────────────────────────────────── */
function main() {
  const [avant, apres] = process.argv.slice(2);
  if (!avant || !apres || !existsSync(avant) || !existsSync(apres)) {
    console.error("Usage : node scripts/comparer-html.mjs <dist-avant> <dist-apres>");
    process.exit(2);
  }
  const fa = lister(avant).filter((f) => !ADMIS.has(f));
  const fb = lister(apres).filter((f) => !ADMIS.has(f));
  const differences = [];
  const dire = (regle, f, lignes) => differences.push({ regle, f, lignes });

  // Règle 1 — la liste des fichiers ; seule la feuille de style peut changer de nom.
  const cssA = fa.filter(EST_CSS);
  const cssB = fb.filter(EST_CSS);
  const renoms = new Map(); // ancien nom → nouveau nom
  for (const c of cssA) {
    if (cssB.includes(c)) continue;
    const pareils = cssB.filter((d) => !cssA.includes(d) && familleCss(d) === familleCss(c));
    if (pareils.length === 1) renoms.set(c, pareils[0]);
  }
  const nouveauxNoms = new Set(renoms.values());
  const lb = new Set(fb);
  for (const f of fa) if (!lb.has(f) && !renoms.has(f)) dire(1, f, ["fichier disparu"]);
  const la = new Set(fa);
  for (const f of fb) if (!la.has(f) && !nouveauxNoms.has(f)) dire(1, f, ["fichier en plus"]);

  // Dans le HTML d'après, le nouveau nom de feuille est ramené à l'ancien.
  const renommer = (v) => {
    for (const [ancien, nouveau] of renoms) v = v.split(basename(nouveau)).join(basename(ancien));
    return v;
  };

  let pages = 0;
  let css = null;
  for (const f of fa) {
    const g = renoms.get(f) ?? f;
    if (!lb.has(g)) continue;
    const A = readFileSync(join(avant, f));
    const B = readFileSync(join(apres, g));
    if (EST_HTML(f)) {
      pages++;
      const l = comparerHtml(A.toString("utf8"), B.toString("utf8"), renommer);
      if (l.length) dire(2, f, l);
    } else if (EST_CSS(f)) {
      const r = comparerCss(A.toString("utf8"), B.toString("utf8"));
      css = css ?? { ajoutees: [], modifiees: 0, total: { avant: 0, apres: 0 } };
      css.ajoutees.push(...r.ajoutees);
      css.modifiees += r.ecarts.length;
      css.total.avant += r.total.avant;
      css.total.apres += r.total.apres;
      if (r.ecarts.length) dire(4, f, r.ecarts);
    } else if (EST_PLAN(f)) {
      if (sansDate(A.toString("utf8")) !== sansDate(B.toString("utf8"))) dire(6, f, ["plan du site différent (hors date)"]);
    } else if (!A.equals(B)) {
      dire(f.startsWith("_astro/") ? 3 : 5, f, ["contenu différent"]);
    }
  }

  // Rapport
  for (const d of differences) {
    console.log(`✗ règle ${d.regle} — ${d.f}`);
    for (const l of d.lignes) console.log(`    ${l}`);
  }
  const nDiffHtml = differences.filter((d) => d.regle === 2).length;
  console.log("");
  console.log(`${pages} pages comparées, ${nDiffHtml} différence${nDiffHtml > 1 ? "s" : ""}.`);
  if (css) {
    console.log(
      `Feuille de style : ${css.modifiees} règle${css.modifiees > 1 ? "s" : ""} modifiée${css.modifiees > 1 ? "s" : ""} ou perdue${css.modifiees > 1 ? "s" : ""}, ` +
        `${css.ajoutees.length} ajoutée${css.ajoutees.length > 1 ? "s" : ""} (${css.total.avant} → ${css.total.apres} règles).`,
    );
    if (process.argv.includes("--detail") && css.ajoutees.length) {
      for (const r of css.ajoutees) console.log(`    + ${r.cle}`);
    }
  }
  for (const [a, b] of renoms) console.log(`Feuille renommée (admis) : ${a} → ${b}`);
  const autres = differences.length - nDiffHtml;
  console.log(autres ? `Autres écarts : ${autres}.` : "Fichiers, fichiers liés, plan du site : identiques.");
  console.log(differences.length ? "\nROUGE" : "\nVERT");
  process.exit(differences.length ? 1 : 0);
}

main();
