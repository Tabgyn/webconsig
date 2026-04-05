# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

Monorepo with two packages:

- `frontend/` — React + TypeScript SPA (Vite, Shadcn/ui, Tailwind CSS v4, React Router v7, TanStack Query, Zod, MSW)
- `backend/` — server-side application (stack TBD)

Design spec: [`docs/superpowers/specs/2026-04-03-webconsig-dashboard-design.md`](docs/superpowers/specs/2026-04-03-webconsig-dashboard-design.md)

## Product

Webconsig is an electronic registration system for payroll-deducted loans (consignações) for public bodies (órgãos públicos). Interface language is **Portuguese (pt-BR)**; codebase is in **English**.

Five user roles share a single URL — role-based access controls what each user sees:
`admin` · `hr_manager` · `employee` · `institution_manager` · `representative`

## Frontend Architecture

Pages are organized by **feature domain**, not by role (`src/pages/consignments/`, `src/pages/portability/`, etc.). A single page serves all roles — the backend scopes data, the frontend adapts UI via a `usePermissions()` hook:

```ts
const { can } = usePermissions()
{can('approve', 'consignment') && <Button>Aprovar</Button>}
```

Mock data via MSW (`src/mocks/`) during development. Removing MSW is the only change needed to connect a real API.

## Key Shared Components

- `DataTable` — filterable, sortable, paginated; columns and actions defined per page, actions gated by `can()`
- `PageShell` — page wrapper with title, breadcrumb, top-right action slot
- `StatusBadge` — unified badge for all status values

## Frontend Development

All commands run from `frontend/`:

```bash
npm run dev          # Start Vite dev server (MSW enabled automatically)
npm run build        # Production build
npm run test         # Run Vitest in watch mode
npm run test:run     # Run tests once (CI)
npx vitest run src/path/to/file.test.ts  # Run a single test file
```

## Test Accounts (dev only)

All passwords: `password`

| Email | Role |
|---|---|
| representante@bancalfa.com | Representante |
| rh@prefeitura.gov.br | Gestor de RH |
| servidor@prefeitura.gov.br | Servidor |
| gestor@bancalfa.com | Gestor de Entidade |
| admin@webconsig.com | Administrador |
