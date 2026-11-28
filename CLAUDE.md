# CLAUDE.md — lesmyconautes-website

Site vitrine des Myconautes (champignonnière bio, Rive-de-Gier). **Astro statique** déployé sur
**Cloudflare Pages** (build `astro build`, déclenché au push). Repo **indépendant du serveur** : un seul
lien vers le système — le **formulaire de contact → Turnstile + honeypot → webhook n8n** (`contact_site`).

## Structure
```
src/pages/       14 pages .astro (index, contact, agriculteurs/particuliers/restaurateurs,
                 a-propos, cgv, mentions-legales, politique-confidentialite, 404…)
src/components/  dont Turnstile.astro + HoneypotField.astro (anti-bot des formulaires)
src/scripts/     contact-form.ts (soumission → webhook n8n)
src/layouts/ · src/styles/ · src/data/ · public/
```

## Règles critiques (héritées d'incidents réels)
- **Validation des formulaires : `name` + `email` SEULEMENT.** Ne **jamais** exiger `message` ni un autre
  champ — incident 16/06 : les demandes grille tarifaire/devis à message vide étaient droppées **en
  silence** côté n8n, ~6 semaines de leads perdus (`claude_code/ANTI_BUGS.md` §92).
  Seule exception : le **calculateur de devis** (`DevisSubstrat.astro`) exige le téléphone (décision de Florestan,
  28/11/2026) ; le refus est montré sous le champ, jamais silencieux, et la demande est gardée avant le code.
- **Anti-bot = honeypot + Turnstile uniquement.** Jamais d'heuristique (User-Agent, contenu…) qui peut
  bloquer des humains.
- **Écriture inclusive maline dès la 1re rédaction** : collectifs et verbes plutôt que doublets, doublets
  courts si besoin, **pas de point médian**.
- **Aucun secret dans le repo** (le `TURNSTILE_SECRET_KEY` vit côté serveur/n8n, jamais ici).
- Contenus légaux : mentions SCEA/SIRET, certification **FR-BIO-01** verbatim — ne pas reformuler.

## Normes transversales (décisions Juger actées 2026-07-02 — `claude_code/docs/systeme/DECISIONS.md`)
- Le site reste **découplé** du système : tout nouveau pont (catalogue, dispos…) passe par un webhook n8n
  dédié et s'inscrit dans `claude_code/SECURITE.md` §3.1 (inventaire des surfaces).
- Toute modification du **workflow n8n `contact_site`** se fait dans le repo `claude_code`
  (`workflows/comptoir_contact_site.json`) — pas d'export brut commité ici (D15).

## Déploiement
Push sur `main` → Cloudflare Pages build et publie. Pas de serveur à gérer, pas de `.env` de prod dans le repo.

## Contexte élargi
- Audit AS-IS du système complet, figé le 22/11/2026 (photo de juillet) : `claude_code/docs/systeme/`.
- Le pipeline SEO « page-auto » (23 skills, repo `claude_code/comptoir/`) écrit dans ce repo lors des
  vagues — voir ses gardes-fous avant toute vague (`myconautes-skill-17-deploiement` : seul EXECUTOR git).
