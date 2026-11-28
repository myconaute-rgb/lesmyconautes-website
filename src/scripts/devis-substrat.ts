/**
 * Calculateur de devis de substrat (étape 5 du cadrage, claude_code docs/aide_aline/devis_substrat).
 *
 *   page → api.lesmyconautes.fr/webhook/devis_substrat_* → passerelle (CORS, débit) → n8n → base
 *
 * Contrat des appels : claude_code briefs/fonctionnels/brief_fonctionnel_comptoir_devis_substrat.md § 2.
 * Règles :
 *   - aucun chiffre métier ici : variétés, mentions, palettes, minimum, délais et CGV viennent des variables ;
 *   - aucun prix sans le code reçu par mail ; le code n'est jamais dans une réponse ;
 *   - la demande est gardée côté serveur AVANT le code : quoi qu'il arrive, la page dit « Aline vous rappelle » ;
 *   - tout texte venu du serveur passe par textContent (jamais innerHTML).
 * Variables introuvables (panne) : on montre le formulaire de demande d'avant (repli), jamais moins bien qu'avant.
 */
import { afficherRepli, lienMailRepli, reportBlocked } from "./contact-form";

const API = "https://api.lesmyconautes.fr/webhook";

type Item = { catalogue_id: number; nom: string; disponibilite: string; mentions: string[] };
type Variables = {
  catalogue: Item[];
  palette_kg: number;
  demi_palette_kg: number;
  minimum_kg: number;
  validite_jours: number;
  delai_ferme_jours?: number;
  delai_commande_semaines?: number;
  cgv?: { url?: string; version?: string };
};
type Ligne = {
  catalogue_id: number;
  nom: string;
  statut: string;
  kg?: number;
  kg_demande?: number;
  quantite?: number;
  unite_vente?: string;
  prix_unitaire_ht?: number;
  total_ht?: number;
  delai_a_convenir?: boolean;
};
type Estimation = {
  chiffrable: boolean;
  motifs?: { code: string }[];
  lignes?: Ligne[];
  kg_total?: number;
  retrait?: boolean;
  emballage?: { mode?: string; quantite?: number; total_ht?: number };
  transport?: { mode?: string; departement?: string; palettes?: number; total_ht?: number };
  total_ht?: number;
  total_ttc?: number;
  programme?: { semaines_entre_envois?: number; budget_mois_ht?: number } | null;
  minimum_kg?: number;
  validite_jours?: number;
};
type Reponse = { http: number; data: Record<string, unknown> };

// ── Petits outils ────────────────────────────────────────────────────────────────────────────────────────────
const fmtEur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const fmtNb = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 });
const eur = (n: unknown) => (Number.isFinite(Number(n)) ? fmtEur.format(Number(n)) : "?");
const nb = (n: unknown) => (Number.isFinite(Number(n)) ? fmtNb.format(Number(n)) : "?");

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe = "", texte?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texte !== undefined) e.textContent = texte;
  return e;
}
function heure(iso: unknown): string {
  const d = new Date(String(iso));
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function dateHeure(iso: unknown): string {
  const d = new Date(String(iso));
  return Number.isNaN(d.getTime())
    ? ""
    : `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} à ${heure(iso)}`;
}

async function appeler(chemin: string, corps?: unknown): Promise<Reponse> {
  try {
    const r = await fetch(`${API}/${chemin}`, corps === undefined
      ? { method: "GET" }
      : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    let data: Record<string, unknown> = {};
    try {
      data = (await r.json()) ?? {};
    } catch {}
    return { http: r.status, data };
  } catch {
    return { http: 0, data: {} };
  }
}

// Pourquoi une estimation n'est pas chiffrée : le visiteur lit une raison, jamais un code (mêmes mots que le mail).
function motif(e: Estimation): string {
  const codes = (e.motifs ?? []).map((m) => String(m?.code));
  for (const c of codes) {
    if (c === "sous_minimum") return `la quantité est sous le minimum de commande (${nb(e.minimum_kg)} kg)`;
    if (c === "bientot_disponible_seulement") return "les variétés choisies ne sont pas encore disponibles";
    if (c === "variete_sans_prix") return "une variété choisie n'a pas encore de prix";
  }
  if (codes.some((c) => c.startsWith("transport_"))) return "le transport jusqu'à chez vous se chiffre au cas par cas";
  return "votre demande demande un prix sur mesure";
}

// ── Le calculateur ───────────────────────────────────────────────────────────────────────────────────────────
export function wireDevisSubstrat(racine: HTMLElement, repli: HTMLElement | null): void {
  const q = <T extends Element>(s: string) => racine.querySelector<T>(s);
  const chargement = q<HTMLElement>("[data-devis-chargement]")!;
  const form = q<HTMLFormElement>("[data-devis-form]")!;
  const zoneVarietes = q<HTMLElement>("[data-devis-varietes]")!;
  const total = q<HTMLElement>("[data-devis-total]")!;
  const aidePalette = q<HTMLElement>("[data-devis-aide-palette]")!;
  const blocCp = q<HTMLElement>("[data-devis-bloc-cp]")!;
  const coordonnees = q<HTMLElement>("[data-devis-coordonnees]")!;
  const rgpd = q<HTMLElement>("[data-devis-rgpd]")!;
  const envoyer = q<HTMLButtonElement>("[data-devis-envoyer]")!;
  const erreur = q<HTMLElement>("[data-devis-erreur]")!;
  const formCode = q<HTMLFormElement>("[data-devis-code]")!;
  const champCode = q<HTMLInputElement>("#dv-code")!;
  const confirmer = q<HTMLButtonElement>("[data-devis-confirmer]")!;
  const renvoyer = q<HTMLButtonElement>("[data-devis-renvoyer]")!;
  const msgCode = q<HTMLElement>("[data-devis-code-message]")!;
  const resultat = q<HTMLElement>("[data-devis-resultat]")!;
  const fin = q<HTMLElement>("[data-devis-fin]")!;

  let v: Variables | null = null;
  let jeton: string | null = null;
  let mode: "demande" | "recalcul" = "demande";
  let blocages = 0;

  const etapes = [form, formCode, resultat, fin];
  function montrer(etape: HTMLElement): void {
    for (const e of etapes) e.classList.toggle("hidden", e !== etape);
  }
  function defiler(e: HTMLElement): void {
    e.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ── Les variétés (lues en base) ──
  const champsKg = new Map<number, HTMLInputElement>();

  function construireVarietes(vars: Variables): void {
    aidePalette.textContent =
      `Une palette fait ${nb(vars.palette_kg)} kg, une demi-palette ${nb(vars.demi_palette_kg)} kg. ` +
      `Vous pouvez mélanger les variétés sur une même palette. Minimum de commande : ${nb(vars.minimum_kg)} kg.`;
    zoneVarietes.replaceChildren();
    for (const it of vars.catalogue) {
      const bientot = it.disponibilite === "coming_soon";
      const ligne = el("div", `grid gap-3 sm:grid-cols-[1fr_auto] items-center bg-page p-4 ${bientot ? "opacity-90" : ""}`);
      const gauche = el("div");
      const titre = el("div", "flex flex-wrap items-center gap-2");
      titre.append(el("span", "font-title text-lg text-cacao leading-tight", it.nom));
      const badges: string[] = [];
      if (bientot) badges.push("Bientôt disponible");
      if (it.disponibilite === "on_order") badges.push("Sur commande");
      for (const m of it.mentions ?? []) if (m) badges.push(String(m));
      for (const b of badges) titre.append(el("span", "px-2.5 py-1 bg-lilas text-brun text-xs font-medium", b));
      gauche.append(titre);
      if (bientot) gauche.append(el("p", "text-xs text-brun/70 mt-1", "Pas encore de prix. Dites-nous combien vous en voudriez : on vous prévient dès qu'elle est prête."));
      else if (it.disponibilite === "on_order") gauche.append(el("p", "text-xs text-brun/70 mt-1", "Délai à convenir avec nous."));

      const droite = el("div", "flex flex-wrap items-center gap-2");
      const input = el("input", "w-24 px-3 py-2.5 rounded-btn bg-ivoire border border-brun/15 focus:border-anis focus:outline-none text-sm text-right");
      input.type = "number";
      input.min = "0";
      input.step = "1";
      input.inputMode = "numeric";
      input.placeholder = "0";
      input.id = `dv-kg-${it.catalogue_id}`;
      input.name = `kg_${it.catalogue_id}`;
      const lab = el("label", "sr-only", `${it.nom} : poids en kg`);
      lab.htmlFor = input.id;
      const raccourcis: [string, number][] = [
        ["½ palette", Number(vars.demi_palette_kg)],
        ["1 palette", Number(vars.palette_kg)],
      ];
      const boutons: HTMLButtonElement[] = [];
      for (const [texte, kg] of raccourcis) {
        if (!(kg > 0)) continue;
        const b = el("button", "px-3 py-2 rounded-btn border border-cacao/40 text-cacao text-xs font-semibold hover:bg-cacao/10 aria-pressed:bg-cacao aria-pressed:text-page transition-colors", texte);
        b.type = "button";
        b.setAttribute("aria-pressed", "false");
        b.dataset.kg = String(kg);
        b.addEventListener("click", () => {
          input.value = input.value === String(kg) ? "" : String(kg);
          input.dispatchEvent(new Event("input", { bubbles: true }));
        });
        boutons.push(b);
      }
      input.addEventListener("input", () => {
        for (const b of boutons) b.setAttribute("aria-pressed", String(input.value === b.dataset.kg));
        majTotal();
      });
      droite.append(...boutons, lab, input, el("span", "text-sm", "kg"));
      ligne.append(gauche, droite);
      zoneVarietes.append(ligne);
      champsKg.set(it.catalogue_id, input);
    }
    majTotal();
  }

  function lignesSaisies(): { catalogue_id: number; kg: number; nom: string }[] {
    const out: { catalogue_id: number; kg: number; nom: string }[] = [];
    for (const it of v?.catalogue ?? []) {
      const kg = Number(champsKg.get(it.catalogue_id)?.value || 0);
      if (Number.isFinite(kg) && kg > 0) out.push({ catalogue_id: it.catalogue_id, kg, nom: it.nom });
    }
    return out;
  }

  function majTotal(): void {
    if (!v) return;
    const chiffrables = new Set(v.catalogue.filter((i) => i.disponibilite !== "coming_soon").map((i) => i.catalogue_id));
    const kg = lignesSaisies().filter((l) => chiffrables.has(l.catalogue_id)).reduce((s, l) => s + l.kg, 0);
    if (kg <= 0) {
      total.textContent = "";
      return;
    }
    total.textContent = `Total : ${nb(kg)} kg.` + (kg < v.minimum_kg
      ? ` En dessous de ${nb(v.minimum_kg)} kg, pas de prix en ligne : Aline vous rappelle avec un prix sur mesure.`
      : "");
  }

  const retrait = () => form.querySelector<HTMLInputElement>('input[name="livraison"]:checked')?.value === "retrait";
  form.querySelectorAll<HTMLInputElement>('input[name="livraison"]').forEach((r) =>
    r.addEventListener("change", () => blocCp.classList.toggle("hidden", retrait())),
  );
  const valeur = (nom: string) => (form.elements.namedItem(nom) as HTMLInputElement | null)?.value?.trim() ?? "";

  // ── Erreurs par champ ──
  function effacerErreurs(): void {
    erreur.classList.add("hidden");
    racine.querySelectorAll<HTMLElement>("[data-devis-erreur-champ]").forEach((e) => e.classList.add("hidden"));
  }
  function erreurChamp(champ: string, message: string): void {
    const zone = racine.querySelector<HTMLElement>(`[data-devis-erreur-champ="${CSS.escape(champ)}"]`);
    if (zone) {
      zone.textContent = message;
      zone.classList.remove("hidden");
      const saisie = champ === "lignes" ? zoneVarietes.querySelector("input") : form.querySelector(`[name="${CSS.escape(champ)}"]`);
      (saisie as HTMLElement | null)?.focus();
    } else {
      erreurGenerale(message);
    }
  }
  function erreurGenerale(message: string): void {
    erreur.textContent = message;
    erreur.classList.remove("hidden");
  }

  function finSansCode(titre: string, texte: string): void {
    fin.replaceChildren(el("h3", "font-title text-2xl text-cacao", titre), el("p", "text-sm leading-relaxed", texte));
    montrer(fin);
    defiler(fin);
  }

  // Rien n'a pu être gardé (serveur injoignable) : la demande part par la messagerie du visiteur, déjà écrite.
  function repliMessagerie(): void {
    const lien = el("a", "inline-flex items-center my-2 px-6 py-3 rounded-btn bg-cacao text-page text-sm font-semibold tracking-wide hover:bg-cacao/90 transition-colors", "Envoyer ma demande par mail");
    lien.href = lienMailRepli(form);
    erreur.replaceChildren(
      el("strong", "block", "Votre demande n'a pas pu partir."),
      el("span", "block", "Notre serveur ne répond pas pour l'instant. Écrivez-nous directement :"),
      lien,
    );
    erreur.classList.remove("hidden");
  }

  function corpsCalcul() {
    const sem = Number(valeur("semaines_entre_envois"));
    return {
      lignes: lignesSaisies(),
      code_postal: retrait() ? null : valeur("code_postal"),
      retrait: retrait(),
      semaines_entre_envois: Number.isInteger(sem) ? sem : 0,
    };
  }
  function verifierSaisie(): boolean {
    if (!lignesSaisies().length) {
      erreurChamp("lignes", "Indiquez au moins une variété et sa quantité.");
      return false;
    }
    if (!retrait() && !valeur("code_postal")) {
      erreurChamp("code_postal", "Indiquez votre code postal, ou choisissez de venir chercher.");
      return false;
    }
    return true;
  }

  function occupe(b: HTMLButtonElement, texte: string | null): void {
    if (texte) {
      b.dataset.texte = b.textContent ?? "";
      b.textContent = texte;
      b.disabled = true;
    } else {
      b.textContent = b.dataset.texte ?? b.textContent;
      b.disabled = false;
    }
  }

  // ── Mode de l'étape 1 : demande (coordonnées, anti-robot) ou recalcul (adresse déjà confirmée) ──
  function passerEn(m: "demande" | "recalcul"): void {
    mode = m;
    coordonnees.classList.toggle("hidden", m === "recalcul");
    rgpd.classList.toggle("hidden", m === "recalcul");
    envoyer.textContent = m === "recalcul" ? "Recalculer" : "Recevoir mon code";
  }

  // ── Étape 1 : envoyer la demande ──
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    effacerErreurs();
    if (form.querySelector<HTMLInputElement>("[data-honeypot]")?.value) return;
    if (!verifierSaisie()) return;
    if (mode === "recalcul") return recalculer(envoyer);

    const tokenCf = form.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value?.trim();
    if (!tokenCf) {
      blocages += 1;
      reportBlocked("devis_substrat", blocages);
      if (blocages >= 2) afficherRepli(erreur, form);
      else erreurGenerale("Vérification de sécurité en cours, réessayez dans une seconde.");
      return;
    }

    occupe(envoyer, "Envoi…");
    const corps = {
      action: "demander",
      nom: valeur("nom"),
      email: valeur("email"),
      telephone: valeur("telephone"),
      etablissement: valeur("etablissement") || null,
      message: valeur("message") || null,
      ...corpsCalcul(),
      "cf-turnstile-response": tokenCf,
      website: form.querySelector<HTMLInputElement>("[data-honeypot]")?.value ?? "",
    };
    const r = await appeler("devis_substrat_demande", corps);
    occupe(envoyer, null);
    // Un jeton anti-robot ne sert qu'une fois.
    (window as unknown as { turnstile?: { reset: () => void } }).turnstile?.reset();

    const d = r.data;
    if (r.http === 200 && d.ok === true) {
      if (!d.jeton) return; // piège à robots : réponse muette
      jeton = String(d.jeton);
      if (d.code_envoye === true) {
        q<HTMLElement>("[data-devis-email-affiche]")!.textContent = corps.email;
        q<HTMLElement>("[data-devis-expire]")!.textContent = heure(d.expire_a);
        msgCode.classList.add("hidden");
        champCode.value = "";
        montrer(formCode);
        defiler(formCode);
        champCode.focus();
      } else if (d.motif === "repli") {
        finSansCode("Votre demande est bien partie", "Le calcul en ligne est indisponible pour l'instant. Aline vous rappelle avec votre prix.");
      } else {
        finSansCode("Votre demande est bien partie", "Nous ne pouvons pas vous envoyer de code pour l'instant. Aline vous rappelle avec votre prix.");
      }
      return;
    }
    if (r.http === 400 && d.error === "invalide" && typeof d.champ === "string") {
      return erreurChamp(d.champ, String(d.message ?? "Vérifiez ce champ."));
    }
    if (r.http === 0 || r.http === 503 || r.http >= 500) return repliMessagerie();
    erreurGenerale(typeof d.message === "string" ? d.message : "Une erreur est survenue. Réessayez dans un instant.");
  });

  // ── Étape 2 : le code ──
  formCode.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const code = champCode.value.replace(/\D/g, "");
    if (code.length !== 6) return messageCode("Le code a 6 chiffres.", true);
    occupe(confirmer, "Vérification…");
    const r = await appeler("devis_substrat_code", { action: "confirmer", jeton, code });
    occupe(confirmer, null);
    const d = r.data;
    if (r.http === 200 && d.status === "ok") {
      if (d.variables && typeof d.variables === "object") v = { ...(v as Variables), ...(d.variables as Variables) };
      return afficherEstimation(d.estimation as Estimation, {
        mail: d.mail_envoye === true,
        jusqua: d.recalcul_jusqu_a,
      });
    }
    if (r.http === 200 && d.status === "wrong") {
      const n = Number(d.essais_restants);
      return messageCode(`Ce code ne correspond pas. Utilisez le dernier code reçu. Encore ${nb(n)} essai${n > 1 ? "s" : ""}.`, true);
    }
    if (r.http === 200 && d.status === "dead") {
      return messageCode("Ce code n'est plus valable. Demandez un nouveau code ci-dessous.", true);
    }
    messageCode(typeof d.message === "string" ? d.message : "Le service ne répond pas. Réessayez dans un instant : votre demande est enregistrée.", true);
  });

  function messageCode(texte: string, alerte: boolean): void {
    msgCode.textContent = texte;
    msgCode.className = `text-sm font-semibold ${alerte ? "text-terracotta" : "text-anis"}`;
  }

  renvoyer.addEventListener("click", async () => {
    occupe(renvoyer, "Envoi…");
    const r = await appeler("devis_substrat_demande", { action: "renvoyer", jeton });
    occupe(renvoyer, null);
    const d = r.data;
    if (r.http === 200 && d.ok === true && d.code_envoye === true) {
      q<HTMLElement>("[data-devis-expire]")!.textContent = heure(d.expire_a);
      champCode.value = "";
      champCode.focus();
      return messageCode("Un nouveau code est parti. Seul ce dernier code est valable.", false);
    }
    if (r.http === 200 && d.motif === "deja_confirmee") {
      passerEn("recalcul");
      return recalculer(renvoyer);
    }
    if (r.http === 200 && typeof d.motif === "string" && d.motif.startsWith("limite")) {
      return messageCode("Trop de codes demandés pour l'instant. Votre demande est enregistrée : Aline vous rappelle.", true);
    }
    if (r.http === 200 && d.motif === "mail") {
      return messageCode("Le mail n'a pas pu partir. Votre demande est enregistrée : Aline vous rappelle.", true);
    }
    messageCode(typeof d.message === "string" ? d.message : "Le service ne répond pas. Réessayez dans un instant.", true);
  });

  q<HTMLButtonElement>("[data-devis-retour]")!.addEventListener("click", () => {
    jeton = null;
    passerEn("demande");
    montrer(form);
    defiler(form);
  });

  // ── Recalcul (adresse confirmée, sans nouveau code) ──
  async function recalculer(b: HTMLButtonElement): Promise<void> {
    occupe(b, "Calcul…");
    const r = await appeler("devis_substrat_code", { action: "recalculer", jeton, ...corpsCalcul() });
    occupe(b, null);
    const d = r.data;
    if (r.http === 200 && d.status === "ok") {
      return afficherEstimation(d.estimation as Estimation, { restants: d.recalculs_restants, jusqua: d.recalcul_jusqu_a });
    }
    montrer(form);
    if (r.http === 200 && d.status === "invalide") {
      return erreurGenerale("Vérifiez les quantités et le code postal, puis recalculez.");
    }
    if (r.http === 200 && ["expire", "limite", "non_confirmee", "dead"].includes(String(d.status))) {
      jeton = null;
      passerEn("demande");
      return erreurGenerale("Le recalcul n'est plus possible pour cette demande. Renvoyez-la : un nouveau code vous sera envoyé.");
    }
    erreurGenerale("Le service ne répond pas. Réessayez dans un instant.");
  }

  // ── Étape 3 : l'estimation ──
  function afficherEstimation(e: Estimation, info: { mail?: boolean; restants?: unknown; jusqua?: unknown }): void {
    const vars = v as Variables;
    const blocs: HTMLElement[] = [];
    const titre = el("h3", "font-title text-2xl text-cacao focus:outline-none", "Votre estimation");
    titre.tabIndex = -1;
    blocs.push(titre);

    const table = el("div", "grid gap-0 bg-page");
    const rangee = (gauche: string, detail: string, droite: string, fort = false) => {
      const r = el("div", `grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 px-4 py-3 border-b border-brun/10 ${fort ? "font-semibold" : ""}`);
      const g = el("div");
      g.append(el("div", "text-sm", gauche));
      if (detail) g.append(el("div", "text-xs text-brun/70", detail));
      r.append(g, el("div", "text-sm text-right whitespace-nowrap", droite));
      table.append(r);
    };

    for (const l of e.lignes ?? []) {
      if (l.statut === "chiffree") {
        const detail = l.unite_vente === "sac"
          ? `${nb(l.kg)} kg · ${nb(l.quantite)} sacs × ${eur(l.prix_unitaire_ht)} HT`
          : `${nb(l.quantite)} kg × ${eur(l.prix_unitaire_ht)} HT le kg`;
        rangee(l.nom, detail + (l.delai_a_convenir ? " · délai à convenir" : ""), e.chiffrable ? `${eur(l.total_ht)} HT` : "");
      } else if (l.statut === "bientot_disponible") {
        rangee(l.nom, "Bientôt disponible : on vous prévient.", "—");
      } else {
        rangee(l.nom, "Prix sur mesure : Aline vous rappelle.", "—");
      }
    }

    if (e.chiffrable) {
      if (e.emballage && e.emballage.mode !== "retrait" && Number(e.emballage.quantite) > 0) {
        const n = Number(e.emballage.quantite);
        rangee(`Emballage`, `${nb(n)} palette${n > 1 ? "s" : ""}`, `${eur(e.emballage.total_ht)} HT`);
      }
      if (e.retrait) rangee("Transport", "Retrait à Rive-de-Gier", "0 €");
      else if (e.transport) {
        const n = Number(e.transport.palettes);
        rangee("Transport estimé", `Jusqu'au ${e.transport.departement ?? "?"} · ${nb(n)} palette${n > 1 ? "s" : ""}`, `${eur(e.transport.total_ht)} HT`);
      }
      blocs.push(table);
      const tot = el("div", "flex flex-wrap items-baseline justify-between gap-2 px-4");
      tot.append(el("span", "font-title text-xl text-cacao", "Total"));
      const montants = el("span", "text-right");
      montants.append(el("span", "block font-title text-3xl text-anis", `${eur(e.total_ht)} HT`), el("span", "block text-xs text-brun/70", `soit ${eur(e.total_ttc)} TTC`));
      tot.append(montants);
      blocs.push(tot);
      const p = e.programme;
      if (p && Number(p.semaines_entre_envois) > 0) {
        blocs.push(el("p", "text-sm px-4", `Un envoi toutes les ${nb(p.semaines_entre_envois)} semaines : environ ${eur(p.budget_mois_ht)} HT par mois.`));
      }
    } else {
      blocs.push(el("p", "text-sm leading-relaxed", `Nous ne pouvons pas chiffrer cette demande tout de suite : ${motif(e)}. Aline vous rappelle avec un prix sur mesure.`));
      if ((e.lignes ?? []).length) blocs.push(table);
    }

    // Les règles qui comptent, toutes tirées des variables (rien d'écrit en dur).
    const regles = el("ul", "text-sm text-brun/90 leading-relaxed list-disc pl-5 grid gap-1");
    if (e.chiffrable) {
      regles.append(el("li", "", `Estimation valable ${nb(e.validite_jours ?? vars.validite_jours)} jours. Aline vous appelle pour l'ajuster.`));
    }
    if (vars.delai_commande_semaines) regles.append(el("li", "", `Commandez au moins ${nb(vars.delai_commande_semaines)} semaines avant la semaine de départ souhaitée.`));
    if (vars.delai_ferme_jours) regles.append(el("li", "", `Modifiable ou annulable sans frais jusqu'à ${nb(vars.delai_ferme_jours)} jours avant le départ.`));
    regles.append(el("li", "", "La commande n'existe qu'à notre confirmation écrite."));
    if (vars.cgv?.url) {
      const li = el("li");
      const a = el("a", "underline hover:text-violet", "conditions générales de vente du substrat");
      a.href = vars.cgv.url;
      li.append("Voir nos ", a, vars.cgv.version ? ` (version du ${vars.cgv.version}).` : ".");
      regles.append(li);
    }
    blocs.push(regles);

    if (info.mail !== undefined) {
      blocs.push(el("p", "text-sm font-semibold", info.mail
        ? "Elle vous a aussi été envoyée par mail."
        : "Nous n'avons pas pu vous l'envoyer par mail : Aline vous la redonne en vous rappelant."));
    }

    // Refaire le calcul sans nouveau code (24 h, quelques fois).
    const pied = el("div", "flex flex-wrap items-center gap-3 border-t border-brun/10 pt-4");
    const modifier = el("button", "inline-flex items-center justify-center px-5 py-3 rounded-btn border-2 border-cacao text-cacao text-sm font-semibold tracking-wide hover:bg-cacao/10 transition-colors", "Modifier ma demande");
    modifier.type = "button";
    modifier.addEventListener("click", () => {
      passerEn("recalcul");
      effacerErreurs();
      montrer(form);
      defiler(form);
    });
    pied.append(modifier);
    const quand = dateHeure(info.jusqua);
    const restants = Number(info.restants);
    const aide = Number.isFinite(restants)
      ? `Vous pouvez refaire le calcul sans nouveau code, encore ${nb(restants)} fois${quand ? `, jusqu'au ${quand}` : ""}.`
      : quand ? `Vous pouvez refaire le calcul sans nouveau code jusqu'au ${quand}.` : "";
    if (aide) pied.append(el("span", "text-xs text-brun/70", aide));
    blocs.push(pied);

    resultat.replaceChildren(...blocs);
    montrer(resultat);
    defiler(resultat);
    titre.focus({ preventScroll: true });
  }

  // ── Ouverture : charger les variables (aucun prix) ──
  (async () => {
    const r = await appeler("devis_substrat_variables");
    const vars = r.data.variables as Variables | undefined;
    if (r.http === 200 && r.data.ok === true && vars && Array.isArray(vars.catalogue) && vars.catalogue.length) {
      v = vars;
      construireVarietes(vars);
      chargement.remove();
      passerEn("demande");
      montrer(form);
      return;
    }
    // Panne : le formulaire d'avant, avec son anti-robot rendu à la demande.
    racine.classList.add("hidden");
    if (repli) {
      repli.classList.remove("hidden");
      const zone = repli.querySelector<HTMLElement>("[data-turnstile-repli]");
      const cle = document.querySelector<HTMLElement>(".cf-turnstile")?.dataset.sitekey;
      // Le script de Turnstile peut arriver après la panne : on attend jusqu'à 15 s.
      let essais = 0;
      const rendre = () => {
        const ts = (window as unknown as { turnstile?: { render: (e: HTMLElement, o: object) => void } }).turnstile;
        if (zone && cle && ts) ts.render(zone, { sitekey: cle, theme: "light" });
        else if (zone && cle && ++essais < 30) setTimeout(rendre, 500);
      };
      rendre();
    }
  })();
}
