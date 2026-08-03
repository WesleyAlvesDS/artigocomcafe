☕ Dashboard Artigo com Café
Master Plan v1.0
Objetivo

Criar um CMS próprio, moderno, rápido e inteligente para gerenciar todo o ecossistema do Artigo com Café.

O Dashboard será responsável por:

Produção de conteúdo
Gestão de usuários
SEO
Inteligência Artificial
Analytics
Biblioteca
Configurações
Integrações
Segurança
Arquitetura Geral
                        INTERNET

                            │

              dash.artigocomcafe.com

                            │

                 Laravel Dashboard

                            │

        ┌───────────────────┼───────────────────┐
        │                   │                   │
     Dashboard           API              Serviços

        │                   │
        │               MariaDB
        │
      Redis
Tecnologias
Backend
Laravel
PHP 8.3+
Laravel Sanctum
Laravel Queue
Laravel Scheduler
Front-end
Filament
Livewire
Alpine.js
TailwindCSS
Banco
MariaDB
Cache
Redis
Testes
Playwright
PHPUnit
Pest
Qualidade
PHPStan
Laravel Pint
ESLint (quando houver JS)
Estrutura
app/

Modules/

Dashboard

Articles

Categories

Tags

Authors

Users

Roles

Permissions

Media

SEO

Analytics

AI

Settings

Logs

Notifications

Newsletter

Search

Integrations

Gamification

Library
Dashboard Principal

Ao entrar o administrador verá:

Total de artigos
Artigos publicados
Rascunhos
Artigos agendados
Leitores ativos
Uso da IA
Consumo de APIs
Tempo médio de leitura
SEO Score
Artigos mais acessados
Erros recentes
Jobs em execução
Cache Redis
Saúde do sistema
Módulo de Artigos

CRUD completo.

Campos:

Título
Slug
Conteúdo
Categoria
Tags
Autor
Imagem
SEO
Status
Data
Tempo de leitura
Destaque

Status:

Rascunho
Revisão
Agendado
Publicado
Arquivado
Editor

Editor inspirado no Notion.

Blocos:

Texto

Imagem

Código

Tabela

Lista

Checklist

Citação

Botão

Embed

YouTube

Callout

Separador

FAQ

Fluxo Editorial
Nova pauta

↓

Pesquisa

↓

IA auxilia

↓

Rascunho

↓

Revisão

↓

SEO

↓

Preview

↓

Agendamento

↓

Publicação
Autores

Cada autor possui:

Foto

Nome

Biografia

Especialidades

Redes sociais

Cargo

Quantidade de artigos

Tempo na plataforma

Perfil público

Usuários

Perfis:

Administrador

Editor-chefe

Editor

Redator

Revisor

Moderador

Analista SEO

Leitor

Sistema RBAC

Permissões individuais.

Exemplo:

Criar artigo

Editar

Excluir

Publicar

Gerenciar usuários

Configurações

Analytics

SEO

IA

Cada permissão independente.

Biblioteca de Mídia

Imagens

Vídeos

PDFs

Documentos

WebP automático

Compressão automática

Alt Text

Legenda

Autor da imagem

SEO

Cada artigo possui:

Meta Title

Meta Description

Canonical

Schema.org

Open Graph

Twitter Card

Robots

Sitemap

SEO Score

Sugestões da IA

IA
Assistente Editorial

Sugere:

Títulos

SEO

Meta Description

Resumo

FAQ

Slug

Links internos

Categorias

Tags

Correções gramaticais

Analytics

Painel:

Mais lidos

Categorias populares

Autores

CTR

Tempo médio

Scroll

Conclusão da leitura

Pesquisa

Origem do tráfego

Integrações

IA:

Groq

Gemini

OpenAI (opcional)

Notícias:

GNews

Guardian

Currents

Imagens:

Openverse

Unsplash

Clima:

OpenWeather

Economia:

ExchangeRate

Sistema de Plugins (Módulos)

O Dashboard permitirá ativar ou desativar módulos sem alterar o núcleo da aplicação.

Exemplos:

Newsletter
Comentários
Chatbot
Biblioteca
Gamificação
Analytics
Busca Inteligente
Recomendações
RSS
Sitemap
Pesquisa Interna

Pesquisar por:

Artigos

Autores

Categorias

Usuários

Tags

Configurações

Logs

Logs

Registrar:

Login

Logout

Publicações

Edições

Exclusões

Erros

Chamadas de IA

Jobs

Filas

Integrações

Configurações

Site

Logo

Tema

SEO

Redes sociais

SMTP

Redis

Cache

Cloudflare

APIs

IA

Newsletter

Analytics

Segurança

CSRF

Sanctum

Rate Limit

Auditoria

2FA (futuro)

Logs

Permissões

Sessões

Playwright

Sempre testar:

Login

CRUD

Artigos

Editor

Responsividade

Dashboard

Menus

Botões

Formulários

Preview

Uploads

Console

Performance

Redis

Lazy Loading

Queues

Jobs

Cache

Compressão

Imagens WebP

Consultas otimizadas

Roadmap
Fase 1
Dashboard
Login
Usuários
Artigos
Categorias
Tags
Fase 2
Editor avançado
SEO
Analytics
Biblioteca de mídia
Logs
Fase 3
Assistente Editorial com IA
Recomendações inteligentes
Busca avançada
Integrações
Fase 4
Gamificação
Biblioteca do usuário
Motor de conhecimento
Workflow editorial avançado
Fase 5
Multi-site
Multi-idioma
API pública
Marketplace de módulos
Aplicativo administrativo
Minha recomendação de arquitetura

Em vez de pensar no Dashboard apenas como uma "área administrativa", trate-o como um produto independente dentro do mesmo projeto Laravel.

Site público (artigocomcafe.com) → focado na experiência do leitor.
Dashboard (dash.artigocomcafe.com) → focado na operação editorial.
Mesmo backend Laravel → compartilhando modelos, regras de negócio e banco de dados.
Subdomínio separado → com autenticação, middleware e permissões próprias.

Essa abordagem reduz manutenção, evita duplicação de código, facilita o deploy e mantém a possibilidade de evoluir para um CMS reutilizável em outros projetos no futuro, sem abrir mão de uma arquitetura simples para a fase inicial.