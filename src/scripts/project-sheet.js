// Project sheet: clicking a featured project card opens a full-screen sheet
// (cover-to-images case view + Behance link) instead of leaving the page.
// Cards are normal links to gallery.html#<key>, so this is pure enhancement;
// modified clicks (new tab etc.) keep the link behaviour.
const webps = import.meta.glob('../assets/img/*-800.webp', { eager: true, query: '?url', import: 'default' });
const url800 = {};
for (const [path, url] of Object.entries(webps)) {
  const m = path.match(/\/([^/]+)-800\.webp$/);
  if (m) url800[m[1]] = url;
}

export function initProjectSheet() {
  const dataEl = document.getElementById('projects-data');
  const dialog = document.getElementById('project-sheet');
  if (!dataEl || !dialog || typeof dialog.showModal !== 'function') return;
  const projects = Object.fromEntries(JSON.parse(dataEl.textContent).map((p) => [p.key, p]));

  const $ = (id) => document.getElementById(id);
  const grid = $('ps-grid');
  let opener = null;

  const open = (key, link) => {
    const p = projects[key];
    if (!p) return false;
    opener = link;
    $('ps-num').textContent = `${p.num} / Project`;
    $('ps-title').textContent = p.title;
    $('ps-meta').textContent = `${p.category} · ${p.client} · ${p.images.length} designs`;
    const be = $('ps-behance');
    be.hidden = !p.behance;
    if (p.behance) be.href = p.behance;
    $('ps-gallery').href = `gallery.html#${p.key}`;
    grid.replaceChildren(...p.images.filter((n) => url800[n]).map((n, i) => {
      const li = document.createElement('li');
      const img = document.createElement('img');
      img.src = url800[n];
      img.alt = `${p.title} — design ${String(i + 1).padStart(2, '0')}`;
      img.loading = i < 4 ? 'eager' : 'lazy';
      img.decoding = 'async';
      li.append(img);
      return li;
    }));
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.classList.add('sheet-open');
    return true;
  };

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-project]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (open(link.dataset.project, link)) e.preventDefault();
  });

  $('ps-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('sheet-open');
    opener?.focus();
  });
}
