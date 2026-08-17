# 🛒 Loja — Diagnóstico de Integração e Roadmap

> Documento vivo: o que já existe, o que falta integrar para a loja funcionar de
> verdade e a ordem recomendada. Complementa o plano de negócio em
> [apoio.md](apoio.md) (dropshipping + Print on Demand, sem estoque próprio).

---

## 1. Estado atual (o que já funciona)

O front da loja está **100% implementado e no ar** (deploy 2026-08-17), mas o
fluxo de compra é **simulado** — nada toca um servidor de pedidos/pagamento.

| Área | Arquivo(s) | Status |
|------|-----------|--------|
| Catálogo de produtos (20 máx.) | `src/data/products.ts` | ✅ dados + specs + FAQ + benefícios |
| Página da loja | `src/pages/loja.astro` | ✅ listagem com filtros |
| Página de produto (SEO) | `src/pages/loja/[slug].astro` | ✅ schema `Product`/`Offer` no JSON-LD |
| Carrinho (localStorage) | `src/lib/cart.ts` + `src/components/CartDrawer.astro` | ✅ add/remove/qty, frete fixo, progresso frete grátis |
| Checkout (UI) | `src/pages/loja/checkout.astro` | ✅ dados, endereço, Pix/cartão/boleto, máscaras, validação |
| Confirmação | `src/pages/loja/confirmacao.astro` | ✅ timeline de status, `robots=noindex` |
| Teste e2e | `tests/playwright/loja-flow-check.mjs` | ✅ fluxo simulado |

## 2. O que está SIMULADO hoje (limitações)

- **Pagamento:** QR Code Pix decorativo, cartão fictício, boleto fake — a própria
  página exibe "Transação simulada… integração com o gateway real será ativada em breve".
- **Pedido:** salvo apenas em `localStorage` (`acf-orders`) — some em outro
  navegador/dispositivo; não há registro no servidor.
- **Frete:** fixo (`R$ 19,90`, grátis ≥ `R$ 199`) em `src/lib/cart.ts`.
- **Grãos/jornada:** a confirmação promete crédito de grãos, mas nada é creditado.
- **Fornecedores:** `products.ts` não possui SKU, link de envio ou parceiro.

## 3. Backend — o que existe

- **Não existe** model `Order`/`OrderItem`, migration, controller ou rota de pedidos
  (`backend/app/Models/` não tem Order; `routes/api.php` não tem `/orders`).
- **Não há gateway de pagamento configurado** (sem Asaas/Stripe/Mercado Pago no
  `backend/config` nem no `.env.server`).
- ✅ O que **já existe** e pode ser reaproveitado: sistema de **Grãos** (`Grain`,
  `RoasteryController` — earn/spend), autenticação Sanctum, usuários e dashboard.

## 4. Roadmap de integração (por prioridade)

### 🔴 Fase 1 — Essencial para vender de verdade

| # | Integração | Detalhe |
|---|-----------|---------|
| 1 | **Backend de pedidos (API)** | Model `Order` + `OrderItem` (+ migrations), endpoints `POST /api/orders`, `GET /api/user/orders`, status do pedido; compra como visitante (e-mail) e vinculada ao usuário logado |
| 2 | **Gateway de pagamento** | Pix dinâmico (QR real), cartão e boleto + **webhook** que confirma o pagamento e atualiza o status; chave no `.env.server` + `config/services.php` |
| 3 | **E-mails transacionais** | Confirmação do pedido, pagamento aprovado, envio e rastreio (prometido em `docs/apoio.md` — "link enviado por e-mail") |
| 4 | **Dashboard "Meus pedidos"** | Seção no dashboard do leitor com pedidos, status e itens |

### 🟠 Fase 2 — Fechar o modelo de negócio

| # | Integração | Detalhe |
|---|-----------|---------|
| 5 | **Fornecedores (dropshipping/POD)** | Plataforma que receba o pedido (ex.: Nuvemshop/Shopify + Printify/Printful, ou afiliados Shopee/AliExpress); preencher `products.ts` com SKU/fornecedor/prazo |
| 6 | **Frete real** | Cálculo por CEP (Correios/Melhor Envio) ou frete do fornecedor no lugar do valor fixo |
| 7 | **Rastreio automático** | Número de rastreio do fornecedor → timeline da confirmação/dashboard |

### 🟡 Fase 3 — Promessas do site + robustez

| # | Integração | Detalhe |
|---|-----------|---------|
| 8 | **Grãos na jornada** | Creditar `Grain` automaticamente quando o webhook confirmar o pagamento (o sistema já existe) |
| 9 | **Legal (LGPD/CDC)** | Termos de compra, política de devolução/troca, guarda de dados no servidor (hoje só no navegador) |
| 10 | **Filas e segurança** | Filas (Redis) para e-mails/webhooks, rate limit no `POST /orders`, validação de CEP e de dados |

## 5. Decisão que define tudo — modelo de monetização

| Modelo | O que exige | Checkout |
|--------|-------------|----------|
| **Loja própria (dropshipping + POD)** — como em `docs/apoio.md` | Backend de pedidos + gateway + fornecedores via API | No próprio site (experiência completa da marca) |
| **Afiliados (Shopee/AliExpress/Amazon)** | Apenas links externos + comissão; **sem** gateway nem backend de pedidos | No site do parceiro |

> **Decisão em aberto (2026-08-17):** escolher o caminho antes de integrar —
> ele define se Fase 1 (gateway + pedidos) é necessária ou se a loja vira uma
> vitrine de afiliados.

## 6. Próximos passos sugeridos

- [ ] Escolher o modelo (loja própria vs. afiliados).
- [ ] Pesquisar provedores (gateway de pagamento, e-mail transacional, plataforma
      dropshipping/POD) com o Índice Gravity antes de integrar.
- [ ] Implementar Fase 1 (backend de pedidos + gateway + e-mails + dashboard).
- [ ] Atualizar este documento conforme cada integração for concluída.

*Criado em 2026-08-17 · Baseado na auditoria do código da loja (front + backend).*
