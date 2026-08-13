// Teste isolado do P1 editor: multi-rascunho + escape XSS do renderMarkdown.
// Não requer credenciais nem backend real: intercepta /api-proxy.php e mocka respostas.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 4342;
const BASE = `http://localhost:${PORT}`;

let server;
function startServer() {
  return new Promise((resolve) => {
    server = spawn('node', ['tests/playwright/static-server.mjs', String(PORT), 'dist'], {
      stdio: 'ignore', detached: false,
    });
    setTimeout(resolve, 800);
  });
}

const results = [];
function report(name, passed, detail = '') {
  results.push({ name, passed });
  console.log(`${passed ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);
}

const mockUser = {
  id: 1, name: 'Teste', username: 'teste', email: 'teste@exemplo.com',
  bio: null, avatar: null, theme: 'cafe',
  reading_time_total: 0, articles_read_count: 0, daily_streak: 0,
  total_grains: 0, completed_trails: 0, collections_count: 0, achievements_count: 0,
};

const mockPosts = {
  data: [
    {
      id: 10, title: 'Post Existente A', slug: 'post-existente-a', excerpt: 'excerto A',
      status: 'draft', featured_image: null, reading_time: 2,
      category: null, tags: [], date: '2026-08-10', created_at: '2026-08-10', updated_at: '2026-08-10',
    },
    {
      id: 11, title: 'Post Existente B', slug: 'post-existente-b', excerpt: 'excerto B',
      status: 'published', featured_image: null, reading_time: 3,
      category: null, tags: [], date: '2026-08-11', created_at: '2026-08-11', updated_at: '2026-08-11',
    },
  ],
  meta: { current_page: 1, last_page: 1, per_page: 10, total: 2 },
};

// Mocka o proxy PHP com sessão autenticada
async function mockApi(page) {
  await page.route('**/api-proxy.php**', async (r) => {
    const url = new URL(r.request().url());
    const path = url.pathname.replace('/api-proxy.php', '');
    if (path.startsWith('/auth/me')) {
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: mockUser }) });
    } else if (path.startsWith('/user/dashboard')) {
      await r.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ evolution: { total_grains: 0, articles_read: 0, reading_time_hours: 0, trails_completed: 0, achievements_unlocked: 0, collections_count: 0, categories_explored: 0, daily_streak: 0 } }),
      });
    } else if (path.startsWith('/user/posts')) {
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPosts) });
    } else if (path.startsWith('/ai/status')) {
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { available: false, providers: {} } }) });
    } else if (path.startsWith('/integrations/')) {
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    } else {
      await r.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'not found' }) });
    }
  });
}

async function acceptCookies(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('cookie-consent', JSON.stringify({
        essential: true, analytics: true, marketing: true, version: 1,
        date: new Date().toISOString(),
      }));
    } catch (e) {}
  });
}

// Seed da sessão (token válido + flag anti-duplicação)
async function seedSession(page) {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('p1seeded')) {
      sessionStorage.setItem('p1seeded', '1');
      localStorage.setItem('auth_token', 'token_mock_valido');
    }
  });
}

(async () => {
  await startServer();
  const browser = await chromium.launch();

  try {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await mockApi(page);
    await acceptCookies(page);
    await seedSession(page);
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !/favicon|404/i.test(msg.text())) consoleErrors.push(msg.text());
    });

    await page.goto(BASE + '/dashboard/#posts', { waitUntil: 'networkidle' });

    // 1. Seção de posts renderiza com os 2 posts mockados
    await page.waitForSelector('text=Post Existente A', { timeout: 15000 });
    report('Lista de posts renderiza (widget)', await page.locator('text=Post Existente A').isVisible());
    report('Widget mostra botão "Novo Artigo"', await page.locator('button:has-text("Novo Artigo")').first().isVisible().catch(() => false));

    // 2. Abre "Novo Artigo" e digita um rascunho (rascunho novo = chave "create")
    await page.locator('button:has-text("+ Novo Artigo")').first().click();
    await page.waitForSelector('textarea.editor-textarea, .editor-pane textarea', { timeout: 10000 });
    const titleInput = page.locator('.editor-title, input[placeholder*="Título"]').first();
    await titleInput.fill('Rascunho Novo Teste');
    const contentArea = page.locator('.editor-pane textarea').first();
    await contentArea.fill('# Rascunho Novo Teste\n\nConteúdo do rascunho novo.');
    await page.waitForTimeout(900); // espera o autosave (debounce 500ms)

    const draftList1 = await page.evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem('dash_post_drafts_v1') || '{}');
      } catch { return {}; }
    });
    report('Autosave cria rascunho "create" na lista', !!(draftList1['create'] && draftList1['create'].data), JSON.stringify(Object.keys(draftList1)));
    report('Rascunho "create" preserva conteúdo', draftList1['create']?.data?.content?.includes('Rascunho Novo Teste') === true);

    // 3. Fecha o editor e abre edição de um post existente (chave "post:10")
    await page.locator('button:has-text("Cancelar")').first().click();
    await page.waitForTimeout(400);
    await page.locator('button[title="Editar"]').first().click();
    await page.waitForSelector('.editor-pane textarea', { timeout: 10000 });
    const editContent = page.locator('.editor-pane textarea').first();
    await editContent.fill('# Post A Editado\n\nConteúdo editado do post existente.');
    await page.waitForTimeout(900);

    const draftList2 = await page.evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem('dash_post_drafts_v1') || '{}');
      } catch { return {}; }
    });
    report('Edição cria rascunho "post:10" na lista', !!(draftList2['post:10'] && draftList2['post:10'].data), JSON.stringify(Object.keys(draftList2)));
    report('Rascunho "post:10" preserva conteúdo', draftList2['post:10']?.data?.content?.includes('Post A Editado') === true);
    report('Rascunho "create" ainda existe (multi-rascunho)', !!(draftList2['create'] && draftList2['create'].data));

    // 4. Rascunho novo NÃO sobrescreve o existente (isolação entre chaves)
    report('Conteúdo do "post:10" não contém texto do "create"',
      !draftList2['post:10']?.data?.content?.includes('Rascunho Novo Teste'));

    // 5. XSS: preview escapa HTML bruto (não executa nem injeta)
    await editContent.fill('# Titulo\n\n<script>window.__xss = true</script>\n\n<img src=x onerror="window.__xss = true">');
    await page.waitForTimeout(300);
    const xss = await page.evaluate(() => !!window.__xss);
    report('XSS NÃO executado no preview', !xss);
    await ctx.close();

    // 6. Teste direto do renderMarkdown via página: verifica escape de entidades no HTML renderizado
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await mockApi(page2);
    await acceptCookies(page2);
    await seedSession(page2);
    await page2.goto(BASE + '/dashboard/#posts', { waitUntil: 'networkidle' });
    await page2.waitForSelector('text=Post Existente A', { timeout: 15000 });
    await page2.locator('button:has-text("+ Novo Artigo")').first().click();
    await page2.waitForSelector('.editor-pane textarea', { timeout: 10000 });
    await page2.locator('.editor-pane textarea').first().fill('Antes **negrito** <b>raw</b> <script>alert(1)</script> depois');
    await page2.waitForTimeout(300);
    // Ativa preview
    const previewBtn = page2.locator('button:has-text("Preview"), button:has-text("Visualização")').first();
    if (await previewBtn.isVisible().catch(() => false)) await previewBtn.click();
    await page2.waitForTimeout(400);
    const previewHtml = await page2.locator('.preview-content, .editor-preview').first().evaluate(el => el.innerHTML).catch(() => '');
    report('Preview renderiza negrito markdown', previewHtml.includes('<strong>negrito</strong>'), previewHtml.substring(0, 120));
    report('Preview escapa <b> bruto (XSS-safe)', !/<b>raw<\/b>/.test(previewHtml), previewHtml.substring(0, 120));
    report('Preview escapa <script> bruto (XSS-safe)', !/<script>alert/.test(previewHtml));
    await ctx2.close();

    report('Sem erros de console relevantes', consoleErrors.length === 0, consoleErrors.join(' | '));

  } catch (err) {
    console.error('ERRO no teste:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server?.kill();
  }

  const fails = results.filter(r => !r.passed).length;
  console.log(`\n=== P1 EDITOR: ${results.length - fails}/${results.length} ✓ ===`);
  process.exitCode = fails > 0 ? 1 : 0;
})();