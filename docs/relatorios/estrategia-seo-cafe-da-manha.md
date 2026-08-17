# ☕ Estratégia SEO — Vertical "Café da Manhã"

> Objetivo: posicionar `artigocomcafe.com` nas pesquisas do Google relacionadas a
> **café da manhã** (receitas, combinações, harmonização com café) e transformar a
> vertical em fonte de tráfego orgânico mensurável.
>
> **Página pilar:** `https://artigocomcafe.com/cafe-da-manha/` (lançada nesta sessão).

---

## 1. Pesquisa de palavras-chave

### 1.1 Keyword de cauda curta (âncora da vertical)

| Palavra-chave | Intenção | Dificuldade | Ação |
|---|---|---|---|
| café da manhã | Informacional / transacional | Alta | Página pilar + otimização contínua |
| café da manhã com café | Informacional | Média | H1 e meta title da pilar |
| o que comer no café da manhã | Informacional | Média | Seção + FAQ da pilar |

### 1.2 Keywords de cauda longa (cluster — onde está o tráfego conversível)

| Palavra-chave | Página alvo |
|---|---|
| receitas de café da manhã rápidas | `/receitas?categoria=cafe-da-manha` + posts do blog |
| café da manhã saudável o que comer | Seção "Café da manhã saudável" + post de apoio |
| como montar mesa de café da manhã | Seção "Mesa para receber" + post de apoio |
| qual café combina com café da manhã | Seção "Harmonização" + post de apoio |
| o que servir com café pela manhã | Seção "Combinações clássicas" + post de apoio |
| café da manhã para receber visitas | Post de apoio |

### 1.3 Palavras-chave semânticas (LSI) usadas no conteúdo

Ritual da manhã, primeira refeição, pão com manteiga, ovos mexidos, tapioca, pão de
queijo, cuscuz, overnight oats, granola, café coado, torra média, harmonização,
cafeína, despertar, mesa posta.

> **Prática:** toda vez que uma palavra de cauda longa começar a gerar impressões no
> Search Console (posição 5–20), criar um post de apoio dedicado a ela e linkar de
> volta para a pilar (`/cafe-da-manha/`).

---

## 2. Arquitetura de conteúdo (pilar + cluster)

```
/cafe-da-manha/            ← PÁGINA PILAR (hub)
├── /receitas?categoria=cafe-da-manha   ← cluster de receitas (Recipe JSON-LD)
├── /blog/[postos]         ← cluster de artigos de apoio
│     • café da manhã saudável
│     • mesa de café da manhã para receber
│     • harmonização de café com comida
│     • receitas de 15 minutos
└── /metodos-de-preparo/   ← interlink com guias já existentes
```

**Regras de interlinking:**
- Toda página do cluster linka para a pilar com âncora descritiva ("café da manhã com café").
- A pilar linka para 3–5 páginas do cluster (já feito via CTA `/receitas?categoria=cafe-da-manha`).
- Adicionar a pilar na coluna "Guia do Café" do rodapé (`Footer.astro`) e no dropdown
  de Receitas do header (feito nesta sessão: item "🥐 Café da manhã" → `/cafe-da-manha/`).

---

## 3. On-page SEO (aplicado na página pilar)

| Elemento | Status |
|---|---|
| Title único (≤ 60 caracteres) com keyword | ✅ `Café da Manhã — Ideias e Receitas para Começar Bem o Dia` |
| Meta description (120–160 caracteres) com CTA | ✅ descrição com "combinações, receitas rápidas e dicas" |
| H1 único com keyword principal | ✅ "Café da Manhã com Café: Ideias e Receitas" |
| H2/H3 com keywords de cauda longa | ✅ 6 seções estruturadas |
| FAQ com schema `FAQPage` | ✅ 6 perguntas (JSON-LD automático) |
| Schema `Article` | ✅ automático via `SeoLandingPage.astro` |
| Breadcrumb `BreadcrumbList` | ✅ automático via `Base.astro` |
| Canonical próprio | ✅ `https://artigocomcafe.com/cafe-da-manha/` |
| Imagens com alt descritivo | ⚠️ adicionar ao criar arte da página |
| Links internos (pilar → cluster e vice-versa) | ✅ CTA + dropdown + rodapé |

> **Ação pendente:** adicionar a página à coluna "Guia do Café" do `Footer.astro` e
> criar imagem OG exclusiva (`/cafe-da-manha/og` ou reuso de `/og-default`).

---

## 4. SEO técnico

- ✅ **Sitemap:** URL adicionada em `public/sitemap-pages.xml` (priority 0.8, monthly).
- ✅ **robots.txt:** permite rastreio em `/`; sitemap index já referenciado.
- ✅ **Indexabilidade:** página estática SSG, sem JS obrigatório para conteúdo.
- ✅ **Schema Recipe** já presente nas páginas de receita (`receitas/[slug].astro`) —
  ativo no cluster via `/receitas?categoria=cafe-da-manha`.
- ✅ **Core Web Vitals:** site já otimizado (fonts non-blocking, assets `_astro`,
  `compressHTML`, CSS minificado).
- ⚠️ **Pendência:** reenviar sitemap no Google Search Console após o deploy e pedir
  indexação da URL `/cafe-da-manha/` ("Inspeção de URL" → "Solicitar indexação").

---

## 5. Metas (KPIs) para aprimorar o alcance

### 5.1 Meta principal

> **Meta 1 (90 dias):** alcançar **posição média ≤ 10 no Google** para as 5 keywords
> de cauda longa do cluster e **≥ 500 cliques/mês** vindos da vertical "café da manhã".

### 5.2 Metas em fases

| Fase | Prazo | Meta mensurável | Como medir |
|---|---|---|---|
| **Indexação** | 7 dias | URL `/cafe-da-manha/` indexada (status "Página" no GSC) | Search Console → Inspeção de URL |
| **Rastreio** | 15 dias | Crawl do sitemap com a nova URL; 0 erros de cobertura | GSC → Sitemaps / Cobertura |
| **Impressões** | 30 dias | ≥ 10k impressões somadas das keywords da vertical | GSC → Performance |
| **Ranking inicial** | 30–45 dias | Top 50 em 3 keywords de cauda longa | GSC → Performance (posição média) |
| **Top 10** | 60–90 dias | Top 10 em 3–5 keywords de cauda longa | GSC + SERP manual |
| **Cliques** | 90 dias | ≥ 500 cliques/mês na vertical | GSC → Performance |
| **CTR** | 90 dias | CTR ≥ 4% (média) nas impressões da vertical | GSC → Performance |
| **Engajamento** | contínuo | Tempo médio na pilar ≥ 2 min; bounce < 60% | GA4 |

### 5.3 Metas de autoridade (off-page)

| Meta | Prazo |
|---|---|
| 5–10 backlinks/menções (pinterest, fóruns, receitas) | 90 dias |
| Compartilhamentos sociais ≥ 100/semana nos posts do cluster | contínuo |
| Feed RSS/Google Discover: publicar 2 posts de apoio/mês | contínuo |

### 5.4 Metas de conteúdo (sustentação)

| Meta | Prazo |
|---|---|
| 2 posts de apoio publicados no blog (cluster) | 30 dias |
| 1 nova seção na pilar (ex.: "café da manhã por região") | 60 dias |
| Atualizar FAQ da pilar com perguntas reais do Search Console | mensal |

---

## 6. Monitoramento e cadência

- **Semanal:** GSC → Performance (impressões, cliques, posição, CTR por keyword);
  GA4 → engajamento na pilar.
- **Mensal:** revisar Search Console → Consultas; detectar novas keywords com
  impressões e criar/otimizar páginas; revisar cobertura de indexação.
- **Trimestral:** auditoria de interlinking da vertical; atualizar conteúdo da pilar
  (data de atualização, novas receitas); comparar metas vs. realizado e recalibrar.

---

## 7. Próximos passos imediatos

- [x] Adicionar link da pilar no rodapé ("Guia do Café" em `Footer.astro`).
- [x] Criar imagem OG exclusiva da página (`/og/cafe-da-manha.png`).
- [x] Produzir o 1º post de apoio "Café da manhã saudável com café" (rascunho em
      `docs/relatorios/post-cluster-cafe-da-manha-saudavel.md`) e linká-lo à pilar
      (seção "Café da manhã saudável" → `/blog/cafe-da-manha-saudavel-com-cafe`).
- [ ] **Publicar o post no dashboard** (conteúdo pronto para colar — ver rascunho).
- [x] Deploy do front realizado (2026-08-17) e validado em produção:
      `/cafe-da-manha/` 200 · OG 200 image/png · FAQPage 6 perguntas · canonical OK ·
      sitemap atualizado · links no dropdown/rodapé ativos · páginas existentes intactas.
- [ ] Enviar sitemap no GSC e solicitar indexação de `/cafe-da-manha/`.
- [ ] Produzir o 2º post de apoio do cluster (ex.: "Como montar mesa de café da manhã").

*Relatório criado em 2026-08-17 · Estratégia alinhada ao padrão das sessões SEO anteriores.*
