// Offline build: a copy of the site that works by double-clicking index.html
// (file://). Browsers block ES-module scripts on file://, so each page is built
// on its own as a classic IIFE bundle with relative URLs, into dist-offline/.
// Usage: node tools/build-offline.mjs
import { build } from 'vite';
import { resolve } from 'node:path';
import fs from 'node:fs';

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'dist-offline');
const pages = ['index.html', 'gallery.html'];

fs.rmSync(out, { recursive: true, force: true });
for (const [i, page] of pages.entries()) {
  await build({
    root,
    configFile: false,
    base: './',
    logLevel: 'warn',
    build: {
      outDir: out,
      emptyOutDir: false,
      copyPublicDir: i === 0,
      modulePreload: false,
      cssCodeSplit: false,
      rollupOptions: {
        input: resolve(root, page),
        output: { format: 'iife' },
      },
    },
  });
}

// Module scripts → classic deferred scripts; drop crossorigin (breaks file:// loads).
for (const page of pages) {
  const f = resolve(out, page);
  let html = fs.readFileSync(f, 'utf8');
  html = html.replace(/<script type="module" crossorigin src=/g, '<script defer src=')
    .replace(/<script type="module" src=/g, '<script defer src=')
    .replace(/ crossorigin(?=[\s>])/g, '');
  fs.writeFileSync(f, html);
}
const left = pages.flatMap((p) => fs.readFileSync(resolve(out, p), 'utf8').match(/type="module"/g) || []);
console.log(`offline build → dist-offline (${left.length} module scripts left)`);
