// Gallery: filters + lightbox. Same features as the original js/gallery.js
// (hash filters, keyboard arrows, wheel/pinch zoom, drag pan, swipe), rebuilt on
// a native <dialog> for focus management and with screen-reader feedback.

// Largest optimized WebP per image name, for the lightbox.
const webps = import.meta.glob('../assets/img/*.webp', { eager: true, query: '?url', import: 'default' });
const fullSize = {};
for (const [path, url] of Object.entries(webps)) {
  const m = path.match(/\/([a-z0-9-]+?)-(\d+)\.webp$/);
  if (!m) continue;
  const [, name, w] = m;
  if (!fullSize[name] || Number(w) > fullSize[name].w) fullSize[name] = { w: Number(w), url };
}

export function initGallery() {
  const tiles = [...document.querySelectorAll('.tile')];
  const filters = [...document.querySelectorAll('.filter')];
  // Valid deep-link groups come from the generated filter buttons (#ads, #bstudy, …)
  const GROUPS = filters.map((b) => b.dataset.filter).filter((g) => g !== 'all');
  const status = document.getElementById('filter-status');
  const dialog = document.getElementById('lightbox');
  if (!tiles.length || !dialog) return;

  const img = document.getElementById('lightbox-img');
  const stage = document.getElementById('lightbox-stage');
  const catEl = document.getElementById('lightbox-cat');
  const titleEl = document.getElementById('lightbox-title');
  const counterEl = document.getElementById('lightbox-counter');

  let visible = tiles;
  let current = 0;
  let opener = null;

  /* ---------------- Filters ---------------- */
  const applyFilter = (value, { announce = true } = {}) => {
    filters.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === value)));
    tiles.forEach((t) => { t.hidden = !(value === 'all' || t.dataset.group === value); });
    visible = tiles.filter((t) => !t.hidden);
    if (announce && status) {
      const btn = filters.find((b) => b.dataset.filter === value);
      const label = btn ? btn.childNodes[0].textContent.trim() : value;
      status.textContent = `Showing ${visible.length} ${value === 'all' ? 'designs' : `${label} designs`}`;
    }
  };

  filters.forEach((btn) => btn.addEventListener('click', () => {
    const value = btn.dataset.filter;
    applyFilter(value);
    history.replaceState(null, '', value === 'all' ? location.pathname : `#${value}`);
  }));

  const fromHash = () => {
    const hash = location.hash.slice(1);
    applyFilter(GROUPS.includes(hash) ? hash : 'all', { announce: false });
  };
  fromHash();
  window.addEventListener('hashchange', fromHash);

  /* ---------------- Lightbox ---------------- */
  let scale = 1, panX = 0, panY = 0;
  const apply = () => { img.style.transform = `scale(${scale}) translate(${panX}px, ${panY}px)`; };
  const resetZoom = () => {
    scale = 1; panX = 0; panY = 0;
    img.classList.remove('is-zoomed', 'is-grabbing');
    apply();
  };

  const show = (i) => {
    current = (i + visible.length) % visible.length;
    const tile = visible[current];
    const name = tile.dataset.name;
    img.src = fullSize[name]?.url ?? tile.querySelector('img').currentSrc;
    img.alt = tile.dataset.title;
    catEl.textContent = tile.dataset.category.replace('&amp;', '&');
    titleEl.textContent = tile.dataset.title;
    counterEl.textContent = `${current + 1} / ${visible.length}`;
    resetZoom();
  };

  const open = (tile) => {
    opener = tile.querySelector('.tile__btn');
    show(visible.indexOf(tile));
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  };

  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
    resetZoom();
    opener?.focus();
  });

  tiles.forEach((tile) => tile.querySelector('.tile__btn').addEventListener('click', () => open(tile)));
  document.getElementById('lightbox-close').addEventListener('click', () => dialog.close());
  document.getElementById('lightbox-next').addEventListener('click', () => show(current + 1));
  document.getElementById('lightbox-prev').addEventListener('click', () => show(current - 1));

  // Click on the dark area (not the image or controls) closes.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target === stage) dialog.close();
  });

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
  });

  // Wheel zoom
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    scale = Math.min(Math.max(scale + (e.deltaY > 0 ? -0.15 : 0.15), 1), 5);
    if (scale === 1) { panX = 0; panY = 0; }
    img.classList.toggle('is-zoomed', scale > 1);
    apply();
  }, { passive: false });

  // Mouse drag pan
  let dragging = false, sx = 0, sy = 0, spx = 0, spy = 0;
  img.addEventListener('mousedown', (e) => {
    if (scale <= 1) return;
    dragging = true; sx = e.clientX; sy = e.clientY; spx = panX; spy = panY;
    img.classList.add('is-grabbing');
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    panX = spx + (e.clientX - sx) / scale;
    panY = spy + (e.clientY - sy) / scale;
    apply();
  });
  window.addEventListener('mouseup', () => { dragging = false; img.classList.remove('is-grabbing'); });

  // Touch: pinch zoom, one-finger pan when zoomed, swipe to navigate when not
  let pinchDist = 0, pinchScale = 1, swipeX = 0;
  const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  stage.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) { pinchDist = dist(e.touches); pinchScale = scale; }
    else if (e.touches.length === 1) {
      swipeX = e.touches[0].clientX;
      if (scale > 1) { dragging = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY; spx = panX; spy = panY; }
    }
  }, { passive: true });
  stage.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      scale = Math.min(Math.max(pinchScale * (dist(e.touches) / pinchDist), 1), 5);
      if (scale === 1) { panX = 0; panY = 0; }
      img.classList.toggle('is-zoomed', scale > 1);
      apply();
    } else if (dragging && e.touches.length === 1) {
      panX = spx + (e.touches[0].clientX - sx) / scale;
      panY = spy + (e.touches[0].clientY - sy) / scale;
      apply();
    }
  }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    const wasDragging = dragging;
    dragging = false;
    if (scale > 1 || wasDragging) return;
    const dx = swipeX - (e.changedTouches[0]?.clientX ?? swipeX);
    if (Math.abs(dx) > 60) show(current + (dx > 0 ? 1 : -1));
  });
}
