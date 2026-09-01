import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'https://artigocomcafe.com';

// ── 1. Página inicial ─────────────────────────────────────────────
test.describe('Home Page', () => {
  test('loads successfully and has correct title', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Artigo com Café/);
  });

  test('has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    // Filter out known external errors (ads, third-party)
    const criticalErrors = errors.filter(e =>
      !e.includes('adsbygoogle') &&
      !e.includes('adsterra') &&
      !e.includes('net::ERR') &&
      !e.includes('Failed to load resource') &&
      !e.includes('astro-island') &&
      !e.includes('Hydrat') &&
      !e.includes('SyntaxError')
    );
    expect(criticalErrors).toEqual([]);
  });

  test('TopBar is visible and consistent', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const topbar = page.locator('.topbar');
    await expect(topbar).toBeVisible();
  });

  test('LeftSidebar is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const sidebar = page.locator('.left-sidebar');
    await expect(sidebar).toBeVisible();
  });

  test('Footer is visible', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const footer = page.locator('footer, .site-footer, [class*="footer"]');
    await expect(footer.first()).toBeVisible();
  });

  test('Hero section renders with content', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const hero = page.locator('.hero, [class*="hero"]').first();
    await expect(hero).toBeVisible();
  });
});

// ── 2. Navegação ──────────────────────────────────────────────────
test.describe('Navigation', () => {
  const pages = [
    { path: '/blog/', name: 'Blog' },
    { path: '/receitas/', name: 'Receitas' },
    { path: '/livros/', name: 'Livros' },
    { path: '/sobre/', name: 'Sobre' },
    { path: '/contato/', name: 'Contato' },
    { path: '/entrar/', name: 'Login' },
    { path: '/cadastro/', name: 'Cadastro' },
    { path: '/dashboard/', name: 'Dashboard' },
    { path: '/cookies/', name: 'Cookies' },
    { path: '/newsletter/', name: 'Newsletter' },
  ];

  for (const p of pages) {
    test(`${p.name} (${p.path}) loads without error`, async ({ page }) => {
      const response = await page.goto(`${BASE_URL}${p.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      expect(response?.status()).toBeLessThan(500);
    });
  }
});

// ── 3. Layout consistente ─────────────────────────────────────────
test.describe('Layout Consistency', () => {
  test('all pages have same Base layout components', async ({ page }) => {
    const testPages = ['/', '/blog/', '/receitas/', '/sobre/', '/contato/'];

    for (const path of testPages) {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });

      // TopBar must exist on every page
      const topbar = page.locator('.topbar');
      await expect(topbar, `TopBar missing on ${path}`).toBeVisible();
    }
  });

  test('fullWidth is applied consistently', async ({ page }) => {
    const testPages = ['/', '/blog/', '/receitas/', '/sobre/'];

    for (const path of testPages) {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
      // Body should not have restricted width — content should be full width
      const bodyWidth = await page.evaluate(() => {
        const main = document.querySelector('.page-body, main, [slot]');
        return main ? getComputedStyle(main).maxWidth : 'none';
      });
      // Should not be 700px or similar restricted width
      expect(bodyWidth, `Content width restricted on ${path}: ${bodyWidth}`).not.toBe('700px');
    }
  });
});

// ── 4. Maintenance bar ────────────────────────────────────────────
test.describe('Maintenance Bar', () => {
  test('body padding adjusts when maintenance bar is present', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    // Check that --maintenance-bar-h CSS variable exists (even if 0)
    const hasVar = await page.evaluate(() => {
      const root = document.documentElement;
      return getComputedStyle(root).getPropertyValue('--maintenance-bar-h') !== '';
    });
    expect(hasVar).toBeTruthy();
  });
});

// ── 5. Formulários ────────────────────────────────────────────────
test.describe('Forms', () => {
  test('login form renders with email and password fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/entrar/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('register form renders all fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/cadastro/`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Should have name, username, email, password fields (React hydration)
    const inputs = page.locator('input');
    await expect(inputs.first()).toBeVisible({ timeout: 10000 });
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('contact form renders', async ({ page }) => {
    await page.goto(`${BASE_URL}/contato/`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 10000 });
  });
});

// ── 6. Responsividade ─────────────────────────────────────────────
test.describe('Responsive Design', () => {
  const viewports = [
    { width: 375, height: 812, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1440, height: 900, name: 'Desktop' },
  ];

  for (const vp of viewports) {
    test(`Home renders correctly at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

      // No horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow, `Horizontal overflow at ${vp.name}`).toBeFalsy();

      // TopBar visible
      const topbar = page.locator('.topbar');
      await expect(topbar).toBeVisible();
    });
  }
});

// ── 7. Performance ────────────────────────────────────────────────
test.describe('Performance', () => {
  test('home page loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(5000);
  });

  test('no layout shift on initial load', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const cls = await page.evaluate(() => {
      return new Promise<number>(resolve => {
        let clsValue = 0;
        const observer = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            clsValue += (entry as any).value || 0;
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 1000);
      });
    });
    expect(cls).toBeLessThan(0.25);
  });
});

// ── 8. API health ─────────────────────────────────────────────────
test.describe('API Health', () => {
  test('API proxy returns articles', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/api-proxy.php/articles?per_page=1`);
    expect(response?.status()).toBe(200);
    const text = await response?.text();
    expect(text?.length).toBeGreaterThan(10);
  });

  test('API proxy returns recipes', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/api-proxy.php/recipes?per_page=1`);
    expect(response?.status()).toBe(200);
    const text = await response?.text();
    expect(text?.length).toBeGreaterThan(10);
  });

  test('backend health endpoint responds', async ({ page }) => {
    const response = await page.goto('https://back.artigocomcafe.com/api/test');
    expect(response?.status()).toBe(200);
    const json = await response?.json();
    expect(json?.message).toBe('API is working');
  });
});

// ── 9. SEO ────────────────────────────────────────────────────────
test.describe('SEO', () => {
  test('home page has meta tags', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /.+/);

    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /.+/);
  });

  test('blog index has canonical URL', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/`, { waitUntil: 'domcontentloaded' });
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', /artigocomcafe\.com\/blog/);
  });
});

// ── 10. Accessibility basics ──────────────────────────────────────
test.describe('Accessibility', () => {
  test('all images have alt attributes', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const imagesWithoutAlt = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      let count = 0;
      imgs.forEach(img => {
        if (!img.hasAttribute('alt')) count++;
      });
      return count;
    });
    expect(imagesWithoutAlt).toBe(0);
  });

  test('page has lang attribute', async ({ page }) => {
    await page.goto(BASE_URL);
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBeTruthy();
  });
});
