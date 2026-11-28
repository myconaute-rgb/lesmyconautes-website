# CLAUDE.md — lesmyconautes-website

Site vitrine des Myconautes (champignonnière bio, Rive-de-Gier). **Astro 7 statique** déployé sur
**Cloudflare Pages** (build `astro build`, déclenché au push). Repo **indépendant du serveur** : un seul
lien vers le système — le **formulaire de contact → Turnstile + honeypot → webhook n8n** (`contact_site`).

## Structure
```
contenu/         les mots du site en JSON (éditeur du site, migration en cours) — voir plus bas
src/pages/       15 pages .astro (index, particuliers, pros, agriculteurs, myconautes, contact,
                 4 pages substrat-*, cgv, cgv-substrat-pro, mentions-legales,
                 politique-confidentialite, 404) + version.json.ts
src/components/  blocs des pages, dont Turnstile.astro + HoneypotField.astro (anti-bot des formulaires)
src/contenu/     formes.ts, texte.ts, schema.ts, charger.ts, edition.ts, integration.ts
src/scripts/     contact-form.ts (soumission → webhook n8n)
src/layouts/ · src/styles/ · src/data/ · src/assets/ · public/
scripts/         comparer-html.mjs (preuve « sans effet visible », modes --apercu et --perimetre),
                 verifier.mjs (npm run verifier), champ.mjs et fiches.mjs (pour l'atelier de l'éditeur),
                 editeur-etat.sh (R94), photo-en-ligne.mjs
```

## Règles critiques (héritées d'incidents réels)
- **Validation des formulaires : `name` + `email` SEULEMENT.** Ne **jamais** exiger un autre champ
  nouveau — incident 16/06 : les demandes grille tarifaire/devis à message vide étaient droppées **en
  silence** côté n8n, ~6 semaines de leads perdus (`claude_code/ANTI_BUGS.md` §92). Exceptions décidées par
  Florestan le 28/11/2026 et laissées telles quelles : message obligatoire sur accueil, contact et
  myconautes ; « Espèces » obligatoire sur agriculteurs.
- **Anti-bot = honeypot + Turnstile uniquement.** Jamais d'heuristique (User-Agent, contenu…) qui peut
  bloquer des humains.
- **Écriture inclusive maline dès la 1re rédaction** : collectifs et verbes plutôt que doublets, doublets
  courts si besoin, **pas de point médian**.
- **Aucun secret dans le repo** (le `TURNSTILE_SECRET_KEY` vit côté serveur/n8n, jamais ici).
- Contenus légaux : mentions SCEA/SIRET, certification **FR-BIO-01** verbatim — ne pas reformuler.

## Contenu et éditeur du site (projet 08, `claude_code` : `projets/08_editeur_site/`)
Les mots sortent du code lot par lot ; chaque lot prouve que le site reste identique. Méthode, preuves et
repères : `src/contenu/CLAUDE.md`, à lire avant de toucher un composant, `contenu/` ou `src/contenu/`.

- **R92** Aucun texte nouveau en dur, nulle part, dès maintenant (décision A). Dans une page migrée : un texte
  se change dans `contenu/`, jamais dans un composant, et un test (« aucun texte en dur ») échoue sinon.
  Dans une page pas encore migrée : on ne déplace rien hors lot, mais tout texte ajouté va dans `contenu/`.
- **R93** Un identifiant (`id`) ne se renomme pas et ne se réutilise pas.
- **R94** Avant de toucher à la structure d'un bloc : `scripts/editeur-etat.sh` dit s'il y a un brouillon
  ouvert dessus (il lit l'état de l'atelier, `/srv/atelier_site/etat.json`).
- **R95** Une classe de forme s'écrit en toutes lettres dans `src/contenu/formes.ts`. Jamais de classe
  fabriquée par collage.
- **R96** Un nouveau type de bloc arrive avec son schéma, sa fiche d'édition et son exemple.
  `npm run verifier` est vert.
- **R97** JSON : deux espaces, pas de tri des clés.
- **R98** Jamais un prix ni une donnée métier dans `contenu/`, sauf `donnees/publiques.json`. Ce fichier est
  une copie de la base. Après le pas 8, seule la publication de la copie l'écrit.

## Normes transversales (décisions Juger actées 2026-07-02 — `claude_code/docs/systeme/DECISIONS.md`)
- Le site reste **découplé** du système : tout nouveau pont (catalogue, dispos…) passe par un webhook n8n
  dédié et s'inscrit dans `claude_code/SECURITE.md` §3.1 (inventaire des surfaces).
- Toute modification du **workflow n8n `contact_site`** se fait dans le repo `claude_code`
  (`workflows/comptoir_contact_site.json`) — pas d'export brut commité ici (D15).

## Déploiement
Push sur `main` → Cloudflare Pages build et publie. Chaque branche a sa préversion. Pas de serveur à gérer,
pas de `.env` de prod dans le repo. `/version.json` dit quelle version est servie.

## Contexte élargi
- Audit AS-IS du système complet, figé le 22/11/2026 (photo de juillet) : `claude_code/docs/systeme/`.
- Le pipeline SEO « page-auto » (23 skills, repo `claude_code/comptoir/`) écrit dans ce repo lors des
  vagues — voir ses gardes-fous avant toute vague (`myconautes-skill-17-deploiement` : seul EXECUTOR git).
