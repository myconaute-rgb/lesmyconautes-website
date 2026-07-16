# docs/da — Direction artistique du site

Chaque vague de refonte graphique a son dossier daté : le **brief** (source de vérité,
prompt de Florestan) + les **maquettes PNG** qu'il référence. Toute intégration se base
sur le dossier de la vague la plus récente ; les dossiers antérieurs sont l'historique.

## Vagues

### `v2-2026-07-16/` — corrections DA (en cours)
Brief : `Refonte graphique V2 - corrections haut-pied de page, accueil, agriculteurs.md`
- `maquette-haut-de-pageV1.png` — header commun à toutes les pages
- `maquette-bas-de-pageV1.png` — pied de page commun (= « maquette-pied-de-pageV1 » dans le brief)
- `maquette-corps-page-accueil.png` — corps de la page d'accueil
- `maquette-corps-page-agriculteurs.png` — corps de la page agriculteurs
- ⚠️ Manquent encore : logo, bloc photo « contact », nouvelles images des encarts.

### `v1-2026-07-09/` — refonte accueil (livrée, merge `d3e9142` du 09/07)
Brief : `Refonte graphique globale de la pag.md`
- `Maquette page accueil1..9.png` + montage `accueil9-imageonline.co-merged.png`

## Conventions
- Nouveaux fichiers d'une même vague → dans le dossier de la vague (pas à la racine du repo).
- Nouvelle vague = nouveau dossier `vN-AAAA-MM-JJ/` + entrée ici.
- Ces fichiers ne sont **pas publiés** par le build Astro (seuls `src/` et `public/` le sont).
