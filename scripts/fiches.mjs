#!/usr/bin/env node
/**
 * Les fiches d'édition, en JSON, pour l'atelier (projet 08, pas 2 ; rendu/11 § 6.1).
 *
 *   node scripts/fiches.mjs [<construction-d-apercu>]
 *
 * Sans argument : { fichiers, fiches } — les fichiers de contenu/ connus du schéma, et ce que
 * l'éditeur montre pour chacun (src/contenu/edition.ts).
 * Avec une construction d'aperçu (APERCU_BASE) : en plus, `pages` — chaque page, ses blocs
 * (data-bloc, data-repere) et ses champs (data-champ). C'est la carte que l'atelier lit pour savoir
 * quelles pages montrent un bloc partagé, sans rien supposer.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parse } from "parse5";

const RACINE = process.cwd();
const { FICHIERS } = await import(join(RACINE, "src/contenu/schema.ts"));
const { FICHES } = await import(join(RACINE, "src/contenu/edition.ts"));

const sortie = { fichiers: Object.keys(FICHIERS), fiches: FICHES };

const carte = process.argv[2];
if (carte) {
  if (!existsSync(carte)) {
    console.error(`construction d'aperçu absente : ${carte}`);
    process.exit(2);
  }
  const pages = [];
  const marcher = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) marcher(p);
      else if (n.endsWith(".html")) pages.push(relative(carte, p).split(sep).join("/"));
    }
  };
  marcher(carte);
  const attr = (n, nom) => n.attrs?.find((a) => a.name === nom)?.value;
  sortie.pages = pages.sort().map((f) => {
    const blocs = [];
    const champs = [];
    const voir = (n) => {
      if (n.tagName) {
        const b = attr(n, "data-bloc");
        if (b) blocs.push({ bloc: b, fichier: attr(n, "data-repere") ?? null });
        const c = attr(n, "data-champ");
        if (c) champs.push(c);
      }
      for (const e of (n.content ?? n).childNodes ?? []) voir(e);
    };
    voir(parse(readFileSync(join(carte, f), "utf8")));
    const chemin = "/" + f.replace(/(^|\/)index\.html$/, "").replace(/\.html$/, "");
    const nom = chemin === "/" ? "accueil" : chemin.slice(1);
    return { page: nom, chemin, fichierHtml: f, blocs, champs };
  });
}

process.stdout.write(JSON.stringify(sortie, null, 2) + "\n");
