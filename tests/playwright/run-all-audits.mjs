#!/usr/bin/env node
/**
 * run-all-audits.mjs — Skillmaster: roda TODAS as auditorias Playwright do Artigo com Café
 *
 * Rodar todas as auditorias de uma vez, em sequência, com relatório final consolidado.
 *
 * Uso (a partir da raiz do projeto):
 *   node tests/playwright/run-all-audits.mjs           # site + dash (padrão)
 *   node tests/playwright/run-all-audits.mjs --site    # somente auditorias do site
 *   node tests/playwright/run-all-audits.mjs --dash    # somente auditorias do dashboard (Filament)
 *   node tests/playwright/run-all-audits.mjs --all     # tudo, incluindo painel do leitor (/dashboard/)
 *   node tests/playwright/run-all-audits.mjs --report  # grava test-results/auditoria-<data>.md
 *   node tests/playwright/run-all-audits.mjs --timeout 900   # timeout por auditoria (s, padrão 600)
 *   node tests/playwright/run-all-audits.mjs --help    # ajuda
 *
 * Variáveis de ambiente respeitadas (repassadas aos testes):
 *   BASE_URL, TEST_USER, TEST_PASS, DASH_EMAIL, DASH_PASSWORD
 *
 * Exit code: 0 se todas passaram; 1 se alguma falhou.
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const USAGE = `🔍 SKILLMASTER — AUDITORIA CONSOLIDADA (run-all-audits.mjs)

Uso:
  node tests/playwright/run-all-audits.mjs                site + dash (padrão)
  node tests/playwright/run-all-audits.mjs --site         somente site
  node tests/playwright/run-all-audits.mjs --dash         somente dashboard (Filament)
  node tests/playwright/run-all-audits.mjs --all          tudo, incl. painel do leitor (/dashboard/)
  node tests/playwright/run-all-audits.mjs --report       grava test-results/auditoria-<data>.md
  node tests/playwright/run-all-audits.mjs --timeout 900  timeout por auditoria (s, padrão 600)
  node tests/playwright/run-all-audits.mjs --help         esta ajuda

Env: BASE_URL, TEST_USER, TEST_PASS, DASH_EMAIL, DASH_PASSWORD
Exit code: 0 = todas passaram | 1 = alguma falhou`;

// ── Catálogo das auditorias ────────────────────────────────────────────────
const AUDITS = [
  { file: 'full-audit.mjs',             name: 'Site — Auditoria geral (desktop+mobile)',  group: 'site' },
  { file: 'receitas-audit.mjs',         name: 'Site — Módulo de receitas',                group: 'site' },
  { file: 'site-audit.mjs',             name: 'Site — Métricas / SEO',                    group: 'site' },
  { file: 'a11y-audit.mjs',             name: 'Site — Acessibilidade (WCAG 2.1 AA)',      group: 'site' },
  { file: 'dash-login.mjs',             name: 'Dash — Login',                             group: 'dash' },
  { file: 'dash-crud.mjs',              name: 'Dash — CRUD',                              group: 'dash' },
  { file: 'dash-central-editorial.mjs', name: 'Dash — Central Editorial',                 group: 'dash' },
  { file: 'dash-audit.mjs',             name: 'Leitor — Painel /dashboard/',              group: 'reader', pending: true },
];

// ── Flags ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(USAGE);
  process.exit(0);
}

const opts = {
  site: args.includes('--site'),
  dash: args.includes('--dash'),
  all: args.includes('--all'),
  report: args.includes('--report'),
  timeout: 600,
};

const timeoutIdx = args.indexOf('--timeout');
if (timeoutIdx !== -1 && args[timeoutIdx + 1]) {
  const t = Number(args[timeoutIdx + 1]);
  if (Number.isFinite(t) && t > 0) opts.timeout = t;
}

// Seleção dos grupos
let groups = ['site', 'dash'];
if (opts.site && !opts.dash) groups = ['site'];
if (opts.dash && !opts.site) groups = ['dash'];
if (opts.all) groups = ['site', 'dash', 'reader'];

const selected = AUDITS.filter(a =>
  groups.includes(a.group) && (opts.all || !a.pending)
);

// ── Avisos de credenciais ──────────────────────────────────────────────────
const hasDashGroup = selected.some(a => a.group === 'dash');
if (hasDashGroup) {
  if (!process.env.DASH_EMAIL) console.warn('⚠️  DASH_EMAIL não definido — usando default do teste');
  if (!process.env.DASH_PASSWORD) console.warn('⚠️  DASH_PASSWORD não definido — usando default do teste');
}
if (selected.some(a => a.group === 'reader')) {
  console.warn('⚠️  Incluindo painel do leitor (/dashboard/): requer deploy da página (hoje retorna 404).');
}

// ── Execução ────────────────────────────────────────────────────────────────
const results = [];

function runAudit(audit) {
  return new Promise((resolve) => {
    const file = path.join(ROOT, 'tests', 'playwright', audit.file);
    const startedAt = Date.now();
    let settled = false;

    const settle = (status, exitCode, error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      results.push({ ...audit, status, exitCode, timeMs: Date.now() - startedAt, error });
      const ok = status === 'ok';
      console.log(`\n  ${ok ? '✅' : '❌'} ${audit.name} — ${ok ? 'PASSOU' : status === 'timeout' ? 'TIMEOUT' : 'FALHOU'} (exit ${exitCode}) em ${((Date.now() - startedAt) / 1000).toFixed(0)}s`);
      resolve();
    };

    console.log('\n' + '═'.repeat(64));
    console.log(`▶ ${audit.name}  (${audit.file})`);
    console.log('═'.repeat(64));

    const child = spawn(process.execPath, [file], {
      cwd: ROOT,
      env: process.env,
      stdio: ['inherit', 'inherit', 'inherit'],
    });

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      settle('timeout', 124, `Excedeu ${opts.timeout}s`);
    }, opts.timeout * 1000);

    child.on('error', (err) => settle('erro', 1, err.message));
    child.on('exit', (code) => settle(code === 0 ? 'ok' : 'falhou', code ?? 1));
  });
}

// ── Relatório final ─────────────────────────────────────────────────────────
function printReport() {
  console.log('\n\n' + '📊'.repeat(24));
  console.log('📊 RELATÓRIO CONSOLIDADO — TODAS AS AUDITORIAS');
  console.log('📊'.repeat(24) + '\n');

  const pad = (s, n) => String(s).padEnd(n);
  console.log(pad('Auditoria', 48) + pad('Grupo', 8) + pad('Status', 10) + pad('Tempo', 8));
  console.log('-'.repeat(76));

  let passed = 0, failed = 0;
  for (const r of results) {
    const ok = r.status === 'ok';
    ok ? passed++ : failed++;
    const status = r.status === 'ok' ? '✅ ok' : r.status === 'timeout' ? '⏱ timeout' : r.status === 'erro' ? '❌ erro' : '❌ falhou';
    console.log(pad(r.name, 48) + pad(r.group, 8) + pad(status, 10) + pad(`${(r.timeMs / 1000).toFixed(0)}s`, 8));
    if (r.error) console.log(`    └ ${r.error}`);
  }

  console.log('-'.repeat(76));
  console.log(`Total: ${results.length} | ✅ ${passed} | ❌ ${failed}`);
  const total = passed + failed;
  const score = total > 0 ? Math.round((passed / total) * 100) : 0;
  console.log(`\n🏆 SCORE GLOBAL: ${score}% (${passed}/${total})`);

  if (results.some(r => r.status !== 'ok')) {
    console.log('\n❌ Auditorias com falha:');
    for (const r of results) {
      if (r.status !== 'ok') console.log(`  • ${r.name} (${r.status})`);
    }
  }

  console.log('');

  if (opts.report) {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const reportDir = path.join(ROOT, 'test-results');
    fs.mkdirSync(reportDir, { recursive: true });
    const reportFile = path.join(reportDir, `auditoria-${stamp}.md`);
    const lines = [
      `# 📊 Auditoria consolidada — ${new Date().toISOString()}`,
      '',
      `**Score:** ${score}% (${passed}/${total}) — ✅ ${passed} | ❌ ${failed}`,
      '',
      '| Auditoria | Grupo | Status | Tempo |',
      '|-----------|-------|--------|-------|',
      ...results.map(r => `| ${r.name} | ${r.group} | ${r.status === 'ok' ? '✅' : r.status === 'timeout' ? '⏱' : '❌'} | ${(r.timeMs / 1000).toFixed(0)}s |`),
      '',
    ];
    fs.writeFileSync(reportFile, lines.join('\n'), 'utf8');
    console.log(`📝 Relatório salvo em: ${reportFile}`);
  }
}

// ── Servidor estático para auditorias locais (dash-audit roda contra localhost) ──
let staticServer = null;
function startStaticServer(port = 4331) {
  return new Promise((resolve) => {
    staticServer = spawn(process.execPath, ['tests/playwright/static-server.mjs', String(port), 'dist'], {
      cwd: ROOT, stdio: 'ignore',
    });
    setTimeout(resolve, 800);
  });
}

// ── Main ────────────────────────────────────────────────────────────────────
console.log('🔍 SKILLMASTER — AUDITORIA CONSOLIDADA');
console.log(`📅 ${new Date().toISOString()}`);
console.log(`🌐 ${process.env.BASE_URL || 'https://artigocomcafe.com (padrão)'}`);
console.log(`⏱ Timeout por auditoria: ${opts.timeout}s`);
console.log(`📋 ${selected.length} auditoria(s): ${selected.map(a => a.file).join(', ')}`);

if (selected.length === 0) {
  console.error('Nenhuma auditoria selecionada.');
  process.exit(1);
}

for (const audit of selected) {
  // dash-audit.mjs valida o painel do leitor contra um servidor estático local
  // (token/API mockados), então sobe o static-server antes e derruba depois.
  if (audit.file === 'dash-audit.mjs') {
    console.log('\n🖥️  Subindo static-server (dist) na porta 4331 para a auditoria do leitor...');
    await startStaticServer();
  }
  await runAudit(audit);
  if (audit.file === 'dash-audit.mjs' && staticServer) {
    staticServer.kill('SIGKILL');
    staticServer = null;
  }
}

printReport();
process.exit(results.some(r => r.status !== 'ok') ? 1 : 0);
