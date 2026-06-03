/* =========================================================
   app.js — Virtual Open House
   ========================================================= */

// ─────────────────── CONFIGURAZIONE ──────────────────────────
const WA_NUMBER = '393384346876';
const WA_TEXT   = encodeURIComponent(
  'Ciao, ho fatto il tour virtuale del trilocale e vorrei maggiori informazioni.'
);
const WA_URL    = `https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`;

// Path relativo: funziona sia in locale (con server HTTP) sia su GitHub Pages.
// ⚠️  Non aprire index.html come file:// — il fetch fallirebbe per policy CORS.
const HOTSPOTS_URL = 'data/hotspots.json';

// ─────────────────── STATO GLOBALE ───────────────────────────
let viewer        = null;
let currentScene  = 'soggiorno';
let hotspotData   = [];
let lastFocusedEl = null;

// ─────────────────── ANALYTICS ───────────────────────────────
function gtagEvent(name, params = {}) {
  if (typeof window.gtag === 'function') window.gtag('event', name, params);
}

// ─────────────────── WHATSAPP ────────────────────────────────
function initWhatsApp() {
  ['wa-sticky', 'wa-modal'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.href = WA_URL;
    el.addEventListener('click', () =>
      gtagEvent('whatsapp_clicked', {
        position: id === 'wa-sticky' ? 'sticky' : 'modal',
      })
    );
  });
}

// ─────────────────── HOTSPOT BUILDER ─────────────────────────
function createHotspotEl(container, args) {
  const div = document.createElement('div');
  div.className = `hotspot hotspot--${args.type}`;
  div.setAttribute('aria-label', args.label);
  div.textContent = args.type === 'staging' ? '👁' : '→';
  container.appendChild(div);
}

function onHotspotClick(_e, args) {
  if (args.type === 'staging') openModal(args);
  else if (args.type === 'scene') switchScene(args.targetScene);
  gtagEvent('hotspot_clicked', { hotspot_id: args.id, type: args.type });
}

function buildPannellumHotspot(h) {
  return {
    id:    h.id,
    pitch: h.pitch,
    yaw:   h.yaw,
    type:  'custom',
    text:  h.label,
    cssClass:          `hs-${h.type}`,
    createTooltipFunc: createHotspotEl,
    createTooltipArgs: h,
    clickHandlerFunc:  onHotspotClick,
    clickHandlerArgs:  h,
  };
}

function buildScenes() {
  const byScene = {};
  hotspotData.forEach(h => {
    (byScene[h.scene] = byScene[h.scene] || []).push(buildPannellumHotspot(h));
  });
  return {
    soggiorno: { type: 'equirectangular', panorama: 'assets/tour-soggiorno-vuoto.webp', hotSpots: byScene['soggiorno'] || [] },
    cucina:    { type: 'equirectangular', panorama: 'assets/tour-cucina-vuota.webp',    hotSpots: byScene['cucina']    || [] },
    camera:    { type: 'equirectangular', panorama: 'assets/tour-camera-vuota.webp',    hotSpots: byScene['camera']    || [] },
  };
}

// ─────────────────── VIEWER & SCENE ──────────────────────────
function startTour() {
  if (viewer) return;

  document.getElementById('landing').hidden        = true;
  document.getElementById('wa-sticky').hidden      = true;
  document.getElementById('viewer-wrapper').hidden = false;

  viewer = pannellum.viewer('viewer', {
    default: {
      firstScene:         'soggiorno',
      sceneFadeDuration:  800,
      keyboardZoom:       false,
      draggable:          true,
      showControls:       true,
      showZoomCtrl:       false,
      showFullscreenCtrl: false,
    },
    scenes: buildScenes(),
  });

  gtagEvent('tour_started', { source: 'landing_cta' });
  prefetchStagingImages();
}

function switchScene(sceneId) {
  if (!viewer || sceneId === currentScene) return;
  viewer.loadScene(sceneId);
  currentScene = sceneId;
  document.querySelectorAll('.scene-btn[data-scene]').forEach(btn => {
    const active = btn.dataset.scene === sceneId;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
}

function backToLanding() {
  document.getElementById('viewer-wrapper').hidden = true;
  document.getElementById('landing').hidden        = false;
  document.getElementById('wa-sticky').hidden      = false;
}

function prefetchStagingImages() {
  hotspotData
    .filter(h => h.type === 'staging' && h.render)
    .forEach(h => { new Image().src = h.render; });
}

// ─────────────────── MODALE ──────────────────────────────────
function openModal(hotspot) {
  const modal = document.getElementById('staging-modal');
  document.getElementById('modal-img').src           = hotspot.render;
  document.getElementById('modal-img').alt           = hotspot.label;
  document.getElementById('modal-title').textContent = hotspot.label;
  lastFocusedEl = document.activeElement;
  modal.hidden = false;
  document.getElementById('modal-close').focus();
  document.addEventListener('keydown', onModalKeydown);
}

function closeModal() {
  const modal = document.getElementById('staging-modal');
  modal.hidden = true;
  document.getElementById('modal-img').src = '';
  document.removeEventListener('keydown', onModalKeydown);
  if (lastFocusedEl) lastFocusedEl.focus();
}

function onModalKeydown(e) {
  if (e.key === 'Escape') closeModal();
}

// ─────────────────── INIT ────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Carica hotspot
  try {
    const res = await fetch(HOTSPOTS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    hotspotData = await res.json();
  } catch (err) {
    console.warn('hotspots.json non trovato — tour senza hotspot', err);
  }

  initWhatsApp();

  // Pulsante avvio tour
  document.getElementById('btn-start-tour')
    .addEventListener('click', startTour);

  // Bottoni navigazione scene
  document.querySelectorAll('.scene-btn[data-scene]').forEach(btn =>
    btn.addEventListener('click', () => switchScene(btn.dataset.scene))
  );

  // Torna alla scheda
  document.getElementById('btn-back-landing')
    .addEventListener('click', backToLanding);

  // Chiusura modale (tasto X e backdrop)
  document.getElementById('modal-close')
    .addEventListener('click', closeModal);
  document.getElementById('modal-backdrop')
    .addEventListener('click', closeModal);
});
