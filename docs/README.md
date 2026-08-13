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
| [plano-fluxo-login.md](plano-fluxo-login.md) | **Auditoria do fluxo de login** (nós/arestas) + melhorias implementadas |

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
| [relatorios/sessao-2026-08-12-navbar.md](relatorios/sessao-2026-08-12-navbar.md) | Navbar flexível/data-driven, bug do blog mal formatado e AdSterraNative |
| [relatorios/sessao-2026-08-12-arealogada.md](relatorios/sessao-2026-08-12-arealogada.md) | Área logada: navegação/breadcrumbs, CSS do editor, UserMenu e SmartSidebar |
| [relatorios/sessao-2026-08-13.md](relatorios/sessao-2026-08-13.md) | Cookies tudo por padrão, IA sem login, hero imersivo, deploy sincronizado |
| [relatorios/sessao-2026-08-13-design-perf.md](relatorios/sessao-2026-08-13-design-perf.md) | Navbar dropdown, selects dark, área do leitor fluida, filtros de receitas client-side, busca unificada, perf + swipe |

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
node ../tests/playwright/dash-audit.mjs     # Dashboard do leitor (49/49 ✓)
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
| `full-audit.mjs` (site, desktop+mobile) | ✅ 86/86 (100%) |
| `receitas-audit.mjs` | ✅ 42/42 (100%) |
| `a11y-audit.mjs` (WCAG 2.1 AA, 18 páginas) | ✅ 0 violações |
| `dash-login.mjs` | ✅ 8/8 |
| `dash-crud.mjs` | ✅ 15/15 |
| `dash-central-editorial.mjs` | ✅ 6/6 |
| `site-audit.mjs` | ✅ 44/44 |
| `dash-audit.mjs` (`/dashboard/`) | ✅ 49/49 — painel do leitor no ar após deploy |
| `npm run build` (Astro) | ✅ 432 páginas |
| `php -l` (backend) | ✅ sem erros de sintaxe |

### Pendências

- ✅ **Resolvido:** deploy da página `/dashboard/` realizado (antes 404, agora 31/31 ✓).
- ✅ **Resolvido:** credenciais FTP/DB removidas dos scripts de deploy (`deploy-ftps.sh`,
  `deploy-ftps-par.sh`, `backend/deploy_backend.sh`) → movidas para `scripts/secrets.sh`
  (gitignored, fonte única). Restam no histórico do git → **trocar a senha no DirectAdmin**.
- 🔄 **Trocar senha FTP** no DirectAdmin (rotação) — credenciais antigas ficaram no histórico do git.
- ✅ **Resolvido: defaults de credenciais removidos de TODOS os testes** —
  `dash-crud.mjs` e `dash-central-editorial.mjs` agora exigem `DASH_EMAIL`/`DASH_PASSWORD`
  (sem defaults). Nenhuma credencial versionada.
- ✅ **Resolvido: AdSense no `<head>`** — script `adsbygoogle.js` adicionado ao `Base.astro`
  (todas as páginas) junto da meta tag `google-adsense-account`.
- ✅ **Resolvido: overflow no mobile** — `grid-template-columns: 1fr` → `minmax(0,1fr)`
  nas listagens de blog/receitas (coluna vazava ~45px do container no mobile).
- ✅ **Resolvido: a11y crítico** — `<select>` de filtros de receitas sem nome acessível
  ganharam `aria-label` (0 violações em receitas).
- ✅ **Resolvido: fluxo de login auditado e melhorado** — ver [plano-fluxo-login.md](plano-fluxo-login.md):
  redirecionamento pós-login para `/dashboard/`, usuário já logado em `/entrar`/`/cadastro`
  é redirecionado, `reset_token` só em ambiente local, rotas `/user/posts` implementadas
  (widget "Meus Artigos" do dashboard funcionando), token inválido limpo no `UserMenu`,
  estado de erro no KnowledgeMap. Auditoria `dash-audit.mjs` agora 49/49 (100%).

### Segurança

- 🔴 **Resolvido:** credenciais FTP que estavam em texto puro no git foram
  movidas para `.env.server` e `scripts/secrets.sh` (gitignored). **Trocar a senha
  no DirectAdmin** (rotação) — ver [ops/acessarserver.md](ops/acessarserver.md).
- 🔴 **Resolvido:** `scripts/secrets.sh` adicionado ao `.gitignore`; os 3 scripts de
  deploy que tinham a senha em texto puro agora carregam de lá (fonte única).
- ✅ **Hook `pre-commit` anti-credenciais** — `scripts/pre-commit` bloqueia commit de
  `.env*`, senhas, API keys e tokens (testado). Instale com `cp scripts/pre-commit .git/hooks/pre-commit`.
- ✅ **IA liberada para visitantes (13/08/2026)** — rota `/api/ai/ask` sem `auth:sanctum`
  (login opcional, mantém `throttle:10,1`); abas Ferramentas/Posts do widget de IA usam
  `/articles` públicos quando deslogado. Deploy frontend + backend realizado no servidor.

---

*Última atualização: agosto/2026 — reorganização de arquivos, unificação da documentação,
auditoria completa (100%), cookies com tudo habilitado por padrão, IA funcional sem login
e deploy sincronizado no servidor.*
