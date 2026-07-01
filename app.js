/* =========================================================
   app.js — Landing page
   ========================================================= */

const WA_NUMBER = '393384346876';
const WA_TEXT   = encodeURIComponent(
  'Ciao, ho visto il trilocale in via Paisiello e vorrei maggiori informazioni.'
);
const WA_URL    = `https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`;

const gtagEvent = window.gtagEvent || function () {};

document.addEventListener('DOMContentLoaded', () => {
  const wa = document.getElementById('wa-sticky');
  if (wa) {
    wa.href = WA_URL;
    wa.addEventListener('click', () =>
      gtagEvent('contact_click', { method: 'whatsapp', location: 'sticky' })
    );
  }

  const call = document.querySelector('.btn-call');
  if (call) {
    call.addEventListener('click', () =>
      gtagEvent('contact_click', { method: 'phone', location: 'sticky' })
    );
  }
});
