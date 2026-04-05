# Webconsig — Admin Dashboard Design Spec

**Date:** 2026-04-03
**Stack:** React, TypeScript, Vite, Shadcn/ui, Tailwind CSS v4, React Router v7, TanStack Query, Zod, MSW

---

## 1. Product Context

Webconsig is an electronic registration system for payroll-deducted loans (consignações) for public bodies (órgãos públicos). It serves five user roles within a single application at a single URL, with role-based access control determining what each user sees and can do.

**Primary goal:** Reduce loan granting time, ensure consistency between bank data and payroll deductions, streamline registration, guarantee full deduction processing, and provide audit-friendly history.

**Language:** Interface in Portuguese (pt-BR); codebase in English.

---

## 2. User Roles (Priority Order)

| Role | Description | Priority |
|---|---|---|
| `representative` | Lending institution representative — registers and manages consignments | 1 (highest volume) |
| `employee` | Public employee — views own loans, simulates, requests statements | 2 |
| `hr_manager` | City hall HR manager — manages employees, approves/rejects, runs reports | 3 |
| `institution_manager` | Lending institution manager — manages institution settings and representatives | 4 |
| `admin` | Application administrator — full system access, audit, config | 5 |

---

## 3. Architecture

### 3.1 Project Structure

```
frontend/
├── src/
│   ├── app/           # Router, providers, shell layout (AppShell, AuthProvider)
│   ├── pages/         # One folder per feature domain (not per role)
│   │   ├── home/
│   │   ├── consignments/
│   │   ├── portability/
│   │   ├── simulation/
│   │   ├── outstanding-balance/
│   │   ├── deduction-statement/
│   │   ├── rate-ranking/
│   │   ├── reports/
│   │   ├── employees/
│   │   ├── institutions/
│   │   ├── users/
│   │   ├── audit/
│   │   └── settings/
│   ├── components/    # Shared UI: DataTable, PageShell, StatusBadge, forms
│   ├── hooks/         # usePermissions, useAuth, useCurrentUser
│   ├── lib/           # API client stub, utils, formatters (pt-BR)
│   ├── types/         # Shared TypeScript interfaces
│   └── mocks/         # MSW handlers + static fixtures
```

### 3.2 Permissions Model

A `usePermissions()` hook reads the current user's role from `AuthContext` and exposes a `can(action: string, resource: string): boolean` function. Pages use it to conditionally render action buttons, table columns, and sections. The sidebar only renders items the logged-in role can access. **Data scoping is enforced by the backend** — the frontend reflects it but does not rely on it for security.

```ts
// Usage example
const { can } = usePermissions()
{can('approve', 'consignment') && <Button>Aprovar</Button>}
```

### 3.3 Mock Layer

MSW (Mock Service Worker) intercepts all API calls in development. Fixtures in `src/mocks/` mirror the expected backend contract. Switching to a real API requires only removing the MSW setup — no page-level changes needed.

---

## 4. Layout & Visual Design

- **Shell:** Fixed left sidebar + top header bar + main content area
- **Color theme:** Dark navy sidebar (`#1a3a5c`), blue primary (`#2563eb`), light grey content background (`#f0f4f8`), white cards
- **Sidebar groups:** Consignações · Financeiro · Relatórios · Cadastros · Sistema
- **Top header:** Greeting + user info + last session timestamp + avatar/menu

---

## 5. Navigation & Role Visibility

| Page (pt-BR) | Route | Admin | RH | Servidor | Gestor | Repres. |
|---|---|---|---|---|---|---|
| Início | `/` | ✓ | ✓ | ✓ | ✓ | ✓ |
| Consignações | `/consignments` | ✓ | ✓ | ✓ | ✓ | ✓ |
| Portabilidade | `/portability` | ✓ | ✓ | — | ✓ | ✓ |
| Simulação | `/simulation` | ✓ | ✓ | ✓ | ✓ | ✓ |
| Saldo Devedor | `/outstanding-balance` | ✓ | ✓ | — | ✓ | ✓ |
| Extrato de Descontos | `/deduction-statement` | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ranking de Taxas | `/rate-ranking` | ✓ | ✓ | ✓ | ✓ | ✓ |
| Relatórios | `/reports` | ✓ | ✓ | — | ✓ | ✓ |
| Servidores | `/employees` | ✓ | ✓ | — | — | — |
| Entidades | `/institutions` | ✓ | — | — | ✓ | — |
| Usuários | `/users` | ✓ | — | — | — | — |
| Auditoria | `/audit` | ✓ | — | — | — | — |
| Configurações | `/settings` | ✓ | — | — | — | — |

---

## 6. Home Page (Início)

Each role sees a tailored home. The representative's view (primary user) includes:

- **KPI Cards:** Consignações Ativas · Pendentes de Aprovação · Portabilidades em andamento · Valor Total Consignado
- **Consignações Recentes:** paginated DataTable (last 10), with status badges and link to full list
- **Ações Rápidas:** Nova Consignação · Simular Empréstimo · Solicitar Saldo Devedor · Gerar Extrato
- **Avisos:** deadline notices (prazo de fechamento da folha), items awaiting action

KPI cards and quick actions are rendered conditionally via `can()` — other roles see different KPIs and actions relevant to their context.

---

## 7. Core Data Types

```ts
type Role = 'admin' | 'hr_manager' | 'employee' | 'institution_manager' | 'representative'

interface CurrentUser {
  id: string
  name: string
  role: Role
  institutionId?: string  // representative & institution_manager only
  employeeId?: string     // employee only
}

interface Consignment {
  id: string
  employeeId: string
  institutionId: string
  installmentValue: number
  installments: number
  installmentsRemaining: number
  interestRate: number       // % a.m.
  totalValue: number
  remainingBalance: number
  startDate: string
  status: 'active' | 'pending' | 'cancelled' | 'finished'
}

interface Employee {
  id: string
  registration: string
  name: string
  cpf: string
  orgId: string
  grossSalary: number
  availableMargin?: number  // only if the public org releases this info
}

interface Institution {
  id: string
  name: string
  cnpj: string
  isActive: boolean
}

interface Portability {
  id: string
  consignmentId: string
  originInstitutionId: string
  destinationInstitutionId: string
  status: 'requested' | 'approved' | 'rejected'
}
```

---

## 8. Shared Component Patterns

| Component | Purpose |
|---|---|
| `DataTable` | Filterable, sortable, paginated table. Columns + actions defined per page; actions gated by `can()` |
| `PageShell` | Page wrapper: title, breadcrumb, top-right action slot |
| `StatusBadge` | Unified badge for all status values (Ativo, Pendente, Cancelado, etc.) |
| Forms | Shadcn `Form` + `react-hook-form` + Zod schema, colocated with their page |

---

## 9. Implementation Phases

### Phase 1 — Shell + Representante
- Project setup: Vite, React Router v7, Shadcn/ui, Tailwind v4, MSW
- Auth flow: login page, role-based redirect on login, `AuthProvider`, `usePermissions`
- App shell: sidebar (role-aware nav), header, `AppLayout`
- Pages: Início, Consignações, Portabilidade, Simulação, Saldo Devedor, Extrato de Descontos, Ranking de Taxas
- Mock data for all Phase 1 pages

### Phase 2 — Gestor de RH
- Pages: Servidores (with `availableMargin` if released by org), Relatórios
- Consignações: expose HR actions (approve / reject / suspend)
- Home: HR-specific KPIs (total active employees with consignments, margin utilisation)

### Phase 3 — Servidor (self-service)
- Consignações: employee-scoped view (own records only)
- Simulação, Extrato de Descontos: employee-scoped
- Home: personal KPIs (active loans, next deduction, total debt)

### Phase 4 — Gestor de Entidade
- Pages: Entidades (institution profile + settings), representative management
- Relatórios: institution-scoped reports (own consignments, representatives activity)

### Phase 5 — Administrador
- Pages: Usuários (CRUD), Auditoria (transaction history log), Configurações
- Full data visibility across all pages
