import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://artigocomcafe.com',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: 'esbuild',
      rollupOptions: {
        cache: false
      }
    },
    cacheDir: '.vite-cache',
    clearScreen: false
  },
  build: {
    inlineStylesheets: 'auto',
    assets: '_astro',
    format: 'directory'
  },
  compressHTML: true,
  scopedStyleStrategy: 'where'
});
