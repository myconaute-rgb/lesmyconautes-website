# docs/da — Direction artistique du site

Chaque vague de refonte graphique a son dossier daté : le **brief** (source de vérité,
prompt de Florestan) + les **maquettes PNG** qu'il référence. Toute intégration se base
sur le dossier de la vague la plus récente ; les dossiers antérieurs sont l'historique.

## Vagues

### `v2-2026-07-16/` — corrections DA (intégrée le 16/07)
Brief : `Refonte graphique V2 - corrections haut-pied de page, accueil, agriculteurs.md`
- `maquette-haut-de-pageV1.png` — header commun à toutes les pages
- `maquette-bas-de-pageV1.png` — pied de page commun (= « maquette-pied-de-pageV1 » dans le brief)
- `maquette-corps-page-accueil.png` — corps de la page d'accueil
- `maquette-corps-page-agriculteurs.png` — corps de la page agriculteurs

**Intégré (16/07)** : header commun (logo seul, nav Pros/Myconautes, redirections 301
`/restaurateurs→/pros` et `/a-propos→/myconautes`), footer commun, charte
(Anton/Poppins + sous-titres script, palette étendue, boutons 10 % sans flèches),
corps accueil (6 encarts sans lien + bloc photo contact) et corps agriculteurs.

⚠️ **Points à finaliser** :
- Police des sous-titres : la charte impose **Bellaboo** (commerciale TypeFairy) —
  **Caveat** en attendant le fichier licencié. Swap = `--font-script` dans `global.css`.
- Le **logo** et plusieurs **photos** (portrait Florestan, univers maison/chef,
  « envie de goûter », cagette contact, bloc substrat, illustrations shiitaké/nameko)
  sont **extraits du PNG de la maquette** (basse déf.) — à remplacer par les
  originaux haute définition quand ils sont fournis.
- Vérification **pixel** non faite dans l'environnement de dev (navigateur headless
  indisponible) : validation visuelle sur la preview/prod Cloudflare Pages.

### `v1-2026-07-09/` — refonte accueil (livrée, merge `d3e9142` du 09/07)
Brief : `Refonte graphique globale de la pag.md`
- `Maquette page accueil1..9.png` + montage `accueil9-imageonline.co-merged.png`

## Conventions
- Nouveaux fichiers d'une même vague → dans le dossier de la vague (pas à la racine du repo).
- Nouvelle vague = nouveau dossier `vN-AAAA-MM-JJ/` + entrée ici.
- Ces fichiers ne sont **pas publiés** par le build Astro (seuls `src/` et `public/` le sont).

### `v3-2026-07-17/` — maquettes pages principales (Aline)
Maquettes de corps pour **particuliers, pro, à-propos (myconautes), contact**.
Couleur d'accent **par page** (décision Aline) :
- accueil + **particuliers** : titres violet / scripts vert (anis)
- **pro** + **contact** : titres cacao / scripts violet ; hero pro = bande cacao
- **à-propos (myconautes)** : titres violet / scripts vert, hero = bande lilas
- **agriculteurs** : titres vert / scripts violet (déjà en place)
Blocs repris de l'accueil (gamme 6 cartes, livraison 3 cartes 4,20€, FAQ catégorisée,
bloc contact cacao, CTA « Envie de goûter ? » toujours violet). Icônes = bulles violettes.

### Icônes & photos d’Aline (17/07)
Pictos + photos HD fournis par Aline (dossiers « icone 1 » / « icone 2 »).
- Pictos traités (blanc transparent) → `src/assets/icons/aline/*.png`, câblés dans `FeatureIcon.astro`.
- Photos HD → remplacent les extraits basse-def dans `src/assets/photos/` (mêmes noms).
- Source brute (203 Mo, non versionnée) : `~/uploads/aline-icones` sur le serveur + originaux chez Florestan.
- Non utilisés pour l’instant : vignettes variétés `square substrat/black pearl/hericium/…`, `tiers-page hor logo bio`, `demi-page contact` (bloc cacao intégré).
