import { describe, it, expect } from 'vitest';
import { createPage, findCall } from './helpers.js';

describe('consent.js — banner cookie', () => {
  it('nuovo utente: mostra il banner con i pulsanti Rifiuta/Accetta', async () => {
    const page = await createPage();
    page.load('consent.js');

    const banner = page.window.document.querySelector('.cookie-banner');
    expect(banner).not.toBeNull();
    expect(banner.querySelector('[data-consent="accept"]')).not.toBeNull();
    expect(banner.querySelector('[data-consent="reject"]')).not.toBeNull();
  });

  it('utente che ha già scelto: niente banner, solo il trigger per riaprire', async () => {
    const page = await createPage({ storage: { smh_consent: 'denied' } });
    page.load('consent.js');

    expect(page.window.document.querySelector('.cookie-banner')).toBeNull();
    const reopen = page.window.document.querySelector('.cookie-reopen');
    expect(reopen).not.toBeNull();
    expect(reopen.hidden).toBe(false);
  });

  it('Accetta: salva "granted" e aggiorna il consenso Google a granted', async () => {
    const page = await createPage();
    page.load('consent.js');

    page.window.document.querySelector('[data-consent="accept"]').click();

    expect(page.window.localStorage.getItem('smh_consent')).toBe('granted');
    const update = findCall(page.calls, 'consent', 'update');
    expect(update[2]).toEqual({
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
    });
  });

  it('Rifiuta: salva "denied" e aggiorna il consenso Google a denied', async () => {
    const page = await createPage();
    page.load('consent.js');

    page.window.document.querySelector('[data-consent="reject"]').click();

    expect(page.window.localStorage.getItem('smh_consent')).toBe('denied');
    expect(findCall(page.calls, 'consent', 'update')[2].analytics_storage).toBe('denied');
  });

  it('Accetta: se analytics.js è caricato, avvia il riconoscimento visitatore', async () => {
    const page = await createPage();
    page.load('analytics.js');
    page.load('consent.js');

    page.window.document.querySelector('[data-consent="accept"]').click();

    expect(findCall(page.calls, 'event', 'visit')).toBeDefined();
  });
});

describe('consent-init.js — Consent Mode v2 default', () => {
  it('imposta il default a denied per gli storage pubblicitari e analytics', async () => {
    const page = await createPage();
    page.load('consent-init.js');

    const def = findCall(page.calls, 'consent', 'default');
    expect(def[2]).toMatchObject({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
    // config con il measurement ID del sito
    expect(findCall(page.calls, 'config')).toEqual(['config', 'G-MCZ5CP1CPZ']);
  });

  it('se il consenso era già stato dato, riallinea subito Google a granted', async () => {
    const page = await createPage({ storage: { smh_consent: 'granted' } });
    page.load('consent-init.js');

    expect(findCall(page.calls, 'consent', 'update')[2]).toMatchObject({
      analytics_storage: 'granted',
    });
  });
});
