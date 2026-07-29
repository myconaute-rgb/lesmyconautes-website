# Retour d'Aline + patch site — 29/07/2026

Réponses au rapport d'intégration du patch DA v4 (25/07), fichiers manquants fournis,
et nouvelle série de corrections. Texte verbatim reçu de Florestan.

---

Patch du 25/07 intégré, c'est en ligne. Tout y est : Chewy en capitales, bandeau, emblème,
FAQ et descriptions de gamme réécrites, blocs resserrés, pictos, alignements. **Vu, OK**

▎ 3 fichiers à me renvoyer :

▎ 1. Les logos bio, en priorité. Ceux du site sont tronqués : on lit « CERTIFI / AGRICULTUR /
BIOLOGIQU » sur l'AB, et « CERTIFIÉ PAR FR- BIO » (sans le -01) + « AGRICULTURE FRAN » sur
l'Eurofeuille. Invisible tant qu'ils étaient petits, criant dès qu'on les agrandit comme tu le
demandais. Comme c'est une mention de certification officielle, je les ai laissés en petit en
attendant. Il me faut les originaux (kit Ecocert ou Agence Bio, en vectoriel) — je repasse en
plein cadre dès que je les ai.
→ **fichier « logosbio »**

▎ 2. L'image du bloc « l'aventure » (page Myconautes), annoncée dans ton prompt.
→ **ne pas modifier l'image pour l'instant**

▎ 3. Les pictos, sur fond transparent la prochaine fois — pictogramme blanc, sans le rond violet.
Les 4 pictos culture étaient sur un aplat lilas qui est exactement la couleur du cadre où ils
devaient aller : ils y étaient invisibles. Je les ai détourés, le site dessine le rond lui-même.
→ **fichiers qui commencent par « Les Myconautes WEB pictos »**

▎ 2 questions :

▎ - Le 3,50 € : ta consigne est dans la partie « pros » mais dit « uniquement sur /particuliers ».
Je l'ai appliqué sur particuliers seulement. Tu confirmes ?
→ **Non, la livraison doit être annoncée à 4,20 € sur `/` et `/particuliers`, mais à 3,50 € sur `/pros`.**

▎ - Accueil, blocs 2 et 5 : tu parles de « l'image de droite » et de « l'image de gauche », mais ces
blocs n'ont qu'une seule image, située de l'autre côté. J'ai répondu pour celle qui existe — dis-moi
si tu voulais les déplacer.
→ **Oublie cette demande, le résultat convient tel qu'il est actuellement.**

▎ Tes dimensions d'images sont dans le repo : `docs/da/v4-2026-07-25/SPECS_IMAGES.md`. En résumé :
pictos 512 × 512 px PNG transparent, photos demi-page 1200 à 1920 px de large, carrés
conditionnement 800 × 800 px. Et le dpi ne sert à rien pour le web — seul le nombre de pixels
compte, exporte en 72. Merci !

▎ Petit détail au passage : j'ai corrigé « ravie les papilles » en « ravit » dans le texte du
Black Pearl. Merci !

---

## Demandes de correction

### Page d'accueil — https://lesmyconautes.fr/
**[Bloc 2 : bio . locaux . délicieux]** Remplacer l'image existante par le fichier
« Les Myconautes WEB cagette ».

### Page /particuliers/
**[Bloc 2 : Tout un monde à explorer]** Remplacer les 3 images existantes (de gauche à droite) par
respectivement « Les Myconautes WEB barquette eryngii » à gauche, « Les Myconautes WEB bocal pickles
eryngii » au centre, « Les Myconautes WEB sac substrat eryngii » à droite.

**[Bloc 4 : lancez vous dans la culture maison !]** Remplacer l'image existante par le fichier
« Les Myconautes WEB substrat eryngii FV ». Remplacer les 4 pictos existants (de haut en bas) par
respectivement « Les Myconautes picto champignon » en 1, « Les Myconautes picto humidite » en 2,
« Les Myconautes picto air » en 3, « Les Myconautes picto tempo » en 4. Ils ne doivent pas être dans
des ronds violet foncé, mais plutôt directement en blanc sur le fond mauve.

### Page /pros/
**[Bloc 4 : conseils pro]** Les 4 pictos doivent être dans des ronds violet foncé. S'aider des
fichiers « Les Myconautes picto temperature », « Les Myconautes picto humidite », « Les Myconautes
picto tempo », « Les Myconautes picto congelation » pour adapter la présentation.

### Page /agriculteurs/
**[Bloc 4 : procédés & expertise]** Réduire l'image (droite) pour qu'elle ne dépasse pas en haut et
en bas du texte (gauche).

**[Bloc « conditionnements professionnels »]** *(demandé sous l'intitulé « /particuliers bloc 6 » —
ce bloc est en réalité sur `/agriculteurs`)* Réduire l'espace ou le saut de ligne entre le titre
(ex. « Sac unitaire »), la quantité (ex. « 2,5 kg ») et la description (ex. « Pour tester, démarrer
une petite culture, ou compléter un volume. ») sur les 3 colonnes.

---

## Fichiers livrés (12 PNG)

| Fichier | Destination |
|---|---|
| `logosbio.png` (2880×1200, transparent) | découpé en `src/assets/logos/certifie-ab.png` + `certifie-eu.png` |
| `Les Myconautes WEB cagette.png` (2880×1200, fond crème) | `src/assets/photos/cagette-eryngii.jpg` — hero accueil |
| `Les Myconautes WEB barquette eryngii.png` (2500²) | `barquette-eryngii.jpg` — particuliers bloc 2 gauche |
| `Les Myconautes WEB bocal pickles eryngii.png` (2500²) | `bocal-pickles-eryngii.jpg` — particuliers bloc 2 centre |
| `Les Myconautes WEB sac substrat eryngii.png` (2500²) | `sac-substrat-eryngii.jpg` — particuliers bloc 2 droite |
| `Les Myconautes WEB substrat eryngii FV.png` (2880×1200, fond anis) | `substrat-eryngii-fructification.jpg` — particuliers bloc 4 |
| `Les Myconautes picto champignon / humidite / air / tempo .png` (2000², blancs transparents) | `src/assets/icons/culture/substrat / humidite / air-frais / patience .png` |
| `Les Myconautes picto temperature / congelation .png` | `src/assets/icons/aline/temperature.png` / `congelation.png` |

**Les aplats de fond des visuels correspondent exactement aux tokens du site** : `#fffaf1`
(`--color-page`) pour les visuels crème, `#87b800` (`--color-anis`) pour le substrat FV. Ils sont donc
affichés en `object-contain` sur le même aplat : aucun recadrage, raccord invisible.
