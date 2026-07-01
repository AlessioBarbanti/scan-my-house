/* =========================================================
   consent-init.js — Consent Mode v2 setup + gtag config
   Loaded synchronously (no defer) so consent defaults are
   pushed to dataLayer before any GA hit is dispatched.
   ========================================================= */

gtag('consent', 'default', {
  ad_storage:            'denied',
  ad_user_data:          'denied',
  ad_personalization:    'denied',
  analytics_storage:     'denied',
  functionality_storage: 'granted',
  security_storage:      'granted',
  wait_for_update:       500
});

// Re-apply a previously granted choice so GA starts aligned.
try {
  if (localStorage.getItem('smh_consent') === 'granted') {
    gtag('consent', 'update', {
      ad_storage:         'granted',
      ad_user_data:       'granted',
      ad_personalization: 'granted',
      analytics_storage:  'granted'
    });
  }
} catch (e) {}

gtag('js', new Date());
gtag('config', 'G-MCZ5CP1CPZ');
