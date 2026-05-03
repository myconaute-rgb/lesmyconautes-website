/**
 * Utilitaires partagés pour les FAQ.
 *
 * Single source of truth : chaque FAQ stocke `answerHtml` (rendu visible) ET
 * fournit via `toLdItems()` la version plain text pour le JSON-LD `FAQPage`.
 *
 * RÈGLE STRICTE : `answerLd` (texte JSON-LD) doit représenter exactement le
 * même contenu que `answerHtml` rendu — sinon Google sanctionne pour cloaking.
 */

export interface FaqItem {
  question: string;
  /** HTML autorisé : <strong>, <em>, <a>, <sup>, <blockquote>, <p>. */
  answerHtml: string;
}

export interface FaqLdItem {
  question: string;
  answer: string;
}

/**
 * Strip basique du HTML pour générer la version plain text destinée au JSON-LD.
 * - Conserve le texte des balises inline (<strong>, <em>, <sup>, <a>)
 * - Conserve le texte des blocs (<p>, <blockquote>) en les séparant par un espace
 * - Décode &nbsp; → espace normal
 * - Collapse les espaces multiples
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<\/(p|blockquote|div)>\s*<(p|blockquote|div)[^>]*>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function toLdItems(items: readonly FaqItem[]): FaqLdItem[] {
  return items.map((it) => ({
    question: it.question,
    answer: stripHtml(it.answerHtml),
  }));
}
