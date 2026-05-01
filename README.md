# lesmyconautes-website

Site marketing des **Myconautes** — champignonnière artisanale certifiée FR-BIO-01 à Rive-de-Gier (Loire). Cinq variétés cultivées (pleurote, éryngii, hericium, karabella, purati), substrats inoculés bio pour la production agricole, kits de culture pour la maison.

→ [lesmyconautes.fr](https://lesmyconautes.fr)

## Stack

- [Astro](https://astro.build) 6 — site statique, MDX-ready
- [Tailwind CSS](https://tailwindcss.com) 4 — config CSS-first via `@theme` dans `src/styles/global.css`
- [Cloudflare Pages](https://pages.cloudflare.com) — hébergement, build automatique sur push, redirections via `public/_redirects`, headers via `public/_headers`
- [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) — sitemap-index.xml généré au build

## Développement local

```bash
npm install
npm run dev   # serveur dev http://localhost:4321
npm run build # build statique dans ./dist/
```

Node 22+ requis (`engines` dans `package.json`).

## Structure

```
src/
├── components/   composants réutilisables (Nav, Footer, Hero, PageHero, ProductCard, ...)
├── data/         variétés et catalogue agri (alignés sur business keys de la DB Myconautes)
├── layouts/      BaseLayout — meta SEO, Google Fonts, slot principal
├── pages/        routes Astro (index, particuliers, restaurateurs, agriculteurs, contact, a-propos, mentions-legales, cgv)
└── styles/       global.css — tokens Aurore Terracotta + fontes Fraunces & Outfit

public/
├── _headers      headers HTTP (CSP, HSTS, X-Frame, ...) servis par Cloudflare Pages
├── _redirects    301 préservation SEO (anciennes URLs → nouvelles)
├── robots.txt    pointe vers /sitemap-index.xml
└── scaphandre-logo.svg
```

## Identité visuelle

Palette **Aurore Terracotta** : ivoire, crème, lavande, terracotta, turquoise, brun. Tokens dans `src/styles/global.css` (`@theme`).
Typo : Fraunces (variable, italiques expressives) pour les titres, Outfit (variable) pour le corps.

## Déploiement

Connecté à Cloudflare Pages. Chaque push sur `main` déclenche un build (`npm run build` → `dist/`).

Variables d'environnement (Phase 1+, dashboard Cloudflare Pages) : voir `.env.example`.

## Contribuer

Issues et PRs bienvenues. Pour toute question : [myconaute@pm.me](mailto:myconaute@pm.me).

## Licence

- **Code** : [MIT](./LICENSE) — tu peux le forker, t'en inspirer pour ton propre site.
- **Marque "Les Myconautes", logo scaphandre, photos, contenu rédactionnel** : tous droits réservés. Ne pas réutiliser sans autorisation.
