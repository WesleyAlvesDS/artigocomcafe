/**
 * Theme initialization — runs as early as possible to prevent FOUC.
 * Must be the first script executed in <body>.
 */
export function initTheme() {
  const theme = localStorage.getItem('theme');
  if (theme === 'light') {
    document.documentElement.classList.add('light');
  } else if (theme === 'dark' || !window.matchMedia('(prefers-color-scheme: light)').matches) {
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
  }
}
