/**
 * Smoke test da Loja — fluxo completo:
 *   /loja (cards + filtros) → carrinho (drawer) → página de produto →
 *   checkout → confirmação de pedido.
 *
 * Uso: node tests/playwright/loja-flow-check.mjs
 * (sobe um static-server local em dist/ e roda headless).
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 4341;
const BASE = `http://127.0.0.1:${PORT}`;

const RESULTS = { passed: 0, failed: 0, errors: [] };
function report(name, ok, detail = '') {
  if (ok) { RESULTS.passed++; console.log(`  ✅ ${name}`); }
  else { RESULTS.failed++; RESULTS.errors.push(`${name}: ${detail}`); console.log(`  ❌ ${name}: ${detail}`); }
}

// Static server local
const server = spawn(process.execPath, ['tests/playwright/static-server.mjs', String(PORT), 'dist'], {
  stdio: 'ignore',
});

let browser;
try {
  await sleep(1500);

  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(String(err)));

  // Dispensa o overlay de cookies (position:fixed z=10000 intercepta cliques)
  async function dismissCookies() {
    const accept = page.locator('#cookie-accept');
    if (await accept.count() > 0) {
      await accept.click({ timeout: 5000 }).catch(() => {});
      await sleep(300);
    }
  }

  // ── 1. /loja ──────────────────────────────────────────────
  await page.goto(`${BASE}/loja/`, { waitUntil: 'networkidle' });
  await dismissCookies();
  const cardCount = await page.locator('.product-card').count();
  report('loja: 20 cards de produto', cardCount === 20, `encontrados ${cardCount}`);

  const hasSearch = await page.locator('#loja-search').count();
  const hasSort = await page.locator('#loja-sort').count();
  report('loja: busca + ordenação presentes', hasSearch === 1 && hasSort === 1);

  // Filtro por categoria
  await page.locator('.category-filter-btn[data-category="artigo-com-cafe"]').click();
  await sleep(200);
  const visibleAfterFilter = await page.locator('.product-card:visible').count();
  report('loja: filtro de categoria (8 visíveis)', visibleAfterFilter === 8, `visíveis ${visibleAfterFilter}`);
  await page.locator('.category-filter-btn[data-category="all"]').click();
  await sleep(200);

  // Busca
  await page.fill('#loja-search', 'caneca');
  await sleep(200);
  const visibleAfterSearch = await page.locator('.product-card:visible').count();
  report('loja: busca filtra resultados', visibleAfterSearch >= 1 && visibleAfterSearch < 20, `visíveis ${visibleAfterSearch}`);
  await page.fill('#loja-search', '');
  await sleep(200);

  // ── 2. Carrinho (drawer) ─────────────────────────────────
  await dismissCookies();
  await page.locator('.product-card[data-product="caneca-ceramica"] .add-to-cart-btn').click();
  await sleep(300);
  const badge = await page.locator('.cart-fab-count').textContent();
  report('carrinho: badge mostra 1 item', badge === '1', `badge="${badge}"`);

  await page.locator('[data-cart-open]').click();
  await sleep(400);
  const drawerOpen = await page.locator('[data-cart-drawer].open').count();
  report('carrinho: drawer abre', drawerOpen === 1);

  const itemName = await page.locator('.cart-item-name').textContent();
  report('carrinho: item listado', (itemName || '').includes('Caneca Cerâmica'), `item="${itemName}"`);

  await page.locator('.cart-item [data-cart-plus]').click();
  await sleep(250);
  const qtyText = await page.locator('[data-cart-qty-value]').textContent();
  report('carrinho: quantidade +1', qtyText === '2', `qty="${qtyText}"`);

  const subtotal = await page.locator('[data-cart-subtotal]').textContent();
  report('carrinho: subtotal atualizado', (subtotal || '').includes('119,80'), `subtotal="${subtotal}"`);

  await page.locator('[data-cart-close]').click();
  await sleep(300);

  // ── 3. Página de produto ─────────────────────────────────
  await page.goto(`${BASE}/loja/v60-dripper/`, { waitUntil: 'networkidle' });
  await dismissCookies();
  const prodTitle = await page.locator('.product-name').textContent();
  report('produto: título renderizado', (prodTitle || '').includes('V60'), `título="${prodTitle}"`);

  const price = await page.locator('.product-price-big').textContent();
  report('produto: preço formatado', (price || '').includes('R$'), `preço="${price}"`);

  const jsonLd = await page.locator('script[type="application/ld+json"]').count();
  report('produto: schema.org JSON-LD', jsonLd >= 2, `${jsonLd} blocos`);

  // Comprar agora → vai direto ao checkout
  await page.locator('[data-buy-now]').click();
  await page.waitForURL('**/loja/checkout/');
  report('produto: "Comprar agora" leva ao checkout', true);

  // ── 4. Checkout ──────────────────────────────────────────
  await page.waitForLoadState('networkidle');
  await dismissCookies();
  const coItems = await page.locator('.co-item').count();
  report('checkout: resumo do pedido listado', coItems >= 1, `${coItems} itens`);

  await page.fill('#co-name', 'Teste da Loja');
  await page.fill('#co-email', 'teste@artigocomcafe.com');
  await page.fill('#co-phone', '(11) 99999-9999');
  await page.fill('#co-cep', '01310-100');
  await page.fill('#co-street', 'Av. Paulista');
  await page.fill('#co-number', '1000');
  await page.fill('#co-city', 'São Paulo');
  await page.selectOption('#co-state', 'SP');
  await page.check('#co-consent');

  // Troca para Pix e confirma
  await page.check('input[name="payment"][value="pix"]');
  const pixDetailVisible = await page.locator('#payment-pix').isVisible();
  report('checkout: detalhe do Pix aparece', pixDetailVisible);

  await page.click('#checkout-submit');
  await page.waitForURL('**/loja/confirmacao/?pedido=*', { timeout: 15000 });
  report('checkout: redireciona para confirmação', true);

  // ── 5. Confirmação ───────────────────────────────────────
  await page.waitForLoadState('networkidle');
  await dismissCookies();
  const confTitle = await page.locator('.conf-title').textContent();
  report('confirmação: pedido confirmado', (confTitle || '').includes('confirmado'), `título="${confTitle}"`);

  const orderId = await page.locator('#conf-order-id').textContent();
  report('confirmação: número do pedido', /^ACF-/.test(orderId || ''), `id="${orderId}"`);

  const timelineSteps = await page.locator('.timeline-step').count();
  report('confirmação: timeline de status', timelineSteps === 4, `${timelineSteps} passos`);

  const total = await page.locator('.conf-totals-row.total strong').textContent();
  report('confirmação: total exibido', (total || '').includes('R$'), `total="${total}"`);

  // ── 6. Erros de console / recursos quebrados ─────────────
  const realErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('adsbygoogle') && !e.includes('gpt') && !e.includes('AdSense'));
  report('nenhum erro de console relevante', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));

  console.log(`\n📊 Resultado: ${RESULTS.passed} ✅ / ${RESULTS.failed} ❌`);
  if (RESULTS.failed > 0) {
    console.log(RESULTS.errors.map(e => `  • ${e}`).join('\n'));
    process.exit(1);
  }
  process.exit(0);
} catch (err) {
  console.error('💥 Falha na execução do teste:', err);
  process.exit(1);
} finally {
  if (browser) await browser.close().catch(() => {});
  server.kill('SIGKILL');
}
