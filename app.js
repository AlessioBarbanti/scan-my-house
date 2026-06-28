/* =========================================================
   app.js — Landing page
   ========================================================= */

const WA_NUMBER = '393384346876';
const WA_TEXT   = encodeURIComponent(
  'Ciao, ho visto il trilocale in via Paisiello e vorrei maggiori informazioni.'
);
const WA_URL    = `https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`;

function gtagEvent(name, params = {}) {
  if (typeof window.gtag === 'function') window.gtag('event', name, params);
}

document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('wa-sticky');
  if (!el) return;
  el.href = WA_URL;
  el.addEventListener('click', () =>
    gtagEvent('whatsapp_clicked', { position: 'sticky' })
  );
});
