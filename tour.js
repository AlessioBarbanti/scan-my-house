/* =========================================================
   tour.js — Virtual Tour 360°
   ========================================================= */

const HOTSPOTS_URL = 'data/hotspots.json';

const SCENE_LABELS = {
  soggiorno: 'Zona Giorno',
  cucina:    'Cucina',
  camera:    'Camera Padronale',
  camera2:   '2ª Camera',
  bagno1:    'Bagno 1',
  bagno2:    'Bagno 2',
};

let viewer       = null;
let currentScene = 'soggiorno';
let hotspotData  = [];
let lastFocusedEl = null;

// Delega all'implementazione esposta da analytics.js. NB: `const` (non
// `function`) per non sovrascrivere `window.gtagEvent` in questo classic script.
const gtagEvent = (name, params) => {
  if (typeof window.gtagEvent === 'function') window.gtagEvent(name, params);
};

function trackSceneView(sceneId, navigation) {
  gtagEvent('tour_scene_view', {
    scene_id:    sceneId,
    scene_label: SCENE_LABELS[sceneId] || sceneId,
    navigation:  navigation, // 'initial' | 'scene_btn'
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
  gtagEvent('hotspot_click', { hotspot_id: args.id, hotspot_type: args.type });
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
    soggiorno: { type: 'equirectangular', panorama: 'assets/foto/interno/soggiorno_pano.webp',        haov: 360, vaov: 60, hotSpots: byScene['soggiorno'] || [] },
    cucina:    { type: 'equirectangular', panorama: 'assets/tour/tour-cucina-vuota.webp',             haov: 360, vaov: 60, hotSpots: byScene['cucina']    || [] },
    camera:    { type: 'equirectangular', panorama: 'assets/foto/interno/camera_padronale_pano.jpg',  haov: 360, vaov: 60, hotSpots: byScene['camera']    || [] },
    camera2:   { type: 'equirectangular', panorama: 'assets/tour/tour-camera2-vuota.webp',           haov: 360, vaov: 60, hotSpots: byScene['camera2']   || [] },
    bagno1:    { type: 'equirectangular', panorama: 'assets/tour/tour-bagno1-vuoto.webp',             haov: 360, vaov: 60, hotSpots: byScene['bagno1']    || [] },
    bagno2:    { type: 'equirectangular', panorama: 'assets/tour/tour-bagno2-vuoto.webp',             haov: 360, vaov: 60, hotSpots: byScene['bagno2']    || [] },
  };
}

// ─────────────────── VIEWER & SCENE ──────────────────────────
function initTour() {
  const params = new URLSearchParams(location.search);
  const initialScene = params.get('scene') || 'soggiorno';

  viewer = pannellum.viewer('viewer', {
    default: {
      firstScene:         initialScene,
      sceneFadeDuration:  800,
      keyboardZoom:       false,
      draggable:          true,
      showControls:       true,
      showZoomCtrl:       false,
      showFullscreenCtrl: false,
      hfov:               95,
      minHfov:            40,
      maxHfov:            95,
      minPitch:           -28,
      maxPitch:           28,
    },
    scenes: buildScenes(),
  });

  currentScene = initialScene;
  highlightSceneBtn(initialScene);
  gtagEvent('tour_start', { initial_scene: initialScene });
  trackSceneView(initialScene, 'initial');
  prefetchStagingImages();
}

function switchScene(sceneId) {
  if (!viewer || sceneId === currentScene) return;
  viewer.loadScene(sceneId);
  currentScene = sceneId;
  highlightSceneBtn(sceneId);
  trackSceneView(sceneId, 'scene_btn');
}

function highlightSceneBtn(sceneId) {
  document.querySelectorAll('.scene-btn[data-scene]').forEach(btn => {
    const active = btn.dataset.scene === sceneId;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
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
  try {
    const res = await fetch(HOTSPOTS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    hotspotData = await res.json();
  } catch (err) {
    console.warn('hotspots.json non trovato — tour senza hotspot', err);
  }

  initTour();

  document.querySelectorAll('.scene-btn[data-scene]').forEach(btn =>
    btn.addEventListener('click', () => switchScene(btn.dataset.scene))
  );

  document.getElementById('modal-close')
    .addEventListener('click', closeModal);
  document.getElementById('modal-backdrop')
    .addEventListener('click', closeModal);
});
