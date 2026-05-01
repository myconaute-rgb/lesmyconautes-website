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
 *
 * UX :
 *   - 3 états : idle / sending / success | error
 *   - Bouton désactivé pendant l'envoi
 *   - Message succès vert, erreur rouge avec retry possible
 */

const WEBHOOK_URL = "https://api.lesmyconautes.fr/webhook/contact_site";

export type ContactFormType = "contact_home" | "contact" | "contact_pro" | "devis_substrat";

export function wireContactForm(
  form: HTMLFormElement,
  formType: ContactFormType,
): void {
  const successEl = form.querySelector<HTMLElement>("[data-form-success]");
  const errorEl = form.querySelector<HTMLElement>("[data-form-error]");
  const submitBtn = form.querySelector<HTMLButtonElement>("button[type='submit']");

  // Page load timestamp pour anti-bot rapide
  const loadedAt = Date.now();

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
      if (errorEl) {
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
    for (const [k, v] of fd.entries()) {
      if (typeof v === "string") payload[k] = v;
    }

    try {
      const resp = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      // Succès : on affiche la confirmation
      successEl?.classList.remove("hidden");
      form.reset();
    } catch (err) {
      console.error("Contact form error:", err);
      if (errorEl) {
        errorEl.classList.remove("hidden");
      } else {
        // Fallback si pas de zone d'erreur dans le form
        alert("Désolé, une erreur s'est produite. Réessayez ou écrivez-nous directement.");
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.originalText ?? "Envoyer →";
      }
    }
  });
}
