/* =========================================================
   analytics.js — Helper GA4 condivisi + riconoscimento visitatore
   Caricato su tutte le pagine PRIMA degli script specifici.
   ========================================================= */

(function () {
  'use strict';

  // ── Helper evento ──────────────────────────────────────────
  function gtagEvent(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params || {});
    }
  }
  window.gtagEvent = gtagEvent;

  // ── Riconoscimento visitatore (first-party, no PII) ─────────
  // Usa localStorage per riconoscere lo stesso browser tra le visite:
  // distingue nuovo/di ritorno, conta le visite e i giorni dalla prima.
  // ⚠️ Gira SOLO con consenso analytics: scrive storage sul dispositivo.
  var STORE_KEY   = 'smh_visitor';
  var SESSION_GAP = 30 * 60 * 1000;   // 30 min → nuova "visita"
  var DAY_MS      = 24 * 60 * 60 * 1000;

  function loadVisitor() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveVisitor(v) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch (e) {}
  }

  function runVisitorRecognition() {
    var now        = Date.now();
    var v          = loadVisitor();
    var firstEver  = !v.firstVisit;
    var newSession = !v.lastVisit || (now - v.lastVisit) > SESSION_GAP;

    if (firstEver)  v.firstVisit = now;
    if (newSession) v.visitCount = (v.visitCount || 0) + 1;
    v.lastVisit = now;
    saveVisitor(v);

    var visitorType    = v.visitCount > 1 ? 'returning' : 'new';
    var daysSinceFirst = Math.floor((now - v.firstVisit) / DAY_MS);

    // Proprietà utente (scope utente, sticky): segmentare nuovo/di ritorno
    // e "lead caldi". NB: vanno registrate come dimensioni personalizzate in GA4.
    if (typeof window.gtag === 'function') {
      window.gtag('set', 'user_properties', {
        visitor_type:     visitorType,
        visit_count:      v.visitCount,
        days_since_first: daysSinceFirst,
      });
    }

    // Evento di sessione: una volta per visita (non a ogni pagina aperta)
    if (newSession) {
      gtagEvent('visit', {
        visitor_type:     visitorType,
        visit_count:      v.visitCount,
        days_since_first: daysSinceFirst,
        landing_page:     location.pathname,
      });
    }
  }

  // Esposta al banner: viene richiamata quando l'utente accetta.
  window.smhVisitorRecognition = runVisitorRecognition;

  // Se il consenso è già stato dato in passato, parte subito.
  try {
    if (localStorage.getItem('smh_consent') === 'granted') runVisitorRecognition();
  } catch (e) {}

  // ── Tracking dichiarativo via attributi data-ga ─────────────
  // <a data-ga="cta_click" data-ga-cta-id="piantina"> → invia
  //   evento "cta_click" con param { cta_id: "piantina" }.
  // Gli eventi partono sempre; con consenso negato GA li tratta come
  // ping senza cookie (Consent Mode v2), senza salvare identificatori.
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-ga]');
    if (!el) return;
    var name   = el.getAttribute('data-ga');
    var params = {};
    for (var i = 0; i < el.attributes.length; i++) {
      var attr = el.attributes[i];
      if (attr.name.indexOf('data-ga-') === 0) {
        var key = attr.name.slice(8).replace(/-/g, '_');
        params[key] = attr.value;
      }
    }
    gtagEvent(name, params);
  });
})();
