/**
 * Le moteur de texte : la SEULE fonction texte → HTML du site (projet 08, rendu/03 § 5).
 *
 * Un texte est une simple chaîne. Signes reconnus, et rien d'autre :
 *
 *   *pour tous*                       italique
 *   **On a ce qu'il vous faut !**     gras
 *   retour à la ligne (\n en JSON)    <br>
 *   [contactez-nous](page:/contact)   lien vers une page (ou page:/pros#faq)
 *   [la culture](ancre:culture)       lien vers une ancre de la même page
 *   [Pour de Bon](externe:pour-de-bon) lien externe (liste fermée, contenu/site/partages/liens.json)
 *   {{tournee.tarif}}                 jeton : une donnée (03 § 12)
 *   {email}                           variable d'un bloc dynamique (seulement si les règles la permettent)
 *
 * Tout le reste est du texte, échappé. Un <script> tapé par erreur s'affiche, il ne s'exécute jamais.
 *
 * Deux sorties :
 *   - analyserTexte(s, regles) : l'arbre et les erreurs (appelée par le schéma) ;
 *   - rendreTexte(s, regles, contexte) : le HTML (appelée par les composants, et plus tard par l'aperçu).
 *
 * Les classes des balises (lien, italique, gras) sont données par le composant, jamais par le contenu.
 * Ce fichier ne lit rien sur le disque : il doit pouvoir tourner dans un navigateur.
 */

export type Regles = {
  max?: number;
  italique?: boolean;
  gras?: boolean;
  liens?: boolean;
  lignes?: boolean;
  jetons?: boolean;
  variables?: readonly string[];
};

export type Cible = { page: string; ancre?: string } | { ancre: string } | { externe: string };

export type Noeud =
  | { t: "texte"; v: string }
  | { t: "italique"; enfants: Noeud[] }
  | { t: "gras"; enfants: Noeud[] }
  | { t: "ligne" }
  | { t: "lien"; cible: Cible; enfants: Noeud[] }
  | { t: "jeton"; nom: string }
  | { t: "variable"; nom: string };

export type Analyse = { noeuds: Noeud[]; erreurs: string[] };

const RE_LIEN = /^\[([^\]\n]+)\]\(([a-z]+):([^)\s]*)\)/;
const RE_JETON = /^\{\{([a-z0-9_]+(?:\.[a-z0-9_]+)*)\}\}/;
const RE_VARIABLE = /^\{([a-z_]+)\}/;
const RE_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const RE_PAGE = /^\/[a-z0-9\-\/]*$/;

type Cadre = { t: "racine" | "italique" | "gras"; enfants: Noeud[] };

/** Lit un texte et rend son arbre. N'échoue jamais : les fautes vont dans `erreurs`. */
export function analyserTexte(s: string, regles: Regles = {}): Analyse {
  const erreurs: string[] = [];
  const pile: Cadre[] = [{ t: "racine", enfants: [] }];
  let tampon = "";

  const haut = () => pile[pile.length - 1];
  const vider = () => {
    if (tampon) haut().enfants.push({ t: "texte", v: tampon });
    tampon = "";
  };
  const basculer = (t: "italique" | "gras", signe: string) => {
    vider();
    if (haut().t === t) {
      const c = pile.pop()!;
      if (c.enfants.length === 0) erreurs.push(`« ${signe}${signe} » : ${t} vide`);
      haut().enfants.push({ t, enfants: c.enfants });
    } else if (pile.some((c) => c.t === t)) {
      erreurs.push(`italique et gras se chevauchent (« ${signe} » mal placé)`);
    } else {
      if (t === "italique" && !regles.italique) erreurs.push("l'italique n'est pas permis ici");
      if (t === "gras" && !regles.gras) erreurs.push("le gras n'est pas permis ici");
      pile.push({ t, enfants: [] });
    }
  };

  let i = 0;
  while (i < s.length) {
    const reste = s.slice(i);
    const c = s[i];

    if (reste.startsWith("**")) { basculer("gras", "**"); i += 2; continue; }
    if (c === "*") { basculer("italique", "*"); i += 1; continue; }

    if (c === "\n") {
      vider();
      if (!regles.lignes) erreurs.push("le retour à la ligne n'est pas permis ici");
      haut().enfants.push({ t: "ligne" });
      i += 1;
      continue;
    }

    if (c === "[") {
      const m = RE_LIEN.exec(reste);
      if (m) {
        vider();
        const [tout, libelle, sorte, valeur] = m;
        if (!regles.liens) erreurs.push("les liens ne sont pas permis ici");
        const cible = lireCible(sorte, valeur, erreurs);
        // Le libellé d'un lien peut porter de l'italique ou du gras, jamais un autre lien.
        const sous = analyserTexte(libelle, { ...regles, liens: false, lignes: false });
        erreurs.push(...sous.erreurs);
        if (cible) haut().enfants.push({ t: "lien", cible, enfants: sous.noeuds });
        i += tout.length;
        continue;
      }
    }

    if (c === "{") {
      const j = RE_JETON.exec(reste);
      if (j) {
        vider();
        if (!regles.jetons) erreurs.push(`le jeton {{${j[1]}}} n'est pas permis ici`);
        haut().enfants.push({ t: "jeton", nom: j[1] });
        i += j[0].length;
        continue;
      }
      const v = regles.variables ? RE_VARIABLE.exec(reste) : null;
      if (v) {
        vider();
        if (!regles.variables!.includes(v[1])) erreurs.push(`la variable {${v[1]}} n'est pas permise ici`);
        haut().enfants.push({ t: "variable", nom: v[1] });
        i += v[0].length;
        continue;
      }
    }

    tampon += c;
    i += 1;
  }
  vider();

  while (pile.length > 1) {
    const c = pile.pop()!;
    erreurs.push(c.t === "gras" ? "« ** » ouvert et jamais fermé" : "« * » ouvert et jamais fermé");
    // On garde le texte pour l'aperçu : il est remis à plat dans le parent.
    haut().enfants.push({ t: "texte", v: c.t === "gras" ? "**" : "*" }, ...c.enfants);
  }
  return { noeuds: pile[0].enfants, erreurs };
}

function lireCible(sorte: string, valeur: string, erreurs: string[]): Cible | null {
  if (sorte === "page") {
    const [page, ancre] = valeur.split("#");
    if (!RE_PAGE.test(page)) { erreurs.push(`lien vers une page mal écrit : « ${valeur} »`); return null; }
    if (ancre !== undefined && !RE_ID.test(ancre)) { erreurs.push(`ancre mal écrite : « ${valeur} »`); return null; }
    return ancre === undefined ? { page } : { page, ancre };
  }
  if (sorte === "ancre") {
    if (!RE_ID.test(valeur)) { erreurs.push(`ancre mal écrite : « ${valeur} »`); return null; }
    return { ancre: valeur };
  }
  if (sorte === "externe") {
    if (!RE_ID.test(valeur)) { erreurs.push(`lien externe mal écrit : « ${valeur} »`); return null; }
    return { externe: valeur };
  }
  erreurs.push(`sorte de lien inconnue : « ${sorte}: » (page, ancre ou externe)`);
  return null;
}

/* ── Le rendu ─────────────────────────────────────────────────────── */

export type Contexte = {
  /** Les liens externes (contenu/site/partages/liens.json). */
  liens?: Record<string, { adresse: string }>;
  /** Classe des liens, donnée par le composant. Absente : pas d'attribut class. */
  classeLien?: string;
  /** Classe de l'italique. Défaut : "italic" (balise d'aujourd'hui : <em class="italic">). Vide : <em>. */
  classeItalique?: string;
  /** Classe du gras. Défaut : aucune (<strong>). */
  classeGras?: string;
  /** Valeur d'un jeton {{…}}. */
  donnee?: (nom: string) => string | undefined;
  /** Valeurs des variables {…}. Absentes : la variable reste écrite telle quelle. */
  variables?: Record<string, string>;
};

const ECHAPPE: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const echapper = (s: string) => s.replace(/[&<>"']/g, (c) => ECHAPPE[c]);
const attr = (nom: string, v: string | undefined) => (v ? ` ${nom}="${echapper(v)}"` : "");

export function rendreNoeuds(noeuds: Noeud[], ctx: Contexte = {}): string {
  let html = "";
  for (const n of noeuds) {
    switch (n.t) {
      case "texte":
        html += echapper(n.v);
        break;
      case "italique":
        html += `<em${attr("class", ctx.classeItalique ?? "italic")}>${rendreNoeuds(n.enfants, ctx)}</em>`;
        break;
      case "gras":
        html += `<strong${attr("class", ctx.classeGras)}>${rendreNoeuds(n.enfants, ctx)}</strong>`;
        break;
      case "ligne":
        html += "<br>";
        break;
      case "lien": {
        const c = n.cible;
        let href: string;
        let externe = "";
        if ("externe" in c) {
          const l = ctx.liens?.[c.externe];
          if (!l) throw new Error(`lien externe inconnu : « ${c.externe} » (voir contenu/site/partages/liens.json)`);
          href = l.adresse;
          externe = ` target="_blank" rel="noopener"`;
        } else if ("page" in c) {
          href = c.ancre ? `${c.page}#${c.ancre}` : c.page;
        } else {
          href = `#${c.ancre}`;
        }
        html += `<a href="${echapper(href)}"${externe}${attr("class", ctx.classeLien)}>${rendreNoeuds(n.enfants, ctx)}</a>`;
        break;
      }
      case "jeton": {
        const v = ctx.donnee?.(n.nom);
        if (v === undefined) throw new Error(`jeton sans donnée : {{${n.nom}}}`);
        html += echapper(v);
        break;
      }
      case "variable":
        html += echapper(ctx.variables?.[n.nom] ?? `{${n.nom}}`);
        break;
    }
  }
  return html;
}

/** Texte → HTML. Échoue (construction arrêtée) si le texte a une faute : le schéma l'aura déjà dit. */
export function rendreTexte(s: string, regles: Regles, ctx: Contexte = {}): string {
  const a = analyserTexte(s, regles);
  if (a.erreurs.length) throw new Error(`texte invalide « ${s.slice(0, 60)} » : ${a.erreurs.join(" ; ")}`);
  return rendreNoeuds(a.noeuds, ctx);
}
