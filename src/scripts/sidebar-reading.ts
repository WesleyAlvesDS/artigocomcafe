/**
 * Smart Sidebar — Reading progress ring + TOC scroll spy.
 * Extracted from SmartSidebar.astro inline script.
 */
export function initReadingProgress() {
  const progressCircle = document.querySelector<SVGCircleElement>('.progress-ring-circle');
  const progressText = document.getElementById('reading-progress-text');
  const radius = 16;
  const circumference = 2 * Math.PI * radius;

  if (progressCircle) {
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = `${circumference}`;
  }

  function update() {
    const article = document.querySelector<HTMLElement>('.article-content, .recipe-main');
    if (!article) return;

    const rect = article.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const articleHeight = rect.height;
    const scrolled = -rect.top + viewportHeight * 0.15;
    const progress = Math.max(0, Math.min(1, scrolled / (articleHeight - viewportHeight * 0.3)));

    if (progressCircle) {
      const offset = circumference * (1 - progress);
      progressCircle.style.strokeDashoffset = `${offset}`;
    }
    if (progressText) {
      progressText.textContent = `${Math.round(progress * 100)}%`;
    }
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

export function initScrollSpy() {
  const tocLinks = document.querySelectorAll<HTMLAnchorElement>('.toc-link');
  const headings = document.querySelectorAll('.article-content h2, .article-content h3, .recipe-main h2');

  if (!tocLinks.length || !headings.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = (entry.target as HTMLElement).id;
          tocLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { rootMargin: '-100px 0px -66% 0px', threshold: 0 },
  );

  headings.forEach((h) => observer.observe(h));
}
