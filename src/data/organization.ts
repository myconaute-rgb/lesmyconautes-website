/**
 * Données stables de l'organisation — source de vérité unique.
 *
 * Source : comptoir/legal.md (mentions légales).
 * Toute modif ici se propage à tous les schémas JSON-LD du site.
 *
 * ⚠️ Ne jamais dupliquer ces valeurs en dur dans un composant.
 */

export const ORG = {
  // Identité juridique
  legalName: "SCEA GRANGE CHAMPIGNONS",
  brandName: "Les Myconautes",
  legalForm: "SCEA (Société Civile d'Exploitation Agricole)",
  siret: "90248061500019",
  vatId: "FR70902480615",
  rcs: "Lyon 902 480 615",
  capital: "3000",
  founder: "Florestan Grange",
  email: "myconautes@pm.me",

  // URLs
  url: "https://lesmyconautes.fr",
  logo: "https://lesmyconautes.fr/scaphandre-logo.svg",

  // Adresses
  headquartersAddress: {
    streetAddress: "2022 route de Lyon",
    postalCode: "69440",
    addressLocality: "Chabanière",
    addressRegion: "Auvergne-Rhône-Alpes",
    addressCountry: "FR",
  },
  productionAddress: {
    streetAddress: "Rive-de-Gier",
    postalCode: "42800",
    addressLocality: "Rive-de-Gier",
    addressRegion: "Auvergne-Rhône-Alpes",
    addressCountry: "FR",
  },

  // Certification
  certification: {
    body: "Ecocert",
    number: "FR-BIO-01.250-0043443.2026.003",
    label: "FR-BIO-01",
  },

  // Coordonnées géographiques (Chabanière 69440)
  // ⚠️ TODO Florestan — confirmer via Google Maps en déposant un pin sur le siège social
  geo: {
    latitude: 45.6356,
    longitude: 4.6797,
  },

  // Domaines d'expertise (knowsAbout)
  knowsAbout: [
    "Substrat champignon",
    "Mycologie",
    "Myciculture professionnelle",
    "Pleurote",
    "Eryngii",
    "Hericium",
    "Agriculture biologique",
  ],
} as const;

/**
 * @id partagé pour l'entité Organization/LocalBusiness — réutilisé sur toutes
 * les pages via référence d'@id, garantit l'unicité de l'entité aux yeux de Google.
 */
export const ORG_ID = `${ORG.url}/#organization`;
