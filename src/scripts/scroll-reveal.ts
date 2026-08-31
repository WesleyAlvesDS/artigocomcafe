/**
 * Scroll reveal — IntersectionObserver-based reveal animations.
 * Handles [data-reveal] elements with reduced-motion fallback.
 */
export function initScrollReveal() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('revealed');
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
  );

  function revealAll() {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('revealed'));
  }

  function initReveal() {
    if (prefersReducedMotion) {
      revealAll();
      return;
    }
    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
    const main = document.getElementById('main-content');
    if (main && !main.hasAttribute('tabindex')) {
      main.setAttribute('tabindex', '-1');
    }
  }

  document.addEventListener('astro:page-load', initReveal);

  // Safety net for SPA navigation: after page swap, reveal visible elements
  // immediately to cover observer races (layout settling, fonts/images).
  document.addEventListener('astro:page-load', () => {
    setTimeout(() => {
      document.querySelectorAll('[data-reveal]').forEach((el) => {
        if (el.classList.contains('revealed')) return;
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('revealed');
      });
    }, 350);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal);
  } else {
    initReveal();
  }

  window.addEventListener('load', () => {
    setTimeout(revealAll, 2500);
  });
}
