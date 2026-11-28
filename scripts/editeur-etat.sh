#!/usr/bin/env bash
# Y a-t-il un brouillon ouvert dans l'éditeur du site, et sur quels blocs ? (règle R94, projet 08 pas 2)
#
#   scripts/editeur-etat.sh            lit /srv/atelier_site/etat.json
#   ATELIER_ETAT=<fichier> scripts/editeur-etat.sh
#
# À lancer AVANT de toucher à la structure d'un bloc (renommer un id, retirer une question…).
# Le fichier d'état de l'atelier ne contient aucun texte : le nombre de gestes, les blocs, les champs.
# Sortie : 0 = aucun brouillon ; 1 = au moins un brouillon ouvert (la liste suit) ; 2 = état illisible.
set -euo pipefail
ETAT="${ATELIER_ETAT:-/srv/atelier_site/etat.json}"

if [[ ! -e "$ETAT" ]]; then
  echo "Aucun atelier sur cette machine (pas de $ETAT) : aucun brouillon ouvert."
  exit 0
fi
if [[ ! -r "$ETAT" ]]; then
  echo "État de l'atelier illisible ($ETAT) : demande à Florestan avant de toucher à la structure d'un bloc."
  exit 2
fi

exec node --input-type=module -e '
import { readFileSync } from "node:fs";
const fichier = process.argv[1];
let e;
try { e = JSON.parse(readFileSync(fichier, "utf8")); } catch (x) {
  console.log(`État de l'"'"'atelier illisible (${fichier}) : ${x.message}`); process.exit(2);
}
const ouverts = (e.brouillons ?? []).filter((b) => b.gestes > 0);
const pub = e.publication ? ` Publication en cours : ${e.publication.numero} (${e.publication.etape}).` : "";
const travaux = e.enTravaux ? " L’éditeur est en travaux (main ne se construit pas)." : "";
if (!ouverts.length) { console.log(`Aucun brouillon ouvert (état du ${e.maj}).${pub}${travaux}`); process.exit(pub ? 1 : 0); }
console.log(`${ouverts.length} brouillon${ouverts.length > 1 ? "s" : ""} ouvert${ouverts.length > 1 ? "s" : ""} (état du ${e.maj}).${pub}${travaux}`);
for (const b of ouverts) {
  console.log(`- ${b.gestes} geste${b.gestes > 1 ? "s" : ""}, depuis ${b.depuis} :`);
  for (const k of b.blocs ?? []) {
    console.log(`    bloc ${k.bloc} (contenu/${k.fichier})`);
    for (const c of k.champs ?? []) console.log(`      ${c}`);
  }
}
console.log("Ne renomme ni ne retire un id visé : le brouillon tomberait en conflit (R93, R94).");
process.exit(1);
' "$ETAT"
