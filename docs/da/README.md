# docs/da — Direction artistique du site

Chaque vague de refonte graphique a son dossier daté : le **brief** (source de vérité,
prompt de Florestan) + les **maquettes PNG** qu'il référence. Toute intégration se base
sur le dossier de la vague la plus récente ; les dossiers antérieurs sont l'historique.

## Vagues

### `v5-2026-07-29/` — visuels manquants + corrections (intégré le 29/07)
Brief : `retour et patch site 29-07-26.md` · 12 PNG livrés (logos bio, 5 visuels détourés,
6 pictos blancs transparents).

**Intégré (29/07)** : logos **AB** et **Eurofeuille** complets (mentions entières) → affichage
**plein cadre rétabli** (`h-40 md:h-56`) sur `/agriculteurs` et `/myconautes` ; visuels d'Aline
sur l'accueil (hero) et `/particuliers` (blocs 2 et 4) ; pictos du bloc culture maison **blancs
sans bulle** sur le lilas (conforme à la maquette v3), pictos des conseils pro **dans des ronds
violets** ; tarif de tournée **4,20 € sur `/` et `/particuliers`, 3,50 € sur `/pros`** ; image
« procédés & expertise » calée sur la hauteur du texte ; cartes de conditionnement resserrées
(le `gap-y` du parent s'appliquait aussi aux lignes du subgrid).

Les visuels sont livrés **détourés sur les aplats exacts du site** (`#fffaf1` = `--color-page`,
`#87b800` = `--color-anis`) : ils s'affichent en `object-contain` sur le même fond, sans recadrage.

⚠️ **En attente / à trancher** :
- Image du bloc « l'aventure » (`/myconautes`) : consigne = **ne pas la modifier pour l'instant**.
- **CGV** (`cgv.astro`) : annoncent encore **2,00 €** pour Lyon et Saint-Étienne alors que les pages
  vitrine affichent 4,20 € / 3,50 €. Contenu contractuel — à corriger par Florestan.
- `hero-cagette-eryngii.jpg` n'est plus utilisé (remplacé par `cagette-eryngii.jpg`) ; conservé.

### `v4-2026-07-25/` — patch site (intégré le 25/07)
Brief : `patch site 25-07-26.md` · Réponses aux specs d'images : `SPECS_IMAGES.md`
- `Les Myconautes WEB square embleme.png` — emblème rond, header + footer
- `Les Myconautes WEB bandeau.png` — bandeau photo, hero des 5 pages principales
- `Les Myconautes WEB demi-page contact.png` — visuel + coordonnées du bloc contact
- `Les Myconautes WEB picto1..4.png` — substrat / humidité / air frais / patience (bloc culture maison)

**Intégré (25/07)** : sous-titres script en **Chewy** (remplace Caveat) et en capitales,
espaces entre blocs réduits (~40 %), 3 réponses de FAQ réécrites, 6 descriptions de gamme
réécrites, bandeau sur les 5 heros, emblème dans le header/footer, bloc contact en visuel
unique (coordonnées conservées en `sr-only`), pictos agrandis, tarif de tournée 3,50 €
sur `/particuliers` seulement, bloc « notre gamme » ajouté sur `/myconautes`, cartes de
conditionnement alignées en subgrid et boutons demi-palette / palette redirigés vers le devis.

Trois blocs dupliqués à l'identique sur plusieurs pages ont été factorisés au passage :
`FaqCommune.astro` (4 pages), `GammeSection.astro` + `src/data/gamme.ts` (3 pages),
`ContactSection.astro` désormais aussi utilisé par l'accueil.

⚠️ **En attente** : l'image du bloc « l'aventure » (`/myconautes`) est annoncée dans un
prochain prompt — le portrait de Florestan tient la place. Logos bio à re-fournir en HD
(cf. `SPECS_IMAGES.md`).

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
- ~~Police des sous-titres : Caveat en attendant Bellaboo~~ → **tranché le 25/07 :
  la police script du site est **Chewy** (Google Fonts, une seule graisse 400).
  Swap = `--font-script` dans `global.css` + l'import dans `BaseLayout.astro`.
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
