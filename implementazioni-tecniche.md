# Implementazioni Tecniche - Virtual Open House via QR

## 1) Obiettivo tecnico
Tradurre il PDR in una web app statica mobile-first, hostata su GitHub Pages, con:
- ingresso rapido da QR statico;
- avvio differito del tour 360 (lazy loading);
- hotspot interattivi con modale Virtual Staging;
- CTA WhatsApp sempre disponibile;
- tracciamento GA4 di funnel ed eventi custom.

## 2) Stack e vincoli

### 2.1 Vincoli fissi (indipendenti dallo stack)
- Hosting: GitHub Pages — il build finale deve essere HTML/CSS/JS statici nella root (o in `/docs`).
- Viewer 360: **Pannellum v2.5.6** — compatibile con qualsiasi framework che esponga un `div` nel DOM e carichi `window.pannellum` prima dell'inizializzazione. Importabile via CDN o come modulo npm (`pannellum` su npm non è mantenuto; usare `@plussub/pannellum` o mantenere CDN).
- Navigazione multi-ambiente: **2-3 scene** collegate tramite hotspot di transizione e barra nav in overlay.
- Asset: immagini in **WebP** (panorami equirettangolari + render statici rettilineari).
- Compatibilità target: Safari iOS 15+, Chrome Android 90+, viewport 360-430 px.
- Zero backend: nessuna API proprietaria; hotspot letti da `hotspots.json` locale.

### 2.2 Scelta dello stack frontend
Non esistono vincoli tecnici che obblighino al vanilla. La scelta impatta ergonomia di sviluppo e pipeline di build, non il prodotto finale.

| Stack | Pro | Contro | Compatibilità Pannellum |
|---|---|---|---|
| **Vanilla HTML/CSS/JS** | Zero tooling, deploy diretto | Nessuna reattività dichiarativa, CSS non scopato | ✅ Nativa |
| **Vite + Vanilla** | Dev server con HMR, build ottimizzata, CSS modules | Richiede `npm` | ✅ Pannellum via CDN o script tag in `index.html` |
| **Astro** | Static-first, componenti per isole, ottimo per pagine di contenuto | Learning curve minima | ✅ Pannellum in componente con `client:only` o script inline |
| **Svelte / SvelteKit** | Sintassi reattiva concisa, bundle piccolo, adapter-static per GitHub Pages | Dipendenza build | ✅ Inizializza viewer in `onMount()` |
| **React + Vite** | Ecosistema ampio | Bundle più pesante per una pagina sola | ✅ Inizializza viewer in `useEffect()` con cleanup |
| **Vue 3 + Vite** | Options/Composition API, ottimo per componenti come il modale | Bundle medio | ✅ Inizializza viewer in `onMounted()` |

**Raccomandazione**: per questo progetto (pagina singola, contenuto statico, un solo sviluppatore) la scelta ottimale è **Vite + Vanilla** oppure **Astro**.
- Vite porta HMR e build ottimizzata senza framework overhead.
- Astro è ideale se si vuole scrivere la scheda immobile come template dichiarativo e isolare la logica Pannellum in un componente separato.

Il codice nelle sezioni successive è scritto in vanilla puro per massima leggibilità e portabilità — si traduce direttamente in qualunque framework sopra elencato.

## 3) Struttura repository consigliata
```text
/
  index.html
  styles.css
  app.js
  assets/
    preview-hero.webp            ← immagine statica landing (≤ 200 KB)
    og-preview.webp              ← immagine Open Graph 1200×630 px (≤ 300 KB)
    placeholder-hero.webp        ← fallback hero (colore piatto con icona, ≤ 5 KB)
    placeholder-render.webp      ← fallback immagine modale (≤ 5 KB)
    favicon.svg                  ← favicon vettoriale (consigliato: lettera "T" su sfondo #1a1a2e)
    favicon-32.png               ← fallback PNG 32×32 px
    tour-soggiorno-vuoto.webp    ← panorama 360° soggiorno
    tour-cucina-vuota.webp       ← panorama 360° cucina
    tour-camera-vuota.webp       ← panorama 360° camera
    render-soggiorno-divano.webp ← staging virtuale
    render-cucina-arredata.webp
    render-camera-arredata.webp
  data/
    hotspots.json                ← definizione scene, pitch/yaw, link render
  .nojekyll                      ← file vuoto obbligatorio per GitHub Pages (disabilita Jekyll)
  README.md
```

> **Nota naming**: `tour-*` per le equirettangolari 360°, `render-*` per i render rettilineari che appaiono nel modale.

## 4) Specifiche funzionali implementative

### 4.1 Landing (fase statica) — Scheda immobile + HTML completo

#### Dati annuncio (contenuto reale)
| Campo | Valore |
|---|---|
| Tipologia | Trilocale |
| Superficie | 83 mq |
| Consegna | Luglio 2026 |
| Classe energetica | **A** (massima efficienza) |
| Infissi | FINSTRAL ad elevato isolamento termoacustico |
| Impianto | Climatizzazione multi-split con modulo idronico |
| Accessori inclusi | Ingresso indipendente, box auto, pavimenti e sanitari completi |
| Prezzo richiesto | **`INSERIRE_PREZZO`** |
| Contatto | 338 434 6876 |

#### Comportamento pagina
- al primo paint mostra: badge «Nuova realizzazione», titolo, metratura, prezzo/contatto, lista feature e pulsante CTA;
- non inizializzare Pannellum finché l'utente non tocca "Inizia il Tour Immersivo";
- badge classe energetica A evidenziato visivamente;
- bottone WhatsApp sticky visibile da subito in basso.

#### HTML completo — `index.html`
```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Vendesi trilocale 83 mq nuova realizzazione. Classe A, infissi Finstral, box auto. Consegna luglio 2026.">
  <title>Trilocale 83 mq – Nuova Realizzazione | Virtual Tour</title>

  <!-- Colore barra browser (mobile) -->
  <meta name="theme-color" content="#1a1a2e">

  <!-- Favicon (SVG universale + fallback PNG) -->
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="alternate icon" href="assets/favicon-32.png" sizes="32x32">

  <!-- Open Graph — anteprima su WhatsApp, iMessage, Telegram -->
  <meta property="og:type"        content="website">
  <meta property="og:title"       content="Trilocale 83 mq – Nuova Realizzazione">
  <meta property="og:description" content="Classe A, infissi Finstral, box auto, consegna luglio 2026. Esplora il tour virtuale 360°.">
  <meta property="og:image"       content="https://USERNAME.github.io/REPO/assets/og-preview.webp">
  <meta property="og:url"         content="https://USERNAME.github.io/REPO/">
  <!-- Sostituire USERNAME e REPO con i valori reali. og:image: immagine 1200×630 px, ≤ 300 KB. -->

  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  </script>

  <!-- Pannellum (defer: non blocca il first paint) -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css">
  <script defer src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"></script>

  <!-- Stili e logica -->
  <link rel="stylesheet" href="styles.css">
  <link rel="preload" as="image" href="assets/preview-hero.webp" type="image/webp">
  <script defer src="app.js"></script>
</head>
<body>

  <!-- ══════════════════ LANDING (fase 1 – statica) ══════════════════ -->
  <main id="landing" class="landing">

    <!-- Hero -->
    <div class="hero">
      <img
        src="assets/preview-hero.webp"
        alt="Foto principale dell'appartamento"
        class="hero__img"
        width="800" height="530"
        onerror="this.src='assets/placeholder-hero.webp'; this.onerror=null;"
      >
      <span class="hero__badge">Nuova realizzazione</span>
    </div>

    <!-- Intestazione annuncio -->
    <section class="card card--header">
      <p class="card__tag">VENDESI</p>
      <h1 class="card__title">Trilocale – <span class="highlight">83 mq</span></h1>
      <p class="card__price">INSERIRE_PREZZO</p>
      <p class="card__subtitle">Consegna: <strong>Luglio 2026</strong></p>
      <div class="energy">
        <span class="energy__badge">A</span>
        <span class="energy__label">Classe Energetica – massima efficienza e risparmio sui consumi</span>
      </div>
    </section>

    <!-- Dotazioni incluse -->
    <section class="card card--features">
      <h2 class="card__section-title">Dotazioni incluse</h2>
      <ul class="feature-list">
        <li class="feature-list__item">
          <span class="feature-list__icon" aria-hidden="true">🚪</span>
          Ingresso indipendente
        </li>
        <li class="feature-list__item">
          <span class="feature-list__icon" aria-hidden="true">🚗</span>
          Box auto
        </li>
        <li class="feature-list__item">
          <span class="feature-list__icon" aria-hidden="true">🪟</span>
          Infissi FINSTRAL ad elevato isolamento termoacustico
        </li>
        <li class="feature-list__item">
          <span class="feature-list__icon" aria-hidden="true">❄️</span>
          Impianto climatizzazione multi-split con modulo idronico
        </li>
        <li class="feature-list__item">
          <span class="feature-list__icon" aria-hidden="true">🛁</span>
          Pavimenti e sanitari completi
        </li>
      </ul>
    </section>

    <!-- CTA Tour -->
    <section class="card card--cta">
      <p class="cta-hint">Scansiona il QR Code per visionare la planimetria e tutti i dettagli — oppure esplora subito il tour virtuale.</p>
      <button id="btn-start-tour" class="btn btn--primary" aria-label="Avvia il tour virtuale 360°">
        🔭 Inizia il Tour Immersivo
      </button>
    </section>

  </main>

  <!-- ══════════════════ VIEWER 360 (fase 2 – lazy) ══════════════════ -->
  <div id="viewer-wrapper" class="viewer-wrapper" hidden aria-label="Tour virtuale 360°" role="region">

    <!-- Barra navigazione scene -->
    <nav class="scene-nav" aria-label="Naviga tra le stanze">
      <button class="scene-btn active" data-scene="soggiorno" aria-pressed="true">Soggiorno</button>
      <button class="scene-btn"        data-scene="cucina"    aria-pressed="false">Cucina</button>
      <button class="scene-btn"        data-scene="camera"    aria-pressed="false">Camera</button>
      <button id="btn-back-landing" class="scene-btn scene-btn--back" aria-label="Torna alla scheda">✕</button>
    </nav>

    <!-- Canvas Pannellum -->
    <div id="viewer" class="viewer" role="img" aria-label="Panorama 360° della stanza"></div>

  </div>

  <!-- ══════════════════ MODALE VIRTUAL STAGING ══════════════════ -->
  <div id="staging-modal" class="modal" hidden
       role="dialog" aria-modal="true" aria-label="Come potrebbe essere questa stanza">
    <div class="modal__backdrop" id="modal-backdrop"></div>
    <div class="modal__content">
      <button id="modal-close" class="modal__close" aria-label="Chiudi">✕</button>
      <p class="modal__title" id="modal-title">Come potrebbe essere</p>
      <img id="modal-img" src="" alt="" class="modal__img"
           onerror="this.src='assets/placeholder-render.webp'; this.onerror=null;">
      <!-- WhatsApp dentro modale -->
      <a id="wa-modal" href="" class="btn btn--whatsapp btn--whatsapp-modal"
         target="_blank" rel="noopener noreferrer"
         aria-label="Contattami su WhatsApp">
        💬 Contattami su WhatsApp
      </a>
    </div>
  </div>

  <!-- ══════════════════ STICKY WHATSAPP ══════════════════ -->
  <a id="wa-sticky" href="" class="btn btn--whatsapp btn--whatsapp-sticky"
     target="_blank" rel="noopener noreferrer"
     aria-label="Contattami su WhatsApp">
    💬 Contattami su WhatsApp
  </a>

</body>
</html>
```

#### CSS completo — `styles.css`
```css
/* ── Reset & base ─────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; scroll-behavior: smooth; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f5f5f0;
  color: #1a1a2e;
  min-height: 100vh;
}

/* ── Hero ─────────────────────────────────────────────────── */
.hero { position: relative; }
.hero__img {
  width: 100%; height: 56vw; max-height: 320px;
  object-fit: cover; display: block;
}
.hero__badge {
  position: absolute; top: 12px; left: 12px;
  background: #e8b84b; color: #1a1a2e;
  font-weight: 700; font-size: .75rem; text-transform: uppercase;
  padding: 4px 10px; border-radius: 4px;
}

/* ── Card ─────────────────────────────────────────────────── */
.card {
  background: #fff;
  margin: 12px 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,.07);
}
.card__tag { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #888; }
.card__title { font-size: 1.7rem; font-weight: 800; line-height: 1.1; margin: 4px 0; }
.card__price { font-size: 1.3rem; font-weight: 700; color: #1a6bba; margin: 6px 0 2px; letter-spacing: -.01em; }
.card__subtitle { font-size: .95rem; color: #555; margin-top: 4px; }
.highlight { color: #1a6bba; }

/* ── Classe energetica ────────────────────────────────────── */
.energy { display: flex; align-items: center; gap: 10px; margin-top: 14px; }
.energy__badge {
  background: #2e7d32; color: #fff;
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 900; font-size: 1.2rem;
  flex-shrink: 0;
}
.energy__label { font-size: .85rem; color: #444; line-height: 1.3; }

/* ── Feature list ─────────────────────────────────────────── */
.card__section-title { font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #888; margin-bottom: 12px; }
.feature-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.feature-list__item { display: flex; align-items: flex-start; gap: 10px; font-size: .95rem; line-height: 1.4; }
.feature-list__icon { font-size: 1.1rem; flex-shrink: 0; }

/* ── CTA ──────────────────────────────────────────────────── */
.cta-hint { font-size: .85rem; color: #555; margin-bottom: 14px; line-height: 1.5; }
.btn {
  display: block; width: 100%;
  padding: 16px; border-radius: 10px;
  font-size: 1rem; font-weight: 700;
  text-align: center; cursor: pointer;
  border: none; text-decoration: none;
  transition: opacity .15s;
}
.btn:active { opacity: .8; }
.btn--primary { background: #1a6bba; color: #fff; }
.btn--whatsapp { background: #25D366; color: #fff; }

/* ── Sticky WhatsApp ──────────────────────────────────────── */
.btn--whatsapp-sticky {
  position: fixed; bottom: 16px; left: 16px; right: 16px;
  width: calc(100% - 32px);
  z-index: 100;
  box-shadow: 0 4px 16px rgba(37,211,102,.45);
}

/* ── Viewer wrapper ───────────────────────────────────────── */
.viewer-wrapper {
  position: fixed; inset: 0;
  display: flex; flex-direction: column;
  background: #000;
  z-index: 50;
}
.viewer-wrapper[hidden] { display: none; }
.viewer { flex: 1; width: 100%; }

/* ── Barra navigazione scene ──────────────────────────────── */
.scene-nav {
  display: flex; align-items: center;
  background: rgba(0,0,0,.7);
  padding: 8px 12px; gap: 8px;
  z-index: 60;
}
.scene-btn {
  flex: 1; padding: 8px 4px;
  background: rgba(255,255,255,.12); color: #fff;
  border: 1px solid rgba(255,255,255,.2); border-radius: 6px;
  font-size: .82rem; font-weight: 600; cursor: pointer;
  transition: background .15s;
}
.scene-btn.active, .scene-btn[aria-pressed="true"] {
  background: #1a6bba; border-color: #1a6bba;
}
.scene-btn--back {
  flex: 0 0 36px; font-size: 1rem;
  background: rgba(255,0,0,.2); border-color: rgba(255,0,0,.3);
}

/* ── Hotspot ──────────────────────────────────────────────── */
.pnlm-hotspot-base { cursor: pointer; }
.hotspot {
  width: 40px; height: 40px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem;
  animation: pulse 2s infinite;
}
.hotspot--staging { background: rgba(255,255,255,.85); color: #1a1a2e; }
.hotspot--scene   { background: rgba(26,26,46,.8); color: #fff; font-size: 1rem; }
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,.4); }
  50%       { box-shadow: 0 0 0 8px rgba(255,255,255,0); }
}

/* ── Modale ───────────────────────────────────────────────── */
.modal {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
  z-index: 200;
  padding: 16px;
}
.modal[hidden] { display: none; }
.modal__backdrop {
  position: absolute; inset: 0;
  background: rgba(0,0,0,.75);
}
.modal__content {
  position: relative; z-index: 1;
  background: #fff; border-radius: 14px;
  padding: 16px; width: 100%; max-width: 480px;
  display: flex; flex-direction: column; gap: 12px;
}
.modal__close {
  align-self: flex-end;
  background: none; border: none;
  font-size: 1.4rem; cursor: pointer; color: #555;
  line-height: 1;
}
.modal__title { font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #888; }
.modal__img { width: 100%; border-radius: 8px; object-fit: cover; display: block; }
.btn--whatsapp-modal { margin-top: 4px; }

/* ── Spazio inferiore per sticky button ───────────────────── */
.landing { padding-bottom: 88px; }
```

### 4.2 Avvio tour 360 — architettura multi-scena

> **Nota per l'implementazione**: le sezioni 4.2–4.5 illustrano la logica con frammenti esplicativi. Il codice **definitivo e completo** da usare come sorgente è esclusivamente quello della sezione **4.6** (`app.js`). Non combinare i frammenti precedenti con 4.6.

Comportamento:
- tap su "Inizia il Tour Immersivo" → nascondi landing, mostra `#viewer-wrapper`, inizializza Pannellum;
- Pannellum viene configurato in modalità **multi-scena** (`scenes` object) con la scena `soggiorno` come default;
- invio evento GA4 `tour_started`;
- avvio prefetch dei render staging in background.

Configurazione Pannellum multi-scena:
```js
let viewer = null;
let currentScene = 'soggiorno';

function initViewer(firstScene) {
  const scenesConfig = buildScenes(); // costruisce da hotspots.json

  viewer = pannellum.viewer('viewer', {
    default: {
      firstScene,
      sceneFadeDuration: 800,  // cross-fade 0.8s tra scene
      keyboardZoom:      false,
      draggable:         true,
      showControls:      true,
      showZoomCtrl:      false,
      showFullscreenCtrl: false,
    },
    scenes: scenesConfig,
  });
}
```

**Schema di `buildScenes()`** — raggruppa hotspot per scena e costruisce le configurazioni:
```js
function buildScenes() {
  // hotspotData è l'array caricato da hotspots.json
  const byScene = {};
  hotspotData.forEach(h => {
    if (!byScene[h.scene]) byScene[h.scene] = [];
    byScene[h.scene].push(buildPannellumHotspot(h));
  });

  return {
    soggiorno: {
      type:      'equirectangular',
      panorama:  'assets/tour-soggiorno-vuoto.webp',
      hotSpots:  byScene['soggiorno'] || [],
    },
    cucina: {
      type:      'equirectangular',
      panorama:  'assets/tour-cucina-vuota.webp',
      hotSpots:  byScene['cucina'] || [],
    },
    camera: {
      type:      'equirectangular',
      panorama:  'assets/tour-camera-vuota.webp',
      hotSpots:  byScene['camera'] || [],
    },
  };
}
```

**Cambio scena** (da hotspot transizione o da barra navigazione):
```js
function switchScene(sceneId) {
  if (!viewer || sceneId === currentScene) return;
  viewer.loadScene(sceneId);  // Pannellum gestisce il fade
  currentScene = sceneId;
  // aggiorna stato visivo barra nav
  document.querySelectorAll('.scene-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.scene === sceneId)
  );
}
```

### 4.3 Hotspot interattivi — schema duale (staging + scene)
Ogni hotspot ha un campo `type`:
- **`staging`** — apre il modale con il render arredato;
- **`scene`** — transita a un altro panorama tramite `viewer.loadScene()`.

Schema completo `data/hotspots.json`:
```json
[
  {
    "id":    "soggiorno-angolo-divano",
    "scene": "soggiorno",
    "type":  "staging",
    "pitch": 2,
    "yaw":   -30,
    "label": "Vedi zona divano arredata",
    "render": "assets/render-soggiorno-divano.webp"
  },
  {
    "id":    "soggiorno-to-cucina",
    "scene": "soggiorno",
    "type":  "scene",
    "pitch": 0,
    "yaw":   80,
    "label": "Vai in cucina →",
    "targetScene": "cucina"
  },
  {
    "id":    "cucina-piano-lavoro",
    "scene": "cucina",
    "type":  "staging",
    "pitch": -5,
    "yaw":   20,
    "label": "Vedi cucina arredata",
    "render": "assets/render-cucina-arredata.webp"
  },
  {
    "id":    "cucina-to-camera",
    "scene": "cucina",
    "type":  "scene",
    "pitch": 0,
    "yaw":   -90,
    "label": "Vai in camera →",
    "targetScene": "camera"
  },
  {
    "id":    "camera-angolo-letto",
    "scene": "camera",
    "type":  "staging",
    "pitch": 5,
    "yaw":   10,
    "label": "Vedi camera arredata",
    "render": "assets/render-camera-arredata.webp"
  }
]
```

> **Come trovare pitch e yaw corretti**: apri Pannellum con `hotSpotDebug: true` nella config — mostra le coordinate del cursore in tempo reale. Disabilita prima del deploy.

Build hotspot per Pannellum:
```js
function buildPannellumHotspot(h) {
  return {
    id:    h.id,
    pitch: h.pitch,
    yaw:   h.yaw,
    type:  'custom',
    text:  h.label,
    cssClass:          h.type === 'scene' ? 'hs-scene' : 'hs-staging',
    createTooltipFunc: createHotspotEl,
    createTooltipArgs: h,
    clickHandlerFunc:  onHotspotClick,
    clickHandlerArgs:  h,
  };
}

function createHotspotEl(container, args) {
  const div = document.createElement('div');
  div.className = `hotspot hotspot--${args.type}`;
  div.setAttribute('aria-label', args.label);
  div.innerHTML = args.type === 'staging' ? '👁' : '→';
  container.appendChild(div);
}

function onHotspotClick(e, args) {
  if (args.type === 'staging') openModal(args);  // openModal definita in 4.6/app.js
  else if (args.type === 'scene') switchScene(args.targetScene);
  gtagEvent('hotspot_clicked', { hotspot_id: args.id, type: args.type });
}
```

> Gli stili CSS degli hotspot sono già inclusi in `styles.css` nella sezione 4.1. Non duplicare.

#### Schema JSON formale — `data/hotspots.json`

Riferimento completo di ogni campo:

| Campo | Tipo | Obbligatorio | Descrizione |
|---|---|---|---|
| `id` | `string` | ✅ | Identificatore univoco dell'hotspot (usato nei log GA4). Formato consigliato: `<scena>-<descrizione>`. |
| `scene` | `string` | ✅ | ID della scena Pannellum in cui compare l'hotspot. Valori: `soggiorno`, `cucina`, `camera`. |
| `type` | `"staging" \| "scene"` | ✅ | `staging` = apre il modale con render arredato. `scene` = transita a un'altra panoramica. |
| `pitch` | `number` | ✅ | Coordinata verticale in gradi (−90 = basso, +90 = alto). |
| `yaw` | `number` | ✅ | Coordinata orizzontale in gradi (−180 … +180, 0 = centro iniziale). |
| `label` | `string` | ✅ | Testo descrittivo del pin (usato come `aria-label` e tooltip). |
| `render` | `string` | Solo se `type: staging` | Percorso relativo al file WebP del render arredato. |
| `targetScene` | `string` | Solo se `type: scene` | ID della scena di destinazione. |

JSON Schema (draft-07) per validazione automatica:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "items": {
    "type": "object",
    "required": ["id", "scene", "type", "pitch", "yaw", "label"],
    "properties": {
      "id":          { "type": "string", "pattern": "^[a-z0-9-]+$" },
      "scene":       { "type": "string", "enum": ["soggiorno", "cucina", "camera"] },
      "type":        { "type": "string", "enum": ["staging", "scene"] },
      "pitch":       { "type": "number", "minimum": -90, "maximum": 90 },
      "yaw":         { "type": "number", "minimum": -180, "maximum": 180 },
      "label":       { "type": "string", "minLength": 1 },
      "render":      { "type": "string", "pattern": "^assets/.+\.webp$" },
      "targetScene": { "type": "string", "enum": ["soggiorno", "cucina", "camera"] }
    },
    "if":   { "properties": { "type": { "const": "staging" } } },
    "then": { "required": ["render"] },
    "else": { "required": ["targetScene"] }
  }
}
```

> Per trovare `pitch` e `yaw` corretti: apri Pannellum con `hotSpotDebug: true` nella config — mostra le coordinate in tempo reale. **Rimuovi** prima del deploy.

### 4.4 Modale Virtual Staging
Requisiti UI:
- overlay full screen con sfondo semitrasparente;
- immagine rettilineare responsive (`max-width: 100%`, `object-fit: contain`);
- chiusura con pulsante X, tap overlay, e tasto ESC;
- bottone WhatsApp anche nel modale.

Requisiti accessibilita:
- `role="dialog"`, `aria-modal="true"`, `aria-label`;
- focus trap minimo: focus iniziale su bottone chiusura;
- ripristino focus al trigger alla chiusura.

### 4.5 Conversione WhatsApp
URL base con numero reale e messaggio precompilato:
```js
const WA_NUMBER = '393384346876'; // 338 434 6876
const WA_TEXT = encodeURIComponent(
  'Ciao, ho fatto il tour virtuale del trilocale e vorrei maggiori informazioni.'
);
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`;
```

Inizializzazione link WhatsApp (da chiamare su `DOMContentLoaded`):
```js
function initWhatsApp() {
  document.getElementById('wa-sticky').href = WA_URL;
  document.getElementById('wa-modal').href  = WA_URL;
  document.getElementById('wa-sticky').addEventListener('click', () =>
    gtagEvent('whatsapp_clicked', { position: 'sticky' })
  );
  document.getElementById('wa-modal').addEventListener('click', () =>
    gtagEvent('whatsapp_clicked', { position: 'modal' })
  );
}
```

### 4.6 `app.js` completo
File JavaScript pronto all'uso — sostituire `G-XXXXXXXXXX` con il Measurement ID reale e inserire i valori reali di prezzo/metratura se si vuole renderli dinamici.

```js
/* =========================================================
   app.js — Virtual Open House
   ========================================================= */

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 CONFIGURAZIONE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const WA_NUMBER = '393384346876';
const WA_TEXT   = encodeURIComponent(
  'Ciao, ho fatto il tour virtuale del trilocale e vorrei maggiori informazioni.'
);
const WA_URL    = `https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`;
// Path relativo: funziona sia in locale (con server HTTP) sia su GitHub Pages
// GitHub Pages serve il sito dalla root del repo — il path 'data/hotspots.json'
// risolve correttamente sia per username.github.io/repo/ sia per dominio custom.
// ⚠️  Non aprire index.html come file:// — il fetch fallirebbe per policy CORS.
const HOTSPOTS_URL = 'data/hotspots.json';

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 STATO GLOBALE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
let viewer       = null;
let currentScene = 'soggiorno';
let hotspotData  = [];
let lastFocusedEl = null;

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 ANALYTICS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function gtagEvent(name, params = {}) {
  if (typeof window.gtag === 'function') window.gtag('event', name, params);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 WHATSAPP \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 HOTSPOT BUILDER \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function createHotspotEl(container, args) {
  const div = document.createElement('div');
  div.className = `hotspot hotspot--${args.type}`;
  div.setAttribute('aria-label', args.label);
  div.textContent = args.type === 'staging' ? '\ud83d\udc41' : '\u2192';
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

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 VIEWER & SCENE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function startTour() {
  if (viewer) return;

  document.getElementById('landing').hidden        = true;
  document.getElementById('wa-sticky').hidden      = true;
  document.getElementById('viewer-wrapper').hidden = false;

  viewer = pannellum.viewer('viewer', {
    default: {
      firstScene:        'soggiorno',
      sceneFadeDuration: 800,
      keyboardZoom:      false,
      draggable:         true,
      showControls:      true,
      showZoomCtrl:      false,
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

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 MODALE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function openModal(hotspot) {
  const modal = document.getElementById('staging-modal');
  document.getElementById('modal-img').src             = hotspot.render;
  document.getElementById('modal-img').alt             = hotspot.label;
  document.getElementById('modal-title').textContent   = hotspot.label;
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

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 INIT \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
document.addEventListener('DOMContentLoaded', async () => {
  // Carica hotspot
  try {
    const res = await fetch(HOTSPOTS_URL);
    hotspotData = await res.json();
  } catch {
    console.warn('hotspots.json non trovato \u2014 tour senza hotspot');
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
```

## 5) Performance e ottimizzazione

### 5.1 Budget suggeriti
- Hero preview: <= 200 KB.
- Panorama 360 principale: 900 KB - 1.8 MB.
- Render staging singolo: 200-450 KB.
- JS custom totale: <= 40 KB gzip.

### 5.2 Pipeline immagini
- esportazione da sorgente ad alta risoluzione;
- conversione WebP qualità 72-82;
- naming consistente (`tour-*`, `render-*`);
- verifica visiva su schermi mobili.

Comando esempio (facoltativo):
```bash
cwebp -q 78 input.jpg -o output.webp
```

### 5.3 Pre-fetch dopo start tour
La funzione `prefetchStagingImages()` è già implementata in `app.js` (sezione 4.6) e viene invocata automaticamente dopo `tour_started`. Scarica solo gli hotspot di tipo `staging` con un campo `render` definito.

### 5.4 Strumenti consigliati per la pipeline immagini

| Operazione | Strumento | Comando rapido |
|---|---|---|
| Conversione JPEG/PNG → WebP | `cwebp` (libwebp) | `cwebp -q 78 input.jpg -o output.webp` |
| Conversione batch | ImageMagick 7 | `magick mogrify -format webp -quality 78 assets/*.jpg` |
| Verifica peso file | PowerShell | `Get-ChildItem assets -Recurse \| Select-Object Name, Length` |
| Ottimizzazione equirettangolare | PTGui / Hugin | esporta direttamente in WebP dal software di stitching |
| Verifica visiva mobile | Chrome DevTools | Device emulation + Network throttle: Slow 4G |

## 6) Analytics (GA4)

### 6.1 Snippet di installazione
Sostituire `G-XXXXXXXXXX` con il Measurement ID reale (ottenuto da Google Analytics → Flusso di dati → Web).

Lo snippet è già incluso nell'`index.html` di sezione 4.1:
```html
<!-- Sostituire G-XXXXXXXXXX con il Measurement ID reale -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', {
    page_title: 'Virtual Open House - Trilocale 83mq',
    send_page_view: true
  });
</script>
```

### 6.2 Funnel di conversione tracciato

```
Page View  →  tour_started  →  hotspot_clicked  →  whatsapp_clicked
   (QR)         (interesse)       (coinvolgimento)      (conversione)
```

### 6.3 Riferimento eventi custom

| Evento | Quando scatta | Parametri |
|---|---|---|
| `tour_started` | Tap su "Inizia il Tour Immersivo" | `source: 'landing_cta'` |
| `hotspot_clicked` | Tap su qualsiasi pin nel viewer | `hotspot_id`, `type: 'staging'\|'scene'` |
| `whatsapp_clicked` | Tap sul bottone WhatsApp | `position: 'sticky'\|'modal'` |

### 6.4 Verifica in GA4 DebugView
1. Aprire la pagina su mobile con `?gtm_debug=1` oppure installare l'estensione **Tag Assistant**.
2. In GA4 → Configura → DebugView: verificare che i tre eventi appaiano in tempo reale.
3. Controllare che `hotspot_id` sia popolato correttamente per ogni pin cliccato.

## 7) Sicurezza e robustezza

| Rischio | Misura applicata |
|---|---|
| XSS da stringhe dinamiche | `textContent` al posto di `innerHTML` in tutto `app.js`; unica eccezione documentata in `createHotspotEl` |
| Dati sensibili client-side | Nessuno — numero di telefono già pubblico sul cartellone |
| CDN Pannellum non disponibile | Fallback: il `#viewer-wrapper` rimane nascosto; aggiungere un listener `onerror` sullo script CDN che mostri un messaggio alternativo |
| Immagini mancanti o 404 | `<img onerror>` sul `modal-img` e `hero__img` per mostrare placeholder; errori loggati in console |
| `hotspots.json` non trovato | Il blocco `try/catch` in `app.js` assicura che il tour parta comunque senza hotspot |
| Open redirect via `wa.me` | URL costruito con costanti hardcoded, nessun parametro utente mai inserito nell'URL |

## 8) Definizione Done (DoD)

Ogni criterio deve essere verificato **su dispositivo fisico mobile** (iOS + Android) prima del go-live.

### 8.1 Performance
- [ ] Lighthouse mobile score ≥ 85 (Performance).
- [ ] First Contentful Paint < 1.5s su rete 4G simulata in Chrome DevTools.
- [ ] QR → landing completamente interattiva in < 2.5s su rete 4G reale.
- [ ] Peso totale pagina al primo caricamento (senza panorama) < 500 KB.

### 8.2 Funzionalità core
- [ ] Il viewer 360 **non** si inizializza prima del tap su "Inizia il Tour Immersivo".
- [ ] Le 3 scene (soggiorno, cucina, camera) sono navigabili sia da hotspot di transizione sia dalla barra nav.
- [ ] Ogni hotspot `staging` apre il modale con l'immagine corretta in < 300ms (con prefetch completato).
- [ ] Il modale si chiude con: pulsante X, tap sul backdrop, tasto ESC.
- [ ] Al ritorno dalla chiusura modale, il focus torna all'elemento che lo aveva aperto.
- [ ] Il pulsante "Torna alla scheda" riporta alla landing senza ricaricare la pagina.

### 8.3 Conversione
- [ ] Bottone WhatsApp sticky visibile durante lo scroll della landing.
- [ ] Bottone WhatsApp presente nel modale.
- [ ] Entrambi i link WhatsApp aprono la chat con il numero `338 434 6876` e il messaggio precompilato.

### 8.4 Analytics
- [ ] `tour_started` visibile in GA4 DebugView al tap sul CTA.
- [ ] `hotspot_clicked` si registra con `hotspot_id` corretto per ogni pin.
- [ ] `whatsapp_clicked` si registra con `position` corretto (`sticky` / `modal`).

### 8.5 QR Code
- [ ] URL del QR è identico all'URL GitHub Pages definitivo (es. `https://username.github.io/trilocale`).
- [ ] QR scansionato con fotocamera nativa iOS e Android apre la pagina senza passaggi intermedi.
- [ ] L'URL non contiene parametri dinamici che potrebbero scadere.

## 9) Piano implementativo operativo

### Fase 1 — Setup repository (30 min)
1. Creare repo GitHub `trilocale` (o nome scelto), visibilità pubblica.
2. Abilitare GitHub Pages su `Settings → Pages → Branch: main, root /`.
3. Creare la struttura cartelle: `assets/`, `data/`.
4. Creare il file **`.nojekyll`** vuoto nella root (obbligatorio — senza di esso Jekyll ignora file e cartelle con `_` nel nome e potrebbe interferire con il routing).
5. Aggiungere `.gitignore` con `node_modules/` e `.DS_Store`.

### Fase 2 — Asset fotografici (tempo variabile)
5. Raccogliere le foto sferiche (equirettangolari) per soggiorno, cucina, camera.
6. Raccogliere o commissionare i render di virtual staging per ogni hotspot staging.
7. Convertire tutti i file in WebP rispettando i budget di sezione 5.1.
8. Verificare visivamente ogni immagine su schermo mobile.
9. Copiare i file in `assets/` con naming `tour-*` / `render-*`.

### Fase 3 — Implementazione (2-4 ore)
10. Creare `index.html` dal template di sezione 4.1 — sostituire `INSERIRE_PREZZO` con il prezzo reale, `USERNAME` e `REPO` nelle meta OG.
11. Creare `styles.css` dal template di sezione 4.1.
12. Creare `app.js` dal template di sezione 4.6. Non mischiare con i frammenti delle sezioni 4.2–4.5.
13. Creare `data/hotspots.json` con lo schema di sezione 4.3.
    - Aprire Pannellum in locale con `hotSpotDebug: true` per trovare pitch/yaw di ogni hotspot.
    - Compilare le coordinate reali nel JSON.
    - Disabilitare `hotSpotDebug` prima del commit finale.

### Fase 4 — Test locale (1 ora)
14. Servire il progetto localmente (es. `npx serve .` oppure `python -m http.server 8080`).
    > ⚠️ `hotspots.json` richiede un server HTTP — non funziona aprendo `index.html` direttamente come `file://`.
15. Eseguire la checklist DoD sezione 8 su dispositivo fisico iOS + Android.
16. Aprire Chrome DevTools → Network → Slow 4G e verificare i tempi di caricamento.
17. Verificare gli eventi GA4 in DebugView.

### Fase 5 — Go-live (15 min)
18. Fare commit e push su `main`.
19. Attendere il deploy GitHub Pages (1-3 minuti).
20. Verificare l'URL pubblico su mobile.
21. Generare il QR Code statico puntando all'URL definitivo (strumenti: qr-code-generator.com, QRCode Monkey, o libreria `qrcode` npm).
22. Validare il QR con fotocamera nativa — ultimo test end-to-end prima della stampa.
