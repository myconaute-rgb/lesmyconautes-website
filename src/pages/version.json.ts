/**
 * /version.json : l'identifiant de la version construite (projet 08, rendu/04 § 7).
 * L'atelier le relit sur le site public jusqu'à y lire l'identifiant qu'il vient de pousser.
 * Cloudflare Pages fournit CF_PAGES_COMMIT_SHA à la construction ; ailleurs : « local ».
 * Le dépôt est public : ce fichier ne révèle rien.
 */
export const prerender = true;

export function GET() {
  const version = process.env.CF_PAGES_COMMIT_SHA || "local";
  return new Response(JSON.stringify({ version }) + "\n", {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
