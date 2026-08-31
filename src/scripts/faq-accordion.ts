/**
 * FAQ accordion — handles [data-faq-list] toggle interactions.
 * Resilient to SPA navigation (re-executes on astro:page-load).
 */
export function initFaqAccordion() {
  function bind() {
    const list = document.querySelector('[data-faq-list]') as HTMLElement | null;
    if (!list || list.dataset.bound === '1') return;
    list.dataset.bound = '1';

    list.querySelectorAll('[data-faq-item]').forEach((item) => {
      const q = item.querySelector('.faq-question') as HTMLElement | null;
      const a = item.querySelector('.faq-answer') as HTMLElement | null;
      if (!q || !a) return;

      q.addEventListener('click', () => {
        const open = a.hidden === false;
        // Close others (accordion behavior)
        list.querySelectorAll('[data-faq-item]').forEach((other) => {
          if (other !== item) {
            const oa = other.querySelector('.faq-answer') as HTMLElement | null;
            const oq = other.querySelector('.faq-question') as HTMLElement | null;
            if (oa) oa.hidden = true;
            if (oq) oq.setAttribute('aria-expanded', 'false');
          }
        });
        a.hidden = open;
        q.setAttribute('aria-expanded', String(!open));
      });
    });
  }

  document.addEventListener('astro:page-load', bind);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
}
