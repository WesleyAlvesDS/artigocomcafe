/**
 * Image lightbox — click-to-zoom for article and recipe images.
 * Creates a modal overlay with the full-size image.
 */
export function initLightbox() {
  let lightbox: HTMLDivElement | null = null;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function makeLightbox() {
    // In SPA navigation, the previous overlay may have been removed from DOM;
    // recreate if reference is disconnected.
    if (lightbox && lightbox.isConnected) return;
    if (lightbox) lightbox.remove();

    lightbox = document.createElement('div');
    lightbox.className = 'img-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Imagem ampliada');
    lightbox.innerHTML =
      '<button type="button" class="img-lightbox-close" aria-label="Fechar imagem">✕</button>';
    document.body.appendChild(lightbox);
    lightbox.addEventListener('click', close);
    lightbox.querySelector('.img-lightbox-close')!.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
    });
  }

  function open(src: string, alt: string) {
    makeLightbox();
    const existingImg = lightbox!.querySelector('img');
    if (existingImg) existingImg.remove();

    const img = document.createElement('img');
    img.src = src;
    img.alt = alt || '';
    img.loading = 'eager';
    lightbox!.appendChild(img);
    lightbox!.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function initImages() {
    document
      .querySelectorAll<HTMLImageElement>('.article-content img, .recipe-description img')
      .forEach((img) => {
        if (img.classList.contains('zoomable')) return;
        if (!img.src) return;
        img.classList.add('zoomable');
        img.setAttribute('title', 'Clique para ampliar');
        img.addEventListener('click', () => {
          open(img.src, img.alt || '');
        });
      });
  }

  document.addEventListener('astro:page-load', initImages);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImages);
  } else {
    initImages();
  }
}
