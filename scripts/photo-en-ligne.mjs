#!/usr/bin/env node
/**
 * Photo du site servi, pour le dernier constat d'un lot (projet 08, rendu/07 § 7) :
 * « les 15 pages servies sont comparées à celles d'avant la fusion ».
 *
 *   node scripts/photo-en-ligne.mjs <adresse> <dist-de-reference> <dossier-photo>
 *   npm run photo-en-ligne -- https://lesmyconautes.fr dist /tmp/photo-avant
 *
 * Copie <dist-de-reference>, puis remplace chaque page HTML par celle que sert <adresse>.
 * Le dossier obtenu se compare avec npm run comparer (deux photos entre elles, ou une photo
 * contre une construction).
 *
 * Un seul geste est défait, celui de Cloudflare sur le domaine de production (pas sur les
 * préversions) : la « protection des adresses mail » réécrit chaque mailto: avec une clé tirée au
 * hasard à chaque visite, et ajoute son script de décodage. Sans cela, deux visites de la même page
 * ne seraient jamais égales. Rien d'autre n'est touché : le comparateur reste sans tolérance.
 */
import { cpSync, readdirSync, readFileSync, statSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join, relative, sep } from "node:path";

const [adresse, reference, sortie] = process.argv.slice(2);
if (!adresse || !reference || !sortie || !existsSync(reference)) {
  console.error("Usage : node scripts/photo-en-ligne.mjs <adresse> <dist-de-reference> <dossier-photo>");
  process.exit(2);
}

const decoder = (hexa) => {
  const b = Buffer.from(hexa, "hex");
  return [...b.subarray(1)].map((x) => String.fromCharCode(x ^ b[0])).join("");
};
const LIEN = /href="\/cdn-cgi\/l\/email-protection#([0-9a-f]+)"/g;
const TEXTE = /<(?:span|a href="\/cdn-cgi\/l\/email-protection") class="__cf_email__" data-cfemail="([0-9a-f]+)">\[email(?:&#160;| | )protected\]<\/(?:span|a)>/g;
const SCRIPT = /<script data-cfasync="false" src="\/cdn-cgi\/scripts\/[^"]+\/cloudflare-static\/email-decode\.min\.js"><\/script>/g;

const pages = [];
const marcher = (d) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) marcher(p);
    else if (n.endsWith(".html")) pages.push(relative(reference, p).split(sep).join("/"));
  }
};
marcher(reference);

rmSync(sortie, { recursive: true, force: true });
cpSync(reference, sortie, { recursive: true });

const compte = { pages: 0, liens: 0, textes: 0, scripts: 0 };
const base = adresse.replace(/\/$/, "");
const marque = `photo=${Date.now()}`; // contourne un éventuel cache entre deux photos
let erreurs = 0;
for (const f of pages.sort()) {
  const chemin = "/" + f.replace(/index\.html$/, "").replace(/\.html$/, "");
  const r = await fetch(`${base}${chemin}?${marque}`, { redirect: "follow" });
  if (r.status !== 200) {
    console.log(`✗ ${chemin} : ${r.status}`);
    erreurs++;
    continue;
  }
  let s = await r.text();
  s = s.replace(LIEN, (_, h) => { compte.liens++; return `href="mailto:${decoder(h)}"`; });
  s = s.replace(TEXTE, (_, h) => { compte.textes++; return decoder(h); });
  s = s.replace(SCRIPT, () => { compte.scripts++; return ""; });
  writeFileSync(join(sortie, f), s);
  compte.pages++;
}
let version = "?";
try { version = (await (await fetch(`${base}/version.json?${marque}`)).json()).version; } catch {}
console.log(`${compte.pages} pages photographiées sur ${base} (version servie : ${version}).`);
console.log(`Protection des adresses de Cloudflare défaite : ${compte.liens} liens, ${compte.textes} adresses en texte, ${compte.scripts} scripts.`);
process.exit(erreurs ? 1 : 0);
