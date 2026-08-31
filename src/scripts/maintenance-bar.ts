/**
 * Maintenance bar — dynamically adjusts TopBar and body padding
 * when the maintenance banner is visible.
 * Runs on DOMContentLoaded, astro:page-load, astro:after-swap, and resize.
 */
export function initMaintenanceBar() {
  function adjust() {
    const bar = document.querySelector(
      '[data-maintenance-bar]',
    ) as HTMLElement | null;
    const topbar = document.querySelector('.topbar') as HTMLElement | null;
    const leftSidebar = document.querySelector(
      '.sidebar-left',
    ) as HTMLElement | null;

    if (!bar) return;

    const h = bar.offsetHeight;

    // Push TopBar down below the maintenance bar
    if (topbar) {
      topbar.style.top = `${h}px`;
    }

    // Push LeftSidebar down below the maintenance bar
    if (leftSidebar) {
      leftSidebar.style.top = `${h}px`;
    }

    // Adjust body padding to account for maintenance bar + topbar
    const topbarHeight = topbar
      ? parseInt(getComputedStyle(topbar).height) || 56
      : 56;
    document.documentElement.style.setProperty(
      '--maintenance-bar-h',
      `${h}px`,
    );
    document.body.style.paddingTop = `${h + topbarHeight}px`;
  }

  function run() {
    adjust();
    requestAnimationFrame(adjust);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  document.addEventListener('astro:page-load', adjust);
  document.addEventListener('astro:after-swap', adjust);
  window.addEventListener('resize', adjust);
}
