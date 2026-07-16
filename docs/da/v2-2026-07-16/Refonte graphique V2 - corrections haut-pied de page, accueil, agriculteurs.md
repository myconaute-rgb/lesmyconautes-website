# Refonte graphique — Brief V2 (corrections)

> **Date :** 16/07/2026 · **Auteur :** Florestan · **Statut :** source de vérité pour la vague de corrections
> Fait suite au brief V1 (`Refonte graphique globale de la pag.md`, refonte accueil mergée le 09/07, commit `6724b00`).
>
> **Fichiers maquettes référencés** (dans ce dossier) : `maquette-haut-de-pageV1.png` ·
> `maquette-bas-de-pageV1.png` (= « maquette-pied-de-pageV1 » du brief) ·
> `maquette-corps-page-accueil.png` · `maquette-corps-page-agriculteurs.png`.
> **Manquent encore au 16/07** : logo · `contact` (bloc photo) · nouvelles images des encarts.

## Contexte général

Il faut différencier 3 sections :

### 1 — Le haut de page

Il sera identique sur toutes les pages du site. Fichier **“maquette-haut-de-pageV1”**.

- Le logo est joint. Supprime l’inscription “les Myconautes” en toutes lettres.
- Le lien vers l’onglet “particuliers” ne change pas.
- L’onglet “restaurateurs” devient l’onglet **“pros”** et le lien `https://lesmyconautes.fr/restaurateurs/` est renommé en `https://lesmyconautes.fr/pros/` mais renvoie toujours sur le contenu identique de l’ancienne page `https://lesmyconautes.fr/restaurateurs/`.
- Le lien vers l’onglet “agriculteurs” ne change pas.
- L’onglet “à propos” devient l’onglet **“myconautes”** et le lien `https://lesmyconautes.fr/a-propos/` est renommé en `https://lesmyconautes.fr/myconautes/` mais renvoie toujours sur le contenu identique de l’ancienne page `https://lesmyconautes.fr/a-propos/`.

### 2 — Le corps de page

Il sera différent sur toutes les pages du site, même si certaines sections pourront être identiques ou très similaires. Fichiers à venir.

Les modifications à apporter sont détaillées plus bas à partir de « Pour l’instant, concentre-toi sur la page d’accueil ».

### 3 — Le pied de page

Il sera identique sur toutes les pages du site. Fichier **“maquette-pied-de-pageV1”**.

- Les liens qui redirigent vers d’autres pages ne changent pas.

## Charte graphique à appliquer à l’ensemble du site

- **Titres** (en gros) : police **Anton**. Idéalement tous de la même taille, mais liberté d’adapter la taille pour respecter les retours à la ligne de la maquette. Coloris **violet `#8644be`**. Respecter la casse majuscule/minuscule et les mots en italique.
- **Sous-titres** (s’ils sont présents) : juste sous les titres. Police **bellaboo**, coloris **vert `#87b800`**. Adapter la taille et l’espacement avec le texte pour respecter le rendu visuel de la maquette. Respecter la casse majuscule/minuscule.
- **Textes** : tous en police **Poppins**, coloris **marron `#532213`**. Adapter la taille pour respecter le rendu visuel de la maquette. Respecter la casse majuscule/minuscule et les mots en gras.
- **Fond** : généralement **blanc pur `#ffffff`** ou **beige `#fffaf1`** en fonction du rendu visuel de la maquette.
- **Autres coloris pouvant apparaître** :
  - mauve `#d3bfff`
  - beige `#e8d0bb`
  - jaune `#ffde59`
  - bleu `#06b6d4`
  - orange `#f14902`
  - rose `#ff6868`
- **Aucune autre police** ne doit apparaître sur le site.
- **Aucun autre coloris** ne doit apparaître sur le site (mis à part les coloris sur les images).
- Les formes et textes en **rouge `#bc1823` ne doivent pas apparaître** : ce sont des indications et précisions sur les maquettes pour guider l’intégration.
- **Boutons cliquables** : rectangle, angles arrondis à 10 %. Quand il y en a 2 côte à côte, distinguer les boutons principaux et secondaires par une inversion de couleurs. Respecter le rendu visuel de la maquette pour les coloris. **Enlever les petites flèches →** sur les boutons.

## Page d’accueil (`https://lesmyconautes.fr/`)

Pour l’instant, concentre-toi sur la page d’accueil. Base-toi sur le fichier **“maquette-corps-page-accueil”**.

### Section « Cultivées à la main »

- Enlever les liens vers les pages, car elles sont inexistantes.
- L’encart avec la photo du champignon et son descriptif sur fond coloré reste.
- Le bouton “découvrir + flèche” disparaît, et l’encart n’est plus relié à aucun lien.
- Conserver 3 encarts sur la première ligne.
- Pour l’instant, il n’y a qu’un encart sur la seconde ligne : **ajouter 2 encarts, “Epicerie fine” et “Substrat”**, conformément à la maquette.

### Section « Une question ? Écrivez-nous »

- Remplacer le bloc de droite par le bloc photo, fichier **“contact”**.

### Garde-fous

- Ne pas modifier les liens des autres boutons du corps de page, ni l’architecture globale du site : ils sont corrects.
- Conserver la FAQ et les différents formulaires de contact en l’état.

## Résultat attendu

Changer les images et les textes pour coller à la maquette. Précisions :

- Si le texte existant est conforme à la maquette : le conserver, mais respecter la casse pour coller au rendu visuel de la maquette.
- Si le texte existant n’est pas identique à la maquette : le remplacer par celui de la maquette, en respectant la casse pour coller au rendu visuel de la maquette.
- Si l’image est conforme à la maquette : la conserver.
- Si l’image existante n’est pas identique à la maquette : la remplacer par celle de la maquette. Les nouvelles images sont jointes.

## Pour terminer

- Faire la même chose sur le corps de page `https://lesmyconautes.fr/agriculteurs/`, en se basant sur le fichier **“maquette-corps-page-agriculteurs”**.
- **Conserver une copie du site avant de procéder aux modifications** pour pouvoir revenir en arrière facilement si besoin.
