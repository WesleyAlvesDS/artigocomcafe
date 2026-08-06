# ☕ Dashboard Artigo com Café — Master Plan

> **Documento vivo** — além do plano, este arquivo registra o **estado real de
> implementação** de cada fase (última atualização: agosto/2026).

## Objetivo

Criar um CMS próprio, moderno, rápido e inteligente para gerenciar todo o
ecossistema do Artigo com Café.

O Dashboard é responsável por: produção de conteúdo, gestão de usuários, SEO,
inteligência artificial, analytics, biblioteca, configurações, integrações e segurança.

## Arquitetura

```
                    INTERNET
                        │
              dash.artigocomcafe.com
                        │
                 Laravel + Filament
                        │
        ┌───────────────┼───────────────┐
        │               │               │
     Dashboard        API           Serviços
        │               │           (integrações)
        │           MariaDB
        │
      Redis
```

- **Site público** (artigocomcafe.com) → foco na experiência do leitor (Astro estático)
- **Dashboard** (dash.artigocomcafe.com) → foco na operação editorial (Filament)
- **Mesmo backend Laravel** → modelos, regras de negócio e banco compartilhados
- **Subdomínio separado** → autenticação, middleware e permissões próprias

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Backend | Laravel, PHP 8.3+, Sanctum, Queue, Scheduler |
| Frontend (painel) | Filament v4, Livewire, Alpine.js, TailwindCSS |
| Banco | MariaDB |
| Cache | Redis |
| Testes | Playwright (E2E), PHPUnit |
| Qualidade | PHPStan, Laravel Pint |

## 📦 Módulos — estado de implementação

| Módulo | Status |
|--------|--------|
| Dashboard (visão geral, widgets) | ✅ Implementado |
| Artigos (CRUD completo) | ✅ Implementado |
| Categorias / Tags (CRUD) | ✅ Implementado |
| Usuários (CRUD + RBAC básico) | ✅ Implementado |
| Mídia / Biblioteca de mídia | ✅ Implementado |
| Receitas (CRUD + capa via Openverse) | ✅ Implementado |
| Logs de atividade (CRUD) | ✅ Implementado |
| **Central Editorial** (busca multi-fonte + rascunho) | ✅ Implementado |
| Integrações (página de chaves + widgets) | ✅ Implementado |
| Gamificação (missões, grãos, trilhas) | ✅ Implementado |
| Autores (CRUD) | ⬜ Futuro |
| Roles / Permissões avançadas (RBAC) | ⬜ Parcial (futuro) |
| SEO Score / sugestões de IA | ⬜ Futuro |
| Analytics (leitores, mais lidos) | ⬜ Futuro |
| Assistente Editorial com IA | ⬜ Futuro |
| Newsletter | ⬜ Futuro (frontend já tem formulário) |
| Calendário editorial / fila de publicações | ⬜ Futuro |

## Dashboard principal

Ao entrar, o administrador vê: total de artigos, artigos publicados, rascunhos,
agendados, leitores ativos, consumo de APIs, tempo médio de leitura, SEO Score,
artigos mais acessados, erros recentes, jobs, cache Redis e saúde do sistema.
*(widgets de clima, câmbio e manchetes já operacionais)*

## Módulo de Artigos

CRUD completo. Campos: título, slug, conteúdo, categoria, tags, autor, imagem,
SEO (meta title, description, canonical, schema.org, Open Graph), status
(rascunho/revisão/agendado/publicado/arquivado), data, tempo de leitura e destaque.

**Editor**: atualmente markdown simples; editor em blocos (Notion-like) fica para fase futura.

## Fluxo Editorial

```
Nova pauta → Pesquisa (Central Editorial) → IA auxilia → Rascunho
→ Revisão → SEO → Preview → Agendamento → Publicação
```

## 🧭 Central Editorial

Busca de notícias em **múltiplas fontes** com um clique, direto no painel:

- **Fontes**: The Guardian, Hacker News, Currents API, GNews
- **Busca** por termo + filtro de fonte
- **Ação "Criar rascunho de artigo"** em cada resultado — preenche título,
  resumo e conteúdo inicial do artigo, com **capa sugerida via Openverse**
- Chaves configuráveis na página **Integrações**

## Integrações

| Grupo | Serviços | Status |
|-------|----------|--------|
| Notícias | The Guardian, Hacker News, Currents, GNews | ✅ Integrados |
| Imagens | Openverse (Creative Commons) | ✅ Integrado |
| Clima | OpenWeather | ✅ Integrado |
| Economia | ExchangeRate-API | ✅ Integrado |
| IA | Groq, Gemini | ⬜ Futuro |
| Imagens | Unsplash | ⬜ Futuro |

## Gamificação

Missões diárias/semanais com auto-progresso, grãos por leitura concluída
(artigos e receitas), trilhas de conhecimento mistas (artigos + receitas).
Detalhes no [plano do módulo](receitas.md).

## Roadmap

| Fase | Escopo | Status |
|------|--------|--------|
| **Fase 1** | Dashboard, Login, Usuários, Artigos, Categorias, Tags | ✅ Concluída |
| **Fase 2** | SEO, biblioteca de mídia, logs | ✅ Concluída |
| **Fase 3** | Integrações (widgets + página de chaves) | ✅ Concluída |
| **Fase 4** | Gamificação, biblioteca do usuário, trilhas | ✅ Concluída |
| **Fase 5** | Multi-site, multi-idioma, API pública | ⬜ Planejada |
| **Fase 6** | Receitas + integração das APIs ao Dash (Central Editorial) | ✅ Concluída |
| **Fase 7** | Verificação e testes (estabilidade, correção de bugs) | ✅ Auditorias 100% (site 86/86, receitas 42/42, a11y 0, site 44/44, dash 29/29) |
| **Fase 8** | Painel do leitor `/dashboard/` (frontend) | 🔄 Em andamento — código criado, aguardando deploy |
