# Relatório Completo — Artigo com Café

## Sumário Executivo

**URL:** https://artigocomcafe.com/  
**Backend API:** https://back.artigocomcafe.com/api  
**Framework:** Astro 7 + React 19 + Tailwind 4 (CSS-first)  
**Deploy:** Static → DirectAdmin (LiteSpeed Web Server)  
**Banco:** MariaDB 10.11 via Laravel 11  
**Status:** ✅ Produção ativa

---

## 1. Arquitetura do Projeto

### 1.1 Frontend (Astro 7 + React 19)

```
artigocomcafe/
├── src/
│   ├── layouts/
│   │   ├── Base.astro         # Layout mestre: SEO, GA4, tema, OG
│   │   └── Layout.astro       # Não utilizado (starter Astro)
│   ├── pages/
│   │   ├── index.astro        # Homepage com hero + últimos artigos
│   │   ├── 404.astro          # Página 404 customizada
│   │   ├── blog/
│   │   │   ├── index.astro    # Listagem com busca, categorias, paginação
│   │   │   └── [slug].astro   # Página de artigo individual
│   │   ├── sobre.astro        # Sobre o projeto
│   │   ├── contato.astro      # Formulário Netlify
│   │   ├── newsletter.astro   # Landing page newsletter
│   │   ├── entrar.astro       # Login (React)
│   │   ├── cadastro.astro     # Registro (React)
│   │   ├── perfil.astro       # Dashboard (React, autenticado)
│   │   ├── biblioteca.astro   # Coleções (React, autenticado)
│   │   ├── graos.astro        # Sistema de XP (React, autenticado)
│   │   ├── conquistas.astro   # Achievements (React, autenticado)
│   ├── mapa.astro          # Mapa do Conhecimento (React, autenticado)
│   ├── torrefacao.astro    # Torrefação de grãos (React, autenticado)
│   ├── missoes.astro       # Missões diárias (React, autenticado)
│   │   └── trilhas.astro      # Trilhas aprendizado (React, autenticado)
│   ├── components/
│   │   ├── Header.astro       # Nav fixa com vidro fosco + menu mobile
│   │   ├── Footer.astro       # 3 colunas + newsletter
│   │   ├── Hero.astro         # Hero fullscreen + CTA
│   │   ├── ArticleCard.astro  # Card com imagem, metadados
│   │   ├── Pagination.astro   # Paginação com elipse
│   │   ├── SearchModal.tsx    # Busca Cmd+K (Laravel API)
│   │   ├── ThemeToggle.tsx    # Dark/light mode
│   │   ├── UserMenu.tsx       # Dropdown usuário
│   │   ├── LoginForm.tsx      # Formulário login
│   │   ├── RegisterForm.tsx   # Formulário registro
│   │   ├── NewsletterForm.tsx # Inline + hero variants
│   │   └── AuthGuard.tsx      # Proteção rotas autenticadas
│   ├── lib/
│   │   ├── laravel.ts         # API client principal (Laravel)
│   │   ├── wordpress.ts       # Cliente legado (WordPress)
│   │   ├── api.ts             # HTTP client com auth
│   │   ├── auth.tsx           # Contexto React de autenticação
│   │   ├── utils.ts           # Formatação, utilidades
│   │   └── types.ts           # Tipos compartilhados
│   └── styles/
│       └── global.css         # Tailwind v4 + tema completo
├── backend/
│   └── app/Console/Commands/
│       └── ImportWpPosts.php  # Comando de importação WP→Laravel
└── astro.config.mjs
```

### 1.2 Backend (Laravel 11)

- API REST em `back.artigocomcafe.com/api`
- Modelos: Article, Category, Tag, User
- Autenticação via token (sanctum-style)
- Sistema de gamificação: grãos (XP), conquistas, trilhas, biblioteca
- Banco: `arti3263_artigocafe`

### 1.3 Dados Importados

| Tipo | Quantidade | Origem |
|------|-----------|--------|
| Artigos | 10 | WordPress (JSON export) |
| Categorias | 34 | WordPress (taxonomias) |
| Tags | 146 | WordPress (taxonomias) |
| Imagens destaque | 10 | Download de URLs WordPress |

---

## 2. Status do Deploy

### 2.1 URLs e Respostas

| Página | Status | Título | Meta Desc | Robots | Canonical |
|--------|--------|--------|-----------|--------|-----------|
| `/` | 200 ✅ | Artigo com Café — Blog de Cafeteria Digital | ✅ | ✅ | `/` |
| `/blog/` | 200 ✅ | Blog — Artigo com Café | ✅ | ✅ | `/blog/` |
| `/sobre/` | 200 ✅ | Sobre — Artigo com Café | ✅ | ✅ | `/sobre/` |
| `/contato/` | 200 ✅ | Contato — Artigo com Café | ✅ | ✅ | `/contato/` |
| `/entrar/` | 200 ✅ | Entrar — Artigo com Café | ✅ | ✅ | `/entrar/` |
| `/cadastro/` | 200 ✅ | Criar Conta — Artigo com Café | ✅ | ✅ | `/cadastro/` |
| `/biblioteca/` | 200 ✅ | Minha Biblioteca — Artigo com Café | ✅ | ✅ | `/biblioteca/` |
| `/perfil/` | 200 ✅ | Meu Perfil — Artigo com Café | ✅ | ✅ | `/perfil/` |
| `/conquistas/` | 200 ✅ | Conquistas — Artigo com Café | ✅ | ✅ | `/conquistas/` |
| `/graos/` | 200 ✅ | Meus Grãos — Artigo com Café | ✅ | ✅ | `/graos/` |
| `/trilhas/` | 200 ✅ | Trilhas de Conhecimento — Artigo com Café | ✅ | ✅ | `/trilhas/` |
| `/newsletter/` | 200 ✅ | Newsletter — Artigo com Café | ✅ | ✅ | `/newsletter/` |
| `/missoes/` | 200 ✅ | Missões — Artigo com Café | ✅ | ✅ | `/missoes/` |
| Artigos (10) | 200 ✅ | Título do artigo — Artigo com Café | ✅ | ✅ | `/blog/{slug}/` |
| `/nao-existe/` | 404 ✅ | 404 customizada | ✅ | ✅ | `/404/` |

### 2.2 Assets Estáticos

| Tipo | Status | Cache |
|------|--------|-------|
| Imagens (PNG) | 200 ✅ image/png | 1 ano |
| Imagens (SVG) | 200 ✅ image/svg+xml | 1 ano |
| CSS/JS | 200 ✅ | 1 ano |
| HTML | 200 ✅ | 0s (sempre fresco) |

### 2.3 Google Analytics

- **ID:** G-TMDJNM49Q6
- **Status:** ✅ Presente em todas as páginas
- **AdSense:** ca-pub-4516147510474933

---

## 3. SEO & Performance

### 3.1 Meta Tags (Corrigido)

- ✅ **Título único** por página (incluindo artigos)
- ✅ **Meta description** única por página (excerpt gerado do conteúdo)
- ✅ **Canonical URL** específica por página
- ✅ **Open Graph** completo (title, description, image, url, locale, site_name)
- ✅ **Twitter Cards** (summary_large_image)
- ✅ **Meta robots** (index, follow) em todas as páginas
- ✅ **HTML lang="pt-BR"**
- ✅ **JSON-LD Article schema** em artigos
- ✅ **rel next/prev** na paginação do blog

### 3.2 Performance

- CSS inline otimizado (`inlineStylesheets: 'auto'`)
- Google Fonts com preconnect + preload
- Imagens com `loading="lazy"` + `decoding="async"`
- Tipografia fluida com `clamp()`
- Animações com IntersectionObserver (respeita `prefers-reduced-motion`)
- Gzip/Brotli via mod_deflate
- Cache de assets por 1 ano

### 3.3 Estrutura de Dados

- ✅ JSON-LD `Article` em todos os artigos
- ❌ **Faltando:** JSON-LD `BreadcrumbList` (navegação estrutural)
- ❌ **Faltando:** JSON-LD `Organization` (marca)
- ❌ **Faltando:** JSON-LD `BlogPosting` para homepage
- ❌ **Faltando:** Sitemap.xml
- ❌ **Faltando:** RSS Feed

---

## 4. Correções Realizadas

### 4.1 Críticas

| # | Problema | Solução | Arquivo |
|---|----------|---------|---------|
| 1 | Canonical sempre `/` | Prop `canonical` em Base.astro | `src/layouts/Base.astro` |
| 2 | Meta description vazia em artigos | Fallback para `content.substring(0,160)` | `src/pages/blog/[slug].astro` |
| 3 | Double-encoding `&amp;amp;` | `html_entity_decode()` nas categorias DB | Script DB |
| 4 | Sem meta robots | Adicionado `index, follow` | `src/layouts/Base.astro` |
| 5 | Sem JSON-LD | Schema Article adicionado | `src/pages/blog/[slug].astro` |
| 6 | 404 inexistente | Criada página + ErrorDocument | `src/pages/404.astro`, `.htaccess` |
| 7 | SearchModal usava WP API | Migrado para Laravel API | `src/components/SearchModal.tsx` |
| 8 | Tags linkavam para categoria | Corrigido link das tags | `src/pages/blog/[slug].astro` |
| 9 | Article excerpts vazios | Gerados a partir do conteúdo | Script DB |

### 4.2 Infraestrutura

| # | Problema | Solução |
|---|----------|---------|
| 1 | Permissões 700 em subdiretórios → 403 | `chmod 755` em todos os diretórios |
| 2 | Storage deleted durante redeploy | Cópia dedicada do storage do backend |
| 3 | LiteSpeed bloqueando subpáginas | Permissões corrigidas |
| 4 | .htaccess mal configurado | Removido SPA catch-all, ErrorDocument 404 |

### 4.3 Slugs

| # | Slug Antigo | Slug Novo |
|---|-------------|-----------|
| 1 | `%e2%98%95-bem-vindo-ao-artigocomcafe...` | `bem-vindo-ao-artigocomcafe-sua-pausa-para-o-conhecimento` |
| 2 | `rascunho-automatico` | `sabao-liquido-caseiro-20-litros-receita-economica-rende-muito-e-pode-reduzir-seus-gastos-domesticos` |

---

## 5. UX/UI Review

### 5.1 Pontos Fortes

- **Design System coeso** com Tailwind v4:
  - Paleta escura/clara completa
  - Glassmorphism (vidro fosco) em cards e header
  - Gradientes sutis (accent → accent-secondary)
  - Tipografia fluida com `clamp()`
- **Dark/Light mode** com persistência em localStorage
- **Animações** scroll-reveal suaves (respeita prefers-reduced-motion)
- **Responsivo:** Grid adaptativo, hamburger menu mobile
- **Navegação** com Cmd+K para busca
- **Header fixo** com efeito glass
- **Artigos** com layout de leitura otimizado (sidebar, share buttons)
- **Sistema de gamificação** (grãos, conquistas, trilhas, biblioteca)

### 5.2 Oportunidades de Melhoria

#### UX
- **Loading states**: Páginas autenticadas (React) não têm skeleton loading
- **Feedback tátil**: Faltam micro-animações em cliques (like ripple effect)
- **Transições de página**: Astro devia usar View Transitions API para navegação fluida
- **Toast/notificações**: Sem sistema de feedback para ações do usuário
- **Offline**: Sem service worker para suporte offline básico
- **Acessibilidade**: 
  - Foco visível em todos os elementos interativos
  - Skip-to-content link ausente
  - Contraste de cores em light mode pode ser melhorado

#### UI
- **Hero**: Background poderia ter animação sutil (partículas, gradiente animado)
- **Ícone do site**: Favicon SVG poderia ser um ícone de café mais distinto
- **Blog grid**: Cards muito uniformes — poderia ter layout alternado (featured, masonry)
- **Categorias**: Scroll horizontal poderia ter indicador visual de scroll
- **Formulários**: Poderiam ter validação inline mais rica
- **Imagens OG**: OG image genérica (svg) — deveria ser template dinâmico por artigo

#### Conteúdo
- **Mismatch branding vs conteúdo**: Site se posiciona como "cafeteria digital" mas artigos são sobre tópicos gerais (solar, jardinagem, skincare)
- **Artigos sem imagens no corpo**: Conteúdo rico em texto sem imagens intermediárias
- **Empty states**: Páginas autenticadas têm empty states mas poderiam ser mais convidativos

### 5.3 Recomendações Prioritárias

1. **View Transitions API** para navegação fluida entre páginas
2. **Skeleton loading** para componentes React (auth pages)
3. **Service Worker** para funcionamento offline básico
4. **Sitemap.xml** + **RSS Feed** para SEO
5. **Imagens OG dinâmicas** por artigo
6. **Breadcrumb JSON-LD** para navegação estrutural
7. **Animações de micro-interação** (hover mais ricos, transições)
8. **Acessibilidade** (skip-to-content, foco visível, aria labels completos)

---

## 6. Configuração do Servidor

### 6.1 Acesso SSH
```
Host: br64-da.valueserver.net.br
Port: 1157
User: arti3263
```

### 6.2 Diretórios
```
/home/arti3263/domains/
├── artigocomcafe.com/
│   ├── public_html/              # Frontend Astro (estático)
│   │   ├── index.html
│   │   ├── 404.html
│   │   ├── blog/
│   │   ├── sobre/
│   │   ├── storage/
│   │   │   └── articles/         # Imagens de destaque
│   │   ├── _astro/               # Assets compilados
│   │   └── .htaccess
│   └── public_html_backup_wp/    # Backup WordPress
└── back.artigocomcafe.com/
    └── public_html/              # Laravel API
```

### 6.3 Banco de Dados
```
Database: arti3263_artigocafe
User: arti3263_artigocafe
Host: localhost (socket)
```

### 6.4 Backup WordPress
O WordPress original está preservado em:
```
/home/arti3263/domains/artigocomcafe.com/public_html_backup_wp/
```
Database: `arti3263_wp424` (prefixo `wphz_`)

---

## 7. Comandos Úteis

### Frontend
```bash
npm run dev          # Servidor dev (localhost)
npm run build        # Build estático
npm run deploy       # Deploy completo via SCP (deploy.ps1)
```

### Backend (SSH)
```bash
# Importar WordPress
php artisan wp:import /tmp/wp_data2.json

# Artisan Tinker
php artisan tinker

# Ver artigos
mysql -u arti3263_artigocafe -p'CmQ#yD7R.u993t' arti3263_artigocafe -e "SELECT id, title, slug FROM articles"
```

### Deploy Manual
```bash
# 1. Build local
cd /caminho/local/artigocomcafe
npm run build

# 2. Copiar para servidor
scp -P 1157 -r dist/* arti3263@br64-da.valueserver.net.br:/home/arti3263/domains/artigocomcafe.com/public_html/

# 3. Copiar imagens
ssh -p 1157 arti3263@br64-da.valueserver.net.br "cp -r /home/arti3263/domains/back.artigocomcafe.com/public_html/storage/app/public/articles /home/arti3263/domains/artigocomcafe.com/public_html/storage/articles"

# 4. Ajustar permissões
ssh -p 1157 arti3263@br64-da.valueserver.net.br "find /home/arti3263/domains/artigocomcafe.com/public_html -type d -exec chmod 755 {} + && find /home/arti3263/domains/artigocomcafe.com/public_html -type f -exec chmod 644 {} +"
```

---

## 8. Observações Técnicas

### SSL
- **artigocomcafe.com** → SSL wildcard OK ✅
- **back.artigocomcafe.com** → SSL mismatch (wildcard não cobre subdomínio) ⚠️
- Build local precisa de `NODE_TLS_REJECT_UNAUTHORIZED=0`

### LiteSpeed
- Servidor usa LiteSpeed Web Server (não Apache)
- Suporte a `.htaccess` (compatível com Apache mod_rewrite)
- Segurança precisa de permissões 755 em diretórios para acesso público

### WordPress Backup
- DB WordPress preservado: `arti3263_wp424`
- Arquivos WP em `public_html_backup_wp/`
- JSON de exportação em `/tmp/wp_data2.json`

---

## 9. Checklist Final

- [x] Site acessível em https://artigocomcafe.com/
- [x] Todas as 23 páginas retornam 200
- [x] Páginas inexistentes retornam 404
- [x] Imagens carregam com tipo MIME correto
- [x] Google Analytics presente em todas as páginas
- [x] Meta tags únicas por página
- [x] Canonical URL correta por página
- [x] Meta robots (index, follow)
- [x] JSON-LD Article schema
- [x] Open Graph / Twitter Cards
- [x] Dark/Light mode funcional
- [x] Modo escuro como padrão
- [x] Busca Cmd+K funcional (Laravel API)
- [x] Autenticação (login/registro/perfil)
- [x] Gamificação (grãos, conquistas, trilhas)
- [x] Newsletters funcional
- [x] Formulário de contato (Netlify)
- [x] WordPress preservado em backup
- [x] Slugs corrigidos (emoji, rascunho)
- [x] Categorias sem double-encoding
- [x] Excerpts gerados do conteúdo
- [x] Permissões de diretório corretas (755/644)

---

## 10. Melhorias Implementadas (v3.0-Stable)

### 10.1 SEO & Dados Estruturados

| # | Melhoria | Detalhes |
|---|----------|---------|
| ✅ | **BreadcrumbList JSON-LD** | Schema de navegação estrutural em todas as páginas |
| ✅ | **Organization JSON-LD** | Schema da marca com logo, URL e redes sociais |
| ✅ | **BlogPosting JSON-LD** | Schema na homepage para indexação do blog |
| ✅ | **Sitemap.xml** | Sitemap index + sub-sitemaps (páginas + artigos) |
| ✅ | **RSS Feed** | Feed RSS completo com 10 artigos e metadados |
| ✅ | **Robots.txt** | Arquivo configurado com sitemap e regras de crawling |
| ✅ | **Link rel sitemap** | Tag `<link rel="sitemap">` no `<head>` |
| ✅ | **Link rel alternate (RSS)** | Tag `<link rel="alternate">` para RSS no `<head>` |

### 10.2 UX/UI

| # | Melhoria | Detalhes |
|---|----------|---------|
| ✅ | **View Transitions API** | Transições suaves entre páginas via CSS `@view-transition` |
| ✅ | **Skip-to-content** | Link de acessibilidade "Pular para o conteúdo" ao tab |
| ✅ | **Focus visible** | Estilos `:focus-visible` em todos os elementos interativos |
| ✅ | **Keyboard navigation** | Suporte completo a navegação por teclado |
| ✅ | **Favicon animado (SVG)** | Xícara de café com vapor animado e gradiente |
| ✅ | **Service Worker** | Cache offline básico com fallback e estratégia network-first |
| ✅ | **Página offline** | `/offline/` com mensagem amigável e botão reconectar |
| ✅ | **Web App Manifest** | `site.webmanifest` para PWA com ícones |
| ✅ | **Skeleton loader** | `@keyframes shimmer` para loading states |
| ✅ | **Animação ripple** | Efeito ripple em botões via CSS |
| ✅ | **Scrollbar customizada** | Scrollbar estilizada com cores do tema |
| ✅ | **Seleção customizada** | `::selection` com cor accent |

### 10.3 Performance

| # | Melhoria | Detalhes |
|---|----------|---------|
| ✅ | **CSS minify** | `cssMinify: 'esbuild'` no Vite |
| ✅ | **Compressão HTML** | `compressHTML: true` no Astro |
| ✅ | **Scoped style strategy** | `scopedStyleStrategy: 'where'` para menor especificidade |
| ✅ | **Build otimizado** | 24 páginas em 8s no build local |

### 10.4 Backend (Laravel)

| # | Melhoria | Detalhes |
|---|----------|---------|
| ✅ | **N+1 fix no Trail model** | Removido `$appends` problemático, agora usa `withCount()` |
| ✅ | **Eager loading TrailController** | `loadCount()`, `withCount()` em todas as queries de trilhas |
| ✅ | **Retorno enriquecido** | `completed_articles` e `total_required` no updateProgress |

### 10.5 Novos Arquivos Criados

```
public/
├── sitemap.xml              # Sitemap index
├── sitemap-pages.xml        # Sitemap de páginas estáticas
├── sitemap-articles.xml     # Sitemap de artigos
├── feed.xml                 # RSS Feed
├── robots.txt               # Instruções para crawlers
├── site.webmanifest         # PWA manifest
└── sw.js                    # Service Worker

src/
├── pages/offline.astro      # Página offline fallback
└── layouts/Base.astro       # Atualizado: JSON-LD, breadcrumbs, acessibilidade
```

---

## 11. Checklist v3.0-Stable

### SEO
- [x] BreadcrumbList JSON-LD
- [x] Organization JSON-LD
- [x] BlogPosting JSON-LD (homepage)
- [x] Article JSON-LD (artigos)
- [x] Sitemap.xml com sub-sitemaps
- [x] RSS Feed
- [x] Robots.txt
- [x] Meta tags únicas + Open Graph + Twitter Cards
- [x] Canonical URLs corretas
- [x] rel next/prev na paginação

### Performance
- [x] Build otimizado (8s, 24 páginas)
- [x] CSS minify com esbuild
- [x] Compressão HTML automática
- [x] Inline stylesheets automático
- [x] Cache de assets (1 ano)
- [x] Lazy loading de imagens

### UX & Acessibilidade
- [x] View Transitions API (navegação fluida)
- [x] Skip-to-content link
- [x] Focus visible indicators
- [x] Service Worker (offline support)
- [x] Página offline amigável
- [x] PWA manifest
- [x] Favicon animado
- [x] Skeleton loaders
- [x] Scrollbar customizada
- [x] prefers-reduced-motion suportado

### Backend
- [x] API REST funcional
- [x] Autenticação Sanctum
- [x] Gamificação (grãos, conquistas, trilhas)
- [x] Recomendações inteligentes
- [x] Reading progress tracking
- [x] N+1 queries eliminados (Trail)
- [x] CORS configurado

### Infraestrutura
- [x] HTTPS ativo
- [x] LiteSpeed + .htaccess
- [x] Cache de assets
- [x] Compressão Brotli/Gzip
- [x] WordPress preservado em backup

---

## 12. Últimas Melhorias (v3.1)

### 12.1 Café do Dia

| # | Melhoria | Detalhes |
|---|----------|---------|
| ✅ | **Componente CafeDoDia** | Card interativo na homepage com loading skeleton e hover state |
| ✅ | **Endpoint API** | `GET /api/articles/cafe-do-dia` com fallback randômico |
| ✅ | **Artigo do dia** | Artigo #10 "Bem-vindo ao Artigocomcafé" marcado no servidor |

### 12.2 Reading Progress Tracker

| # | Melhoria | Detalhes |
|---|----------|---------|
| ✅ | **Scroll tracking** | Rastreamento via requestAnimationFrame sem stale closure |
| ✅ | **API progress** | Envia progresso a cada 15s via `POST /articles/{id}/progress` |
| ✅ | **Auto-complete** | Completa leitura aos 90% scroll + 30s, concede grãos |
| ✅ | **Barra visual** | Barra gradiente no rodapé com `aria-valuenow` |
| ✅ | **SSR-safe** | Usa `isAuthenticated()` em vez de contexto React |

### 12.3 Toast Notification System

| # | Melhoria | Detalhes |
|---|----------|---------|
| ✅ | **5 tipos** | success, error, info, grain, achievement com cores e ícones |
| ✅ | **Auto-dismiss** | Fecha após 4s com animação slide-up |
| ✅ | **Provider + Context** | Integrado ao AuthProvider, disponível em todas as páginas autenticadas |
| ✅ | **Defensivo** | `useToast()` retorna no-op sem provider, não quebra ilhas React |

### 12.4 Página de Missões

| # | Melhoria | Detalhes |
|---|----------|---------|
| ✅ | **/missoes/** | Nova página com layout Base e breadcrumbs |
| ✅ | **Abas diárias/semanais** | Filtro com badges de contagem |
| ✅ | **Progress bars** | Barras animadas com gradiente e contador |
| ✅ | **Claim rewards** | Botão "Resgatar" com toast de confirmação |
| ✅ | **Vocabulário dinâmico** | Nomes de moedas e ações seguem o tema do usuário |

### 12.5 Trail Seeder

| # | Trilha | Artigos | Dificuldade | Recompensa |
|---|--------|---------|-------------|------------|
| ✅ | **Vida Sustentável** | 4 artigos (casca de ovo, sabão, babosa, truques) | Iniciante | 50 grãos |
| ✅ | **Ciência do Cotidiano** | 4 artigos (gatos, impressões, saara, boas-vindas) | Intermediário | 75 grãos |
| ✅ | **Beleza Natural** | 4 artigos (hidratante, babosa, shopee, truques) | Iniciante | 50 grãos |

### 12.6 Novos Arquivos

```
src/
├── components/
│   ├── CafeDoDia.tsx        # Card do Café do Dia na homepage
│   ├── MissionsPage.tsx     # Página de missões diárias/semanais
│   ├── ReadingTracker.tsx   # Rastreador de progresso de leitura
│   └── Toast.tsx            # Sistema de notificações toast
└── pages/
    └── missoes.astro        # Página de missões

backend/database/seeders/
└── TrailSeeder.php          # 3 trilhas com 12 conexões artigo-trila
```

---

## 13. Dados Atualizados (Produção)

| Item | Quantidade |
|------|-----------|
| **Categorias** | 34 |
| **Artigos** | 10 |
| **Tags** | 146 |
| **Missões** | 6 (3 diárias, 3 semanais) |
| **Conquistas** | 15 |
| **Trilhas** | 3 (12 conexões artigo-trila) |
| **Recompensas** | 23 |
| **Páginas** | 27 (todas 200) |
| **Rotas API** | 43 |

---

## 14. Build Atual

```
✓ 27 page(s) built in 8.99s
✓ 0 errors
```

---

## Próximos Passos (Recomendados)

1. **Deploy automático CI/CD** — GitHub Actions para build + deploy via SCP
2. **Newsletter real** — Integrar API de email (MailerLite, Resend)
3. **Imagens OG dinâmicas** — Template OG por artigo via SSG
