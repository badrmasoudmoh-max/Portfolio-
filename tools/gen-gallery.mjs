// Generates gallery filters + tiles (gallery.html), the home showcase of the
// strongest single designs, the project chips and the project-sheet data
// (index.html) from tools/gallery-data.json + src/assets/img/manifest.json.
// Only regions between <!-- gen:NAME --> and <!-- /gen:NAME --> are replaced.
// Usage: npm run images && npm run gallery
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


/* ---------------- home showcase (strongest single designs) ---------------- */
const byKey = Object.fromEntries(data.projects.map((p) => [p.key, p]));
const TILT = [0, 1, 0, -1, 0, 1, 0, -1, 0];
const shots = data.showcase.map(([key, file], i) => {
  const p = byKey[key];
  const tilt = TILT[i % TILT.length];
  const cls = tilt ? ` shot--tilt${tilt > 0 ? 'R' : 'L'}` : '';
  return `          <li class="shot${cls}">
            <a class="shot__link" href="gallery.html#${key}" data-project="${key}">
              ${picture(`w-${key}-${file}`, '(min-width: 1100px) 30vw, (min-width: 600px) 46vw, 92vw', `${p.title} — selected design`, { cls: 'shot__media', lazy: i > 2 })}
              <span class="shot__cap"><span class="shot__client">${esc(p.client)}</span><span class="shot__cat">${esc(p.category)}</span></span>
            </a>
          </li>`;
}).join('\n');

const withWork = data.projects.filter((p) => p.images.length + (p.legacy || []).length > 0);
const chips = withWork.map((p) => {
  const n = p.images.length + (p.legacy || []).length;
  return `            <li><a class="chip" href="gallery.html#${p.key}" data-project="${p.key}">${esc(p.label)} <span>${n}</span></a></li>`;
}).join('\n');

let index = readFileSync('index.html', 'utf8');
index = replace(index, 'showcase', shots);
index = replace(index, 'project-chips', chips);
index = index.replace(/View all (?:work|\d+ projects|\d+ designs)(<svg| *\n)/, `View all ${items.length} designs$1`);

// Data for the project sheet overlay (image *names*; JS resolves them to built URLs)
const sheet = withWork.map((p, i) => ({
  key: p.key,
  num: String(i + 1).padStart(2, '0'),
  title: p.title,
  client: p.client,
  category: p.category,
  behance: p.behance,
  images: [...p.images.map((f) => `w-${p.key}-${f.split('.')[0]}`), ...(p.legacy || []).map(([n]) => n)],
}));
const json = JSON.stringify(sheet).replace(/</g, '\\u003c');
index = replace(index, 'projects-data', `  <script type="application/json" id="projects-data">${json}</script>`);
writeFileSync('index.html', index);

console.log(`gallery: ${items.length} tiles, ${data.projects.length} filters · home: ${data.showcase.length} showcase designs, ${withWork.length} project chips`);
