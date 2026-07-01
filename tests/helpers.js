import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Crea una finestra jsdom isolata in cui eseguire gli script del sito come
 * "classic script" (runScripts: 'dangerously'), con un vero origin https così
 * che localStorage e document.cookie funzionino.
 *
 * È async: attende il `load` iniziale di jsdom prima di restituire, così quando
 * i test iniettano gli script `document.readyState === 'complete'` — esattamente
 * come accade agli script `defer` del sito. Di conseguenza un handler
 * `DOMContentLoaded` registrato da uno script iniettato NON riparte da solo
 * (l'evento è già passato): lo si attiva esplicitamente con fireDOMContentLoaded.
 *
 * Ritorna { window, calls, load } dove:
 *  - calls: array che raccoglie ogni chiamata a window.gtag(...args)
 *  - load(relPath): inietta un file del repo come <script> inline (esecuzione
 *    sincrona, semantica globale identica al browser).
 */
export async function createPage({
  html = '<!DOCTYPE html><html><body></body></html>',
  storage = {},
  cookies = [],
  now,
} = {}) {
  const dom = new JSDOM(html, {
    url: 'https://example.com/',
    runScripts: 'dangerously',
    pretendToBeVisual: true, // fornisce requestAnimationFrame (usato da consent.js)
  });
  const { window } = dom;

  // Attende che il documento iniziale sia completamente caricato.
  await new Promise((resolve) => {
    if (window.document.readyState === 'complete') resolve();
    else window.addEventListener('load', () => resolve(), { once: true });
  });

  if (typeof now === 'number') {
    const fixed = now;
    window.Date.now = () => fixed;
  }

  for (const [key, value] of Object.entries(storage)) {
    window.localStorage.setItem(key, value);
  }
  for (const cookie of cookies) {
    window.document.cookie = cookie;
  }

  // Stub di gtag: raccoglie gli argomenti di ogni chiamata.
  const calls = [];
  window.dataLayer = [];
  window.gtag = (...args) => {
    calls.push(args);
  };

  const load = (relPath) => {
    const src = readFileSync(join(ROOT, relPath), 'utf8');
    const el = window.document.createElement('script');
    el.textContent = src;
    window.document.body.appendChild(el);
  };

  return { dom, window, calls, load };
}

/** Attiva manualmente l'evento DOMContentLoaded (già passato al load iniziale). */
export function fireDOMContentLoaded(window) {
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
}

/** Ritorna la prima chiamata gtag il cui primo argomento è `command`. */
export function findCall(calls, command, second) {
  return calls.find(
    (c) => c[0] === command && (second === undefined || c[1] === second)
  );
}
