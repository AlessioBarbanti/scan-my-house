import { describe, it, expect } from 'vitest';
import { createPage, findCall, fireDOMContentLoaded } from './helpers.js';

/**
 * Regressione del bug 🔴: negli script di pagina lo shim `gtagEvent` era una
 * `function` a livello top. In un classic script questo sovrascrive
 * `window.gtagEvent` (l'impl. vera di analytics.js) con sé stesso → ricorsione
 * infinita alla prima chiamata. La fix usa `const`, che NON tocca window.
 *
 * Questi test caricano i file reali come <script> in jsdom (semantica browser
 * fedele), quindi fallirebbero con il vecchio codice.
 */
describe('regressione: lo shim di pagina non sovrascrive window.gtagEvent', () => {
  it('app.js — window.gtagEvent resta l\'impl. di analytics.js', async () => {
    const page = await createPage({ html: '<!DOCTYPE html><html><body><a id="wa-sticky"></a></body></html>' });
    page.load('analytics.js');
    const real = page.window.gtagEvent;

    page.load('app.js');

    expect(page.window.gtagEvent).toBe(real); // non è stato clobberato
  });

  it('app.js — un click sul WhatsApp sticky invia UN solo evento (niente ricorsione)', async () => {
    const page = await createPage({ html: '<!DOCTYPE html><html><body><a id="wa-sticky"></a></body></html>' });
    page.load('analytics.js');
    page.load('app.js');

    // app.js aggancia i listener su DOMContentLoaded
    fireDOMContentLoaded(page.window);
    const wa = page.window.document.getElementById('wa-sticky');
    wa.addEventListener('click', (e) => e.preventDefault()); // evita il warning di navigazione jsdom
    wa.click();

    const contactClicks = page.calls.filter((c) => c[0] === 'event' && c[1] === 'contact_click');
    expect(contactClicks).toHaveLength(1);
    expect(contactClicks[0][2]).toEqual({ method: 'whatsapp', location: 'sticky' });
  });

  it('tour.js — window.gtagEvent resta l\'impl. di analytics.js', async () => {
    const page = await createPage();
    page.load('analytics.js');
    const real = page.window.gtagEvent;

    page.load('tour.js');

    expect(page.window.gtagEvent).toBe(real);
  });

  it('piantina.js — window.gtagEvent resta l\'impl. di analytics.js', async () => {
    const page = await createPage({
      html:
        '<!DOCTYPE html><html><body>' +
        '<div id="room-overlay"></div>' +
        '<div id="bottom-sheet"></div>' +
        '<span id="sheet-title"></span>' +
        '<span id="sheet-mq"></span>' +
        '<img id="sheet-img">' +
        '<button id="sheet-close"></button>' +
        '</body></html>',
    });
    page.load('analytics.js');
    const real = page.window.gtagEvent;

    page.load('piantina.js');

    expect(page.window.gtagEvent).toBe(real);
  });

  it('chiamare window.gtagEvent dopo la fix delega a gtag esattamente una volta', async () => {
    const page = await createPage();
    page.load('analytics.js');
    page.load('app.js');

    page.window.gtagEvent('test_event', { foo: 'bar' });

    expect(findCall(page.calls, 'event', 'test_event')).toEqual([
      'event',
      'test_event',
      { foo: 'bar' },
    ]);
  });
});
