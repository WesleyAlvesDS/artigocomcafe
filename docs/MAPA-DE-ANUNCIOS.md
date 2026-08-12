# Mapa de Anúncios — Artigo com Café

Documento para localizar **todos** os pontos de publicidade (Adsterra) do site.
Use este mapa para remover ou desativar anúncios rapidamente no futuro.

## Rede de publicidade

A rede usada é a **Adsterra**, que entrega três formatos de anúncio:

| Componente | Formato | Domínio |
|---|---|---|
| `AdSterraBanner.astro` | Banner iframe (leaderboard, mobile, skyscraper) | `highperformanceformat.com` |
| `AdSterraNative.astro` | Nativo (in-feed / sidebar) | `effectivecpmnetwork.com` |
| `AdSterraSmartLink.astro` | Smart Link (link patrocinado) | `effectivecpmnetwork.com` |

> **Nota técnica:** o componente `AdSterraBanner` usa `set:html` num script `is:inline`
> para definir a variável global `atOptions` antes do `invoke.js` carregar. Não remover
> só o `invoke.js` sem remover também o script `atOptions`.

---

## 1. Componentes de anúncio (DFN — Definição)

Compara a pontos de renderização — remova estes se quiser limpar totalmente o site.

| Arquivo | Descrição |
|---|---|
| `src/components/AdSterraBanner.astro` | Banner iframe parametrizado (key, width, height) |
| `src/components/AdSterraNative.astro` | Anúncio nativo com script de `invoke.js` embutido |
| `src/components/AdSterraSmartLink.astro` | Link patrocinado com URL fixa da rede |

---

## 2. Pontos de renderização (uso dos componentes)

### Home (`src/pages/index.astro`)
| Linha | Componente | Chave / Formato | Classe CSS |
|---|---|---|---|
| 24 | `AdSterraBanner` | `a2885857...` — 728×90 (leaderboard) | — |
| 102 | `AdSterraNative` | nativo | — |
| 103 | `AdSterraSmartLink` | link | `home-ad-smartlink` |

### Blog — listagem (`src/pages/blog/index.astro`)
| Linha | Componente | Chave / Formato | Classe CSS |
|---|---|---|---|
| 150 | `AdSterraBanner` | `a2885857...` — 728×90 (leaderboard) | — |

Blog — listagem usa também `SidebarWidgets` (ver seção 3), que renderiza nativo e smart link no sidebar.

### Blog — artigo (`src/pages/blog/[slug].astro`)
| Linha | Componente | Chave / Formato | Classe CSS |
|---|---|---|---|
| 189 | `AdSterraNative` | nativo (após o conteúdo) | `ad-article-inline` |
| 204 | `AdSterraSmartLink` | card | `ad-article-smartlink` |
| 210 | `AdSterraBanner` | `36c0e766...` — 320×50 (mobile) | `ad-article-mobile` |
| 238 | `AdSterraBanner` | `b479d95f...` — 160×300 (skyscraper, sidebar) | `ad-article-skyscraper` |

### Receitas — listagem (`src/pages/receitas/index.astro`)
| Linha | Componente | Chave / Formato | Classe CSS |
|---|---|---|---|
| 200 | `AdSterraBanner` | `a2885857...` — 728×90 (leaderboard) | — |

Receitas — listagem usa também `SidebarWidgets` (seção 3).

### Receita — detalhe (`src/pages/receitas/[slug].astro`)
| Linha | Componente | Chave / Formato | Classe CSS |
|---|---|---|---|
| 317 | `AdSterraSmartLink` | card | `ad-recipe-smartlink` |
| 323 | `AdSterraBanner` | `5e4796fa...` — 468×60 | `ad-recipe-banner` |
| 327 | `AdSterraNative` | nativo (sidebar) | `ad-recipe-sidebar` |

---

## 3. Sidebar compartilhada (`src/components/SidebarWidgets.astro`)

Renderizada em `blog/index.astro:137` e `receitas/index.astro:187`.
Sempre exibe anúncio:

| Linha | Componente | Formato |
|---|---|---|
| 34 | `AdSterraNative` | nativo (topo do sidebar) |
| 73 | `AdSterraSmartLink` | card |

> Remover apenas o **nativo** (linha 33–35), o **smart link** (linha 72–77), ou o bloco
> inteiro `.widget-ad`. O widget mantém os demais cards (café do dia, receita, newsletter, câmbio).

---

## 4. Footer (`src/components/Footer.astro`)

| Linha | Componente | Formato |
|---|---|---|
| 65 | `AdSterraSmartLink` | link (dentro de `.footer-bottom`) |

Aparece em todas as páginas (importado pelo `Base.astro`).

---

## 5. Referências externas / anexos de rede

| Arquivo | Linha | O que é |
|---|---|---|
| `src/layouts/Base.astro` | 148 | `<link rel="preconnect">` para `effectivecpmnetwork.com` (otimização) |
| `src/pages/cookies.astro` | 69, 82 | Texto da política de cookies citando Adsterra e link para a política de privacidade da rede |

> Ao remover anúncios, atualize também `cookies.astro` para retirar a menção à Adsterra.
> O `preconnect` em `Base.astro` pode ser removido (perfumaria de performance).

---

## Como remover todos os anúncios de uma vez

1. **Renderização:** apague ou comente as linhas listadas nas seções 2, 3 e 4.
2. **Componentes (opcional):** delete os 3 arquivos da seção 1 e limpe os `import` deles
   nas páginas (`index.astro`, `blog/index.astro`, `blog/[slug].astro`,
   `receitas/index.astro`, `receitas/[slug].astro`, `Footer.astro`, `SidebarWidgets.astro`).
3. **CSS:** remova os blocos de estilo dos componentes (sumiram junto com os arquivos)
   e as classes de anúncio nos `<style>` das páginas (`ad-article-*`, `ad-recipe-*`,
   `adsterra-smartlink` no `Footer.astro`, `home-ad-*`, `*-leaderboard`, `home-ad-section`).
4. **Texto legal:** ajuste `src/pages/cookies.astro` (menção a Adsterra).
5. **Prefetch:** remova o `preconnect` em `src/layouts/Base.astro:148`.
6. Rebuild: `npm run build` e deploy normal.

---

## Chaves dos banners (referência)

| Chave | Formato | Onde |
|---|---|---|
| `a2885857c5978b578e5340115924dbb1` | 728×90 | home, blog list, receitas list |
| `36c0e766cf3f9f800adf45b24d6e2815` | 320×50 | artigo (mobile) |
| `b479d95fee71af96353fa4bbcc5b72b5` | 160×300 | artigo (sidebar) |
| `5e4796fac36254508762271cad34a145` | 468×60 | receita |

Chave do nativo (fixa em `AdSterraNative.astro`): `b286da2e2fe2bfd4ecebf03e8a877de9`.
URL do smart link (fixa em `AdSterraSmartLink.astro:20`):
`https://www.effectivecpmnetwork.com/ryhkx4gd?key=1c1fb12053a54c089ff2c5a6c46c3ef1`xvx
---

## 6. Densidade real por página (auditoria agosto/2026)

> Slots contados por template (exclui o smartlink do footer, presente em todas).

| Página | Slots | Lazy-load | Observação |
|---|---|---|---|
| Home | 3 (leaderboard 728×90 + nativo + smartlink) | nativo: lazy | Leaderboard acima da dobra (eager) |
| Blog listagem | 1 leaderboard + sidebar (nativo + smartlink) | ambos lazy | |
| **Artigo** | **4 (nativo inline + smartlink + 320×50 mobile + 160×300 sidebar)** | todos lazy | O mais denso — aceitável (3–5 desktop) |
| Receitas listagem | 1 leaderboard + sidebar (nativo + smartlink) | ambos lazy | |
| Receita detalhe | 3 (smartlink + 468×60 + nativo sidebar) | banner + nativo lazy | |
| Footer (todas) | 1 smartlink link | — | Sem script externo (link puro) |

### Regras aplicadas

- **Lazy-load:** slots abaixo da dobra usam `IntersectionObserver` (`rootMargin: 350px`)
  com fallback de 9s — nunca deixam o slot vazio e preservam LCP/INP.
- **Distância mínima:** margens verticais de 2.75rem–3rem entre anúncios e conteúdo
  interativo (política anti-clique acidental).
- **Densidade mobile ≤ 30%:** nenhuma página passa do limite; o artigo tem o maior
  peso, dentro do recomendado (2–3 mobile / 3–5 desktop).

---

## 7. Estado do Google AdSense (importante!)

**Configurado mas sem unidades ativas.** O site carrega o script do AdSense no
`<head>` (`Base.astro` — `ca-pub-4516147510474933`) e a meta tag de verificação,
porém **não existe nenhuma unidade `<ins class="adsbygoogle">` renderizada** em
qualquer página. Toda a monetização atual vem da **Adsterra**.

### Para ativar o AdSense

1. Aprovar a conta em `https://adsense.google.com` (site adicionado via meta tag).
2. Criar unidades de anúncio responsivas no painel (display + in-feed).
3. Renderizá-las nos pontos estratégicos — sugestão de prioridade:
   - **Artigo:** 1 unidade inline após o 2º parágrafo + 1 sticky/âncora mobile
   - **Home:** 1 unidade abaixo da seção de widgets
   - **Receita:** 1 unidade após os ingredientes
   - **Sidebar:** 1 unidade display (300×250)
4. Manter a densidade ≤ 30% e espaçamento ≥ 150px do conteúdo interativo.

### Onde ver as métricas

| Métrica | Onde | Referência |
|---|---|---|
| RPM / CPC / impressões | AdSense → Relatórios | Comparar RPM por página (artigo > receita > home) |
| Viewability | AdSense → Relatórios → Visibilidade | Alvo ≥ 70% |
| Cliques inválidos | AdSense → Centro de revisão | Previne limitação de conta |
| Core Web Vitals | Search Console / PageSpeed Insights | CLS < 0.1, LCP < 2.5s, INP < 200ms |
| Densidade de anúncios | PageSpeed Insights → Experiência | Mobile ≤ 30% da altura do conteúdo |

> **Nota:** o AdSense também pode limitar a entrega se a página tiver excesso de
> anúncios em relação ao conteúdo. Com 3–4 slots por página e lazy-load, o site
> está em conformidade.
