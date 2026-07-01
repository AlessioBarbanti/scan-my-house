import { describe, it, expect } from 'vitest';
import { createPage, findCall } from './helpers.js';

const NOW = 1_700_000_000_000; // istante fisso per rendere deterministici i calcoli
const DAY = 24 * 60 * 60 * 1000;
const MIN = 60 * 1000;

function visitor(state) {
  return { smh_visitor: JSON.stringify(state) };
}

describe('analytics.js — riconoscimento visitatore', () => {
  it('primo accesso in assoluto: nuovo visitatore, visit_count 1, evento visit', async () => {
    const page = await createPage({ now: NOW, storage: { smh_consent: 'granted' } });
    page.load('analytics.js');

    expect(page.calls[0]).toEqual([
      'set',
      'user_properties',
      { visitor_type: 'new', visit_count: 1, days_since_first: 0 },
    ]);
    expect(page.calls[1]).toEqual([
      'event',
      'visit',
      { visitor_type: 'new', visit_count: 1, days_since_first: 0, landing_page: '/' },
    ]);
  });

  it('visitatore di ritorno oltre il gap di sessione: incrementa visit_count ed emette visit', async () => {
    const page = await createPage({
      now: NOW,
      storage: {
        smh_consent: 'granted',
        ...visitor({ firstVisit: NOW - 10 * DAY, lastVisit: NOW - 60 * MIN, visitCount: 2 }),
      },
    });
    page.load('analytics.js');

    expect(findCall(page.calls, 'set', 'user_properties')[2]).toEqual({
      visitor_type: 'returning',
      visit_count: 3,
      days_since_first: 10,
    });
    expect(findCall(page.calls, 'event', 'visit')[2]).toEqual({
      visitor_type: 'returning',
      visit_count: 3,
      days_since_first: 10,
      landing_page: '/',
    });
  });

  it('stessa sessione (entro 30 min): NON incrementa e NON emette un nuovo evento visit', async () => {
    const page = await createPage({
      now: NOW,
      storage: {
        smh_consent: 'granted',
        ...visitor({ firstVisit: NOW - 3 * DAY, lastVisit: NOW - 5 * MIN, visitCount: 2 }),
      },
    });
    page.load('analytics.js');

    // le user_properties vengono comunque aggiornate...
    expect(findCall(page.calls, 'set', 'user_properties')[2]).toEqual({
      visitor_type: 'returning',
      visit_count: 2,
      days_since_first: 3,
    });
    // ...ma nessun evento 'visit' per una visita già in corso
    expect(findCall(page.calls, 'event', 'visit')).toBeUndefined();
    expect(page.calls).toHaveLength(1);
  });

  it('localStorage svuotato ma cookie di backup presente: riconosciuto come di ritorno', async () => {
    const page = await createPage({
      now: NOW,
      storage: { smh_consent: 'granted' }, // niente smh_visitor
      cookies: ['smh_vc=4'],
    });
    page.load('analytics.js');

    expect(findCall(page.calls, 'set', 'user_properties')[2]).toEqual({
      visitor_type: 'returning',
      visit_count: 5, // 4 dal cookie + 1
      days_since_first: 0,
    });
    expect(findCall(page.calls, 'event', 'visit')).toBeDefined();
  });

  it('senza consenso non parte al load, ma parte quando il banner chiama smhVisitorRecognition()', async () => {
    const page = await createPage({ now: NOW }); // nessun smh_consent
    page.load('analytics.js');
    expect(page.calls).toHaveLength(0);

    page.window.smhVisitorRecognition();
    expect(findCall(page.calls, 'set', 'user_properties')).toBeDefined();
    expect(findCall(page.calls, 'event', 'visit')).toBeDefined();
  });

  it('è idempotente: due chiamate a smhVisitorRecognition() contano una sola visita', async () => {
    const page = await createPage({ now: NOW });
    page.load('analytics.js');
    page.window.smhVisitorRecognition();
    const after = page.calls.length;
    page.window.smhVisitorRecognition();
    expect(page.calls).toHaveLength(after);
  });
});

describe('analytics.js — tracking dichiarativo data-ga', () => {
  it('un click su un elemento data-ga invia l\'evento con i parametri parsati', async () => {
    const page = await createPage({
      html:
        '<!DOCTYPE html><html><body>' +
        '<a data-ga="cta_click" data-ga-cta-id="piantina" data-ga-location="landing">' +
        '<span id="child">x</span></a>' +
        '</body></html>',
    });
    page.load('analytics.js');

    page.window.document.getElementById('child').click();

    expect(findCall(page.calls, 'event', 'cta_click')[2]).toEqual({
      cta_id: 'piantina',
      location: 'landing',
    });
  });
});

describe('analytics.js — robustezza', () => {
  it('window.gtagEvent non lancia se gtag non è disponibile', async () => {
    const page = await createPage();
    page.load('analytics.js');
    page.window.gtag = undefined;
    expect(() => page.window.gtagEvent('qualsiasi', { a: 1 })).not.toThrow();
  });
});
