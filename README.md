# scan-my-house

Virtual Open House — Trilocale 83 mq, Nuova Realizzazione.

Tour virtuale 360° con Pannellum, hostato su GitHub Pages.

🔗 **Live:** https://AlessioBarbanti.github.io/scan-my-house/

## Setup locale

```bash
npx serve .
```

Aprire `http://localhost:3000` nel browser (necessario un server HTTP per il fetch di `data/hotspots.json`).

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
