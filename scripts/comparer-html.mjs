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
 *
 * Deux modes de plus, pour l'éditeur du site (projet 08, pas 2, rendu/11 § 5 E1 et § 6.7) :
 *
 *   --apercu <publique> <apercu> [--base /site/apercu/]
 *     L'aperçu, sans ses repères, est-il la construction publique ? Côté aperçu, il ignore trois
 *     choses et rien d'autre : les attributs data-champ, data-bloc, data-repere ; le script d'édition
 *     (<script data-edition>) ; le préfixe du sous-chemin. Les fichiers dont Astro tire le nom de la
 *     base (images optimisées, feuille de style) sont appariés par leur contenu, à l'octet, ou, pour la
 *     feuille, règle par règle une fois le préfixe retiré. Attendu : zéro différence, zéro règle ajoutée.
 *
 *   --perimetre <temoin> <controle> --carte <apercu> --blocs faq[,autre]
 *     Le contrôle du périmètre d'une publication (rendu/04 § 6, étape 6). <temoin> : la copie « en
 *     ligne » ; <controle> : la construction de contrôle ; --carte : la construction d'aperçu du même
 *     contenu, qui a le même arbre que <controle> (E1) plus les repères. Règles :
 *       - seules les pages où la carte montre un bloc touché ont le droit de changer ;
 *       - dans ces pages, chaque nœud qui diffère est sous un élément qui, dans la carte, porte un
 *         data-bloc touché ;
 *       - les formulaires, l'en-tête (<head>), les données structurées et le plan du site sont identiques ;
 *       - hors HTML : tout est identique, feuille de style comprise (aucune règle ajoutée).
 *
 *   --json : le rapport en JSON sur la sortie (pour l'atelier), au lieu du texte.
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
function aplatir(noeud, chemin, out, renommer, options = {}) {
  const { ignorerAttr = () => false, ignorerElement = () => false, renommerTexte = null } = options;
  for (const [i, n] of (noeud.childNodes ?? []).entries()) {
    if (n.nodeName === "#text") {
      const brut = n.value;
      const v = renommerTexte && ["script", "style"].includes(noeud.tagName) ? renommerTexte(brut) : brut;
      out.push({ chemin: `${chemin} › texte[${i}]`, v: `texte:${JSON.stringify(v)}` });
    } else if (n.nodeName === "#comment") {
      out.push({ chemin: `${chemin} › commentaire[${i}]`, v: `commentaire:${JSON.stringify(n.data)}` });
    } else if (n.nodeName === "#documentType") {
      out.push({ chemin: "doctype", v: `doctype:${n.name}` });
    } else if (n.tagName) {
      if (ignorerElement(n)) continue;
      const attrs = n.attrs.filter((a) => !ignorerAttr(a.name)).map((a) => `${a.name}=${JSON.stringify(renommer(a.value))}`).join(" ");
      const ici = `${chemin} › ${n.tagName}[${i}]`;
      out.push({ chemin: ici, v: `<${n.tagName} ${attrs}>` });
      // <template> range ses enfants à part.
      aplatir(n.content ?? n, ici, out, renommer, options);
      out.push({ chemin: ici, v: `</${n.tagName}>` });
    }
  }
  return out;
}

function comparerHtml(a, b, renommer, optionsB = {}) {
  const ga = aplatir(parse(a), "", [], (v) => v);
  const gb = aplatir(parse(b), "", [], renommer, optionsB);
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

/* ── Mode --apercu : ce qu'on ignore côté aperçu, et rien d'autre ─── */
const REPERES = new Set(["data-champ", "data-bloc", "data-repere"]);
const attr = (n, nom) => n.attrs?.find((a) => a.name === nom)?.value;
const estScriptEdition = (n) => n.tagName === "script" && attr(n, "data-edition") !== undefined;

/** « agri-eryngii.DQmy8let_1XU6oQ.webp » → « agri-eryngii.DQmy8let.webp » : l'image source, sans la variante. */
const familleImage = (f) => f.replace(/_[A-Za-z0-9_-]+(\.[a-z0-9]+)$/, "$1");

/* ── Mode --perimetre : la marche parallèle témoin / contrôle / carte ── */
const enfants = (n) => (n.content ?? n).childNodes ?? [];
const signature = (n) => {
  if (n.nodeName === "#text") return `texte:${JSON.stringify(n.value)}`;
  if (n.nodeName === "#comment") return `commentaire:${JSON.stringify(n.data)}`;
  if (n.nodeName === "#documentType") return `doctype:${n.name}`;
  if (!n.tagName) return n.nodeName; // #document, #document-fragment
  return `<${n.tagName} ${n.attrs.map((a) => `${a.name}=${JSON.stringify(a.value)}`).join(" ")}>`;
};
const serialiser = (n) => aplatir({ childNodes: [n] }, "", [], (v) => v).map((x) => x.v).join("\n");

function trouver(n, test, out = []) {
  if (n.tagName && test(n)) out.push(n);
  for (const c of enfants(n)) trouver(c, test, out);
  return out;
}

/**
 * Témoin et contrôle marchent ensemble ; la carte suit le contrôle (même arbre, E1), script d'édition ôté.
 * Sous un élément de la carte qui porte un data-bloc touché, tout écart est permis. Ailleurs, aucun.
 */
function comparerPerimetre(htmlTemoin, htmlControle, htmlCarte, blocs) {
  const ecarts = [];
  const blocsChanges = new Set();
  const marcher = (a, b, c, chemin) => {
    if (c && b.tagName !== c.tagName) throw new Error(`la carte ne suit pas le contrôle à ${chemin} (${b.tagName} / ${c.tagName}) : E1 est-il vert ?`);
    const bloc = c?.tagName ? attr(c, "data-bloc") : undefined;
    if (bloc && blocs.has(bloc)) {
      if (serialiser(a) !== serialiser(b)) blocsChanges.add(bloc);
      return;
    }
    if (signature(a) !== signature(b)) {
      ecarts.push(`${chemin} : hors des blocs touchés\n      témoin   : ${court(signature(a))}\n      contrôle : ${court(signature(b))}`);
      return;
    }
    const ka = enfants(a), kb = enfants(b), kc = c ? enfants(c).filter((x) => !estScriptEdition(x)) : [];
    if (c && kb.length !== kc.length) throw new Error(`la carte ne suit pas le contrôle à ${chemin} (${kb.length} / ${kc.length} enfants)`);
    if (ka.length !== kb.length) {
      ecarts.push(`${chemin} : ${ka.length} enfants dans le témoin, ${kb.length} dans le contrôle, hors des blocs touchés`);
      return;
    }
    for (let i = 0; i < kb.length; i++) marcher(ka[i], kb[i], c ? kc[i] : null, `${chemin} › ${kb[i].tagName ?? kb[i].nodeName}[${i}]`);
  };
  const [ta, tb, tc] = [parse(htmlTemoin), parse(htmlControle), parse(htmlCarte)];
  marcher(ta, tb, tc, "");
  // Ceinture et bretelles : formulaires, en-tête et données structurées identiques, même dans un bloc touché.
  const zones = [
    ["formulaire", (n) => n.tagName === "form"],
    ["en-tête", (n) => n.tagName === "head"],
    ["données structurées", (n) => n.tagName === "script" && attr(n, "type") === "application/ld+json"],
  ];
  for (const [nom, test] of zones) {
    const za = trouver(ta, test).map(serialiser), zb = trouver(tb, test).map(serialiser);
    if (za.length !== zb.length || za.some((z, i) => z !== zb[i])) ecarts.push(`${nom} : différent entre le témoin et le contrôle`);
  }
  return { ecarts, blocsChanges: [...blocsChanges] };
}

/* ── Programme ────────────────────────────────────────────────────── */
function lireArguments() {
  const args = process.argv.slice(2);
  const o = { positions: [], apercu: false, perimetre: false, json: false, detail: false, base: "/site/apercu/", carte: null, blocs: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--apercu") o.apercu = true;
    else if (a === "--perimetre") o.perimetre = true;
    else if (a === "--json") o.json = true;
    else if (a === "--detail") o.detail = true;
    else if (a === "--base") o.base = args[++i];
    else if (a === "--carte") o.carte = args[++i];
    else if (a === "--blocs") o.blocs = (args[++i] ?? "").split(",").filter(Boolean);
    else o.positions.push(a);
  }
  if (!o.base?.startsWith("/") || !o.base.endsWith("/") || o.base === "/") o.erreur = "--base doit ressembler à /site/apercu/";
  if (o.apercu && o.perimetre) o.erreur = "--apercu et --perimetre ne vont pas ensemble";
  if (o.perimetre && (!o.carte || !existsSync(o.carte) || !o.blocs.length)) o.erreur = "--perimetre demande --carte <dossier> et --blocs <noms>";
  return o;
}

function main() {
  const o = lireArguments();
  const [avant, apres] = o.positions;
  if (o.erreur || !avant || !apres || !existsSync(avant) || !existsSync(apres)) {
    console.error(o.erreur ?? "Usage : node scripts/comparer-html.mjs <dist-avant> <dist-apres> [--apercu | --perimetre --carte <dist> --blocs faq] [--json]");
    process.exit(2);
  }
  const mode = o.apercu ? "apercu" : o.perimetre ? "perimetre" : "lot";
  const sansPrefixe = (v) => v.split(o.base).join("/");
  const fa = lister(avant).filter((f) => !ADMIS.has(f));
  const fb = lister(apres).filter((f) => !ADMIS.has(f));
  const differences = [];
  const dire = (regle, f, lignes) => differences.push({ regle, f, lignes });

  // Règle 1 — la liste des fichiers ; seule la feuille de style peut changer de nom.
  // En mode aperçu, une image optimisée aussi : appariée par son contenu, à l'octet.
  const cssA = fa.filter(EST_CSS);
  const cssB = fb.filter(EST_CSS);
  const renoms = new Map(); // ancien nom → nouveau nom
  for (const c of cssA) {
    if (cssB.includes(c)) continue;
    const pareils = cssB.filter((d) => !cssA.includes(d) && familleCss(d) === familleCss(c));
    if (pareils.length === 1) renoms.set(c, pareils[0]);
  }
  if (mode === "apercu") {
    const sa = new Set(fa), sb = new Set(fb);
    const libres = new Map(); // famille → fichiers de l'aperçu absents du public
    for (const f of fb) if (!sa.has(f) && !EST_CSS(f)) (libres.get(familleImage(f)) ?? libres.set(familleImage(f), []).get(familleImage(f))).push(f);
    for (const f of fa) {
      if (sb.has(f) || EST_CSS(f)) continue;
      const candidats = libres.get(familleImage(f)) ?? [];
      const octets = readFileSync(join(avant, f));
      const k = candidats.findIndex((g) => readFileSync(join(apres, g)).equals(octets));
      if (k >= 0) renoms.set(f, candidats.splice(k, 1)[0]);
    }
  }
  const nouveauxNoms = new Set(renoms.values());
  const lb = new Set(fb);
  for (const f of fa) if (!lb.has(f) && !renoms.has(f)) dire(1, f, ["fichier disparu"]);
  const la = new Set(fa);
  for (const f of fb) if (!la.has(f) && !nouveauxNoms.has(f)) dire(1, f, ["fichier en plus"]);

  // Dans le HTML d'après, chaque nouveau nom est ramené à l'ancien.
  const renommerNoms = (v) => {
    for (const [ancien, nouveau] of renoms) v = v.split(basename(nouveau)).join(basename(ancien));
    return v;
  };
  const renommer = mode === "apercu" ? (v) => renommerNoms(sansPrefixe(v)) : renommerNoms;
  const optionsB = mode === "apercu"
    ? { ignorerAttr: (nom) => REPERES.has(nom), ignorerElement: estScriptEdition, renommerTexte: (v) => renommerNoms(sansPrefixe(v)) }
    : {};

  let pages = 0;
  let css = null;
  const perimetre = { attendues: [], changees: [], blocs: new Set() };
  const blocs = new Set(o.blocs);
  for (const f of fa) {
    const g = renoms.get(f) ?? f;
    if (!lb.has(g)) continue;
    const A = readFileSync(join(avant, f));
    const B = readFileSync(join(apres, g));
    if (EST_HTML(f)) {
      pages++;
      if (mode === "perimetre") {
        const cf = join(o.carte, f);
        if (!existsSync(cf)) { dire(2, f, ["page absente de la carte"]); continue; }
        const carte = readFileSync(cf, "utf8");
        const attendue = trouver(parse(carte), (n) => blocs.has(attr(n, "data-bloc"))).length > 0;
        if (attendue) perimetre.attendues.push(f);
        if (A.equals(B)) continue;
        perimetre.changees.push(f);
        if (!attendue) {
          const l = comparerHtml(A.toString("utf8"), B.toString("utf8"), (v) => v);
          dire(2, f, ["page hors périmètre : elle ne montre aucun bloc touché", ...l]);
          continue;
        }
        try {
          const r = comparerPerimetre(A.toString("utf8"), B.toString("utf8"), carte, blocs);
          r.blocsChanges.forEach((b) => perimetre.blocs.add(b));
          if (r.ecarts.length) dire(2, f, r.ecarts);
        } catch (e) {
          dire(2, f, [e.message]);
        }
        continue;
      }
      const l = comparerHtml(A.toString("utf8"), B.toString("utf8"), renommer, optionsB);
      if (l.length) dire(2, f, l);
    } else if (EST_CSS(f)) {
      const r = comparerCss(A.toString("utf8"), mode === "apercu" ? sansPrefixe(B.toString("utf8")) : B.toString("utf8"));
      css = css ?? { ajoutees: [], modifiees: 0, total: { avant: 0, apres: 0 } };
      css.ajoutees.push(...r.ajoutees);
      css.modifiees += r.ecarts.length;
      css.total.avant += r.total.avant;
      css.total.apres += r.total.apres;
      if (r.ecarts.length) dire(4, f, r.ecarts);
      // Aperçu et périmètre : la feuille doit être la même, sans règle en plus.
      if (mode !== "lot" && r.ajoutees.length) dire(4, f, r.ajoutees.map((x) => `règle en plus : ${x.cle}`));
    } else if (EST_PLAN(f)) {
      const xb = mode === "apercu" ? B.toString("utf8").split(o.base.replace(/\/$/, "")).join("") : B.toString("utf8");
      if (sansDate(A.toString("utf8")) !== sansDate(xb)) dire(6, f, ["plan du site différent (hors date)"]);
    } else if (!A.equals(B)) {
      dire(f.startsWith("_astro/") ? 3 : 5, f, ["contenu différent"]);
    }
  }

  const nDiffHtml = differences.filter((d) => d.regle === 2).length;
  if (o.json) {
    console.log(JSON.stringify({
      mode, vert: differences.length === 0, pages, differences,
      css: css && { modifiees: css.modifiees, ajoutees: css.ajoutees.length, avant: css.total.avant, apres: css.total.apres },
      ...(mode === "perimetre" ? { pagesAttendues: perimetre.attendues, pagesChangees: perimetre.changees, blocsChanges: [...perimetre.blocs] } : {}),
      ...(mode === "apercu" ? { fichiersApparies: renoms.size } : {}),
    }, null, 2));
    process.exit(differences.length ? 1 : 0);
  }

  // Rapport
  for (const d of differences) {
    console.log(`✗ règle ${d.regle} — ${d.f}`);
    for (const l of d.lignes) console.log(`    ${l}`);
  }
  console.log("");
  if (mode === "perimetre") {
    console.log(`Périmètre (blocs ${o.blocs.join(", ")}) : ${perimetre.attendues.length} pages attendues, ${perimetre.changees.length} changées (${perimetre.changees.join(", ") || "aucune"}).`);
  }
  console.log(`${pages} pages comparées, ${nDiffHtml} différence${nDiffHtml > 1 ? "s" : ""}.`);
  if (css) {
    console.log(
      `Feuille de style : ${css.modifiees} règle${css.modifiees > 1 ? "s" : ""} modifiée${css.modifiees > 1 ? "s" : ""} ou perdue${css.modifiees > 1 ? "s" : ""}, ` +
        `${css.ajoutees.length} ajoutée${css.ajoutees.length > 1 ? "s" : ""} (${css.total.avant} → ${css.total.apres} règles).`,
    );
    if (o.detail && css.ajoutees.length) {
      for (const r of css.ajoutees) console.log(`    + ${r.cle}`);
    }
  }
  if (mode === "apercu") {
    const images = [...renoms.keys()].filter((f) => !EST_CSS(f)).length;
    console.log(`Aperçu : repères, script d'édition et préfixe ${o.base} ignorés ; ${images} images appariées par leur contenu.`);
  }
  for (const [a, b] of renoms) if (EST_CSS(a)) console.log(`Feuille renommée (admis) : ${a} → ${b}`);
  const autres = differences.length - nDiffHtml;
  console.log(autres ? `Autres écarts : ${autres}.` : "Fichiers, fichiers liés, plan du site : identiques.");
  console.log(differences.length ? "\nROUGE" : "\nVERT");
  process.exit(differences.length ? 1 : 0);
}

main();
