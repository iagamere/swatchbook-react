# Swatchbook 2

UI component explorer built with **React + TypeScript + Vite**.
Browse, preview (sandboxed), favorite, collect, export ZIPs, build themes, and generate an integration package and prompt for Claude.

```bash
npm install
npm run dev        # local development
npm run build      # production build in dist/
```

## Deploy
1. Push to GitHub (branch `main`).
2. Settings → Pages → Source: **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds and deploys.

## Structure
- `src/data.ts` component library (add a `C(...)` line per component)
- `src/lib/` ZIP read/write, theme tokens, Claude prompt builder
- `src/parts.tsx` card and detail view, `src/views.tsx` collections/theme/AI views
