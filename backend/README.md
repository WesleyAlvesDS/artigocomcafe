# ☕ Backend — API Laravel + Dashboard Filament

Backend do **Artigo com Café**: API REST consumida pelo site público (Astro) e
painel administrativo completo em Filament.

## Stack

- **Laravel 12** — PHP 8.3+
- **Filament v4** — painel administrativo (`dash.artigocomcafe.com`)
- **Laravel Sanctum** — autenticação de API
- **MariaDB** — banco de dados
- **Redis** — cache e filas

## Estrutura principal

```
backend/app/
├── Filament/
│   ├── Resources/          # CRUDs: Articles, Categories, Tags, Media, Users, Recipes, ActivityLogs
│   ├── Pages/              # Integrações (chaves de API) + Central Editorial
│   └── Widgets/
│       └── Integrations/   # Headlines, Weather, ExchangeRate
├── Http/Controllers/Api/   # Endpoints REST (Auth, Articles, Recipes, Missions, Trails, Library…)
├── Models/                 # Article, Recipe, User, Mission, Trail, ReadingProgress…
├── Services/
│   ├── GamificationService.php
│   └── Integrations/       # OpenWeather, ExchangeRate, Guardian, HackerNews, Openverse, Currents, GNews
└── Providers/Filament/     # AdminPanelProvider (painel, navegação)
```

## Dashboard (Filament)

Painel publicado em `dash.artigocomcafe.com` (subdomínio separado, mesmo banco).

- **CRUDs**: Artigos, Categorias, Tags, Mídia, Usuários, Receitas, Logs de atividade
- **Central Editorial** (`CentralEditorial`): busca notícias em múltiplas fontes
  (The Guardian, Hacker News, Currents, GNews) e cria rascunho de artigo
  com capa sugerida via Openverse (Creative Commons)
- **Página Integrações**: cadastro das chaves de API (guardadas em `settings` table)
- **Widgets**: Manchetes do dia, Clima (OpenWeather) e Câmbio (ExchangeRate) no dashboard

## API

Rotas em `routes/api.php` (prefixo `/api`). Principais grupos:

| Grupo | Endpoints |
|-------|-----------|
| Artigos | `GET /articles`, `GET /articles/{slug}`, progresso de leitura, conclusão |
| Receitas | `GET /recipes`, `GET /recipes/{slug}`, `POST /recipes/{recipe}/progress`, `/complete` |
| Integrações | `GET /integrations/weather?city=`, `/exchange-rate`, `/headlines` |
| Auth | `POST /auth/register`, `/auth/login`, `/auth/logout`, recuperação/reset de senha |
| Gamificação | Missões (`GET/POST /missions`), grãos, trilhas (`GET /trails`) |
| Biblioteca | `GET/POST /library`, favoritos |
| Clima do Café | `GET /recipes/cafe-do-dia` |

## Integrações externas

Serviços em `app/Services/Integrations/` — padrão: `ApiClient` com cache +
chave em `Setting::apiKey('servico')` (configurada no painel → Integrações):

| Serviço | Uso |
|---------|-----|
| **OpenWeather** | Clima do Café (home) + widget do dashboard |
| **ExchangeRate-API** | Câmbio (widget do dashboard) |
| **The Guardian Open Platform** | Manchetes + Central Editorial |
| **Hacker News** | Central Editorial (Firebase API, sem chave) |
| **Currents API** | Central Editorial |
| **GNews** | Central Editorial |
| **Openverse** | Sugestão de capas Creative Commons (receitas e artigos) |

Specs e exemplos de resposta em [`../docs/apis/`](../docs/apis/).

## Seeders (idempotentes)

```bash
php artisan db:seed --class=RecipeCategorySeeder --force
php artisan db:seed --class=RecipeSeeder --force
php artisan db:seed --class=RecipeTrailSeeder --force
php artisan db:seed --class=MissionSeeder --force
php artisan db:seed --class=DatabaseSeeder --force   # tudo
```

Todos os seeders usam `updateOrCreate` — podem rodar quantas vezes for necessário
sem duplicar dados.

## Comandos úteis

```bash
php artisan migrate --force          # Migrations em produção
php artisan db:seed --force          # Seeds
php artisan optimize                 # Cache de config/rotas/views
php artisan tinker                   # Shell interativo
php artisan test                     # PHPUnit
php -l app/...                       # Checagem de sintaxe
```

## Deploy

O deploy do backend é feito pelo `deploy.ps1` da raiz (`-Back` ou `-All`),
que empacota `app`, `config`, `routes`, `database`, `bootstrap`, `resources`,
`artisan`, `composer.json` e `composer.lock`, envia via scp e roda
`migrate --force` + `optimize` no servidor.

> ⚠️ Nunca rode `migrate:fresh` ou `db:seed` destrutivos em produção.
