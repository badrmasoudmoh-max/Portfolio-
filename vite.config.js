import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Static multi-page site. `base` matches the GitHub Pages project path
// (https://badrmasoudmoh-max.github.io/Portfolio-/) so built asset URLs resolve there.
export default defineConfig({
  base: '/Portfolio-/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        gallery: resolve(import.meta.dirname, 'gallery.html'),
      },
    },
  },
});
