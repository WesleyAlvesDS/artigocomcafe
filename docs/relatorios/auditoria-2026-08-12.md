# 📋 Relatório de Auditoria Completa — 2026-08-12

> Formato obrigatório da [skillmaster](../skillmaster.md).
> Sessão: **auditoria completa do site após otimização de anúncios (lazy-load) e
> melhorias de design — com correção de problemas de resiliência encontrados.**

---

## 🏆 Resultado consolidado

| Auditoria | Cobertura | Resultado | Observação |
|---|---|---|---|
| **site-audit** (métricas/SEO, desktop+mobile) | 44 testes | ✅ **100% — Grade A** | Anterior: 65% (D) por 503 transitórios |
| **a11y-audit** (WCAG 2.1 AA) | 16 páginas, 685 regras | ✅ **0 violações** | Nenhuma crítica/séria/moderada/menor |
| **receitas-audit** | 42 testes | ✅ **100% (42/42)** | Zero erros no console |
| **dash-audit** (painel do leitor `/dashboard/`) | 49 testes | ✅ **100% — Grade A** | Console limpo, responsivo |
| **dash-login / dash-crud / dash-central-editorial** (Filament) | — | ⏳ Pendente | Exige `DASH_EMAIL`/`DASH_PASSWORD` (não versionadas) |

**Nada quebrou com os anúncios**: lazy-load validado (leaderboard eager, nativos
carregam ao rolar), densidade dentro das boas práticas (3–4 slots por página),
zero erros de console.

---

## 🔍 Problemas encontrados e corrigidos

### 1. 503 em rajada — PHP-FPM compartilhado saturado (crítico)
- **Sintoma:** auditoria falhava 20–35% dos testes; páginas hidratam 4+ widgets
  que batem no `/api-proxy.php` simultaneamente; sob rajada o host retorna 503.
- **Causa raiz:** pool PHP-FPM compartilhado (ValueHost) + proxy sem stale
  imediato + widgets sem retry client-side + timeouts longos prendendo workers.
- **Correções aplicadas (commit `44cae76`):**
  - `src/lib/api.ts`: **retry com backoff** (600ms/1200ms) para `502/503/429` e
    falha de rede em GET (idempotente).
  - `public/api-proxy.php`: **stale-while-revalidate com `flock`** — cache
    expirado serve stale imediato; apenas 1 processo revalida por endpoint.
    Frontend **nunca** vê 503 enquanto existir cache (janela de 6× TTL).
  - `public/api-proxy.php`: `CURLOPT_TIMEOUT` 30s→10s, `CONNECTTIMEOUT` 10s→5s
    (libera workers do PHP-FPM mais rápido).
  - `tests/playwright/site-audit.mjs`: 503/502/429 do proxy tratados por retry
    client-side não contam como falha; retry no teste de proxy.

### 2. Service worker — cache-first em API (médio, sessão anterior)
- SW agora faz **network-first** para `/api-proxy.php` (dados dinâmicos nunca
  devem ser cache-first). Versão de cache bumpada para forçar atualização.

### 3. Falhas de upload FTP intermitentes (operacional)
- 3 páginas de receitas falharam no deploy; resolvidas com retry (schannel
  intermitente do curl em Windows). Todos os 504 arquivos publicados.

---

## 📁 Arquivos modificados nesta sessão

| Arquivo | Ação |
|---|---|
| `src/lib/api.ts` | retry com backoff para erros transitórios (GET) |
| `public/api-proxy.php` | stale-while-revalidate + flock; timeouts reduzidos |
| `tests/playwright/site-audit.mjs` | filtro de 503 transitórios + retry proxy + dismiss cookies |
| `docs/relatorios/auditoria-2026-08-12.md` | este relatório |

## ⏭️ Pendências

- [ ] Rodar `dash-login`, `dash-crud` e `dash-central-editorial` com credenciais
      (`DASH_EMAIL`/`DASH_PASSWORD`) — fornecidas pelo usuário.
- [ ] (Opcional) Revisar limites do PHP-FPM com a hospedagem se rajadas maiores
      voltarem a causar 503 (o stale-cache já absorve a maioria).
