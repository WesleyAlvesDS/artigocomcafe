/**
 * Swipe navigation — touch swipe to go back/forward in history (like native apps).
 * Only on touch devices; ignores gestures starting in interactive elements or scrollable grids.
 */
export function initSwipeNav() {
  if (!('ontouchstart' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let startX = 0;
  let startY = 0;
  let tracking = false;

  document.addEventListener(
    'touchstart',
    (e) => {
      const t = e.target as HTMLElement;
      if (t && t.closest) {
        if (
          t.closest(
            'a, button, input, select, textarea, [role="button"], .recipes-grid, .books-grid, .carousel, [data-no-swipe]',
          )
        )
          return;
      }
      tracking = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    },
    { passive: true },
  );

  document.addEventListener(
    'touchmove',
    (e) => {
      if (!tracking) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      // Predominantly vertical gesture = normal scroll: cancel swipe
      if (Math.abs(dy) > 20 && Math.abs(dy) > Math.abs(dx) * 1.5) tracking = false;
    },
    { passive: true },
  );

  document.addEventListener(
    'touchend',
    (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx > 0) {
        // Swipe right → go back (like Android native gesture)
        if (window.history.length > 1) history.back();
      } else {
        // Swipe left → go forward
        history.forward();
      }
    },
    { passive: true },
  );
}
