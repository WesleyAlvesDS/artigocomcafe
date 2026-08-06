# 📚 Documentação — Artigo com Café

Índice central de toda a documentação do projeto. Tudo que muda no sistema deve
manter estes documentos atualizados.

## 🧭 Visão do produto

| Documento | Conteúdo |
|-----------|----------|
| [visao2.md](visao2.md) | **PRD v3.0 (atual)** — plataforma de conhecimento, IA, gamificação, Central de APIs |
| [visao1.md](visao1.md) | 🕰️ Visão original v1.0 (documento histórico) |

## 🏗️ Arquitetura e planos

| Documento | Conteúdo |
|-----------|----------|
| [dash.md](dash.md) | Plano do Dashboard/CMS + **estado real de implementação por fase** |
| [planoapi.md](planoapi.md) | Plano de APIs externas + **status de integração de cada uma** |
| [receitas.md](receitas.md) | Módulo de Receitas (gamificação, trilha Barista, deploy, auditoria) |

## 🔌 Specs das APIs externas

Em [apis/](apis/) — exemplos reais de resposta (JSON) e snippets de consumo (Python):

- `The_Guardian_Open_Platform.json` + snippet
- `OpenWeatherMap.json` + snippet
- `ExchangeRate-API.json` + snippet

Os serviços correspondentes no backend estão em `backend/app/Services/Integrations/`.

## 🛠️ Operações

| Documento | Conteúdo |
|-----------|----------|
| [ops/acessarserver.md](ops/acessarserver.md) | Acesso SSH / DirectAdmin ao servidor ValueHost |

## 🧑‍💻 Desenvolvimento

| Documento | Conteúdo |
|-----------|----------|
| [skillmaster.md](skillmaster.md) | Skill permanente — Playwright como parceiro de desenvolvimento |
| [../AGENTS.md](../AGENTS.md) | Convenções do Astro para agentes de IA |

## 📋 Relatórios de sessão

| Documento | Conteúdo |
|-----------|----------|
| [relatorios/sessao-2026-08-06.md](relatorios/sessao-2026-08-06.md) | Reorganização da documentação, segurança (credenciais) e auditorias 100% |

## 🧪 Testes

Audits Playwright em `../tests/playwright/`:

```bash
node ../tests/playwright/run-all-audits.mjs           # TUDO (site + dash) com relatório final
node ../tests/playwright/run-all-audits.mjs --site    # Somente auditorias do site
node ../tests/playwright/run-all-audits.mjs --dash    # Somente auditorias do dashboard
node ../tests/playwright/run-all-audits.mjs --all     # Tudo, incluindo painel do leitor
node ../tests/playwright/run-all-audits.mjs --report  # Gera test-results/auditoria-<data>.md

# Ou via npm (a partir da raiz):
npm run audit / npm run audit:site / npm run audit:dash / npm run audit:all

# Auditorias individuais:
node ../tests/playwright/full-audit.mjs     # Auditoria geral do site (86/86 ✓)
node ../tests/playwright/receitas-audit.mjs # Módulo de receitas (42/42 ✓)
node ../tests/playwright/site-audit.mjs     # Métricas / SEO (44/44 ✓)
node ../tests/playwright/a11y-audit.mjs     # Acessibilidade WCAG 2.1 AA (0 violações ✓)
node ../tests/playwright/dash-login.mjs     # Login do dashboard Filament (8/8 ✓)
node ../tests/playwright/dash-crud.mjs      # CRUD do dashboard (15/15 ✓)
node ../tests/playwright/dash-central-editorial.mjs  # Central Editorial (6/6 ✓)
node ../tests/playwright/dash-audit.mjs     # Dashboard do leitor (31/31 ✓)
```

> O runner unificado executa em sequência e imprime um **relatório consolidado**
> (status por auditoria + score global). Respeita `BASE_URL`, `TEST_USER`,
> `TEST_PASS`, `DASH_EMAIL` e `DASH_PASSWORD` do ambiente.

## 🚀 Deploy

- `deploy.ps1` (raiz) — backend + frontend; ver [../README.md](../README.md#deploy-valuehost)

---

## 📊 Relatório Consolidado do Projeto

> **Documento vivo** — atualizar sempre que o estado do sistema mudar.
> Fontes: [dash.md](dash.md), [planoapi.md](planoapi.md), [receitas.md](receitas.md) e auditorias Playwright.

### Roadmap (Dashboard/CMS)

| Fase | Escopo | Status |
|------|--------|--------|
| Fase 1 | Dashboard, Login, Usuários, Artigos, Categorias, Tags | ✅ Concluída |
| Fase 2 | SEO, biblioteca de mídia, logs | ✅ Concluída |
| Fase 3 | Integrações (widgets + página de chaves) | ✅ Concluída |
| Fase 4 | Gamificação, biblioteca do usuário, trilhas | ✅ Concluída |
| Fase 5 | Multi-site, multi-idioma, API pública | ⬜ Planejada |
| Fase 6 | Receitas + Central Editorial (APIs no Dash) | ✅ Concluída |
| Fase 7 | Verificação e testes (estabilidade, correção de bugs) | ✅ Auditorias 100% |

### Módulos do Dashboard

| Módulo | Status |
|--------|--------|
| Dashboard / Artigos / Categorias / Tags / Usuários / Mídia | ✅ Implementado |
| Receitas / Logs / Central Editorial / Integrações / Gamificação | ✅ Implementado |
| Autores (CRUD) | ⬜ Futuro |
| Roles/Permissões avançadas (RBAC) | ⬜ Parcial |
| SEO Score / Analytics / Assistente Editorial IA / Newsletter / Calendário editorial | ⬜ Futuro |

### Integrações externas (backend)

| API | Status |
|-----|--------|
| The Guardian / Hacker News / Currents / GNews | ✅ Integradas (Central Editorial) |
| OpenWeather / ExchangeRate / Openverse | ✅ Integradas |
| IPinfo / Unsplash / Groq / Gemini | ⬜ Planejadas |

### Últimas auditorias (Playwright, ago/2026)

| Auditoria | Resultado |
|-----------|-----------|
| `full-audit.mjs` (site, desktop+mobile) | ✅ 88/88 (100%) |
| `receitas-audit.mjs` | ✅ 42/42 (100%) |
| `a11y-audit.mjs` (WCAG 2.1 AA, 18 páginas) | ✅ 0 violações |
| `dash-login.mjs` | ✅ 8/8 |
| `dash-crud.mjs` | ✅ 15/15 |
| `dash-central-editorial.mjs` | ✅ 6/6 |
| `site-audit.mjs` | ✅ 44/44 |
| `dash-audit.mjs` (`/dashboard/`) | ✅ 31/31 — painel do leitor no ar após deploy |
| `npm run build` (Astro) | ✅ 37 páginas |
| `php -l` (backend) | ✅ sem erros de sintaxe |

### Pendências

- ✅ **Resolvido:** deploy da página `/dashboard/` realizado (antes 404, agora 31/31 ✓).
- 🔄 **Trocar senha FTP** no DirectAdmin (rotação) — credenciais antigas ficaram no histórico do git.
- 🔄 **Credenciais padrão nos testes** (`dash-login.mjs`, `full-audit.mjs`,
  `dash-audit.mjs`) — usar apenas env vars (`DASH_EMAIL`, `DASH_PASSWORD`,
  `TEST_USER`, `TEST_PASS`) sem defaults, para não versionar credenciais.

### Segurança

- 🔴 **Resolvido:** credenciais FTP que estavam em texto puro no git foram
  movidas para `.env.server` (gitignored). **Trocar a senha no DirectAdmin**
  (rotação) — ver [ops/acessarserver.md](ops/acessarserver.md).

---

*Última atualização: agosto/2026 — reorganização de arquivos, unificação da documentação e auditoria completa (100%).*
