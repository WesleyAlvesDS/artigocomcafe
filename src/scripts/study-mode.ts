/**
 * Study mode — toggles a focused reading mode on article pages.
 * Persists preference in localStorage, handles SPA navigation.
 */
export function initStudyMode() {
  const KEY = 'acf-study-mode';

  function apply() {
    let on = false;
    try {
      on = localStorage.getItem(KEY) === '1';
    } catch (_) {}
    document.body.classList.toggle('study-mode', on);

    const btn = document.getElementById('study-mode-toggle');
    if (!btn) return;
    btn.setAttribute('aria-pressed', String(on));
    const label = btn.querySelector('.study-mode-label');
    if (label) label.textContent = on ? 'Sair do modo estudo' : 'Modo Estudo';
  }

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target?.closest?.('#study-mode-toggle')) return;
    const on = !document.body.classList.contains('study-mode');
    document.body.classList.toggle('study-mode', on);
    try {
      localStorage.setItem(KEY, on ? '1' : '0');
    } catch (_) {}
    apply();
  });

  document.addEventListener('astro:page-load', apply);
  apply();
}
