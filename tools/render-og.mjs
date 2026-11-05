// Renders tools/og.html and tools/icon.html with headless Chrome (dev server
// must be running on :5173) and writes the social card + favicon set to public/.
// Usage: npm run dev   (in another terminal)  then  node tools/render-og.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173/Portfolio-/tools';
const tmp = join(tmpdir(), 'bm-og');
mkdirSync(tmp, { recursive: true });
mkdirSync('public', { recursive: true });

const shot = (page, w, h, out, transparent = false) => {
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${w},${h}`, '--virtual-time-budget=4000',
    ...(transparent ? ['--default-background-color=00000000'] : []),
    `--screenshot=${out}`, `${BASE}/${page}`,
  ], { stdio: 'ignore' });
};

const og = join(tmp, 'og.png');
shot('og.html', 1200, 630, og);
await sharp(og).jpeg({ quality: 86, mozjpeg: true }).toFile('public/og-image.jpg');

const icon = join(tmp, 'icon.png');
shot('icon.html', 512, 512, icon, true);
await sharp(icon).png().toFile('public/icon-512.png');
await sharp(icon).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(icon).resize(32, 32).png().toFile('public/favicon-32.png');

rmSync(tmp, { recursive: true, force: true });
console.log('Wrote public/og-image.jpg, icon-512.png, apple-touch-icon.png, favicon-32.png');
