# lesmyconautes-website

Site marketing des **Myconautes** — champignonnière artisanale certifiée FR-BIO-01 à Rive-de-Gier (Loire). Champignons frais bio, substrats inoculés pour les producteurs, kits de culture pour la maison.

→ [lesmyconautes.fr](https://lesmyconautes.fr)

## Stack

- [Astro](https://astro.build) 7 — site statique
- [Tailwind CSS](https://tailwindcss.com) 4 — config CSS-first via `@theme` dans `src/styles/global.css`
- [Cloudflare Pages](https://pages.cloudflare.com) — hébergement, build automatique sur push, redirections via `public/_redirects`, headers via `public/_headers`
- [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) — sitemap-index.xml généré au build
- Zod (fourni par Astro, `astro/zod`) — schéma du contenu

## Développement local

```bash
npm install
npm run dev        # serveur dev http://localhost:4321
npm run build      # build statique dans ./dist/
npm run verifier   # build + contrôles du contenu (schéma, texte en dur, classes, moteur de texte)
npm run comparer -- <dist-avant> <dist-apres>   # prouve qu'un changement est sans effet visible
```

Node 22.18+ requis (`engines` dans `package.json` ; les scripts lisent les fichiers `.ts` directement).

## Structure

```
contenu/                 les mots du site, en JSON (éditeur du site, en cours de migration)
└── site/partages/       blocs partagés entre pages (liens.json, faq.json…)

src/
├── assets/              photos, pictos, logos (optimisés par astro:assets)
├── components/          blocs des pages (Nav, Footer, Hero, ContactSection, FaqCommune…) et seo/
├── contenu/             formes.ts, texte.ts, schema.ts, charger.ts, edition.ts (voir plus bas)
├── data/                variétés, gamme, espèces agri, FAQ des pages substrat, organisation
├── layouts/             BaseLayout — meta SEO, polices, slot principal
├── pages/               15 pages + /version.json
├── scripts/             contact-form.ts (soumission → webhook n8n)
└── styles/              global.css — tokens de couleur et polices

scripts/
├── comparer-html.mjs    compare deux constructions (arbre HTML, feuille de style, fichiers)
└── verifier.mjs         npm run verifier

public/
├── _headers             headers HTTP (CSP, HSTS, X-Frame, ...) servis par Cloudflare Pages
├── _redirects           301 préservation SEO (anciennes URLs → nouvelles)
├── robots.txt           pointe vers /sitemap-index.xml
└── favicons, manifeste, logos
```

Les 15 pages : accueil, particuliers, pros, agriculteurs, myconautes, contact ; les quatre pages substrat
(pleurote pro, eryngii-panicaut, hericium pro, incubé prêt à fructifier) ; cgv, cgv-substrat-pro,
mentions-legales, politique-confidentialite ; 404.

## Le contenu et l'éditeur du site

Les mots sortent du code, lot par lot, vers `contenu/` : Aline et Florestan les changeront par l'éditeur
du site, sans toucher au code. Chaque lot prouve que le site en ligne reste identique (`npm run comparer`).

- `src/contenu/texte.ts` — la seule fonction texte → HTML. Signes : `*italique*`, `**gras**`, retour à la
  ligne, `[libellé](page:/contact)`, `[libellé](externe:pour-de-bon)`, `{{jeton}}`. Tout le reste est échappé.
- `src/contenu/formes.ts` — les réglages de forme, en listes fermées, classes écrites en entier.
- `src/contenu/schema.ts` — le schéma de chaque fichier de `contenu/`. Un fichier invalide arrête le build.
- `src/contenu/charger.ts` — lit, valide et donne le contenu aux composants.
- `src/contenu/edition.ts` — les fiches d'édition (libellés vus dans l'éditeur).
- `/version.json` — l'identifiant de la version construite (`CF_PAGES_COMMIT_SHA`, ou `local`).

Tailwind ne lit pas `contenu/` (`@source not` dans `global.css`) : un mot tapé ne change jamais la feuille de style.

## Identité visuelle

Charte d'Aline (accueil, particuliers, pros, agriculteurs, myconautes, contact) : Anton pour les titres,
Chewy pour les sous-titres, Poppins pour le texte ; aplats violet, lilas, anis, cacao, jaune, sable, bleu,
rose, orange. Ancienne charte « Aurore Terracotta » (Fraunces, Outfit) : pages substrat et pages légales.
Tokens dans `src/styles/global.css` (`@theme`).

## Déploiement

Connecté à Cloudflare Pages. Chaque push sur `main` déclenche un build (`npm run build` → `dist/`).
Chaque branche poussée a sa préversion.

Variables d'environnement (dashboard Cloudflare Pages) : voir `.env.example`.

## Contribuer

Issues et PRs bienvenues. Pour toute question : [myconautes@pm.me](mailto:myconautes@pm.me).

## Licence

- **Code** : [MIT](./LICENSE) — tu peux le forker, t'en inspirer pour ton propre site.
- **Marque "Les Myconautes", logo scaphandre, photos, contenu rédactionnel** : tous droits réservés. Ne pas réutiliser sans autorisation.
