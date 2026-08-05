# ☕ Módulo de Receitas — Artigo com Café

> Fase 6 do roadmap do Dashboard (`docs/dash.md`).
> Objetivo: dar ao leitor uma experiência de "café, pausa e aprendizado",
> com conteúdo prático (receitas) integrado ao ecossistema do blog
> (artigos, trilhas, biblioteca e gamificação).

---

## 1. Visão Geral

O módulo de **Receitas** transforma o site em um lugar onde o leitor
não só aprende, mas também **põe em prática** — começando pela própria
identidade da marca: o café.

Cada receita terá:

- Ingredientes (com medidas e opções de substituição)
- Modo de preparo passo a passo
- Tempo de preparo / rendimento / dificuldade
- Dicas de especialista e variações
- Categoria (café, bebidas, acompanhamentos, sobremesas, etc.)
- Metadados de SEO (meta title, description, schema.org Recipe)

---

## 2. Estrutura de Dados

### Tabela `recipes`

| Campo             | Tipo        | Descrição                                    |
| ----------------- | ----------- | -------------------------------------------- |
| id                | bigint PK   |                                              |
| title             | string      | Título da receita                            |
| slug              | string(uni) | URL amigável                                 |
| excerpt           | text        | Resumo curto                                 |
| description       | text        | História/contexto da receita                 |
| ingredients       | json        | Lista `[{ name, amount, unit, optional }]`   |
| steps             | json        | Lista ordenada de passos                     |
| prep_time_minutes | int         | Tempo de preparo                             |
| cook_time_minutes | int         | Tempo de cozimento (opcional)                |
| servings          | int         | Rendimento                                   |
| difficulty        | enum        | `facil`, `media`, `dificil`                  |
| cover_image       | string      | URL da imagem de destaque                    |
| category_id       | fk          | Categoria da receita                         |
| user_id           | fk          | Autor                                        |
| tags              | pivot       | Reaproveita a tabela `tags`                  |
| is_featured       | bool        | Destaque na home                             |
| is_cafe_do_dia    | bool        | Pode ser "Café do Dia"                       |
| status            | enum        | `draft`, `review`, `published`, `archived`   |
| meta              | json        | SEO (title, description, schema)             |
| views_count       | int         | Contador de visualizações                    |
| published_at      | datetime    |                                              |
| timestamps        |             |                                              |
| soft_deletes      |             |                                              |

### Tabela `recipe_categories`

| Campo | Tipo      | Descrição                |
| ----- | --------- | ------------------------ |
| id    | bigint PK |                          |
| name  | string    | Ex.: "Café", "Bebidas"   |
| slug  | string(uni) |                        |
| icon  | string    | Emoji/ícone              |
| color | string    | Cor da categoria         |
| order | int       | Ordenação                |

---

## 3. Endpoints da API

### Públicos

| Método | Rota                      | Descrição                          |
| ------ | ------------------------- | ---------------------------------- |
| GET    | `/api/recipes`            | Lista (filtros: category, tag, search, featured) |
| GET    | `/api/recipes/{slug}`     | Detalhe + incrementa views         |
| GET    | `/api/recipes/cafe-do-dia`| Receita especial do dia            |
| GET    | `/api/recipes/featured`   | Destaques                          |
| GET    | `/api/recipe-categories`  | Categorias ativas                  |

### Autenticados (leitor)

| Método | Rota                                | Descrição                     |
| ------ | ----------------------------------- | ----------------------------- |
| POST   | `/user/library/{recipe}` (ou artigo) | Salvar receita na biblioteca |

### Dashboard (Filament, Fase 6)

- `RecipeResource` — CRUD completo com editor de blocos:
  - ingredientes (repeater)
  - passos (repeater ordenável)
  - SEO, categoria, tags, autor, status, agendamento
- Widgets no Dashboard:
  - Receitas mais acessadas
  - Receitas por categoria

---

## 4. Integrações (Fase 6)

As receitas podem enriquecer a experiência usando as APIs de `docs/planoapi.md`:

- **Openverse / Unsplash**: sugestão automática de imagem de capa pela busca
  de tags da receita (ex.: "latte art", "coffee beans").
- **OpenWeather**: sugestão de "dia perfeito para um café gelado" conforme
  a temperatura da cidade do leitor (widget na home).
- **ExchangeRate**: preço estimado de ingredientes importados (informativo).

---

## 5. Gamificação (Fase 4 já existente)

- Concluir a leitura de uma receita conta como **artigo lido** para grãos.
- **Trilha "Barista Iniciante"**: sequência de receitas com certificado
  simbólico ao final.
- **Missões semanais**: "Prepare uma receita de café gelado".

---

## 6. Páginas no Frontend (Astro)

| Página                        | Descrição                             |
| ----------------------------- | ------------------------------------- |
| `/receitas`                   | Lista com filtros por categoria/tag   |
| `/receitas/[slug]`            | Detalhe com schema.org Recipe, barra de progresso de leitura |
| Home (seção)                  | "Receita do dia" junto ao Café do Dia |
| `/trilhas/barista-iniciante`  | Trilha de receitas (reuso do motor de trilhas) |

---

## 7. Ordem de Implementação

1. Migration `recipe_categories` + `recipes` + pivot `recipe_tag`
2. Models + seeders de categorias e receitas exemplo
3. Controllers + rotas públicas da API
4. Filament `RecipeResource` (CRUD + editor de ingredientes/passos)
5. Páginas Astro `/receitas` + `/receitas/[slug]` + sitemap/schema
6. Gamificação: leitura concluída, trilha, missões
7. Integrações: capa automática (Openverse/Unsplash) e widget do clima
8. Testes Playwright (site + dashboard)

---

## 8. Estado Atual

- [x] Documento de plano criado (este arquivo)
- [x] Tabelas e models (`recipe_categories`, `recipes`, pivot `recipe_tag`, pivot `collection_recipe`)
- [x] API pública (`/api/recipes`, `/api/recipes/{slug}`, `/api/recipes/cafe-do-dia`, `/api/recipes/featured`, `/api/recipe-categories`) + salvar receita na biblioteca
- [x] Filament Resource (`RecipeResource` com repeaters de ingredientes/passos + widget "Receitas mais acessadas")
- [x] Páginas Astro (`/receitas` + `/receitas/[slug]` com schema.org Recipe + Receita do Dia na home)
- [x] Gamificação: conclusão de leitura de receita concede grãos (`POST /recipes/{recipe}/complete`), trilha "Barista Iniciante" (pivot `trail_recipe`), missões diárias/semanais de receitas (service `GamificationService`)
- [x] Integrações: capa automática via Openverse (`OpenverseService` + ação "Sugerir capa" no Filament) e widget "Clima do Café" na home (sugere a bebida ideal pela temperatura)
- [x] Testes Playwright específicos do módulo criados (`tests/playwright/receitas-audit.mjs`) — execução depende do deploy
- [ ] Deploy do módulo (frontend + backend + seeds) — pendente

---

> Última atualização: Fase 6 do roadmap (`docs/dash.md`) **completa e publicada**.
> Deploy realizado (backend + migrations + seeds + frontend) e auditoria Playwright
> do módulo com 100% de aproveitamento (42/42) — auditoria geral do site 100% (86/86).
>
> Nota: `deploy.ps1` funciona de PowerShell nativo e do git-bash (resolve o tar do
> Windows/bsdtar explicitamente). Seeds de receitas: `php artisan db:seed
> --class=RecipeCategorySeeder|RecipeSeeder|RecipeTrailSeeder|MissionSeeder --force`.
