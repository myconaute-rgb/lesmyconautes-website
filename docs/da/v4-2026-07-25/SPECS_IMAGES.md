# Dimensions optimales des images — réponses au patch du 25/07/2026

Réponse aux 9 demandes « donne-moi les dimensions optimales (pixel et résolution) »
du brief `patch site 25-07-26.md`.

## Deux règles avant la liste

1. **La résolution (dpi) n'existe pas à l'écran.** Un navigateur ne lit jamais le champ
   dpi d'un fichier : seul compte le nombre de pixels. Exporte en **72 dpi**, la valeur
   n'a aucun effet — c'est la largeur en pixels qui fait la netteté. (Le dpi ne compte
   que pour l'impression : étiquettes, flyers.)
2. **Les tailles ci-dessous sont doublées** par rapport à l'affichage réel, pour les
   écrans « Retina » (2 pixels physiques par pixel CSS) — un iPhone ou un MacBook
   affiche sinon une image floue. Astro regénère ensuite automatiquement les versions
   plus petites en AVIF/WebP : **fournir plus grand ne pénalise pas le chargement**,
   fournir plus petit dégrade définitivement.

Format : **JPEG qualité 90** pour les photos, **PNG transparent** pour les pictos et logos.

## Les 9 demandes

| # | Emplacement | Dimensions à fournir | Format |
|---|---|---|---|
| 1 | **Accueil, bloc 2** — image du bandeau deux volets (« bio . locaux . délicieux ») | **1920 × 1080 px** | JPEG |
| 2 | **Accueil, bloc 5** — photo « Explorateurs depuis 2015 » | **1600 × 1600 px** (carré) | JPEG |
| 3 | **Accueil, bloc 6** — 3 pictos ronds « livraison & retrait » | **512 × 512 px** | PNG transparent |
| 4 | **Pros, bloc 3** — 6 pictos ronds « pourquoi nous choisir ? » | **512 × 512 px** | PNG transparent |
| 5 | **Pros, bloc 4** — 4 pictos « conseils pro » | **512 × 512 px** | PNG transparent |
| 6 | **Agriculteurs, bloc 2** — logo bio plein cadre | **1200 × 700 px** (ou 600 px de haut par logo) | PNG transparent |
| 7 | **Agriculteurs, bloc 6** — 3 images de conditionnement | **800 × 800 px** (carré strict) | JPEG |
| 8 | **Myconautes, bloc 2** — image « l'aventure » (fichier à venir) | **1200 × 1000 px** | JPEG |
| 9 | **Myconautes, bloc 3** — 5 pictos ronds « nos valeurs » | **512 × 512 px** | PNG transparent |

**Bandeau haut de page** (déjà fourni) : 2560 × 900 px suffisent. Le fichier livré faisait
4630 × 1654 px pour 4,6 Mo — réduit à cette taille à l'intégration, sans perte visible.

## Deux points d'attention

- ✅ **Pictos** — **réglé le 29/07** : le jeu HD est arrivé **en PNG transparent, pictogramme blanc,
  sans rond** (2000 × 2000 px), exactement comme demandé. Traitement à l'intégration : blanc pur
  forcé (le détourage laissait un liseré gris sur trois d'entre eux), recadrage sur le contenu,
  centrage dans un carré et réduction à 512 × 512 px. Consigne inchangée pour les prochains.
- ✅ **Logos bio** (n° 6) — **réglé le 29/07** : `logosbio.png` (2880 × 1200, transparent) contient
  les deux logos complets, mentions entières (« CERTIFIÉ / AGRICULTURE BIOLOGIQUE », « CERTIFIÉ PAR
  FR- BIO -01 / AGRICULTURE FRANCE »). Découpé à l'intégration en `certifie-ab.png` (409 × 560) et
  `certifie-eu.png` (695 × 560), **affichage plein cadre rétabli** (`h-40 md:h-56`) sur
  `agriculteurs.astro` et `myconautes.astro`. Historique du blocage ci-dessous.

<details><summary>Historique — le blocage du 25/07 (résolu)</summary>

- 🔴 **Logos bio** (n° 6) — **bloquant, plus grave qu'un problème de résolution.** Les deux
  PNG du repo sont des **extraits de maquette tronqués** : `certifie-ab.png` affiche
  « CERTIFI », « AGRICULTUR », « BIOLOGIQU », et `certifie-eu.png` affiche « CERTIFIÉ PAR
  FR- BIO » (sans le -01) et « AGRICULTURE FRAN ». Invisible tant qu'ils étaient petits ;
  criant dès qu'on les agrandit comme le demandait le brief. On parle de **mentions de
  certification réglementées**, qui ne doivent être ni déformées ni tronquées.
  → **En attendant, l'affichage est bridé à 112 px de haut** (au lieu du « plein cadre »
  demandé). Fournir les originaux **AB** et **Eurofeuille** — ils sont dans le kit de
  communication Ecocert, et téléchargeables en vectoriel (SVG/EPS) auprès de l'Agence Bio
  et de la Commission européenne. Exporter en **600 px de haut**, puis repasser les deux
  pages à `h-40 md:h-56` (`agriculteurs.astro`, `myconautes.astro`).

</details>
