/**
 * Auditoria de Acessibilidade (WCAG) - Artigo com Café
 * Usando axe-core + Playwright para testar conformidade WCAG 2.1 Level AA
 * 
 * Uso: node tests/playwright/a11y-audit.mjs
 */

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = 'https://artigocomcafe.com';
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];

const RESULTS = {
  totalViolations: 0,
  totalPasses: 0,
  pagesTested: 0,
  allViolations: [],
  criticalCount: 0,
  seriousCount: 0,
  moderateCount: 0,
  minorCount: 0,
};

function printDivider(char = '─', len = 60) {
  console.log(char.repeat(len));
}

async function auditPage(page, url, name) {
  console.log(`\n📄 ${name}`);
  console.log(`   URL: ${url}`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (err) {
    console.log(`   ⚠️  Erro ao carregar: ${err.message.substring(0, 60)}`);
    return;
  }
  
  // Wait a bit for React hydration
  await page.waitForTimeout(1000);
  
  const results = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze();
  
  RESULTS.pagesTested++;
  RESULTS.totalPasses += results.passes.length;
  
  const violations = results.violations;
  
  if (violations.length === 0) {
    console.log(`   ✅ 0 violações encontradas`);
    return;
  }
  
  RESULTS.totalViolations += violations.length;
  
  // Categorize by impact
  for (const v of violations) {
    RESULTS.allViolations.push({ page: name, ...v });
    if (v.impact === 'critical') RESULTS.criticalCount += v.nodes.length;
    else if (v.impact === 'serious') RESULTS.seriousCount += v.nodes.length;
    else if (v.impact === 'moderate') RESULTS.moderateCount += v.nodes.length;
    else if (v.impact === 'minor') RESULTS.minorCount += v.nodes.length;
  }
  
  console.log(`   ⚠️  ${violations.length} violações encontradas:`);
  
  for (const violation of violations) {
    const nodes = violation.nodes.length;
    console.log(`\n   🔴 [${violation.impact.toUpperCase()}] ${violation.id}`);
    console.log(`      ${violation.help}`);
    console.log(`      ${violation.helpUrl}`);
    console.log(`      ${nodes} elemento(s) afetado(s):`);
    
    for (const node of violation.nodes.slice(0, 3)) {
      const target = node.target?.[0] || 'N/A';
      const snippet = (node.html || '').substring(0, 100);
      console.log(`        • ${target}`);
      if (snippet) console.log(`          ${snippet}`);
      
      // Show failure summary
      if (node.failureSummary) {
        const lines = node.failureSummary.split('\n').filter(l => l.trim());
        for (const line of lines.slice(0, 3)) {
          console.log(`          → ${line.substring(0, 120)}`);
        }
      }
    }
    
    if (violation.nodes.length > 3) {
      console.log(`        ... e mais ${violation.nodes.length - 3} elemento(s)`);
    }
  }
}

function printSummary() {
  console.log('\n\n' + '📊'.repeat(30));
  console.log('📊 RELATÓRIO DE ACESSIBILIDADE (WCAG 2.1 AA)');
  console.log('📊'.repeat(30) + '\n');
  
  console.log(`📄 Páginas testadas: ${RESULTS.pagesTested}`);
  console.log(`✅ Regras aprovadas: ${RESULTS.totalPasses}`);
  console.log(`❌ Total violações: ${RESULTS.totalViolations}`);
  
  console.log(`\n📊 Por Impacto:`);
  console.log(`   🔴 Críticas: ${RESULTS.criticalCount}`);
  console.log(`   🟠 Sérias:   ${RESULTS.seriousCount}`);
  console.log(`   🟡 Moderadas: ${RESULTS.moderateCount}`);
  console.log(`   🔵 Menores:   ${RESULTS.minorCount}`);
  
  // Group violations by rule across pages
  if (RESULTS.allViolations.length > 0) {
    console.log(`\n📋 Violações por Regra:`);
    
    const ruleCount = {};
    for (const v of RESULTS.allViolations) {
      const key = v.id;
      if (!ruleCount[key]) {
        ruleCount[key] = { id: v.id, impact: v.impact, help: v.help, helpUrl: v.helpUrl, count: 0, pages: [] };
      }
      ruleCount[key].count += v.nodes.length;
      if (!ruleCount[key].pages.includes(v.page)) {
        ruleCount[key].pages.push(v.page);
      }
    }
    
    const sorted = Object.values(ruleCount).sort((a, b) => b.count - a.count);
    for (const rule of sorted) {
      console.log(`\n   [${rule.impact.toUpperCase()}] ${rule.id} (${rule.count}x)`);
      console.log(`   ${rule.help.substring(0, 80)}`);
      console.log(`   Páginas: ${rule.pages.join(', ')}`);
    }
    
    console.log(`\n📝 RECOMENDAÇÕES PRIORITÁRIAS:`);
    const critical = sorted.filter(r => r.impact === 'critical' || r.impact === 'serious');
    if (critical.length > 0) {
      for (const rule of critical) {
        console.log(`   🔴 Corrigir: ${rule.id} - ${rule.help.substring(0, 60)}`);
      }
    }
  }
  
  console.log('');
}


async function run() {
  console.log('\n🔍 AUDITORIA DE ACESSIBILIDADE WCAG 2.1 AA');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🌐 ${BASE_URL}`);
  printDivider();
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox'],
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
  });
  
  const page = await context.newPage();
  
  // Test all major pages
  const pages = [
    { url: BASE_URL + '/', name: 'Homepage' },
    { url: BASE_URL + '/blog/', name: 'Blog - Listagem' },
    { url: BASE_URL + '/blog/bem-vindo-ao-artigocomcafe-sua-pausa-para-o-conhecimento/', name: 'Artigo Individual' },
    { url: BASE_URL + '/sobre/', name: 'Sobre' },
    { url: BASE_URL + '/contato/', name: 'Contato' },
    { url: BASE_URL + '/entrar/', name: 'Entrar (Login)' },
    { url: BASE_URL + '/cadastro/', name: 'Cadastro' },
    { url: BASE_URL + '/404/', name: 'Página 404' },
    { url: BASE_URL + '/newsletter/', name: 'Newsletter' },
    { url: BASE_URL + '/offline/', name: 'Offline' },
    // Auth pages (will load but likely show unauthenticated state)
    { url: BASE_URL + '/perfil/', name: 'Perfil (auth)' },
    { url: BASE_URL + '/biblioteca/', name: 'Biblioteca (auth)' },
    { url: BASE_URL + '/graos/', name: 'Graos (auth)' },
    { url: BASE_URL + '/conquistas/', name: 'Conquistas (auth)' },
    { url: BASE_URL + '/torrefacao/', name: 'Torrefacao (auth)' },
    { url: BASE_URL + '/mapa/', name: 'Mapa (auth)' },
    { url: BASE_URL + '/missoes/', name: 'Missoes (auth)' },
    { url: BASE_URL + '/trilhas/', name: 'Trilhas (auth)' },
  ];
  
  for (const { url, name } of pages) {
    await auditPage(page, url, name);
  }
  
  await browser.close();
  
  printSummary();
  
  // Exit with appropriate code
  if (RESULTS.criticalCount > 0 || RESULTS.seriousCount > 5) {
    console.log('❌ Críticas ou muitas violações sérias encontradas!');
    process.exit(1);
  }
  
  console.log('✅ Auditoria concluída!');
}

run().catch(err => {
  console.error('💥 Erro fatal:', err.message);
  process.exit(1);
});
