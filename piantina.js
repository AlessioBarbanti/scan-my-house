/* =========================================================
   piantina.js — Interactive floor plan
   ========================================================= */

const ROOMS = {
  soggiorno: {
    label:  'Soggiorno e cucina',
    mq:     '~24 mq',
    img:    'assets/render/soggiorno_cucina.png',
  },
  bagno2: {
    label:  'Bagno',
    mq:     '~5 mq',
    img:    'assets/render/bagno_centrale.png',
  },
  bagno1: {
    label:  'Bagno',
    mq:     '~5 mq',
    img:    'assets/render/bagno_est.png',
  },
  cameraPad: {
    label:  'Camera da letto',
    mq:     '~15 mq',
    img:    'assets/render/camera_letto_est.png',
  },
  camera2: {
    label:  'Camera da letto',
    mq:     '~14 mq',
    img:    'assets/render/camera_letto_ovest.png',
  },
  ingressoEsterno: {
    label:  'Ingresso esterno',
    mq:     '',
    img:    'assets/foto/esterno/esterno_enh.png',
  },
};

const ACTIVE_FILL = '#3A3020';
const GLOW_FILL   = 'rgba(196,165,106,0.18)';

const gtagEvent = (name, params) => {
  if (typeof window.gtagEvent === 'function') window.gtagEvent(name, params);
};

let selectedRoom = null;

// ── DOM refs ──────────────────────────────────────────────
const overlay    = document.getElementById('room-overlay');
const sheet      = document.getElementById('bottom-sheet');
const sheetTitle = document.getElementById('sheet-title');
const sheetMq    = document.getElementById('sheet-mq');
const sheetImg   = document.getElementById('sheet-img');
const sheetClose = document.getElementById('sheet-close');

// ── Helpers ───────────────────────────────────────────────
function setRoomFill(roomId, active) {
  const el = document.getElementById('fill-' + roomId);
  if (!el) return;
  if (active) {
    el.setAttribute('fill', ACTIVE_FILL);
    gsap.set(el, { opacity: 1 });
  } else {
    gsap.to(el, { opacity: 0, duration: 0.3, onComplete: () => el.setAttribute('fill', GLOW_FILL) });
  }
}

function setRoomSelection(roomId, selected) {
  const el = document.getElementById('sel-' + roomId);
  if (el) el.setAttribute('opacity', selected ? '1' : '0');
}

function updateSheet() {
  const room = selectedRoom ? ROOMS[selectedRoom] : null;
  if (!room) return;
  sheetTitle.textContent = room.label;
  sheetMq.textContent    = room.mq;
  sheetImg.src = room.img || '';
  sheetImg.alt = room.label;
}

// ── Intro animation ───────────────────────────────────────
const ROOM_SEQUENCE = ['ingressoEsterno', 'soggiorno', 'cameraPad', 'bagno1', 'bagno2', 'camera2'];

let introTl = null;

function buildIntroTimeline() {
  const allFills = ROOM_SEQUENCE
    .map(id => document.getElementById('fill-' + id))
    .filter(Boolean);

  const tl = gsap.timeline({
    repeat: -1,
    repeatDelay: 2,
    defaults: { ease: 'power1.inOut', duration: 0.5 },
  });

  // Stanze una alla volta — GSAP le catena in sequenza automaticamente
  ROOM_SEQUENCE.forEach(roomId => {
    const el = document.getElementById('fill-' + roomId);
    if (!el) return;
    tl.to(el, { opacity: 1 })          // fade in
      .to(el, { opacity: 0 }, '+=0.7'); // resta accesa 0.7s, poi fade out
  });

  // Pulse finale — parte 0.8s dopo che l'ultima stanza si è spenta
  tl.to(allFills, { opacity: 1 }, '+=0.8')   // tutte insieme
    .to(allFills, { opacity: 0 }, '+=1.0');   // restano 1s, poi si spengono

  return tl;
}

// ── Open / close ──────────────────────────────────────────
function openRoom(roomId) {
  if (introTl) introTl.pause();

  if (selectedRoom && selectedRoom !== roomId) {
    setRoomFill(selectedRoom, false);
    setRoomSelection(selectedRoom, false);
  }
  selectedRoom = roomId;

  setRoomFill(roomId, true);
  setRoomSelection(roomId, true);
  updateSheet();

  gtagEvent('room_open', {
    room_id:    roomId,
    room_label: (ROOMS[roomId] && ROOMS[roomId].label) || roomId,
  });

  sheet.hidden = false;
  requestAnimationFrame(() => {
    sheet.classList.add('is-open');
    overlay.classList.add('is-open');
  });
}

function closeRoom() {
  sheet.classList.remove('is-open');
  overlay.classList.remove('is-open');

  if (selectedRoom) {
    setRoomFill(selectedRoom, false);
    setRoomSelection(selectedRoom, false);
    selectedRoom = null;
  }

  sheet.addEventListener('transitionend', () => {
    if (!sheet.classList.contains('is-open')) {
      sheet.hidden = true;
      if (introTl) gsap.delayedCall(0.8, () => introTl.restart());
    }
  }, { once: true });
}

// ── Event listeners ───────────────────────────────────────
document.querySelectorAll('.room-fill').forEach(el => {
  el.addEventListener('click', () => openRoom(el.dataset.room));
});

sheetClose.addEventListener('click', closeRoom);
overlay.addEventListener('click', closeRoom);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && selectedRoom) closeRoom();
});

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  introTl = buildIntroTimeline();
});

// ── Prefetch images ───────────────────────────────────────
Object.values(ROOMS).forEach(r => {
  if (r.img) new Image().src = r.img;
});
