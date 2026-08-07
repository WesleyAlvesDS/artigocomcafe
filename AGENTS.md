## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## JSX in Astro (React Components)

### `class=` vs `className=`

Astro's React integration allows using `class=` as an alias for `className=` in JSX
within `.tsx` files. This project uses `class=` throughout for consistency with
Astro's preferred syntax. Vite may emit dev-mode warnings about this, but it
works correctly in production builds.

```tsx
// Both work — this project uses:
<div class="glass-card">✅</div>

// Instead of:
<div className="glass-card">❌</div>
```

### Test Commands

```
npm run build       # Build for production
npm run dev         # Start dev server
node tests/playwright/dash-audit.mjs  # Dashboard audit (mock auth, 39 tests)
node tests/playwright/prod-test.mjs   # Production test (real creds, 17 tests)
node tests/playwright/full-audit.mjs  # Full site audit
```

### Deployment (ValueHost DirectAdmin)

Frontend (Astro static):
```
npm run build
scp -P 1157 -i "C:\Users\prowe\.ssh\id_ed25519" -r dist/* arti3263@br64-da.valueserver.net.br:/home/arti3263/domains/artigocomcafe.com/public_html/
```
After SCP, fix permissions — Astro dirs default to 700 which causes 403 on directory index:
```
ssh -p 1157 -i "C:\Users\prowe\.ssh\id_ed25519" arti3263@br64-da.valueserver.net.br "
  find /home/arti3263/domains/artigocomcafe.com/public_html/ -type d -exec chmod 755 {} \; &&
  find /home/arti3263/domains/artigocomcafe.com/public_html/ -type f -exec chmod 644 {} \; &&
  chmod 644 /home/arti3263/domains/artigocomcafe.com/public_html/.htaccess
"
```
Always exclude `storage/` from frontend deploys (Laravel storage dir, not needed here).

Backend (Laravel):
```
scp -P 1157 -i "C:\Users\prowe\.ssh\id_ed25519" -r backend/app/ backend/routes/ backend/composer.json arti3263@br64-da.valueserver.net.br:/home/arti3263/domains/back.artigocomcafe.com/public_html/
```
After deploy, clear caches:
```
php artisan config:clear && php artisan route:clear && php artisan config:cache && php artisan route:cache
```

### Lint / Type Check

This project does not currently have dedicated lint or typecheck scripts.
Run `npm run build` to validate both TypeScript and JSX compilation.
