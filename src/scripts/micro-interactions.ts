/**
 * Micro-interactions: spotlight, tilt 3D, magnetic buttons.
 * Only activates on pointer: fine devices with motion preference.
 */
export function initMicroInteractions() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const isPointerFine = window.matchMedia('(pointer: fine)').matches;
  if (!isPointerFine) return;

  let ticking = false;

  // Spotlight: follows mouse inside each card marked with .spotlight-card
  function initSpotlight(root: ParentNode) {
    root.querySelectorAll<HTMLElement>('.spotlight-card').forEach((card) => {
      if (card.dataset.mxSpotlight === '1') return;
      card.dataset.mxSpotlight = '1';
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--spot-x', x + '%');
        card.style.setProperty('--spot-y', y + '%');
      });
    });
  }

  // Tilt 3D: subtle perspective rotation on hover
  function initTilt(root: ParentNode) {
    root.querySelectorAll<HTMLElement>('.tilt-card').forEach((card) => {
      if (card.dataset.mxTilt === '1') return;
      card.dataset.mxTilt = '1';
      card.addEventListener('pointermove', (e) => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width;
          const py = (e.clientY - rect.top) / rect.height;
          const rx = (0.5 - py) * 7;
          const ry = (px - 0.5) * 9;
          card.style.transform =
            'perspective(900px) rotateX(' +
            rx.toFixed(2) +
            'deg) rotateY(' +
            ry.toFixed(2) +
            'deg) translateY(-2px)';
          ticking = false;
        });
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  // Magnetic: elements attract toward cursor (with smooth return)
  function initMagnetic(root: ParentNode) {
    root.querySelectorAll<HTMLElement>('.magnetic').forEach((el) => {
      if (el.dataset.mxMagnetic === '1') return;
      el.dataset.mxMagnetic = '1';
      el.addEventListener('pointermove', (e) => {
        const rect = el.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const strength = el.dataset.magneticStrength
          ? parseFloat(el.dataset.magneticStrength)
          : 0.28;
        el.style.transform =
          'translate(' + (dx * strength).toFixed(1) + 'px, ' + (dy * strength).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', () => {
        el.style.transform = '';
      });
    });
  }

  function initAll() {
    initSpotlight(document);
    initTilt(document);
    initMagnetic(document);
  }

  document.addEventListener('astro:page-load', initAll);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
}
