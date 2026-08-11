# 🔐 Plano do Fluxo de Login — Auditoria e Melhorias

> **Skillmaster**: Playwright como parceiro — nada é considerado pronto sem validação
> visual e funcional automatizada. Este documento registra o planejamento, o grafo
> de nós/arestas do fluxo de login, os achados da auditoria e as melhorias aplicadas.

---

## 1. Objetivo

Garantir que o usuário tenha a **melhor experiência possível ao acessar o site**,
verificando de ponta a ponta o fluxo de autenticação (login, cadastro, recuperação
de senha, logout, páginas protegidas) e corrigindo **nós e arestas inativos ou sem
lógica** no grafo da jornada do usuário.

## 2. Grafo do fluxo (nós e arestas)

```
                        ┌────────────────────────────┐
                        │   PÁGINAS PÚBLICAS         │
                        │  / , /blog, /receitas, …   │
                        └────────────┬───────────────┘
                                     │ entrar / cadastro
                                     ▼
              ┌───────────────────────────────────────┐
              │            /entrar (login)            │
              │   nós: LoginForm, links de ajuda      │
              └──────────┬────────────────┬───────────┘
                         │ credenciais    │ já autenticado
                         ▼                ▼
              ┌──────────────┐   ┌──────────────────┐
              │ POST /auth/  │   │  (NÓ INATIVO)    │
              │ login        │   │  mostra login    │  → redirecionar p/ /dashboard/
              └──────┬───────┘   └──────────────────┘
                     │ token
                     ▼
        ┌──────────────────────────────┐
        │  Destino pós-login           │
        │  (nó: /dashboard/ ou ?next=) │
        └──────────────────────────────┘

┌───────────────────┐    ┌────────────────────────┐
│ PÁGINAS PROTEGIDAS │    │  /entrar com ?next=    │
│ /dashboard /perfil │◄───┤  volta à origem        │
│ /mapa /jornada …   │    │  (AuthGuard)           │
└───────────────────┘    └────────────────────────┘

┌─────────────────────────────┐   ┌──────────────────────────────┐
│ /recuperar-senha            │   │ Dashboard (pós-login)        │
│  → forgot → reset → login   │   │  widgets + Meus Artigos      │
│  ⚠️ reset_token vazado      │   │  (nó /user/posts INATIVO)    │
└─────────────────────────────┘   └──────────────────────────────┘
```

### Arestas verificadas

| Aresta | Estado na auditoria | Ação |
|--------|--------------------|------|
| `/entrar` → login válido → destino | ⚠️ ia para `/` | ✅ vai para `/dashboard/` (ou `?next=`) |
| `/entrar` → usuário **já logado** | 🔴 mostrava login de novo | ✅ redireciona p/ `/dashboard/` |
| `/cadastro` → registro → destino | ⚠️ ia para `/` | ✅ vai para `/dashboard/` (ou `?next=`) |
| `/cadastro` → usuário **já logado** | 🔴 mostrava cadastro de novo | ✅ redireciona p/ `/dashboard/` |
| Página protegida → sem token → `/entrar?next=` | ✅ ok | mantido |
| `?next=` → validação de URL segura | ✅ ok (evita open redirect) | mantido |
| `/auth/me` com token expirado (UserMenu) | ⚠️ token sujo permanecia | ✅ token é limpo |
| `/auth/forgot-password` | 🔴 devolvia `reset_token` em produção | ✅ token só em local/testing |
| Dashboard "Meus Artigos" → `/user/posts` | 🔴 **rotas inexistentes (404)** | ✅ CRUD implementado no backend |
| KnowledgeMap com erro de API | ⚠️ mostrava "Faça login" mesmo logado | ✅ estado de erro + retry |
| Logout | ✅ ok | mantido |

## 3. Melhorias implementadas

### Backend (Laravel)
1. **`UserPostController`** (novo) — CRUD `/user/posts` (listar, criar, editar, excluir)
   com slug único, categoria find-or-create, tags sync e estimativa de tempo de leitura.
   Apenas artigos do próprio usuário (403 para os demais).
2. **Rotas**: `GET/POST /user/posts`, `PUT/DELETE /user/posts/{article}` dentro do
   grupo `auth:sanctum`.
3. **Segurança**: `forgotPassword` só expõe `reset_token` em `local`/`testing`.
   Em produção, nenhum token é devolvido na resposta.

### Frontend (Astro/React)
4. **LoginForm**: destino padrão `/dashboard/`; usuário já autenticado é validado via
   `/auth/me` e redirecionado (token inválido é limpo, sem loop).
5. **RegisterForm**: destino padrão `/dashboard/`; usuário já autenticado redirecionado.
6. **UserMenu**: token inválido/expirado no `/auth/me` agora é limpo (logout silencioso).
7. **KnowledgeMap**: estado de erro de API com "Tentar novamente" (antes mostrava
   "Faça login" indevidamente).
8. **Toast**: nova função `showToast()` (evento `app:show-toast`) para toasts fora do
   contexto do provider (usada no login).

### Testes (Playwright)
9. **dash-audit.mjs**: mock de `/user/posts`, verificações do widget "Meus Artigos",
   teste de redirecionamento de usuário já logado em `/entrar` e `/cadastro`;
   removida rota duplicada de `/auth/me`.
10. **Credenciais**: `dash-login.mjs`, `full-audit.mjs` e `prod-test.mjs` agora exigem
    env vars (`DASH_EMAIL/DASH_PASSWORD`, `TEST_USER/TEST_PASS`) — sem credenciais
    versionadas (pendência antiga resolvida).

### Correções de build (herdadas de alterações não commitadas)
11. **`blog/[slug].astro`**: `<script is:inline>` com `{JSON.stringify(...)}` quebrava o
    compilador do Astro → convertido para `define:vars`.
12. **`receitas/index.astro`** + `getRecipes()`: contrato desatualizado (página esperava
    `{ recipes, pagination }` com filtros em objeto) → `getRecipes` atualizado para o
    novo contrato, espelhando `getPosts`.

## 4. Validação (Skillmaster)

- `php -l` nos arquivos alterados ✅
- `npm run build` → 432 páginas ✅
- `dash-audit.mjs` (Playwright, desktop + mobile) — a executar
- `full-audit.mjs` / `prod-test.mjs` — exigem credenciais por env (documentado)

## 5. Pendências

- Deploy do backend (rotas/controller) + frontend (build) no servidor.
- Atualizar `docs/README.md` e `README.md` com o novo estado.
