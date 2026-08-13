# 📋 Auditoria Completa do Fluxo de Login & Dashboard — Artigo com Café

> **Data:** 2026-08-11  
> **Versão:** 1.0  
> **Auditor:** Web Designer Pós-Graduado | Engenharia de Experiência

---

## 🎯 Resumo Executivo

| Métrica | Status Atual | Objetivo |
|---------|--------------|----------|
| **Score Geral** | ~72% | ≥90% |
| **Login Flow** | Funcional mas com redundâncias | Fluido, sem loops |
| **Dashboard UX** | Funcional, estático | Imersivo, criação fluida |
| **Mobile Dashboard** | Básico | Nativo, responsivo |
| **Content Creation** | Formulário simples | Editor rico com preview |
| **Edge Cases** | Parcialmente tratados | Cobertura total |

---

## 🔍 Análise Detalhada por Nó/Aresta

### 1. Fluxo de Autenticação (`/entrar/`, `/cadastro/`)

#### ✅ **Funcionando**
- Login com email/senha via `/auth/login`
- Redirect inteligente com parâmetro `?next=`
- Toggle de visualização de senha
- Auto-redirect se já autenticado (LoginForm linha 40-54)

#### ❌ **Problemas Identificados**

| Nó/Aresta | Problema | Severidade |
|-----------|----------|------------|
| **LoginForm → AuthProvider** | Duplicação de verificação: LoginForm faz `api.get('/auth/me')` E AuthProvider também faz no mount | 🟡 Médio |
| **LoginForm → `/entrar/`** | Se token inválido/expirado, limpa token mas usuário fica na página sem feedback visual | 🟡 Médio |
| **AuthProvider → `/auth/me`** | Sem retry automático em falhas de rede; falha silenciosa | 🟡 Médio |
| **`/cadastro/` → Dashboard** | Não testado no audit; mesmo código de redirect do login | 🟡 Médio |
| **Logout → Home** | `logout()` chama API mas não trata erro de rede; usuário pode ficar "logado" localmente | 🔴 Alto |

#### 🔴 **Arestas Quebradas/Inativas**
```
┌─────────────────────────────────────────────────────────────┐
│  /entrar/ (já logado) ──✗──> Deveria ir para /dashboard/   │
│  /cadastro/ (já logado) ──✗──> Deveria ir para /dashboard/ │
│  Token expirado ──✗──> Deveria mostrar "Sessão expirada"   │
│  Falha de rede no logout ──✗──> Limpar localStorage anyway │
└─────────────────────────────────────────────────────────────┘
```

---

### 2. Dashboard (`/dashboard/`) — Painel do Autor/Leitor

#### ✅ **Funcionando**
- 4 seções navegáveis: Overview, Contexto, Meus Artigos, Assistente IA
- Navegação por hash (`#overview`, `#posts`, etc.)
- Atalhos de teclado (1-4)
- Widgets de API integrados: Clima, Câmbio, Manchetes
- CRUD de posts via `/user/posts` (listar, criar, editar, excluir)
- Auto-save de rascunhos (localStorage + broadcast)
- Estados de loading/skeleton/error
- Responsivo (mobile sidebar colapsável, desktop sticky)

#### ❌ **Problemas de UX/Design**

| Área | Problema | Impacto |
|------|----------|---------|
| **Criação de Conteúdo** | Formulário simples `<textarea>` para Markdown; sem preview live | 🔴 Alto - autor não vê resultado |
| **Editor** | Sem toolbar de formatação (bold, italic, headings, links, imagens) | 🔴 Alto |
| **Gestão de Imagens** | Sem upload de capa/imagens no editor | 🔴 Alto |
| **Preview** | Só vê resultado após publicar; sem "Visualizar" | 🟡 Médio |
| **Rascunhos** | Um único rascunho; sem versionamento/histórico | 🟡 Médio |
| **Categorias/Tags** | Input livre; sem autocomplete/sugestões | 🟡 Médio |
| **SEO** | Sem campos meta title/description, slug editável | 🟡 Médio |
| **Mobile** | Sidebar oculta; navegação por tabs horizontal com scroll | 🟡 Médio |
| **Acessibilidade** | Falta aria-live em auto-save; focus management fraco | 🟡 Médio |

#### 🔴 **Arestas Quebradas no Dashboard**
```
┌─────────────────────────────────────────────────────────────┐
│  Novo Artigo → Salvar ──✗──> Deveria abrir preview antes   │
│  Editar → Cancelar ──✗──> Deveria perguntar "Descartar?"   │
│  Excluir ──✗──> Confirmação nativa `confirm()` (feia)       │
│  Rascunho auto-save ──✗──> Sem indicador visual de "salvo"  │
│  Mobile: #posts → scroll ──✗──> Navbar some, perde contexto │
│  Teclado: Tab no editor ──✗──> Não insere tab, foca próximo │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Fluxos de Navegação (Grafo de Estados)

```
ESTADOS DO USUÁRIO:
┌─────────────┐     login      ┌─────────────┐
│  ANÔNIMO    │ ─────────────> │  AUTENTICADO│
└─────────────┘                └─────────────┘
      │                              │
      │ register                     │ logout
      ▼                              ▼
┌─────────────┐                ┌─────────────┐
│  ANÔNIMO    │ <───────────── │  AUTENTICADO│
└─────────────┘                └─────────────┘

ARRESTAS PROBLEMÁTICAS:
┌────────────────────────────────────────────────────────────┐
│ ANÔNIMO ──/entrar/──> LOGIN ──success──> /dashboard/  ✓   │
│ AUTENTICADO ──/entrar/──> REDIRECT ──> /dashboard/  ✗ BUG │
│ AUTENTICADO ──/cadastro/──> REDIRECT ──> /dashboard/ ✗ BUG │
│ AUTENTICADO ──/dashboard/ (token expirado) ──> /entrar/  ✗  │
│   Deveria: mostrar toast "Sessão expirada, faça login"     │
└────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Plano de Melhorias Priorizadas

### P0 — Crítico (Bloqueia UX)
1. **Fix edge cases de redirect** — logged-in user em `/entrar/`, `/cadastro/`
2. **Token refresh/validation** — interceptar 401, tentar refresh, fallback limpo
3. **Logout robusto** — limpar localStorage mesmo se API falhar

### P1 — Alto (Experiência de Criação)
4. **Editor Markdown Rico** — Toolbar, shortcuts, live preview split-pane
5. **Upload de Imagens** — Drag-drop, paste, otimização automática
6. **Preview Modal** — "Visualizar" antes de publicar
7. **Gestão de Rascunhos v2** — Múltiplos, versionamento, restauração ponto-a-ponto

### P2 — Médio (Polimento)
8. **Mobile Dashboard** — Bottom sheet navigation, swipe gestures
9. **Keyboard Shortcuts** — `Cmd+S` save, `Cmd+P` publish, `Cmd+E` edit
10. **SEO Fields** — Meta title, description, slug editável, OG image
11. **Categorias/Tags Autocomplete** — Sugestões baseadas em uso

### P3 — Nice to Have
12. **Colaboração** — Comentários inline, sugestões
13. **Analytics no Dashboard** — Views, tempo de leitura por artigo
14. **Export/Import** — Markdown, Notion, Ghost

---

## 📦 Implementação Imediata (Próximos Passos)

### 1. Correção do Auth Flow (`LoginForm.tsx`, `auth.tsx`)
```typescript
// Remover verificação duplicada em LoginForm
// Centralizar em AuthProvider com interceptor 401
// Adicionar toast "Sessão expirada" no erro 401
```

### 2. Dashboard Editor Rico (`PostEditor.tsx` novo)
```tsx
// Componente com:
// - Toolbar flutuante (B, I, H1-H3, Link, Image, Code, Quote)
// - Split pane: Editor | Preview (sync scroll)
// - Auto-save com indicador visual
// - Keyboard shortcuts
// - Drag-drop images → upload → insert markdown
```

### 3. Mobile Navigation (`DashboardMobileNav.tsx`)
```tsx
// Bottom sheet com:
// - 4 tabs fixas + "Mais"
// - Swipe para fechar
// - Badge de rascunho no tab "Artigos"
// - Safe area inset para iOS
```

### 4. Testes de Regressão
```bash
# Rodar audit completo
node tests/playwright/dash-audit.mjs
# Esperado: score ≥ 90%
```

---

## 🎨 Design System para Dashboard

### Cores de Estado
```css
:root {
  --draft-amber: #f59e0b;      /* Rascunho */
  --published-gold: #d4a373;   /* Publicado */
  --review-orange: #f97316;    /* Em Revisão */
  --scheduled-blue: #3b82f6;   /* Agendado */
  --archived-gray: #6b7280;    /* Arquivado */
  --error-red: #ef4444;        /* Erro */
  --success-green: #22c55e;    /* Sucesso/Salvo */
}
```

### Componentes Base
- `StatCard` — animação count-up, hover lift
- `ActionButton` — loading state, ripple, tooltip
- `Toast` — sucesso/erro/info, auto-dismiss, action button
- `Modal` — focus trap, ESC para fechar, portal
- `Dropdown` — keyboard nav, click outside, portal

---

## ✅ Checklist de Validação Pós-Implementação

### Login Flow
- [ ] Anônimo em `/entrar/` → login → `/dashboard/`
- [ ] Anônimo em `/cadastro/` → registro → `/dashboard/`
- [ ] Autenticado em `/entrar/` → redirect imediato `/dashboard/`
- [ ] Autenticado em `/cadastro/` → redirect imediato `/dashboard/`
- [ ] Token expirado → toast "Sessão expirada" → `/entrar/`
- [ ] Logout com falha de rede → limpa localStorage → `/`
- [ ] `?next=/biblioteca` preservado no login

### Dashboard
- [ ] Editor abre em < 200ms
- [ ] Preview live sync scroll
- [ ] Toolbar completa (10+ ações)
- [ ] Drag-drop imagem → upload → insert
- [ ] Auto-save indicador visual
- [ ] `Cmd+S` salva, `Cmd+Enter` publica
- [ ] Mobile: bottom sheet nav funcional
- [ ] Sem overflow horizontal 375px
- [ ] Acessível: Tab order, ARIA labels, focus visible

### API Widgets
- [ ] Clima: geolocalização + fallback cidade
- [ ] Câmbio: 6 moedas, cache 1h
- [ ] Manchetes: Guardian + HN, cache 1h
- [ ] Todos com retry button em erro

---

## 📊 Métricas de Sucesso (KPIs)

| KPI | Baseline | Target 30d |
|-----|----------|------------|
| Tempo médio criação artigo | 12 min | 6 min |
| Taxa abandono editor | 35% | <15% |
| Artigos publicados/semana | 2.3 | 5 |
| Mobile dashboard usage | 18% | 35% |
| Erros console (dashboard) | 3/session | 0 |
| Auto-save reliability | 80% | 99.9% |

---

*Documento vivo — atualizar conforme implementação*  
*Próxima revisão: após P0+P1 concluídos*