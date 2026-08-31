/**
 * Smart Sidebar — Font controls, reading themes, copy link, share.
 * Extracted from SmartSidebar.astro inline script.
 */
export function initFontControls() {
  const fontDecrease = document.getElementById('font-decrease');
  const fontIncrease = document.getElementById('font-increase');
  const articleContent = document.querySelector<HTMLElement>('.article-content, .recipe-main');

  function setFontSize(size: string) {
    if (articleContent) {
      articleContent.style.fontSize = size === 'small' ? '0.9rem' : size === 'large' ? '1.15rem' : '1rem';
    }
    [fontDecrease, fontIncrease].forEach((b) => b?.classList.remove('active'));
    if (size === 'small') fontDecrease?.classList.add('active');
    else if (size === 'large') fontIncrease?.classList.add('active');
    localStorage.setItem('article-font-size', size);
  }

  fontDecrease?.addEventListener('click', () => setFontSize('small'));
  fontIncrease?.addEventListener('click', () => setFontSize('large'));

  // Restore saved font size
  const saved = localStorage.getItem('article-font-size');
  if (saved && articleContent) {
    setFontSize(saved);
  }
}

export function initReadingThemes() {
  const themeButtons = document.querySelectorAll<HTMLElement>('[data-reading-theme]');
  const readingTarget = document.querySelector('.article-content, .recipe-main');

  function applyReadingTheme(theme: string) {
    document.body.classList.remove('reading-serif', 'reading-sepia');
    if (theme === 'serif') document.body.classList.add('reading-serif');
    if (theme === 'sepia') document.body.classList.add('reading-sepia');
    themeButtons.forEach((b) => {
      const active = b.dataset.readingTheme === theme;
      b.classList.toggle('active', active);
      b.setAttribute('aria-checked', active ? 'true' : 'false');
    });
    localStorage.setItem('article-reading-theme', theme);
  }

  themeButtons.forEach((btn) => {
    btn.addEventListener('click', () => applyReadingTheme(btn.dataset.readingTheme || 'default'));
  });

  const savedTheme = localStorage.getItem('article-reading-theme');
  if (savedTheme && readingTarget) {
    applyReadingTheme(savedTheme);
  }
}

export function initCopyLink() {
  const copyLinkBtn = document.getElementById('copy-link');
  if (!copyLinkBtn) return;

  copyLinkBtn.addEventListener('click', async () => {
    const url = copyLinkBtn.getAttribute('data-url') || window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      copyLinkBtn.classList.add('copied');
      copyLinkBtn.setAttribute('aria-label', 'Link copiado!');
      const span = copyLinkBtn.querySelector('span');
      if (span) span.textContent = 'Copiado!';
      setTimeout(() => {
        copyLinkBtn.classList.remove('copied');
        copyLinkBtn.setAttribute('aria-label', 'Copiar link');
        if (span) span.textContent = 'Copiar link';
      }, 2000);
    } catch {
      // Clipboard API not available
    }
  });
}

export function initShareButton() {
  const shareBtn = document.getElementById('share-native');
  if (!shareBtn) return;

  if (navigator.share) {
    shareBtn.style.display = 'flex';
    shareBtn.addEventListener('click', async () => {
      const title = document.querySelector('h1')?.textContent || document.title;
      try {
        await navigator.share({ title, url: window.location.href });
      } catch {
        // User cancelled
      }
    });
  } else {
    shareBtn.style.display = 'none';
  }
}

export function initReadingTime() {
  const readingTimeEl = document.getElementById('reading-time-estimate');
  const articleContent = document.querySelector<HTMLElement>('.article-content, .recipe-main');

  if (readingTimeEl && articleContent) {
    const text = articleContent.textContent || '';
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    readingTimeEl.textContent = `${minutes} min`;
  }
}

export function initLazyRelated() {
  const relatedContent = document.getElementById('related-content');
  if (!relatedContent) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          relatedContent.dispatchEvent(new CustomEvent('load-related'));
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '200px', threshold: 0.01 },
  );
  observer.observe(relatedContent);
}
