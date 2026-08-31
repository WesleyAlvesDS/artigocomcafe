/**
 * Scroll animations — stagger, counter, typewriter, and parallax effects.
 * Uses IntersectionObserver for performance. Handles SPA navigation.
 * Note: data-reveal is handled separately by scroll-reveal.ts.
 */
export function initScrollAnimations() {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  function revealAllOnce() {
    if (prefersReducedMotion) {
      document.querySelectorAll('[data-scroll-reveal]').forEach((el) => {
        el.classList.add('scroll-revealed');
      });
      document
        .querySelectorAll('[data-stagger] > [data-stagger-item]')
        .forEach((item) => {
          item.classList.add('stagger-revealed');
        });
      document.querySelectorAll('[data-counter]').forEach((el) => {
        const target = parseInt(
          (el as HTMLElement).dataset.counterTarget || '0',
          10,
        );
        const isDecimal =
          (el as HTMLElement).dataset.counterDecimal === 'true';
        const decimals = parseInt(
          (el as HTMLElement).dataset.counterDecimals || '0',
          10,
        );
        el.textContent = isDecimal
          ? target.toFixed(decimals)
          : target.toLocaleString();
      });
      return;
    }
  }

  function init() {
    if (prefersReducedMotion) {
      revealAllOnce();
      return;
    }

    // Scroll reveal animations
    const scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = parseInt(
              (el as HTMLElement).dataset.scrollDelay || '0',
              10,
            );
            setTimeout(() => {
              el.classList.add('scroll-revealed');
            }, delay);
            scrollObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' },
    );

    document.querySelectorAll('[data-scroll-reveal]').forEach((el) => {
      if (!el.classList.contains('scroll-revealed')) scrollObserver.observe(el);
    });

    // Stagger animations
    const staggerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const container = entry.target as HTMLElement;
            const items = container.querySelectorAll('[data-stagger-item]');
            const baseDelay = parseInt(
              container.dataset.staggerDelay || '80',
              10,
            );
            const startDelay = parseInt(
              container.dataset.staggerStart || '0',
              10,
            );

            items.forEach((item, index) => {
              const delay = startDelay + index * baseDelay;
              setTimeout(() => {
                item.classList.add('stagger-revealed');
              }, delay);
            });

            staggerObserver.unobserve(container);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' },
    );

    document.querySelectorAll('[data-stagger]').forEach((el) => {
      if (!el.classList.contains('stagger-done')) {
        el.classList.add('stagger-done');
        staggerObserver.observe(el);
      }
    });

    // Counter animations
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const target = parseInt(el.dataset.counterTarget || '0', 10);
            const duration = parseInt(
              el.dataset.counterDuration || '2000',
              10,
            );
            const isDecimal = el.dataset.counterDecimal === 'true';
            const decimals = parseInt(el.dataset.counterDecimals || '0', 10);

            let startTime: number | null = null;
            const startValue = 0;

            function animateCounter(currentTime: number) {
              if (!startTime) startTime = currentTime;
              const progress = Math.min(
                (currentTime - startTime) / duration,
                1,
              );
              const eased = 1 - Math.pow(1 - progress, 3);
              const current = startValue + (target - startValue) * eased;

              if (isDecimal) {
                el.textContent = current.toFixed(decimals);
              } else {
                el.textContent = Math.floor(current).toLocaleString();
              }

              if (progress < 1) {
                requestAnimationFrame(animateCounter);
              } else {
                el.textContent = isDecimal
                  ? target.toFixed(decimals)
                  : target.toLocaleString();
              }
            }

            if (prefersReducedMotion) {
              el.textContent = isDecimal
                ? target.toFixed(decimals)
                : target.toLocaleString();
            } else {
              requestAnimationFrame(animateCounter);
            }

            counterObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5, rootMargin: '0px' },
    );

    document.querySelectorAll('[data-counter]').forEach((el) => {
      if ((el as HTMLElement).dataset.counterDone !== '1') {
        (el as HTMLElement).dataset.counterDone = '1';
        counterObserver.observe(el);
      }
    });

    // Typewriter effect
    const typewriterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const text = el.dataset.typewriterText || el.textContent || '';
            const speed = parseInt(el.dataset.typewriterSpeed || '30', 10);
            const delay = parseInt(el.dataset.typewriterDelay || '0', 10);

            el.textContent = '';
            el.style.borderRight = '2px solid var(--color-accent)';

            setTimeout(() => {
              let i = 0;
              function type() {
                if (i < text.length) {
                  el.textContent += text.charAt(i);
                  i++;
                  setTimeout(type, speed + Math.random() * 50);
                } else {
                  el.style.borderRight = 'none';
                  el.classList.add('typewriter-done');
                }
              }
              type();
            }, delay);

            typewriterObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 },
    );

    document.querySelectorAll('[data-typewriter]').forEach((el) => {
      if ((el as HTMLElement).dataset.typewriterDone !== '1') {
        (el as HTMLElement).dataset.typewriterDone = '1';
        typewriterObserver.observe(el);
      }
    });

    // Parallax elements — only [data-parallax-speed]
    const parallaxElements = document.querySelectorAll(
      '[data-parallax-speed]:not([data-hero-parallax])',
    );
    if (parallaxElements.length) {
      let ticking = false;
      function updateParallax() {
        const scrollY = window.pageYOffset;
        parallaxElements.forEach((el) => {
          const speed = parseFloat(
            (el as HTMLElement).dataset.parallaxSpeed || '0.3',
          );
          const offset = parseFloat(
            (el as HTMLElement).dataset.parallaxOffset || '0',
          );
          const y = scrollY * speed + offset;
          el.style.transform = `translate3d(0, ${y}px, 0)`;
        });
        ticking = false;
      }

      function requestTick() {
        if (!ticking) {
          requestAnimationFrame(updateParallax);
          ticking = true;
        }
      }

      window.addEventListener('scroll', requestTick, { passive: true });
      window.addEventListener('resize', requestTick, { passive: true });
      updateParallax();
    }
  }

  init();
  document.addEventListener('astro:page-load', init);

  // Safety net for SPA navigation: reveal visible elements after swap
  document.addEventListener('astro:page-load', () => {
    setTimeout(() => {
      document.querySelectorAll('[data-scroll-reveal]').forEach((el) => {
        if (el.classList.contains('scroll-revealed')) return;
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          const delay = parseInt(
            (el as HTMLElement).dataset.scrollDelay || '0',
            10,
          );
          setTimeout(() => el.classList.add('scroll-revealed'), delay);
        }
      });
      document.querySelectorAll('[data-stagger]').forEach((container) => {
        if (container.classList.contains('stagger-done')) return;
        const items = container.querySelectorAll('[data-stagger-item]');
        const baseDelay = parseInt(
          (container as HTMLElement).dataset.staggerDelay || '80',
          10,
        );
        const startDelay = parseInt(
          (container as HTMLElement).dataset.staggerStart || '0',
          10,
        );
        let any = false;
        items.forEach((item, index) => {
          if (item.classList.contains('stagger-revealed')) return;
          const r = item.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) {
            any = true;
            const delay = startDelay + index * baseDelay;
            setTimeout(
              () => item.classList.add('stagger-revealed'),
              delay,
            );
          }
        });
        if (any) container.classList.add('stagger-done');
      });
    }, 350);
  });
}
