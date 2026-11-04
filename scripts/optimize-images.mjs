// Generates responsive AVIF / WebP / JPEG variants of the original images.
// Originals in /images are never modified. Output goes to src/assets/img/
// plus a manifest (src/assets/img/manifest.json) used when building <picture> markup.
//
// Usage: npm run images
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { extname, basename, join } from 'node:path';
import sharp from 'sharp';

const SRC = 'images';
const OUT = 'src/assets/img';
const WIDTHS = [480, 800, 1200, 1600];
const WORK_WIDTHS = [480, 800, 1200]; // gallery / project images

await mkdir(OUT, { recursive: true });
// Top-level images, character artwork (images/characters/) and project
// images (images/work/<project>/*, output as w-<project>-<file>-<width>).
const isImg = (f) => /\.(jpe?g|png)$/i.test(f);
const jobs = [
  ...(await readdir(SRC)).filter(isImg).map((f) => ({ file: f, name: basename(f, extname(f)) })),
  ...(await readdir(join(SRC, 'characters')).catch(() => [])).filter(isImg)
    .map((f) => ({ file: `characters/${f}`, name: basename(f, extname(f)) })),
];
for (const key of await readdir(join(SRC, 'work')).catch(() => [])) {
  for (const f of (await readdir(join(SRC, 'work', key))).filter(isImg)) {
    jobs.push({ file: `work/${key}/${f}`, name: `w-${key}-${basename(f, extname(f))}`, work: true });
  }
}
const manifest = {};

for (const { file, name, work } of jobs) {
  const input = sharp(join(SRC, file));
  const meta = await input.metadata();
  const { width, height } = meta;
  const hasAlpha = !work && meta.hasAlpha; // project images are always flattened to JPEG
  const max = work ? 1200 : 1600;
  const widths = [...new Set((work ? WORK_WIDTHS : WIDTHS).filter((w) => w < width).concat(Math.min(width, max)))].sort((a, b) => a - b);
  const entry = { width, height, alpha: !!hasAlpha, widths, formats: ['avif', 'webp', hasAlpha ? 'png' : 'jpg'] };
  manifest[name] = entry;

  // Skip unchanged sources (all outputs newer than the original).
  const srcTime = statSync(join(SRC, file)).mtimeMs;
  const outs = widths.flatMap((w) => entry.formats.map((f) => join(OUT, `${name}-${w}.${f}`)));
  if (outs.every((o) => existsSync(o) && statSync(o).mtimeMs >= srcTime)) continue;

  for (const w of widths) {
    let base = sharp(join(SRC, file)).rotate().resize({ width: w, withoutEnlargement: true });
    if (work) base = base.flatten({ background: '#151613' });
    await base.clone().avif({ quality: 55, effort: 5 }).toFile(join(OUT, `${name}-${w}.avif`));
    await base.clone().webp({ quality: 78 }).toFile(join(OUT, `${name}-${w}.webp`));
    if (hasAlpha) await base.clone().png({ compressionLevel: 9, palette: true }).toFile(join(OUT, `${name}-${w}.png`));
    else await base.clone().jpeg({ quality: 80, mozjpeg: true, progressive: true }).toFile(join(OUT, `${name}-${w}.jpg`));
  }
  console.log(`${file.padEnd(28)} ${width}x${height} -> ${widths.join(', ')}`);
}

await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`\n${jobs.length} images in manifest -> ${OUT}`);
