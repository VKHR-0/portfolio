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
biome check                      # Check formatting + linting
biome lint                       # Lint only
biome format                     # Format only
```

## Architecture

**Stack:** React 19 + TanStack Start (SSR) + Convex (backend) + Better Auth + Tailwind CSS + shadcn UI

**Routing:** TanStack Router with file-based routing. `routeTree.gen.ts` is auto-generated — never edit it manually. Routes live in `src/routes/`.

**Two main route groups:**

- `_home/` — Public-facing pages (posts, projects)
- `admin/` — Authenticated admin CRUD (posts, projects, categories, series, tags)

**Backend:** All database access goes through Convex. Backend functions live in `convex/functions/`. Schema defined in `convex/schema.ts`. Convex separates reads (`query`) from writes (`mutation`).

**Auth:** Better Auth with Convex adapter (`@convex-dev/better-auth`). Auth client in `src/lib/auth-client.ts`, server helpers in `src/lib/auth-server.ts`. Auth check happens in the root route (`src/routes/__root.tsx`).

**Data fetching:** TanStack React Query via `@convex-dev/react-query` adapter. Loaders in route files prefetch data; components use `useSuspenseQuery`.

**Forms:** TanStack Form + Zod for validation. Convex mutations called on submit.

**Rich text editor:** TipTap with many extensions (code blocks, tables, math/KaTeX, drag handle). Editor component in `src/components/editor.tsx`.

## Path Aliases

- `#/*` → `src/*` (e.g., `#/components/ui/button`)
- `convex/*` → `convex/*`
- `shared/*` → `shared/*`

## Key Conventions

- Package manager: **bun** (always use `bun`, not npm/yarn/pnpm)
- Linter/formatter: **Biome** (not ESLint/Prettier)
- Biome lints `src/**/*` and `convex/**/*`; excludes `convex/_generated/**/*` and `routeTree.gen.ts`
- UI components use shadcn (style: base-nova, icons: Tabler)
- Environment variables validated via T3 Env in `src/env.ts`

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:

- `CONVEX_DEPLOYMENT` — from Convex dashboard
- `VITE_CONVEX_URL` — Convex API endpoint
- `VITE_SITE_URL`
- `BETTER_AUTH_SECRET` — generate with `bunx --bun @better-auth/cli secret`
- `VITE_CONVEX_SITE_URL`
