# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal website for Xiaolin (xiaolin.li), built with Vite + React 19 + React Router v7 (Data Mode), deployed to Cloudflare Pages as a static SPA.

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — TypeScript check + production build (`tsc -b && vite build`)
- `npm run preview` — Preview production build

## Architecture

**Framework:** React 19 with TypeScript. React Router v7 in Data Mode (`createBrowserRouter`) with `lazy()` per-route code splitting.

**Routing** (`src/router.tsx`):
- `/` — Landing page
- `/blog` — Blog listing, `/blog/:slug` — Blog post
- `/demos/*` — Interactive demos (squircles, rounded-polygon, voice-visualizer)
- `/tools/*` — Developer tools (timing, path-interpolator, blur-to-gradient, lottie-base64, scroll-target)
- `*` — 404 catch-all
- Root layout (`src/routes/root.tsx`) renders Nav + `<Outlet />`
- Legacy paths (e.g. `tools/calculate-scroll-target`) redirect to new paths

**Key directories:**
- `src/routes/` — Page components, each exports `Component` (and optionally `loader`) for React Router lazy loading
- `src/components/` — Shared components (Nav, CodeSnippet, InputSlider) with CSS Modules
- `src/hooks/` — Custom hooks (useDocumentTitle)
- `src/lib/` — Framework-agnostic pure JS libraries:
  - `lib/timing/` — Spring animation converter (solver, converter, animator, constants, templates)
  - `lib/scroll-target/` — Scroll physics calculations
  - `lib/demos/` — Canvas/geometry utilities (squircle, RoundedPolygon)
  - `lib/utils/` — Math and CSS helpers

**Styling:**
- `src/app.css` — Global design system: modern-normalize reset, CSS custom properties (neutral color palette, semantic tokens, radii, fonts), element-level styles (button, select, input, table, etc.)
- Fonts: IBM Plex Sans (body), Lora (headings) via @fontsource-variable
- Shared components use CSS Modules (`.module.css`)
- Page-specific styles use scoped classes in `app.css`

**Deployment:**
- Static SPA to Cloudflare Pages
- `public/_redirects` handles SPA fallback (`/* /index.html 200`)
- Vite `assetsInclude: ['**/*.glsl']` for WebGL shader imports

## Design Philosophy

**Semantic HTML first, components only when complex.** Native `<button>`, `<input>`, `<select>`, `<table>`, `<details>` are styled globally via `app.css`. React components exist only for genuinely complex UI (InputSlider = range + number combo, CodeSnippet = code + copy, Nav = active link detection).

**CSS custom properties for theming.** All colors, radii, and fonts defined as `--color-*` / `--radius-*` / `--font-*` variables in `:root`. Semantic aliases (`--color-primary`, `--color-muted`, etc.) reference the neutral scale.

**Path alias:** `@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.json`).
