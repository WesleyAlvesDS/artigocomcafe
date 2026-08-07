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
node tests/playwright/dash-audit.mjs  # Dashboard audit
node tests/playwright/full-audit.mjs   # Full site audit
```

### Lint / Type Check

This project does not currently have dedicated lint or typecheck scripts.
Run `npm run build` to validate both TypeScript and JSX compilation.
