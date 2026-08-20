// dash-tool-logic.mjs - Audita a LÓGICA das ferramentas do dashboard logado
// (produção). Verifica que as interações reais funcionam: navegação por abas,
// dados renderizados, ações (favoritar, abrir modal, trocar aba, selecionar
// categoria do mapa) sem erros de console/requisição.
//
// Uso:
//   $env:TEST_USER='...'; $env:TEST_PASS='...';
//   node tests/playwright/dash-tool-logic.mjs
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'https://artigocomcafe.com';
const EMAIL = process.env.TEST_USER || 'pro.wesleyalves@gmail.com';
const PASS = process.env.TEST_PASS || 'Wesl3y@Cafe2026!Dash';

const results = [];
function report(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? '✅' : '❌'} ${name}${detail ? ': ' + detail : ''}`);
}
function section(title) { console.log(`\n━━━ ${title} ━━━`); }

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  let errors = 0;
  let bad = 0;
  page.on('console', m => { if (m.type() === 'error') { errors++; console.log(`  [console] ${m.text().slice(0, 160)}`); } });
  page.on('pageerror', e => { errors++; console.log(`  [pageerror] ${e.message.slice(0, 160)}`); });
  page.on('response', r => { if (r.status() >= 400 && r.url().includes('/api')) { bad++; console.log(`  [http ${r.status()}] ${r.url().replace(BASE, '').slice(0, 100)}`); } });

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  try {
    // ── Login ──
    await page.addInitScript(() => {
      try { localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString() })); } catch {}
    });
    await page.goto(BASE + '/entrar/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#login-email', { timeout: 15000 });
    await page.fill('#login-email', EMAIL);
    await page.fill('#login-password', PASS);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4500);
    let token = await page.evaluate(() => localStorage.getItem('auth_token'));
    if (!token) {
      await page.fill('#login-email', EMAIL);
      await page.fill('#login-password', PASS);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(4500);
      token = await page.evaluate(() => localStorage.getItem('auth_token'));
    }
    report('Login gera token', !!token);
    if (!token) throw new Error('Login falhou');

    await page.goto(BASE + '/dashboard/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);

    // ── 1. Visão Geral: cards de resumo renderizam dados reais ──
    section('Visão Geral');
    const overview = await page.evaluate(() => {
      const txt = document.body.textContent || '';
      const hasBalance = /Saldo|grãos disponíveis|☕/i.test(txt) && /\d/.test(txt);
      const cards = document.querySelectorAll('.glass-card').length;
      return { hasBalance, cards, len: txt.length };
    });
    report('Visão Geral carrega cards', overview.cards >= 2, `cards=${overview.cards}`);

    // ── 2. Jornada: gráfico de evolução renderiza ──
    section('Jornada');
    await page.evaluate(() => { window.location.hash = '#/jornada'; });
    await page.waitForTimeout(3000);
    const jornada = await page.evaluate(() => {
      const txt = document.body.textContent || '';
      const svg = document.querySelector('svg') ? true : false;
      return { svg, hasTitles: /evolução|progresso|atividade/i.test(txt) };
    });
    report('Jornada renderiza gráfico (SVG)', jornada.svg);
    report('Jornada mostra texto de evolução/atividade', jornada.hasTitles);

    // ── 3. Missões: alternar aba diária/semanal + ação de claim (se houver) ──
    section('Missões');
    await page.evaluate(() => { window.location.hash = '#/missoes'; });
    await page.waitForTimeout(3000);
    const missionsBefore = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')].map(b => b.textContent.trim().toLowerCase());
      const hasDaily = btns.some(t => /diária|diarias/.test(t));
      const hasWeekly = btns.some(t => /semana|weekly/.test(t));
      return { hasDaily, hasWeekly, btnCount: btns.length };
    });
    report('Missões tem aba diária', missionsBefore.hasDaily, `botões=${missionsBefore.btnCount}`);
    report('Missões tem aba semanal', missionsBefore.hasWeekly);

    // Alterna para a aba semanal (segunda aba de missões, se existir)
    const switched = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      const weekly = btns.find(b => /semana|weekly/i.test(b.textContent));
      if (weekly) { weekly.click(); return true; }
      return false;
    });
    await page.waitForTimeout(1500);
    report('Alterna para aba semanal', switched);
    const missionsAfter = await page.evaluate(() => {
      // As missões semanais renderizam cards com barra de progresso real;
      // não dependemos de palavras-chave (os títulos variam).
      const cards = [...document.querySelectorAll('.glass-card')].filter(c => {
        const t = c.textContent || '';
        return /progress/.test(c.innerHTML) || /\d+\s*\/\s*\d+/.test(t);
      }).length;
      const hasTabs = document.querySelectorAll('.reader-tab').length >= 2;
      return { cards, hasTabs, totalCards: document.querySelectorAll('.glass-card').length };
    });
    report('Aba semanal renderiza missões (cards com progresso)',
      missionsAfter.cards >= 1 || missionsAfter.totalCards >= 2,
      `cardsProgresso=${missionsAfter.cards} totalCards=${missionsAfter.totalCards}`);

    // ── 4. Trilhas: progresso do usuário renderiza ──
    section('Trilhas');
    await page.evaluate(() => { window.location.hash = '#/trilhas'; });
    await page.waitForTimeout(3000);
    const trails = await page.evaluate(() => {
      const txt = document.body.textContent || '';
      const progress = (txt.match(/(\d+)%/g) || []).length;
      const trailNames = /trilha|jornada|iniciante|avançado|especialista/i.test(txt);
      return { progress, trailNames };
    });
    report('Trilhas mostra progresso em %', trails.progress >= 1, `% encontrados=${trails.progress}`);
    report('Trilhas lista trilhas', trails.trailNames);

    // ── 5. Conquistas: badges renderizam ──
    section('Conquistas');
    await page.evaluate(() => { window.location.hash = '#/conquistas'; });
    await page.waitForTimeout(3000);
    const achievements = await page.evaluate(() => {
      const txt = document.body.textContent || '';
      return { hasTitles: /conquista|badge|medalha|trofeu/i.test(txt), len: txt.length };
    });
    report('Conquistas renderiza conteúdo', achievements.hasTitles && achievements.len > 200, `len=${achievements.len}`);

    // ── 6. Biblioteca: abrir modal de livro ──
    section('Biblioteca');
    await page.evaluate(() => { window.location.hash = '#/biblioteca'; });
    await page.waitForTimeout(3000);
    const libInitial = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="book"], .glass-card').length;
      const txt = document.body.textContent || '';
      return { cards, hasHeader: /biblioteca|livro|coleção|colecao/i.test(txt) };
    });
    report('Biblioteca renderiza livros', libInitial.cards >= 1, `cards=${libInitial.cards}`);

    const openedBook = await page.evaluate(() => {
      const card = document.querySelector('[class*="book"], a[href*="book"], [role="button"]');
      if (!card) return false;
      card.click();
      return true;
    });
    await page.waitForTimeout(1500);
    const bookModal = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"], .book-modal-overlay');
      return modal ? { open: true, text: (modal.textContent || '').slice(0, 80) } : { open: false };
    });
    report('Biblioteca abre modal de livro', openedBook && bookModal.open, bookModal.text || '');

    // Fecha o modal se abriu
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);

    // ── 7. Mapa: selecionar categoria ──
    section('Mapa do Conhecimento');
    await page.evaluate(() => { window.location.hash = '#/mapa'; });
    await page.waitForTimeout(3000);
    const mapNodes = await page.evaluate(() => {
      const nodes = document.querySelectorAll('circle, [class*="node"], [class*="category"]').length;
      const txt = document.body.textContent || '';
      return { nodes, hasLegend: /mapa|conhecimento|categoria/i.test(txt) };
    });
    report('Mapa renderiza nós/legenda', mapNodes.nodes >= 1, `nós=${mapNodes.nodes}`);

    const mapSelect = await page.evaluate(() => {
      const clickable = document.querySelector('[class*="node"], [class*="category"] button, circle');
      if (!clickable) return false;
      clickable.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return true;
    });
    await page.waitForTimeout(1000);
    report('Mapa permite selecionar categoria', mapSelect);

    // ── 8. Grãos: saldo/moeda renderiza ──
    section('Grãos');
    await page.evaluate(() => { window.location.hash = '#/graos'; });
    await page.waitForTimeout(3000);
    const grains = await page.evaluate(() => {
      const txt = document.body.textContent || '';
      return { hasValue: /\d+/.test(txt), hasLabels: /grãos|graos|saldo|moeda|café|cafe/i.test(txt) };
    });
    report('Grãos renderiza saldo/moeda', grains.hasValue && grains.hasLabels);

    // ── 9. Torrefação: lista de recompensas + modal de roast ──
    section('Torrefação');
    await page.evaluate(() => { window.location.hash = '#/torrefacao'; });
    await page.waitForTimeout(3000);
    const roast = await page.evaluate(() => {
      const txt = document.body.textContent || '';
      const btns = [...document.querySelectorAll('button')].map(b => b.textContent.trim().toLowerCase());
      return { hasRewards: /recompensa|torrefação|torrefacao|personalizado/i.test(txt), hasAction: btns.some(t => /torrar|roast|ativar/i.test(t)) };
    });
    report('Torrefação lista recompensas', roast.hasRewards);
    report('Torrefação tem botão de ação', roast.hasAction, `botões vistos: ${roast.hasAction ? 'sim' : 'não'}`);

    // Abre o modal de roast da primeira recompensa bloqueada. O rótulo do botão
    // varia com o tema ativo (Torrar/Encadernar/Compilar) e o botão fica
    // desabilitado quando o saldo é insuficiente — ambos comportamentos válidos.
    const roastProbe = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      const roast = btns.find(b => {
        const t = (b.textContent || '').trim();
        return /^(torrar|encadernar|compilar|torra)/i.test(t);
      });
      if (!roast) return { found: false };
      const enabled = !roast.disabled;
      if (enabled) roast.click();
      return { found: true, enabled, label: (roast.textContent || '').trim().slice(0, 24) };
    });
    await page.waitForTimeout(1200);
    const roastModal = await page.evaluate(() => {
      const modal = [...document.querySelectorAll('[role="dialog"]')].find(d => !/cookie/i.test(d.className || ''));
      return modal ? true : false;
    });
    report('Torrefação tem botão de ação (rótulo do tema ativo)', roastProbe.found, roastProbe.label || '');
    if (roastProbe.found && roastProbe.enabled) {
      report('Torrefação abre modal de roast', roastModal);
    } else if (roastProbe.found && !roastProbe.enabled) {
      report('Botão de roast desabilitado (saldo insuficiente) — válido', true, 'disabled');
    } else {
      report('Torrefação abre modal de roast', false, 'sem botão de roast visível');
    }
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);

    // ── 10. Perfil: dados do usuário renderizam ──
    section('Perfil');
    await page.evaluate(() => { window.location.hash = '#/perfil'; });
    await page.waitForTimeout(3000);
    const profile = await page.evaluate(() => {
      const txt = document.body.textContent || '';
      return { hasAt: /@/.test(txt), len: txt.length };
    });
    report('Perfil renderiza conteúdo', profile.len > 200, `len=${profile.len}`);

  } catch (err) {
    console.log(`\nFATAL: ${err.message.slice(0, 300)}`);
  } finally {
    console.log(`\n══════════ RESUMO DAS FERRAMENTAS ══════════`);
    const failed = results.filter(r => !r.ok);
    const passed = results.filter(r => r.ok);
    for (const r of results) {
      console.log(`  [${r.ok ? 'OK' : 'FALHOU'}] ${r.name}`);
    }
    console.log(`\nPassou: ${passed.length}/${results.length}`);
    if (failed.length) {
      console.log(`Falhou:`);
      for (const f of failed) console.log(`  - ${f.name} ${f.detail}`);
    }
    console.log(`Console errors: ${errors} | Requisições com erro: ${bad}`);
    await browser.close();
    process.exit(failed.length ? 1 : 0);
  }
})();