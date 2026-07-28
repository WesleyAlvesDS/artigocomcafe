# Artigo com Café — artigocomcafe.com

Blog autoral sobre cafeteria digital. Astro + React Islands + WordPress Headless.

## Estrutura

```
blog/
├── src/
│   ├── components/       # Astro + React components
│   ├── layouts/          # Layout Base (SEO, tema, fonts)
│   ├── lib/              # WordPress API, types, utils
│   ├── pages/            # Páginas (Home, Blog, Sobre, Contato, Newsletter)
│   └── styles/           # Design system (CSS custom properties)
├── public/               # Assets estáticos
├── dist/                 # Build output (enviar para servidor)
├── deploy.ps1            # Script de deploy automatizado
├── .htaccess             # Config servidor (Astro + WordPress)
└── astro.config.mjs
```

## Comandos

| Comando | Ação |
|---------|------|
| `npm run dev` | Dev server local |
| `npm run build` | Build produção → `dist/` |
| `npm run preview` | Preview do build |
| `npm run deploy` | Deploy automático para ValueHost |

## Deploy Manual (ValueHost - DirectAdmin)

1. **Build**: `npm run build`
2. **Upload**: Copiar `dist/` para `public_html/` no servidor
3. **.htaccess**: Garantir que `public_html/.htaccess` tenha `DirectoryIndex index.html index.php`

## Deploy Automático

```powershell
# Opção 1: passar caminho
.\deploy.ps1 -Target "C:\inetpub\public_html\artigocomcafe"

# Opção 2: criar .env com DEPLOY_PATH=
.\deploy.ps1

# Opção 3: npm script
npm run deploy
```

## WordPress Headless

O WordPress continua em `public_html/` e serve como backend de conteúdo:

- **Admin**: `https://artigocomcafe.com/wp-admin/`
- **API**: `https://artigocomcafe.com/wp-json/wp/v2/posts`
- **Mídias**: `https://artigocomcafe.com/wp-content/uploads/`
- **Plugins**: FluentCRM (newsletter), auto-blog-api (automação)

### Como publicar novo artigo

1. Escreva no WordPress (admin)
2. Execute no projeto: `npm run build`
3. Faça deploy do `dist/` para `public_html/`

### Automação (opcional)

Build automático via webhook: configure o plugin `auto-blog-api` para disparar rebuild via serviço externo (ex: GitHub Actions, cron).

## Design System

- **Fonte**: Inter (sans) + JetBrains Mono (mono)
- **Tema**: Dark (#0a0a0f) / Light (#fafafa)
- **Accent**: Teal (#00d4aa) + Violet (#7c3aed)
- **Glassmorphism**: backdrop-blur, cards translúcidos
- **Animações**: Scroll reveal, stagger, hover lift
