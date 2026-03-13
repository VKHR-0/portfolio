# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (run both concurrently)
bun --bun vite dev --port 3000   # Frontend dev server
bunx --bun convex dev            # Convex backend (separate terminal)

# Build & preview
bun --bun vite build
bun --bun vite preview

# Testing
vitest run                       # Run all tests
vitest run src/path/to/file      # Run single test file

# Code quality
biome check --write .            # Fix formatting + linting
biome check                      # Check only (no writes)
```

Always use `bun` — never npm/yarn/pnpm.

## Architecture

**Stack:** React 19 + TanStack Start (SSR via Nitro) + Convex (backend) + Better Auth + Tailwind CSS 4 + shadcn UI

**Build:** Vite is aliased to `rolldown-vite`. React Compiler (`babel-plugin-react-compiler`) is active — no manual `useMemo`/`useCallback` needed.

### Routing

TanStack Router with file-based routing in `src/routes/`. `src/routeTree.gen.ts` is auto-generated — never edit it.

Two route groups:

- `_home/` — Public pages (posts, projects)
- `admin/` — Authenticated admin CRUD (posts, projects, categories, series, tags)

Route masks are used to keep modals at clean URLs (e.g., `/admin/tags/new` masked as `/admin/tags`).

### Data Flow

1. Convex functions in `convex/functions/` — queries (reads) and mutations (writes)
2. `@convex-dev/react-query` adapter bridges Convex to TanStack Query
3. Route loaders prefetch data; components consume with `useSuspenseQuery`
4. Mutations called on form submit, cache updates automatically

Schema in `convex/schema.ts`. `convex/_generated/` is auto-generated — never edit it.

### Auth

Better Auth with Convex adapter. Auth client: `src/lib/auth-client.ts`, server: `src/lib/auth-server.ts`. Auth check runs in root route `beforeLoad`. Email/password only, no signup flow.

### Forms & Validation

TanStack Form + Zod (v4). Convex mutations on submit.

### Rich Text Editor

TipTap with 20+ extensions (code blocks, tables, math/KaTeX, drag handle, slash commands, bubble menu). Editor component in `src/components/editor.tsx`, static renderer for display.

## Path Aliases

- `#/*` → `src/*` (e.g., `#/components/ui/button`)
- `convex/*` → `convex/*`
- `shared/*` → `shared/*`

## Conventions

- **Formatting:** Biome — tab indentation, double quotes, organized imports
- **Tailwind classes:** Auto-sorted by Biome in `clsx`, `cva`, `cn`, `tw` calls
- **Exports:** Named exports only (no default exports)
- **UI components:** shadcn (style: `base-nova`, icons: `hugeicons`, color: `mist`)
- **Icons:** `@hugeicons/react` + `@hugeicons/core-free-icons`
- **Environment variables:** Validated via T3 Env in `src/env.ts`
- **Biome scope:** Lints `src/**/*` and `convex/**/*`; excludes `convex/_generated`, `routeTree.gen.ts`, `tmp/`

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:

- `CONVEX_DEPLOYMENT` — from Convex dashboard
- `VITE_CONVEX_URL` — Convex API endpoint
- `VITE_SITE_URL`
- `BETTER_AUTH_SECRET` — generate with `bunx --bun @better-auth/cli secret`
- `VITE_CONVEX_SITE_URL`
