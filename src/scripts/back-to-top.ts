/**
 * Back-to-top button with reading progress ring.
 * Uses delegation to survive SPA navigation (button re-created on swap).
 */
export function initBackToTop() {
  const CIRC = 2 * Math.PI * 20;
  let ticking = false;

  function update() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    const ring = btn.querySelector<SVGCircleElement>('.btt-ring-fg');
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.pageYOffset / max) * 100 : 0;
    btn.classList.toggle('visible', window.pageYOffset > 480);
    if (ring) ring.style.strokeDashoffset = String(CIRC * (1 - pct));
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

  // Event delegation: survives SPA navigation (button re-created on swap)
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target && target.closest && target.closest('#back-to-top')) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    }
  });

  update();
}
