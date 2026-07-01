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
};

const ACTIVE_FILL = '#3A3020';

// Delega all'implementazione esposta da analytics.js. NB: `const` (non
// `function`) per non sovrascrivere `window.gtagEvent` in questo classic script.
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
    el.setAttribute('opacity', '1');
  } else {
    el.setAttribute('opacity', '0');
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

// ── Open / close ──────────────────────────────────────────
function openRoom(roomId) {
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
    if (!sheet.classList.contains('is-open')) sheet.hidden = true;
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

// ── Prefetch images ───────────────────────────────────────
Object.values(ROOMS).forEach(r => {
  if (r.img) new Image().src = r.img;
});
