// Generates gallery filters + tiles (gallery.html) and the featured project
// cards (index.html) from tools/gallery-data.json + src/assets/img/manifest.json.
// Only the regions between <!-- gen:NAME --> and <!-- /gen:NAME --> are replaced.
// Usage: npm run images && node tools/gen-gallery.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const data = JSON.parse(readFileSync('tools/gallery-data.json', 'utf8'));
const manifest = JSON.parse(readFileSync('src/assets/img/manifest.json', 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const A = 'src/assets/img/';

function picture(name, sizes, alt, { lazy = true, cls = '' } = {}) {
  const m = manifest[name];
  if (!m) throw new Error(`No optimized image for ${name} — run npm run images`);
  const set = (f) => m.widths.map((w) => `${A}${name}-${w}.${f} ${w}w`).join(', ');
  const fallbackW = m.widths.includes(800) ? 800 : m.widths[m.widths.length - 1];
  const ratio = m.width / m.height;
  const h = Math.round(m.widths.at(-1) / ratio);
  return `<picture${cls ? ` class="${cls}"` : ''}>
                <source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">
                <source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">
                <img src="${A}${name}-${fallbackW}.${m.formats[2]}" width="${m.widths.at(-1)}" height="${h}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ''} decoding="async">
              </picture>`;
}

const replace = (html, name, body) => {
  const re = new RegExp(`(<!-- gen:${name} -->)[\\s\\S]*?(\\s*<!-- /gen:${name} -->)`);
  if (!re.test(html)) throw new Error(`marker gen:${name} missing`);
  return html.replace(re, `$1\n${body}$2`);
};

/* ---------------- gallery ---------------- */
const items = [];
for (const p of data.projects) {
  const list = [
    ...p.images.map((f, i) => ({ name: `w-${p.key}-${f.split('.')[0]}`, title: `${p.title} — ${String(i + 1).padStart(2, '0')}` })),
    ...(p.legacy || []).map(([name, title]) => ({ name, title })),
  ];
  list.forEach((it, i) => items.push({ ...it, p, first: i === 0 }));
}
let tiles = '';
items.forEach((it, i) => {
  const size = i % 9 === 0 ? 'wide' : i % 9 === 5 ? 'tall' : '';
  const sizes = size === 'wide' ? '(min-width: 900px) 50vw, 100vw' : '(min-width: 900px) 25vw, 50vw';
  tiles += `          <li class="tile${size ? ` tile--${size}` : ''}"${it.first ? ` id="${it.p.key}"` : ''} data-group="${it.p.key}" data-name="${it.name}" data-category="${esc(it.p.category)}" data-title="${esc(it.title)}">
            <button class="tile__btn" type="button" aria-label="View ${esc(it.title)} (${esc(it.p.category)})">
              ${picture(it.name, sizes, it.title)}
              <span class="tile__overlay" aria-hidden="true"><span class="tile__cat">${esc(it.p.category)}</span><span class="tile__title">${esc(it.p.client)}</span></span>
            </button>
          </li>\n`;
});
const filters = ['        <button class="filter" type="button" data-filter="all" aria-pressed="true">All <span class="filter__n">' + items.length + '</span></button>']
  .concat(data.projects.map((p) => {
    const n = items.filter((it) => it.p.key === p.key).length;
    return `        <button class="filter" type="button" data-filter="${p.key}" aria-pressed="false">${esc(p.label)} <span class="filter__n">${n}</span></button>`;
  })).join('\n');

let gallery = readFileSync('gallery.html', 'utf8');
gallery = replace(gallery, 'filters', filters);
gallery = replace(gallery, 'tiles', tiles.trimEnd());
writeFileSync('gallery.html', gallery);

/* ---------------- home featured cards ---------------- */
const featured = data.projects.filter((p) => p.featured);
const cards = featured.map((p, i) => {
  const count = p.images.length + (p.legacy || []).length;
  return `          <li class="work-card">
            <a class="work-card__link" href="gallery.html#${p.key}">
              ${picture(`w-${p.key}-cover`, '(min-width: 900px) 30vw, 92vw', `${p.title} — project cover`, { cls: 'work-card__media' })}
              <span class="work-card__meta">
                <span class="work-card__num">${String(i + 1).padStart(2, '0')}</span>
                <span class="work-card__title">${esc(p.title.split(' — ')[0])}</span>
                <span class="work-card__cat">${esc(p.category)} · ${esc(p.client)}</span>
                <span class="work-card__count">${count} designs</span>
                <svg class="work-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M8 7h9v9"/></svg>
              </span>
            </a>
          </li>`;
}).join('\n');
let index = readFileSync('index.html', 'utf8');
index = replace(index, 'work-cards', cards);
index = index.replace(/View all work(<svg| *\n)/, `View all ${data.projects.length} projects$1`);
writeFileSync('index.html', index);

console.log(`gallery: ${items.length} tiles, ${data.projects.length} filters · home: ${featured.length} featured cards`);
