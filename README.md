# ☕ Artigo com Café — artigocomcafe.com

Plataforma de conhecimento sobre café, tecnologia e cultura: blog estático de alta performance
(Astro) alimentado por uma API própria (Laravel) com um painel editorial completo (Filament).

> **Leia também:** [Índice completo da documentação →](docs/README.md)

## Stack

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Astro 5 + React Islands + TypeScript |
| **Backend / API** | Laravel 12 + PHP 8.3 + Sanctum |
| **Dashboard** | Filament v4 (Livewire + Alpine + Tailwind) |
| **Banco de dados** | MariaDB |
| **Cache / Fila** | Redis |
| **Testes** | Playwright (E2E) + PHPUnit |
| **Hospedagem** | ValueHost — DirectAdmin (VPS 5 vCPU / 5 GB RAM) |

## Domínios

- **Site público** — `artigocomcafe.com` (build estático em `dist/`)
- **Dashboard (CMS)** — `dash.artigocomcafe.com` (Laravel + Filament)
- **API** — `back.artigocomcafe.com/api` (consumida pelo site via `api-proxy.php`)

## Estrutura

```
artigocomcafe/
├── src/                    # Frontend Astro
│   ├── components/         #   Astro + React components
│   ├── layouts/            #   Layout Base (SEO, tema, fontes)
│   ├── lib/                #   api.ts, laravel.ts, wordpress.ts, utils
│   ├── pages/              #   Home, Blog, Receitas, Trilhas, Perfil, Jornada…
│   └── styles/             #   Design system (global.css)
├── backend/                # API Laravel + Dashboard Filament
│   ├── app/Filament/       #   Recursos, páginas e widgets do painel
│   ├── app/Http/Controllers/Api/  # Endpoints REST
│   ├── app/Services/       #   Gamificação + Integrações (clima, câmbio, notícias…)
│   ├── database/           #   Migrations + seeders idempotentes
│   └── routes/api.php      #   Rotas da API
├── docs/                   # Documentação do projeto
│   ├── apis/               #   Specs das APIs externas (JSON + snippets Python)
│   ├── ops/                #   Operações (acesso ao servidor)
│   └── README.md           #   Índice dos documentos
├── scripts/                # Utilitários (composer, fetchers de API)
├── tests/playwright/       # Audits E2E (site, receitas, a11y, dashboard)
├── public/                 # Assets estáticos + api-proxy.php
├── deploy.ps1              # Deploy automático (frontend + backend)
└── astro.config.mjs
```

## Comandos (frontend)

| Comando | Ação |
|---------|------|
| `npm install` | Instala dependências |
| `npm run dev` | Dev server local |
| `npm run build` | Build de produção → `dist/` |
| `npm run preview` | Preview do build |
| `npm run astro` | CLI do Astro |

## Deploy (ValueHost)

O `deploy.ps1` funciona tanto do PowerShell nativo quanto do git-bash
(usa o `tar.exe` nativo do Windows via `Get-WindowsTar()`).

> 🔐 **Segredos:** credenciais de servidor (FTP/SSH) ficam em `.env.server`
> (raiz, **gitignored**). Nunca commitar credenciais nos docs — ver
> [docs/ops/acessarserver.md](docs/ops/acessarserver.md).

```powershell
.\deploy.ps1 -All        # Backend (migrations) + frontend (build + upload)
.\deploy.ps1 -Back       # Somente backend (roda migrate --force e otimiza)
.\deploy.ps1 -Front      # Somente frontend (build + upload do dist/)
.\deploy.ps1 -All -DryRun  # Mostra o que seria feito, sem executar
```

> **Ordem recomendada:** backend primeiro (a API precisa estar no ar para o build
> gerar as páginas dinâmicas), depois seeds, depois frontend.

## Dashboard (CMS)

O painel administrativo é construído com **Filament** e inclui:

- **CRUDs**: Artigos, Categorias, Tags, Mídia, Usuários, Receitas, Logs de atividade
- **Central Editorial**: busca multi-fonte (Guardian, Hacker News, Currents, GNews)
  e criação de rascunho de artigo com capa sugerida via Openverse
- **Integrações**: página com chaves de API + widgets de clima, câmbio e manchetes
- **Gamificação**: missões, grãos, trilhas de conhecimento

## API

Endpoints principais em `backend/routes/api.php`:

- `GET /api/articles` — artigos do blog
- `GET /api/recipes` — receitas (+ `/api/recipes/{slug}`, progresso, conclusão)
- `GET /api/integrations/weather` — clima para a cidade
- `GET /api/integrations/exchange-rate` — câmbio
- `GET /api/integrations/headlines` — manchetes
- `POST /api/auth/*` — login, cadastro, recuperação de senha
- Gamificação: `POST /api/articles/*/complete`, `POST /api/recipes/*/complete`,
  `GET /api/missions`, `POST /api/missions/{mission}/claim`…

## Testes (Playwright)

```bash
node tests/playwright/full-audit.mjs        # Auditoria geral do site (100% atual)
node tests/playwright/receitas-audit.mjs    # Módulo de receitas
node tests/playwright/site-audit.mjs        # Métricas e SEO
node tests/playwright/a11y-audit.mjs        # Acessibilidade (0 violações)
node tests/playwright/dash-login.mjs        # Login do dashboard
node tests/playwright/dash-crud.mjs         # CRUD do dashboard
```

## Documentação

Todos os documentos vivem em [`docs/`](docs/README.md): visão do produto,
plano do dashboard, plano de APIs, módulo de receitas e operações do servidor.
