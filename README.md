# scan-my-house

Virtual Open House — Trilocale 83 mq, Nuova Realizzazione.

Tour virtuale 360° con Pannellum, hostato su GitHub Pages.

🔗 **Live:** https://AlessioBarbanti.github.io/scan-my-house/

## Setup locale

```bash
npx serve .
```

Aprire `http://localhost:3000` nel browser (necessario un server HTTP per il fetch di `data/hotspots.json`).

## Test

Suite unitaria/di regressione con [Vitest](https://vitest.dev) + [jsdom](https://github.com/jsdom/jsdom). Gli script del sito vengono eseguiti come *classic script* dentro una finestra jsdom isolata (vedi `tests/helpers.js`), così i test riproducono fedelmente la semantica del browser.

```bash
npm install   # solo la prima volta (installa le devDependencies)
npm test      # esegue la suite una volta
npm run test:watch
```

Copertura: riconoscimento visitatore (`analytics.js`), tracking dichiarativo `data-ga`, banner consenso e Consent Mode v2 (`consent.js` / `consent-init.js`) e una regressione che blocca il bug dello shim `gtagEvent`. Il tooling di test non viene mai referenziato dalle pagine: il sito resta 100% statico.

## Prima del go-live

- [ ] Sostituire `G-XXXXXXXXXX` in `index.html` con il Measurement ID GA4 reale
- [ ] Aggiungere le immagini WebP reali in `assets/` (panorami `tour-*` e render `render-*`)
- [ ] Aggiornare `INSERIRE_PREZZO` se si decide di mostrare il prezzo
- [ ] Generare il QR Code puntando a `https://AlessioBarbanti.github.io/scan-my-house/`
- [ ] Calibrare `pitch` e `yaw` in `data/hotspots.json` con `hotSpotDebug: true` su immagini reali

## Struttura

```
/
  index.html          ← Landing + Viewer + Modale
  styles.css          ← Stili mobile-first con font Outfit
  app.js              ← Logica tour, modale, analytics, WhatsApp
  .nojekyll           ← Disabilita Jekyll su GitHub Pages
  assets/             ← Immagini WebP (panorami + render + favicon)
  data/
    hotspots.json     ← Definizione scene e hotspot interattivi
```
