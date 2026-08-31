/**
 * PWA — service worker registration, install prompt, and SPA navigation fixes.
 */
export function initPwa() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }

  // Capture install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as any).__deferredPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa-install-ready'));
  });

  // Clear prompt after install
  window.addEventListener('appinstalled', () => {
    (window as any).__deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });

  // Ensure main-content has tabindex after SPA swap
  document.addEventListener('astro:after-swap', () => {
    const main = document.getElementById('main-content');
    if (main && !main.hasAttribute('tabindex')) {
      main.setAttribute('tabindex', '-1');
    }
  });
}
