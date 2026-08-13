# 📋 Relatório de Sessão — 2026-08-13 (Bugs de Navegação + SEO)

> Formato obrigatório da [skillmaster](../skillmaster.md).
> Sessão: **caça de bugs de precisão em todo o site** (navegação SPA, hero, navbar,
> menu mobile, filtros, TOC) **+ 5 páginas SEO de engajamento + skill bug-hunter**.

---

## 🔍 Bugs encontrados e corrigidos (causa-raiz)

| # | Severidade | Sintoma | Causa-raiz | Correção |
|---|-----------|---------|-----------|----------|
| 1 | 🔴 Alta | **"Preciso apertar F5 para renderizar"** — após navegação SPA, dropdown de Receitas para de abrir no hover, hamburger/menu mobile quebram | `transition:persist="site-header"` no `<Header>` (Base.astro) NÃO é propagado ao elemento raiz em componente `.astro`. Header era substituído a cada swap e o script do bundle rodava uma única vez → listeners mortos | Script do header reescrito: `initHeader()` re-executado em `astro:page-load`, delegação de clique no `document`, guardas `data-hx-bound`/`window.__headerLifecycleBound`, `astro:before-swap`/`after-swap` para fechar menu/dropdown e reavaliar links ativos |
| 2 | 🔴 Alta | **Navbar duplicada abaixo do footer** em /blog (produção) | Persist de header + scopes de transição do build antigo (sub-elementos com `transition:name`/`persist` duplicavam no swap) | Removidos `transition:persist`/`transition:name` dos sub-elementos e do uso no Base (props não propagadas). Confirmado via teste: header único + nenhuma navbar após o footer |
| 3 | 🔴 Alta | **Dropdown "Receitas" não abre no hover** | `.header { contain: layout style paint }` clipa o painel que renderiza ABAIXO do header (só 3,8px visíveis) | Removido `contain` e `will-change: transform` do `.header` |
| 4 | 🔴 Alta | **Menu mobile abre com 108px de altura** (não tela cheia) | `backdrop-filter` no `.header` cria **containing block** para o menu `position:fixed` → preso ao header | Menu mobile movido para fora do `<header>` no DOM (irmão fixo cobre a viewport) |
| 5 | 🟠 Média | Hero: imagem de fundo encolhia e revelava as bordas ("quadrados") | Zoom-out (scale < 1) no scroll | Script no Base.astro: **zoom-in** (scale 1→1.06) + translateY + blur/fade suaves, sempre ≥ 1 |
| 6 | 🟠 Média | **Filtros de Dificuldade/Tempo em /receitas nunca aplicavam** | Selects com `onchange="this.form.submit()"` estavam FORA do `<form>` → `this.form` era `null` | Filtros movidos para dentro do form (o form agora agrupa busca + filtros) |
| 7 | 🟠 Média | **TOC de artigos não funciona** (links de âncora + scroll-spy) | TOC gerava `#id` por slugify, mas o conteúdo `set:html` não recebia `id` nos h2/h3 | Função única de slugify + `addHeadingIds()` injeta os ids no conteúdo (com dedupe) |
| 8 | 🟡 Baixa | **Jitter no texto do hero ao rolar** | Dois scripts escreviam `transform` no mesmo `[data-parallax]` (Hero.astro + ScrollAnimations) | ScrollAnimations agora só trata `[data-parallax-speed]` |
| 9 | 🟡 Baixa | Elementos invisíveis após SPA (reveal) | Observer podia perder elementos no viewport na troca; `window.load` não dispara em SPA | Safety net em `astro:page-load` (+350ms) força reveal dos elementos já no viewport (Base + ScrollAnimations) |

## 📁 Arquivos modificados/criados

| Arquivo | Ação |
|---|---|
| `src/components/Header.astro` | Script resiliente a SPA + CSS sem contain/will-change-transform + menu mobile fora do header |
| `src/layouts/Base.astro` | Removidas props inúteis de persist; safety net de reveal; (zoom-in do hero já presente) |
| `src/components/ScrollAnimations.astro` | Parallax só `[data-parallax-speed]` + safety net de reveal |
| `src/pages/receitas/index.astro` | Filtros dentro do `<form>` (fix dos selects) |
| `src/pages/blog/[slug].astro` | TOC com ids injetados no conteúdo (slugify único) |
| `src/components/Footer.astro` | Nova coluna "Guia do Café" (5 links SEO) |
| `src/pages/index.astro` | Seção "Guia do Café" na home (interlinking interno) |
| `src/data/seoLanding.ts` | **Novo** — conteúdo das 5 páginas SEO |
| `src/components/SeoLandingPage.astro` | **Novo** — layout das páginas SEO (FAQ accordion + FAQPage/Article JSON-LD) |
| `src/pages/{metodos-de-preparo,tipos-de-graos,como-fazer-cafe,cafes-do-brasil,glossario-do-cafe}.astro` | **Novos** — 5 páginas SEO |
| `public/sitemap-pages.xml` | +5 URLs novas |
| `.agents/skills/bug-hunter/SKILL.md` | **Novo** — skill de caça a bugs de precisão (playbook + padrões aprendidos) |
| `tests/playwright/nav-diagnostic.mjs` | Aprimorado (viewport-aware + checagem de navbar duplicada) |
| `tests/playwright/{mobile-menu-check,dash-flow-check,seo-filter-check,live-404-check}.mjs` | **Novos** — testes de regressão |

## 🧪 Testes executados (todos ✅)

| Teste | Resultado |
|---|---|
| `npm run build` | ✅ 437 páginas |
| `nav-diagnostic.mjs` (3× — estabilidade) | ✅ TUDO OK (SPA, reveal, dropdown pós-nav, hero zoom-in, sem navbar duplicada) |
| `mobile-menu-check.mjs` | ✅ menu tela cheia, navega SPA, fecha, reabre pós-nav |
| `seo-filter-check.mjs` | ✅ selects submetem form; 5 páginas SEO com h1+FAQ+JSON-LD+canonical; FAQ abre |
| `dash-flow-check.mjs` (produção, credenciais reais) | ✅ login → /dashboard "Olá, Wesley 👋" → /jornada |
| `live-404-check.mjs` (produção) | ✅ nenhum 404/5xx nas páginas existentes |

## 🚀 Deploy (autorizado pelo usuário — 13/08/2026)

- `deploy.ps1 -Front` via PowerShell (PATH limpo p/ tar.exe do Windows) — **FRONT_OK**.
- Permissões corrigidas no servidor (`chmod 755` dirs / `644` files).
- Validação pós-deploy em produção (`prod-validation.mjs`) — **11/11 PASS**:
  hero zoom-in (scale 1.04), dropdown abre + reabre pós-SPA, /blog sem navbar duplicada,
  menu mobile tela cheia (844px), 5 páginas SEO com FAQPage JSON-LD, **0 erros de console**.

## 📌 Pendências

- [ ] Re-auditoria completa Playwright (`run-all-audits.mjs --all --report`).
- [ ] Registrar mais padrões no skill bug-hunter conforme novas causas-raiz aparecerem.
- [ ] Commit do working tree (mudanças do editor/dashboard de sessões anteriores + esta sessão).

*Relatório gerado em 2026-08-13 · Skillmaster: Playwright como parceiro de desenvolvimento.*
