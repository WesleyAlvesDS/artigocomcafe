/**
 * Dashboard navigation — shows/hides sections based on URL hash.
 * Handles hashchange, astro:page-load, and initial DOMContentLoaded.
 */
export function initDashboardNav() {
  function navigateToSection() {
    const hash = window.location.hash.slice(1) || 'home';
    const sections = document.querySelectorAll('[data-dash-section]');
    sections.forEach((section) => {
      (section as HTMLElement).hidden =
        section.getAttribute('data-dash-section') !== hash;
    });
  }

  window.addEventListener('hashchange', navigateToSection);
  window.addEventListener('astro:page-load', navigateToSection);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', navigateToSection);
  } else {
    navigateToSection();
  }
}
