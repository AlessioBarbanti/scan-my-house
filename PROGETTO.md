# Scan My House — Note di progetto

## L'immobile

- **Tipologia:** Trilocale, nuova costruzione
- **Indirizzo:** Via Paisiello 17, Milano Marittima (RA)
- **Superficie:** 83 mq
- **Classe energetica:** A
- **Stato di consegna:** Grezzo con pavimenti già posati — le finiture (rivestimenti, sanitari, rubinetteria) sono a carico dell'acquirente

### Composizione degli spazi
| Ambiente | Superficie |
|---|---|
| Soggiorno + cucina | ~24 mq |
| Camera padronale | ~15 mq |
| 2ª Camera | ~14 mq |
| Bagno 1 | ~5 mq |
| Bagno 2 | ~5 mq |
| Spazi di servizio / altri | ~20 mq |

### Dotazioni incluse
- Infissi FINSTRAL (isolamento termico e acustico di fascia alta)
- Predisposizione impianto multi-split
- Ingresso indipendente
- Box auto di proprietà

---

## Target

**Età:** 50–60 anni
**Profilo:** Acquirente maturo, con idee chiare su cosa vuole. Non ha bisogno di essere convinto con aggettivi vuoti — vuole capire cosa compra, valutare la qualità costruttiva e immaginare come renderà l'appartamento proprio. Spesso acquista come casa vacanze vicino al mare (Milano Marittima) o come investimento. Conosce la zona, sa che il parcheggio in agosto è un problema, apprezza la praticità dei due bagni quando si rientra dalla spiaggia.

**Tono di voce:** Diretto, concreto, contestualizzato alla vita reale a Milano Marittima. Niente superlativi gratuiti. Le specifiche tecniche (Finstral, Classe A) sono un segnale di qualità, non un elenco da recitare.

---

## Scelte di design

### Palette colori
| Ruolo | Colore |
|---|---|
| Sfondo principale | `#0A0A0A` |
| Testo primario (titoli) | `#EDE8E0` |
| Testo corpo descrizione | `#ADA7A1` |
| Testo secondario (label, mq) | `#9A938D` |
| Accento oro | `#C4A56A` |
| Energia / classe A | `#56B87A` |
| Sfondo card/sheet | `#191919` / `#161412` |
| Finestre SVG | `#3A5B6E` |
| Porte SVG | `#6A6560` |

### Tipografia
- **Display / titoli:** DM Serif Display (serif elegante, anche in italic per le etichette SVG)
- **Corpo / UI:** DM Sans (sans-serif moderna, leggibile)
- **Scala base:** 16px (1em), tutto il resto in em relativi
- **Minimo testo leggibile:** 0.75em (12px) — usato solo per label uppercase con letter-spacing

### Pagine
| Pagina | Descrizione |
|---|---|
| `index.html` | Landing page principale. Hero foto, stats, CTA tour+piantina, descrizione immobile, dotazioni |
| `tour.html` | Tour virtuale 360° con Pannellum. Navigazione tra stanze con hotspot |
| `piantina.html` | Planimetria SVG interattiva. Click su stanza → bottom sheet con foto e dettagli |

### Componenti chiave
- **Bottom sheet (piantina):** Si apre dal basso con transizione spring. Mostra nome stanza, mq e foto. Niente toggle Prima/Dopo — rimosso per semplicità.
- **Sticky bar:** WhatsApp + telefono, sempre visibile in basso. In landscape si riduce a 40px.
- **SVG floor plan:** Inline SVG con layer sovrapposti — geometria → overlay fill → testo → selection ring → hotspot trasparenti. Dark mode adattato dalla planimetria originale del geometra.
- **CTA tour e piantina:** Stesso peso visivo (card scura con bordo sottile, icona oro), nessuna gerarchia tra i due.

### Scelte da rivedere / in sospeso
- Il tasto tour virtuale 360° nella bottom sheet della piantina è commentato temporaneamente
- I render di alcune stanze (2ª Camera) non sono ancora disponibili
