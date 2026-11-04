# Launch checklist — Badr Masoud: Controlled Chaos

The redesign lives on the `redesign` branch. The live site keeps serving `main`
(published from the branch, unbuilt) until every step below is done.

> ⚠️ Order matters. The new `index.html` needs the Vite build. If `main` is
> merged while Pages still serves the raw branch, the live site will load
> without styles. Switch the Pages source **first**.

## 0. Before launch (local)

- [ ] `npm ci && npm run build` succeeds
- [ ] `npm run preview` → check http://localhost:4173/Portfolio-/ and `/gallery.html` on a real phone and desktop browser (animations, menu, lightbox, form)
- [ ] Send one test message through the contact form (FormSubmit may ask to confirm the address on the first submission from a new page)

Last audit (Lighthouse 12, local build):

| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| Home — mobile | 95 | 100 | 100 | 100 |
| Home — desktop | 100 | 100 | 100 | 100 |
| Gallery — mobile | 98 | 100 | 100 | 100 |

## 1. Push the branch (no effect on the live site)

```bash
git push -u origin redesign
```

## 2. Switch GitHub Pages to Actions

GitHub → repository **Portfolio-** → **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The currently published site stays online until the next deployment.

## 3. Merge and deploy

Merge `redesign` into `main` (pull request recommended). The **Deploy to GitHub Pages**
workflow (`.github/workflows/deploy.yml`) builds and publishes `dist/`.
Watch it under the repository's **Actions** tab (≈1–2 min).

## 4. After deploy

- [ ] https://badrmasoudmoh-max.github.io/Portfolio-/ loads the new design
- [ ] `gallery.html#bstudy`, `#mawhiba`, `#training` deep links filter correctly
- [ ] Link preview: paste the URL into WhatsApp / LinkedIn Post Inspector → shows `og-image.jpg`
- [ ] Optional: submit `https://badrmasoudmoh-max.github.io/Portfolio-/sitemap.xml` in Google Search Console
      (a project site's `robots.txt` is not read by crawlers; only the user-site root one is)

## Rollback

Any of these restores the old site within minutes:

1. **Fastest:** Settings → Pages → Source: **Deploy from a branch** → `main` / root, after reverting the merge commit:
   ```bash
   git revert -m 1 <merge-commit-sha>
   git push
   ```
2. Or re-run the last good deployment from the Actions tab.

The previous site is also preserved in git history at commit `2303b65`.

## Maintenance notes

- New project / Behance work: copy originals to `images/work/<key>/`, add the project to `tools/gallery-data.json`, then run `npm run images` and `npm run gallery` (regenerates the gallery tiles, filters and the home featured cards).
- Characters: originals in `images/characters/`, then `npm run images`.
- Social card / favicon: edit `tools/og.html` / `tools/icon.html`, run `npm run dev`, then `node tools/render-og.mjs`.
- Dev-only pages (not deployed): `styleguide.html`, `tools/*.html`.
- Unused after launch (kept until removal is approved): `css/style.css`, `css/gallery.css`, `js/script.js`, `js/gallery.js`.
