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
      // Try to disable Rolldown caching
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
  redirects: {
    '/jornada': '/dashboard#/jornada',
    '/missoes': '/dashboard#/missoes',
    '/trilhas': '/dashboard#/trilhas',
    '/conquistas': '/dashboard#/conquistas',
    '/biblioteca': '/dashboard#/biblioteca',
    '/mapa': '/dashboard#/mapa',
    '/graos': '/dashboard#/graos',
    '/torrefacao': '/dashboard#/torrefacao',
    '/perfil': '/dashboard#/perfil',
  },
  compressHTML: true,
  scopedStyleStrategy: 'where'
});
