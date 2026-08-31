/**
 * Scroll progress bar — updates the width of #scroll-progress based on scroll position.
 */
export function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;

  function update() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.pageYOffset / max) * 100 : 0;
    bar.style.width = pct + '%';
    ticking = false;
  }

  function request() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  update();
}
