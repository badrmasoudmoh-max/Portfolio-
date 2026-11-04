// Generates responsive AVIF / WebP / JPEG variants of the original images.
// Originals in /images are never modified. Output goes to src/assets/img/
// plus a manifest (src/assets/img/manifest.json) used when building <picture> markup.
//
// Usage: npm run images
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { extname, basename, join } from 'node:path';
import sharp from 'sharp';

const SRC = 'images';
const OUT = 'src/assets/img';
const WIDTHS = [480, 800, 1200, 1600];

await mkdir(OUT, { recursive: true });
// Top-level project images plus character artwork in images/characters/.
const isImg = (f) => /\.(jpe?g|png)$/i.test(f);
const files = [
  ...(await readdir(SRC)).filter(isImg),
  ...(await readdir(join(SRC, 'characters')).catch(() => [])).filter(isImg).map((f) => `characters/${f}`),
];
const manifest = {};

for (const file of files) {
  const name = basename(file, extname(file));
  const input = sharp(join(SRC, file));
  const { width, height, hasAlpha } = await input.metadata();
  const widths = [...new Set(WIDTHS.filter((w) => w < width).concat(Math.min(width, 1600)))].sort((a, b) => a - b);
  const entry = { width, height, alpha: !!hasAlpha, widths, formats: ['avif', 'webp', hasAlpha ? 'png' : 'jpg'] };

  for (const w of widths) {
    const base = sharp(join(SRC, file)).rotate().resize({ width: w, withoutEnlargement: true });
    await base.clone().avif({ quality: 55, effort: 5 }).toFile(join(OUT, `${name}-${w}.avif`));
    await base.clone().webp({ quality: 78 }).toFile(join(OUT, `${name}-${w}.webp`));
    if (hasAlpha) await base.clone().png({ compressionLevel: 9, palette: true }).toFile(join(OUT, `${name}-${w}.png`));
    else await base.clone().jpeg({ quality: 80, mozjpeg: true, progressive: true }).toFile(join(OUT, `${name}-${w}.jpg`));
  }
  manifest[name] = entry;
  console.log(`${file.padEnd(16)} ${width}x${height} -> ${widths.join(', ')}`);
}

await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`\n${files.length} images processed -> ${OUT}`);
