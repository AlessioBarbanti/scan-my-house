/* =========================================================
   consent.js — Banner consenso cookie + Consent Mode v2
   Mostra il banner al primo accesso, salva la scelta e
   aggiorna il consenso di Google. La revoca è sempre
   disponibile tramite il piccolo trigger "Cookie".
   ========================================================= */

(function () {
  'use strict';

  var KEY = 'smh_consent';

  function getChoice() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
  }

  function updateConsent(granted) {
    if (typeof window.gtag !== 'function') return;
    var state = granted ? 'granted' : 'denied';
    window.gtag('consent', 'update', {
      ad_storage:         state,
      ad_user_data:       state,
      ad_personalization: state,
      analytics_storage:  state,
    });
  }

  // ── DOM del banner ──────────────────────────────────────────
  function buildBanner() {
    var el = document.createElement('div');
    el.className = 'cookie-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Preferenze cookie');
    el.innerHTML =
      '<div class="cookie-banner__inner">' +
        '<p class="cookie-banner__text">' +
          'Usiamo cookie di <strong>analisi</strong> (Google Analytics) per capire come ' +
          'viene usato il sito e migliorarlo. Nessun dato viene raccolto finché non scegli. ' +
          'Puoi cambiare idea in qualsiasi momento.' +
        '</p>' +
        '<div class="cookie-banner__actions">' +
          '<button type="button" class="cookie-btn cookie-btn--ghost" data-consent="reject">Rifiuta</button>' +
          '<button type="button" class="cookie-btn cookie-btn--solid" data-consent="accept">Accetta</button>' +
        '</div>' +
      '</div>';
    return el;
  }

  function buildReopen() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cookie-reopen';
    btn.setAttribute('aria-label', 'Preferenze cookie');
    btn.textContent = '🍪';
    btn.addEventListener('click', showBanner);
    return btn;
  }

  var bannerEl = null;
  var reopenEl = null;

  function showBanner() {
    if (!bannerEl) {
      bannerEl = buildBanner();
      bannerEl.addEventListener('click', function (e) {
        var b = e.target.closest('[data-consent]');
        if (!b) return;
        choose(b.getAttribute('data-consent') === 'accept');
      });
      document.body.appendChild(bannerEl);
    }
    // forza il reflow per attivare la transizione di entrata
    requestAnimationFrame(function () { bannerEl.classList.add('is-open'); });
    if (reopenEl) reopenEl.hidden = true;
  }

  function hideBanner() {
    if (bannerEl) bannerEl.classList.remove('is-open');
    if (reopenEl) reopenEl.hidden = false;
  }

  function ensureReopen() {
    if (!reopenEl) {
      reopenEl = buildReopen();
      document.body.appendChild(reopenEl);
    }
  }

  function choose(granted) {
    save(granted ? 'granted' : 'denied');
    updateConsent(granted);
    if (granted && typeof window.smhVisitorRecognition === 'function') {
      window.smhVisitorRecognition();
    }
    ensureReopen();
    hideBanner();
  }

  // ── Init ────────────────────────────────────────────────────
  function init() {
    ensureReopen();
    if (!getChoice()) {
      reopenEl.hidden = true;
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
