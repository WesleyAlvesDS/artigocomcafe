# 🔌 Plano de APIs Externas — Artigo com Café

> **Documento vivo** — além do plano original, registra o **status de integração**
> de cada API no backend (`backend/app/Services/Integrations/`).
> Specs de resposta e snippets: [docs/apis/](apis/).

## Resumo de integração

| API | Grupo | Backend | Status |
|-----|-------|---------|--------|
| The Guardian Open Platform | Notícias | `GuardianService` | ✅ Integrada (widget + Central Editorial) |
| Hacker News | Notícias | `HackerNewsService` | ✅ Integrada (Central Editorial) |
| Currents API | Notícias | `CurrentsService` | ✅ Integrada (Central Editorial) |
| GNews | Notícias | `GNewsService` | ✅ Integrada (Central Editorial) |
| OpenWeatherMap | Clima | `OpenWeatherService` | ✅ Integrada (Clima do Café + widget) |
| ExchangeRate-API | Economia | `ExchangeRateService` | ✅ Integrada (widget do dashboard) |
| Openverse (CC Search) | Imagens | `OpenverseService` | ✅ Integrada (sugestão de capas) |
| IPinfo | Contexto local | — | ⬜ Planejada |
| Unsplash API | Imagens | — | ⬜ Planejada |
| Groq Cloud | IA | — | ⬜ Planejada |
| Google Gemini API | IA | — | ⬜ Planejada |

---

## Notícias e Atualidades

Integrar notícias mantém seu blog relevante e atualizado.

- **Currents API**: Atualmente uma das mais generosas para uso comercial gratuito
  (~600-1.000 requisições/dia). Permite buscar notícias recentes por palavra-chave,
  fonte ou país sem as restrições severas de outras APIs.
- **GNews**: Oferece cerca de 100 requisições diárias no plano gratuito. É excelente
  para exibir "Manchetes do Dia" ou notícias relacionadas ao tópico do artigo automaticamente.
- **The Guardian Open Platform**: Acesso gratuito ao vasto arquivo de jornalismo de
  qualidade do The Guardian. Ideal para blogs que precisam de fontes históricas ou
  reportagens aprofundadas.
- **Hacker News**: [API pública oficial](https://github.com/HackerNews/API) — sem
  chave, ótima para pautas de tecnologia.
- **Reddit Scraper** (apify): [https://apify.com/benthepythondev/reddit-scraper](https://apify.com/benthepythondev/reddit-scraper)

## Dados em Tempo Real (Contexto Local e Global)

Dados dinâmicos aumentam o tempo de permanência do usuário no site.

- **OpenWeatherMap**: A padrão da indústria para dados meteorológicos. Widgets que
  mostram o clima atual ou previsões para cidades mencionadas nos posts.
  *(usado no "Clima do Café" da home — sugere a bebida ideal para a temperatura)*
- **ExchangeRate-API**: Fundamental para blogs de finanças, viagens ou e-commerce.
  Taxas de câmbio atualizadas em tempo real. *(widget no dashboard)*
- **IPinfo**: Detecta a localização aproximada do visitante baseada no IP.
  Útil para personalizar conteúdo ou exibir preços na moeda local. *(planejada)*

## Mídia e Imagens (Direitos Autorais Seguros)

- **Unsplash API**: Milhões de fotos gratuitas de alta resolução. Geração de
  thumbnails automáticas baseadas nas tags do artigo. *(planejada)*
- **Openverse** (antiga CC Search): Gerida pelo WordPress e Creative Commons —
  milhões de ativos (áudio, imagem, vídeo) em domínio público ou licenças CC,
  garantindo segurança jurídica. ✅ **Integrada** — ação "Sugerir capa" no painel.

## 🧠 Inteligência Artificial e Processamento de Texto

- **Groq Cloud**: Acesso extremamente rápido a LLMs (Llama, Mixtral) com nível
  gratuito generoso. Resumos automáticos, sugestão de títulos, meta-descrições SEO.
- **Google Gemini API**: Nível gratuito robusto para IA generativa —
  chatbots especializados no nicho e análise de sentimentos.

*(ambas planejadas — a Central Editorial já prepara o caminho: pauta → rascunho → revisão)*

## 💡 Dica de Implementação

- **Cacheie as respostas**: APIs gratuitas têm limites de requisição. O backend
  salva as respostas (clima, câmbio, notícias) em cache por períodos curtos
  (ex.: 1 hora) em vez de chamar a API a cada carregamento.
- **Combine APIs**: Crie experiências únicas — ex.: o "Clima do Café" combina
  OpenWeather + receitas sugeridas pela temperatura; a Central Editorial combina
  notícias (Guardian/HN/Currents/GNews) + capa via Openverse.
