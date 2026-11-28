/*
 * Le script d'édition de l'aperçu, version minimale du pas 2 (projet 08, rendu/11 § 6.1).
 * Posé en ligne en bas de chaque page, en aperçu seulement (BaseLayout.astro, src/contenu/apercu.ts).
 * Jamais dans public/ : il partirait sur le site public.
 *
 * Ce qu'il fait ici :
 *   1. il prouve qu'il se charge (window.__editionSite, et une ligne dans la console) ;
 *   2. il intercepte le clic sur un lien interne (« /pros ») et lui ajoute le préfixe de l'aperçu.
 * Le vrai script (survol, saisie sur place, messages avec le module de l'app) est le pas 3.
 */
(function () {
  var moi = document.currentScript;
  var base = (moi && moi.getAttribute("data-base")) || "/site/apercu/";
  if (base.charAt(base.length - 1) !== "/") base += "/";

  var reperes = document.querySelectorAll("[data-champ]").length;
  window.__editionSite = { charge: true, base: base, reperes: reperes };
  console.info("[éditeur] script d'édition chargé : " + reperes + " repères, base " + base);

  /** Une adresse interne du site, sans le préfixe : « /pros », « /#univers », « /agriculteurs#contact-agri ». */
  function interne(href) {
    return typeof href === "string" && href.charAt(0) === "/" && href.charAt(1) !== "/" && href.indexOf(base) !== 0;
  }

  document.addEventListener(
    "click",
    function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a) return;
      var href = a.getAttribute("href");
      if (!interne(href)) return;
      e.preventDefault();
      window.location.assign(base + href.slice(1));
    },
    true,
  );
})();
