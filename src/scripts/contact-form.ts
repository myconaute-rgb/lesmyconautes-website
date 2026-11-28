/**
 * Wire un formulaire de contact vers le webhook public.
 *
 * Architecture :
 *   form HTML → fetch POST → api.lesmyconautes.fr/webhook/contact_site
 *   → intendant_web :5001 (whitelist Flask) → n8n :5678 → DB + Telegram
 *
 * Sécurité :
 *   - Honeypot field 'website' rempli → bot, drop côté serveur (silencieux)
 *   - 'loaded_at' (ms timestamp page load) — soumission < 3s → bot
 *   - Cloudflare Turnstile : token 'cf-turnstile-response' validé côté webhook n8n
 *   - CORS strict côté serveur (Origin = https://lesmyconautes.fr seul)
 *   - CSP connect-src élargi à api.lesmyconautes.fr (cf public/_headers)
 *   - Sans token Turnstile : rien n'est envoyé, mais un signal /webhook/form_blocked
 *     (zéro PII) est loggé côté serveur pour ne pas perdre ces leads en silence.
 *     Dès le 2e essai bloqué, le visiteur reçoit un repli : un bouton qui ouvre sa
 *     messagerie avec sa demande déjà écrite (incident du 22/11/2026 : 13 essais
 *     bloqués, la demande perdue, le visiteur n'avait que « réessayez »).
 *
 * UX :
 *   - 3 états : idle / sending / success | error
 *   - Bouton désactivé pendant l'envoi
 *   - Message succès vert, erreur rouge avec retry possible
 */

const WEBHOOK_URL = "https://api.lesmyconautes.fr/webhook/contact_site";
const BLOCKED_URL = "https://api.lesmyconautes.fr/webhook/form_blocked";

export type ContactFormType =
  | "contact_home"
  | "contact"
  | "contact_pro"
  | "devis_substrat"
  | "grille_tarifaire_pleurote";

/**
 * Signal « bloqué par Turnstile » : sans token, rien n'est envoyé et le lead
 * serait perdu sans trace. On prévient le serveur (une ligne de log, zéro PII :
 * ni nom ni email). Best-effort, n'affecte jamais l'UX.
 */
export function reportBlocked(formType: ContactFormType, attempt: number): void {
  const hasScript = Boolean((window as unknown as { turnstile?: unknown }).turnstile);
  fetch(BLOCKED_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      form: formType,
      reason: hasScript ? "token_absent" : "script_absent",
      attempt,
    }),
    keepalive: true,
  }).catch(() => {});
}

// Adresse du repli, assemblée à l'exécution : jamais en clair dans le code servi (comme <MailLink>).
const MAIL_REPLI = ["myconautes", "pm.me"].join("@");
// Ne partent pas dans le mail de repli : jeton anti-robot, piège à robots, accord RGPD.
const HORS_MAIL = new Set(["cf-turnstile-response", "website", "consent"]);
// Libellés des champs sans <label for> (cases à cocher, champs ajoutés plus tard).
const LIBELLES: Record<string, string> = {
  name: "Nom",
  email: "Email",
  phone: "Téléphone",
  postal_code: "Code postal",
  species: "Espèces",
  varietes: "Variétés",
  volume: "Volume",
  message: "Message",
};
// Un lien mailto trop long est tronqué ou refusé par certaines messageries mobiles.
const CORPS_MAX = 1800;

function libelleChamp(form: HTMLFormElement, nom: string): string {
  if (LIBELLES[nom]) return LIBELLES[nom];
  const champ = form.querySelector<HTMLElement>(`[name="${CSS.escape(nom)}"]`);
  const label = champ?.id ? form.querySelector(`label[for="${CSS.escape(champ.id)}"]`) : null;
  return (label?.textContent ?? "").replace(/\*/g, "").replace(/\s+/g, " ").trim() || nom;
}

/** Lien mailto avec la demande déjà écrite : rien n'est perdu, rien à retaper. */
export function lienMailRepli(form: HTMLFormElement): string {
  const lignes: string[] = [];
  const noms = new Set(
    Array.from(form.querySelectorAll<HTMLInputElement>("[name]"), (c) => c.name),
  );
  for (const nom of noms) {
    if (HORS_MAIL.has(nom)) continue;
    const valeurs: string[] = [];
    form.querySelectorAll<HTMLInputElement>(`[name="${CSS.escape(nom)}"]`).forEach((c) => {
      if ((c.type === "checkbox" || c.type === "radio") && !c.checked) return;
      // Case cochée : son texte visible (« Eryngii (pleurote du panicaut) »), pas sa valeur technique.
      // Message : ses retours à la ligne sont gardés tels quels.
      const v =
        c.type === "checkbox" || c.type === "radio"
          ? (c.closest("label")?.textContent ?? c.value).replace(/\s+/g, " ")
          : c.value;
      if (v.trim()) valeurs.push(v.trim());
    });
    if (!valeurs.length) continue;
    const texte = valeurs.join(", ");
    // Texte sur plusieurs lignes : il commence sous son libellé.
    lignes.push(`${libelleChamp(form, nom)} :${texte.includes("\n") ? "\n" : " "}${texte}`);
  }
  let corps = lignes.join("\n");
  if (corps.length > CORPS_MAX) corps = corps.slice(0, CORPS_MAX) + " […]";
  return (
    `mailto:${MAIL_REPLI}?subject=${encodeURIComponent("Demande depuis le site")}` +
    `&body=${encodeURIComponent(corps)}`
  );
}

/** Repli visible après 2 essais bloqués par Turnstile (texte validé par Florestan le 23/11/2026). */
export function afficherRepli(errorEl: HTMLElement, form: HTMLFormElement): void {
  const ligne = (texte: string, gras = false): HTMLElement => {
    const el = document.createElement(gras ? "strong" : "span");
    el.className = "block";
    el.textContent = texte;
    return el;
  };
  const bouton = document.createElement("a");
  bouton.href = lienMailRepli(form);
  bouton.textContent = "Envoyer ma demande par mail";
  bouton.className =
    "inline-flex items-center my-2 px-6 py-3 rounded-btn bg-cacao text-page text-sm font-semibold tracking-wide hover:bg-cacao/90 transition-colors";
  // L'adresse : un vrai lien mailto, au cas où le bouton n'ouvre rien (pas de messagerie configurée).
  const adresse = document.createElement("a");
  adresse.href = `mailto:${MAIL_REPLI}`;
  adresse.className = "underline";
  adresse.textContent = MAIL_REPLI;
  const ou = ligne("ou à l'adresse ");
  ou.append(adresse);

  errorEl.replaceChildren(
    ligne("La vérification anti-robot ne marche pas sur votre appareil.", true),
    ligne("Votre demande n'est pas partie. Ce n'est pas de votre faute."),
    ligne("Écrivez-nous directement :"),
    bouton,
    ou,
  );
  errorEl.classList.remove("hidden");
}

export function wireContactForm(
  form: HTMLFormElement,
  formType: ContactFormType,
): void {
  const successEl = form.querySelector<HTMLElement>("[data-form-success]");
  const errorEl = form.querySelector<HTMLElement>("[data-form-error]");
  const submitBtn = form.querySelector<HTMLButtonElement>("button[type='submit']");

  // Page load timestamp pour anti-bot rapide
  const loadedAt = Date.now();
  let blockedAttempts = 0;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Honeypot client-side : drop direct si rempli
    const honeypot = form.querySelector<HTMLInputElement>("[data-honeypot]");
    if (honeypot?.value) return;

    // Reset des messages
    successEl?.classList.add("hidden");
    errorEl?.classList.add("hidden");

    // Turnstile : vérifier que le widget a généré un token avant d'envoyer
    const turnstileToken = form
      .querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')
      ?.value?.trim();
    if (!turnstileToken) {
      blockedAttempts += 1;
      reportBlocked(formType, blockedAttempts);
      if (errorEl && blockedAttempts >= 2) {
        afficherRepli(errorEl, form);
      } else if (errorEl) {
        errorEl.textContent =
          "Vérification de sécurité en cours, réessayez dans une seconde.";
        errorEl.classList.remove("hidden");
      }
      return;
    }

    // Disable bouton pendant l'envoi
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.textContent ?? "";
      submitBtn.textContent = "Envoi…";
    }

    // Construit le payload depuis les fields nommés
    const fd = new FormData(form);
    const payload: Record<string, string> = {
      form: formType,
      loaded_at: String(loadedAt),
    };
    // Cases à cocher multiples (variétés de la grille tarifaire) : toutes les valeurs cochées, séparées
    // par « , » — avant, seule la dernière partait. Le jeton Turnstile reste unique (le dernier).
    for (const k of new Set(fd.keys())) {
      const valeurs = fd.getAll(k).filter((v): v is string => typeof v === "string");
      if (!valeurs.length) continue;
      payload[k] = k === "cf-turnstile-response" ? valeurs[valeurs.length - 1] : valeurs.join(", ");
    }

    try {
      const resp = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        let serverMsg = "";
        try {
          const data = await resp.json();
          if (data && typeof data.message === "string") serverMsg = data.message;
        } catch {}
        const err = new Error(`HTTP ${resp.status}`) as Error & { serverMessage?: string };
        err.serverMessage = serverMsg;
        throw err;
      }

      // Succès : on affiche la confirmation
      successEl?.classList.remove("hidden");
      form.reset();
    } catch (err) {
      console.error("Contact form error:", err);
      const serverMsg = (err as { serverMessage?: string })?.serverMessage;
      if (errorEl) {
        if (serverMsg) errorEl.textContent = serverMsg;
        errorEl.classList.remove("hidden");
      } else {
        alert(serverMsg || "Désolé, une erreur s'est produite. Réessayez ou écrivez-nous directement.");
      }
    } finally {
      // Reset Turnstile pour forcer un token frais à la prochaine soumission
      // (un même token n'est validable qu'une seule fois côté Cloudflare)
      (window as unknown as { turnstile?: { reset: () => void } }).turnstile?.reset();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.originalText ?? "Envoyer →";
      }
    }
  });
}
