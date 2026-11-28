# Carte — le contenu et sa migration (projet 08, éditeur du site)

Les règles R92 à R98 sont dans le `CLAUDE.md` racine. Ici : la méthode d'un lot et les repères.
Conception : dépôt `claude_code`, `projets/08_editeur_site/rendu/` (07 = migration, 03 = modèle de contenu).

## Un lot = une PR, prouvée sans effet visible
1. Construire `main` (« avant »), puis la branche (« après ») : deux dossiers `dist`.
2. `npm run comparer -- <avant> <après>` : 0 différence sur les 15 pages ; feuille de style : 0 règle
   modifiée ou perdue, des ajouts permis. Rouge : on corrige le composant, jamais le comparateur.
3. `npm run verifier` vert. Chaque composant migré entre dans `COMPOSANTS_MIGRES` (`scripts/verifier.mjs`).
4. Captures sur le serveur de secours : 15 pages en 1 440 et 390 px, mouvement réduit, anti-robot bloqué,
   0 pixel d'écart.
5. Avant et après la fusion : `npm run photo-en-ligne -- https://lesmyconautes.fr <dist> <dossier>`, puis
   `npm run comparer` entre les deux photos. Le script défait la protection des adresses mail de Cloudflare
   (domaine de production seulement, clé tirée au hasard à chaque visite).

## Repères
- `texte.ts` est la seule fonction texte → HTML ; les classes des balises viennent du composant.
- `schema.ts` : `REGLES` sert au schéma et au rendu ; `FICHIERS` liste chaque fichier de `contenu/` (un
  fichier inconnu arrête la construction).
- Une page pas encore migrée passe toujours ses différences en paramètres au bloc partagé déjà migré (K15).
- Les blancs du HTML d'avant se reproduisent tels quels (exemple : la réponse de `FaqCommune`).
- La migration ne corrige rien : fautes, doublons, code mort viennent après, à part.
- Tailwind ne lit pas `contenu/` (`@source not` dans `global.css`) : ne jamais retirer cette ligne.
- JSON écrit par `JSON.stringify(x, null, 2)` + retour à la ligne final (R97). `npm run verifier` le contrôle.

## L'aperçu de l'éditeur (pas 2)
- `APERCU_BASE=/site/apercu/ npm run build` : même construction, plus les repères (`apercu.ts` : `repere`,
  `repereBloc`) et le script `apercu/edition.js`, posé en ligne. Sans la variable : rien, à l'octet.
- Un bloc migré porte `{...repereBloc(nom, fichier)}` ; chaque texte éditable `{...repere(chemin)}`, chemin par
  `id` (`/rubriques/@conservation/questions/@congeler/reponse`). Jamais d'élément ajouté : des attributs seuls.
- Preuve : `npm run comparer -- --apercu <public> <apercu>` = 0 différence (E1). Le script d'édition ne va
  jamais dans `public/` ni dans `_astro/`.
- `ecriture.ts` : les règles d'un geste (R12, R14, R16 à R19, R23, R27), jouées par `scripts/champ.mjs`.
