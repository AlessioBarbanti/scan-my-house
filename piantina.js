/* =========================================================
   piantina.js — Interactive floor plan
   ========================================================= */

const ROOMS = {
  soggiorno: {
    label:  'Soggiorno',
    mq:     '~25 mq',
    render: 'assets/render/render-soggiorno-divano.webp',
    vuoto:  'assets/foto/interno/finestra_salotto_int_pre.jpg',
  },
  cucina: {
    label:  'Cucina',
    mq:     '~12 mq',
    render: 'assets/render/render-cucina-arredata.webp',
    vuoto:  'assets/tour/tour-cucina-vuota.webp',
  },
  bagno2: {
    label:  'Bagno 2',
    mq:     '~5 mq',
    render: null,
    vuoto:  'assets/tour/tour-bagno2-vuoto.webp',
  },
  bagno1: {
    label:  'Bagno 1',
    mq:     '~7 mq',
    render: 'assets/render/foto_bagno_arredata.png',
    vuoto:  'assets/foto/interno/bagno_1.jpg',
  },
  cameraPad: {
    label:  'Camera Padronale',
    mq:     '~18 mq',
    render: 'assets/render/render-camera-arredata.webp',
    vuoto:  'assets/tour/tour-camera-vuota.webp',
  },
  camera2: {
    label:  '2ª Camera',
    mq:     '~14 mq',
    render: null,
    vuoto:  'assets/tour/tour-camera2-vuota.webp',
  },
};

const BASE_FILLS = {
  soggiorno: '#28241B',
  cucina:    '#22201A',
  bagno2:    '#192025',
  bagno1:    '#1A2126',
  cameraPad: '#1E1C27',
  camera2:   '#1C1D26',
};
const ACTIVE_FILL = '#38321A';

let selectedRoom = null;
let showBefore   = false;

// ── DOM refs ──────────────────────────────────────────────
const overlay    = document.getElementById('room-overlay');
const sheet      = document.getElementById('bottom-sheet');
const sheetTitle = document.getElementById('sheet-title');
const sheetMq    = document.getElementById('sheet-mq');
const sheetImg   = document.getElementById('sheet-img');
const sheetClose = document.getElementById('sheet-close');
const toggleWrap = document.getElementById('toggle-wrap');
const badgeArrivo = document.getElementById('badge-arrivo');
const btnPrima   = document.getElementById('btn-prima');
const btnDopo    = document.getElementById('btn-dopo');

// ── Helpers ───────────────────────────────────────────────
function setRoomFill(roomId, active) {
  const el = document.getElementById('fill-' + roomId);
  if (el) el.setAttribute('fill', active ? ACTIVE_FILL : (BASE_FILLS[roomId] || '#1A1A1A'));
}

function setRoomSelection(roomId, selected) {
  const el = document.getElementById('sel-' + roomId);
  if (el) el.setAttribute('opacity', selected ? '1' : '0');
}

function updateSheet() {
  const room = selectedRoom ? ROOMS[selectedRoom] : null;
  if (!room) return;

  const hasRender = !!room.render;
  sheetTitle.textContent = room.label;
  sheetMq.textContent    = room.mq;

  toggleWrap.hidden   = !hasRender;
  badgeArrivo.hidden  = hasRender;

  const src = (showBefore && hasRender) ? room.vuoto : (room.render || room.vuoto || '');
  sheetImg.src = src;
  sheetImg.alt = room.label;

  btnPrima.classList.toggle('is-active-prima', showBefore);
  btnPrima.classList.toggle('is-active-dopo',  false);
  btnDopo.classList.toggle('is-active-dopo',  !showBefore);
  btnDopo.classList.toggle('is-active-prima',  false);
}

// ── Open / close ──────────────────────────────────────────
function openRoom(roomId) {
  if (selectedRoom && selectedRoom !== roomId) {
    setRoomFill(selectedRoom, false);
    setRoomSelection(selectedRoom, false);
  }
  selectedRoom = roomId;
  showBefore   = false;

  setRoomFill(roomId, true);
  setRoomSelection(roomId, true);

  updateSheet();

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

btnPrima.addEventListener('click', () => {
  showBefore = true;
  updateSheet();
});

btnDopo.addEventListener('click', () => {
  showBefore = false;
  updateSheet();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && selectedRoom) closeRoom();
});

// ── Prefetch renders ──────────────────────────────────────
Object.values(ROOMS).forEach(r => {
  if (r.render) new Image().src = r.render;
});
