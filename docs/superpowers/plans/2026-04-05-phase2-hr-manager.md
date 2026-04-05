# Phase 2 — Gestor de RH Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the HR Manager (gestor de RH) perspective — Servidores page, Relatórios page, wired consignment approve/reject/cancel mutations, and HR-specific home KPIs.

**Architecture:** All new pages follow the existing feature-domain pattern (`src/pages/<feature>/`). Consignment status changes go through a `useMutation` + `api.patch` + `invalidateQueries` cycle. MSW handlers are extended with a mutable in-memory copy of consignments so status changes persist across requests within a session.

**Tech Stack:** React 19, TanStack Query v5 (`useMutation`, `useQueryClient`), TanStack Table v8, react-hook-form v7, Zod v3, MSW v2, Vitest v2 + Testing Library

---

## File Map

| Status | Path | Responsibility |
|--------|------|----------------|
| Modify | `frontend/src/lib/api.ts` | Add `patch` method |
| Modify | `frontend/src/types/index.ts` | Extend `DashboardStats` with HR KPI fields |
| Create | `frontend/src/pages/not-found/not-found-page.tsx` | 404 page |
| Create | `frontend/src/pages/not-found/not-found-page.test.tsx` | 404 page tests |
| Modify | `frontend/src/app/router.tsx` | Add `/employees`, `/reports`, catch-all `*` routes |
| Create | `frontend/src/mocks/handlers/employees.ts` | GET /api/employees mock |
| Modify | `frontend/src/mocks/browser.ts` | Register new handlers |
| Create | `frontend/src/pages/employees/employees-page.tsx` | Servidores page |
| Create | `frontend/src/pages/employees/employees-page.test.tsx` | Servidores page tests |
| Create | `frontend/src/mocks/handlers/reports.ts` | POST /api/reports/export mock |
| Create | `frontend/src/pages/reports/reports-page.tsx` | Relatórios page |
| Create | `frontend/src/pages/reports/reports-page.test.tsx` | Relatórios page tests |
| Modify | `frontend/src/mocks/handlers/consignments.ts` | Mutable array + PATCH handler |
| Modify | `frontend/src/pages/consignments/consignments-page.tsx` | Wire mutations to buttons |
| Create | `frontend/src/pages/consignments/consignments-page.test.tsx` | Mutation wiring tests |
| Modify | `frontend/src/mocks/handlers/dashboard.ts` | Add `totalEmployees`, `employeesWithConsignments` |
| Modify | `frontend/src/pages/home/home-page.tsx` | Render HR KPI cards |

---

## Task 1: Add `patch` to API client + extend DashboardStats

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Add `patch` to api.ts**

Replace `src/lib/api.ts` with:

```ts
const API_BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error((error as { message?: string }).message ?? 'Erro na requisição')
  }
  return response.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
```

- [ ] **Step 2: Extend DashboardStats in types/index.ts**

Replace the `DashboardStats` interface (lines 80–85) in `src/types/index.ts`:

```ts
export interface DashboardStats {
  activeConsignments: number
  pendingApproval: number
  activePortabilities: number
  totalConsignedValue: number
  totalEmployees: number
  employeesWithConsignments: number
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npm run build`
Expected: build succeeds (no new type errors)

- [ ] **Step 4: Commit**

```bash
cd frontend && git add src/lib/api.ts src/types/index.ts
git commit -m "feat: add api.patch and extend DashboardStats with HR KPI fields"
```

---

## Task 2: 404 page + routing

**Files:**
- Create: `frontend/src/pages/not-found/not-found-page.tsx`
- Create: `frontend/src/pages/not-found/not-found-page.test.tsx`
- Modify: `frontend/src/app/router.tsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/pages/not-found/not-found-page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router'
import { NotFoundPage } from './not-found-page'

describe('NotFoundPage', () => {
  it('renders a 404 heading', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /404/i })).toBeInTheDocument()
  })

  it('renders a link back to home', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /início/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `cd frontend && npm run test:run -- not-found-page`
Expected: FAIL — `NotFoundPage` not found

- [ ] **Step 3: Create the 404 page**

Create `frontend/src/pages/not-found/not-found-page.tsx`:

```tsx
import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
      <h1 className="text-6xl font-bold text-slate-300">404</h1>
      <p className="text-lg text-slate-600">Página não encontrada.</p>
      <Link to="/" className="text-blue-600 hover:underline text-sm">
        ← Ir para o Início
      </Link>
    </div>
  )
}
```

- [ ] **Step 4: Run test to confirm it passes**

Run: `cd frontend && npm run test:run -- not-found-page`
Expected: PASS (2 tests)

- [ ] **Step 5: Add /employees, /reports, and catch-all routes to router**

Replace `frontend/src/app/router.tsx`:

```tsx
import { createBrowserRouter } from 'react-router'
import { ProtectedRoute } from './protected-route'
import { AppLayout } from './app-layout'
import { LoginPage } from '@/pages/login/login-page'
import { HomePage } from '@/pages/home/home-page'
import { ConsignmentsPage } from '@/pages/consignments/consignments-page'
import { PortabilityPage } from '@/pages/portability/portability-page'
import { SimulationPage } from '@/pages/simulation/simulation-page'
import { OutstandingBalancePage } from '@/pages/outstanding-balance/outstanding-balance-page'
import { DeductionStatementPage } from '@/pages/deduction-statement/deduction-statement-page'
import { RateRankingPage } from '@/pages/rate-ranking/rate-ranking-page'
import { EmployeesPage } from '@/pages/employees/employees-page'
import { ReportsPage } from '@/pages/reports/reports-page'
import { NotFoundPage } from '@/pages/not-found/not-found-page'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'consignments', element: <ConsignmentsPage /> },
      { path: 'portability', element: <PortabilityPage /> },
      { path: 'simulation', element: <SimulationPage /> },
      { path: 'outstanding-balance', element: <OutstandingBalancePage /> },
      { path: 'deduction-statement', element: <DeductionStatementPage /> },
      { path: 'rate-ranking', element: <RateRankingPage /> },
      { path: 'employees', element: <EmployeesPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
```

Note: `EmployeesPage` and `ReportsPage` don't exist yet — the build will fail until Tasks 3 and 4 are done. That is expected. Do not run build until both pages exist.

- [ ] **Step 6: Commit**

```bash
cd frontend && git add src/pages/not-found/ src/app/router.tsx
git commit -m "feat: add 404 page and register /employees, /reports, catch-all routes"
```

---

## Task 3: Servidores page (/employees)

**Files:**
- Create: `frontend/src/mocks/handlers/employees.ts`
- Modify: `frontend/src/mocks/browser.ts`
- Create: `frontend/src/pages/employees/employees-page.tsx`
- Create: `frontend/src/pages/employees/employees-page.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/pages/employees/employees-page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '@/app/auth-context'
import type { CurrentUser, Employee } from '@/types'
import { EmployeesPage } from './employees-page'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      data: [
        { id: 'emp-1', registration: '001234', name: 'Carlos Oliveira', cpf: '12345678901', orgId: 'org-1', grossSalary: 4500, availableMargin: 900 },
      ] as Employee[],
    }),
  },
}))

const hrUser: CurrentUser = { id: 'u1', name: 'RH User', email: 'rh@test.com', role: 'hr_manager' }
const mockAuth = { user: hrUser, token: 'tok', isAuthenticated: true, login: vi.fn(), logout: vi.fn() }

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={mockAuth}>
        <MemoryRouter>
          <EmployeesPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

describe('EmployeesPage', () => {
  it('renders page title', () => {
    renderPage()
    expect(screen.getByText('Servidores')).toBeInTheDocument()
  })

  it('renders table column headers', () => {
    renderPage()
    expect(screen.getByText('Matrícula')).toBeInTheDocument()
    expect(screen.getByText('Nome')).toBeInTheDocument()
    expect(screen.getByText('CPF')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `cd frontend && npm run test:run -- employees-page`
Expected: FAIL — `EmployeesPage` not found

- [ ] **Step 3: Create the employees MSW handler**

Create `frontend/src/mocks/handlers/employees.ts`:

```ts
import { http, HttpResponse } from 'msw'
import { EMPLOYEES } from '../fixtures/employees'

export const employeeHandlers = [
  http.get('/api/employees', () => {
    return HttpResponse.json({ data: EMPLOYEES, total: EMPLOYEES.length })
  }),
]
```

- [ ] **Step 4: Register the handler in browser.ts**

Replace `frontend/src/mocks/browser.ts`:

```ts
import { setupWorker } from 'msw/browser'
import { authHandlers } from './handlers/auth'
import { consignmentHandlers } from './handlers/consignments'
import { portabilityHandlers } from './handlers/portability'
import { simulationHandlers } from './handlers/simulation'
import { outstandingBalanceHandlers } from './handlers/outstanding-balance'
import { deductionStatementHandlers } from './handlers/deduction-statement'
import { rateRankingHandlers } from './handlers/rate-ranking'
import { dashboardHandlers } from './handlers/dashboard'
import { employeeHandlers } from './handlers/employees'
import { reportHandlers } from './handlers/reports'

export const worker = setupWorker(
  ...authHandlers,
  ...consignmentHandlers,
  ...portabilityHandlers,
  ...simulationHandlers,
  ...outstandingBalanceHandlers,
  ...deductionStatementHandlers,
  ...rateRankingHandlers,
  ...dashboardHandlers,
  ...employeeHandlers,
  ...reportHandlers,
)
```

Note: `reportHandlers` from `./handlers/reports` does not exist yet — it will be created in Task 4. browser.ts will fail to compile until then; that is expected.

- [ ] **Step 5: Create the Servidores page**

Create `frontend/src/pages/employees/employees-page.tsx`:

```tsx
import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { api } from '@/lib/api'
import { formatCurrency, formatCPF } from '@/lib/formatters'
import { PageShell } from '@/components/page-shell'
import { DataTable } from '@/components/data-table'
import type { Employee } from '@/types'

const col = createColumnHelper<Employee>()

const columns = [
  col.accessor('registration', { header: 'Matrícula' }),
  col.accessor('name', { header: 'Nome' }),
  col.accessor('cpf', {
    header: 'CPF',
    cell: (info) => formatCPF(info.getValue()),
  }),
  col.accessor('grossSalary', {
    header: 'Salário Bruto',
    cell: (info) => formatCurrency(info.getValue()),
  }),
  col.accessor('availableMargin', {
    header: 'Margem Disponível',
    cell: (info) => {
      const v = info.getValue()
      return v !== undefined ? formatCurrency(v) : '—'
    },
  }),
]

export function EmployeesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get<{ data: Employee[] }>('/employees'),
  })

  return (
    <PageShell
      title="Servidores"
      description="Lista de servidores cadastrados no sistema."
    >
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchPlaceholder="Buscar por matrícula ou nome..."
      />
    </PageShell>
  )
}
```

- [ ] **Step 6: Run test to confirm it passes**

Run: `cd frontend && npm run test:run -- employees-page`
Expected: PASS (3 tests)

- [ ] **Step 7: Commit**

```bash
cd frontend && git add src/mocks/handlers/employees.ts src/pages/employees/
git commit -m "feat: add Servidores page with employees listing"
```

---

## Task 4: Relatórios page (/reports)

**Files:**
- Create: `frontend/src/mocks/handlers/reports.ts`
- Modify: `frontend/src/mocks/browser.ts` (already updated in Task 3 — just needs the file to exist)
- Create: `frontend/src/pages/reports/reports-page.tsx`
- Create: `frontend/src/pages/reports/reports-page.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/pages/reports/reports-page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '@/app/auth-context'
import type { CurrentUser } from '@/types'
import { ReportsPage } from './reports-page'

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn().mockResolvedValue({}) },
}))

const hrUser: CurrentUser = { id: 'u1', name: 'RH User', email: 'rh@test.com', role: 'hr_manager' }
const mockAuth = { user: hrUser, token: 'tok', isAuthenticated: true, login: vi.fn(), logout: vi.fn() }

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={mockAuth}>
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

describe('ReportsPage', () => {
  it('renders page title', () => {
    renderPage()
    expect(screen.getByText('Relatórios')).toBeInTheDocument()
  })

  it('renders export buttons for each report type', () => {
    renderPage()
    const buttons = screen.getAllByRole('button', { name: /exportar/i })
    expect(buttons.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `cd frontend && npm run test:run -- reports-page`
Expected: FAIL — `ReportsPage` not found

- [ ] **Step 3: Create the reports MSW handler**

Create `frontend/src/mocks/handlers/reports.ts`:

```ts
import { http, HttpResponse } from 'msw'

const REPORT_TYPES = ['consignments', 'employees', 'deductions'] as const

export const reportHandlers = [
  http.post('/api/reports/export', async ({ request }) => {
    const body = await request.json() as { type: string }
    if (!REPORT_TYPES.includes(body.type as typeof REPORT_TYPES[number])) {
      return HttpResponse.json({ message: 'Tipo de relatório inválido' }, { status: 400 })
    }
    return HttpResponse.json({ message: `Relatório "${body.type}" exportado com sucesso.` })
  }),
]
```

- [ ] **Step 4: Create the Relatórios page**

Create `frontend/src/pages/reports/reports-page.tsx`:

```tsx
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { PageShell } from '@/components/page-shell'
import { Button } from '@/components/ui/button'

interface ReportType {
  type: string
  label: string
  description: string
}

const REPORT_TYPES: ReportType[] = [
  { type: 'consignments', label: 'Consignações', description: 'Todas as consignações registradas no período.' },
  { type: 'employees', label: 'Servidores', description: 'Lista de servidores com margem consignável.' },
  { type: 'deductions', label: 'Descontos', description: 'Extrato consolidado de descontos por competência.' },
]

export function ReportsPage() {
  const [exported, setExported] = useState<string | null>(null)

  const exportMutation = useMutation({
    mutationFn: (type: string) =>
      api.post<{ message: string }>('/reports/export', { type }),
    onSuccess: (_, type) => setExported(type),
  })

  return (
    <PageShell
      title="Relatórios"
      description="Exporte relatórios gerenciais do sistema."
    >
      <div className="space-y-3">
        {REPORT_TYPES.map((r) => (
          <div key={r.type} className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-sm font-medium text-slate-800">{r.label}</p>
              <p className="text-xs text-slate-500">{r.description}</p>
            </div>
            <div className="flex items-center gap-3">
              {exported === r.type && (
                <span className="text-xs text-green-600">Exportado!</span>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={exportMutation.isPending}
                onClick={() => exportMutation.mutate(r.type)}
              >
                Exportar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  )
}
```

- [ ] **Step 5: Run test to confirm it passes**

Run: `cd frontend && npm run test:run -- reports-page`
Expected: PASS (2 tests)

- [ ] **Step 6: Verify the full build compiles (router.tsx + browser.ts now have all imports)**

Run: `cd frontend && npm run build`
Expected: build succeeds

- [ ] **Step 7: Commit**

```bash
cd frontend && git add src/mocks/handlers/reports.ts src/mocks/browser.ts src/pages/reports/
git commit -m "feat: add Relatórios page with export actions"
```

---

## Task 5: Consignment status mutations

**Files:**
- Modify: `frontend/src/mocks/handlers/consignments.ts`
- Modify: `frontend/src/pages/consignments/consignments-page.tsx`
- Create: `frontend/src/pages/consignments/consignments-page.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/pages/consignments/consignments-page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '@/app/auth-context'
import type { CurrentUser, Consignment } from '@/types'
import { ConsignmentsPage } from './consignments-page'

const mockPatch = vi.fn().mockResolvedValue({ data: {} })
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'cons-1',
          employeeId: '001234',
          institutionId: 'inst-1',
          installmentValue: 500,
          installments: 12,
          installmentsRemaining: 10,
          interestRate: 1.5,
          totalValue: 6000,
          remainingBalance: 5000,
          startDate: '2026-01-01',
          status: 'pending',
        },
      ] as Consignment[],
    }),
    patch: mockPatch,
  },
}))

const hrUser: CurrentUser = { id: 'u1', name: 'RH User', email: 'rh@test.com', role: 'hr_manager' }
const mockAuth = { user: hrUser, token: 'tok', isAuthenticated: true, login: vi.fn(), logout: vi.fn() }

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={mockAuth}>
        <MemoryRouter>
          <ConsignmentsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

describe('ConsignmentsPage mutations', () => {
  it('renders Aprovar button for pending consignment viewed by hr_manager', async () => {
    renderPage()
    expect(await screen.findByRole('button', { name: /aprovar/i })).toBeInTheDocument()
  })

  it('calls api.patch with status active when Aprovar is clicked', async () => {
    renderPage()
    const btn = await screen.findByRole('button', { name: /aprovar/i })
    await userEvent.click(btn)
    expect(mockPatch).toHaveBeenCalledWith('/consignments/cons-1', { status: 'active' })
  })

  it('renders Rejeitar button for pending consignment viewed by hr_manager', async () => {
    renderPage()
    expect(await screen.findByRole('button', { name: /rejeitar/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `cd frontend && npm run test:run -- consignments-page`
Expected: FAIL — buttons render but clicks don't call api.patch (not wired yet)

- [ ] **Step 3: Update the consignments MSW handler to use a mutable array + add PATCH**

Replace `frontend/src/mocks/handlers/consignments.ts`:

```ts
import { http, HttpResponse } from 'msw'
import { CONSIGNMENTS } from '../fixtures/consignments'
import type { Consignment, ConsignmentStatus } from '@/types'

// Mutable in-memory copy — persists across requests in the same browser session
let consignmentsData: Consignment[] = [...CONSIGNMENTS]

export const consignmentHandlers = [
  http.get('/api/consignments', () => {
    return HttpResponse.json({ data: consignmentsData, total: consignmentsData.length })
  }),

  http.post('/api/consignments', async ({ request }) => {
    const body = await request.json() as Partial<Consignment>
    const newConsignment: Consignment = {
      id: `cons-${Date.now()}`,
      employeeId: body.employeeId ?? '',
      institutionId: body.institutionId ?? '',
      installmentValue: body.installmentValue ?? 0,
      installments: body.installments ?? 0,
      installmentsRemaining: body.installments ?? 0,
      interestRate: body.interestRate ?? 0,
      totalValue: (body.installmentValue ?? 0) * (body.installments ?? 0),
      remainingBalance: (body.installmentValue ?? 0) * (body.installments ?? 0),
      startDate: new Date().toISOString().split('T')[0],
      status: 'pending',
    }
    consignmentsData = [...consignmentsData, newConsignment]
    return HttpResponse.json({ data: newConsignment }, { status: 201 })
  }),

  http.patch('/api/consignments/:id', async ({ params, request }) => {
    const body = await request.json() as { status: ConsignmentStatus }
    const index = consignmentsData.findIndex((c) => c.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ message: 'Consignação não encontrada' }, { status: 404 })
    }
    consignmentsData = consignmentsData.map((c) =>
      c.id === params.id ? { ...c, status: body.status } : c,
    )
    return HttpResponse.json({ data: consignmentsData[index] })
  }),
]
```

- [ ] **Step 4: Wire mutations in consignments-page.tsx**

Replace `frontend/src/pages/consignments/consignments-page.tsx`:

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { api } from '@/lib/api'
import { usePermissions } from '@/hooks/use-permissions'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/formatters'
import { PageShell } from '@/components/page-shell'
import { DataTable } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import type { Consignment, ConsignmentStatus } from '@/types'

const col = createColumnHelper<Consignment>()

export function ConsignmentsPage() {
  const { can } = usePermissions()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['consignments'],
    queryFn: () => api.get<{ data: Consignment[] }>('/consignments'),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ConsignmentStatus }) =>
      api.patch<{ data: Consignment }>(`/consignments/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consignments'] }),
  })

  const columns = [
    col.accessor('id', { header: 'Nº' }),
    col.accessor('employeeId', { header: 'Matrícula' }),
    col.accessor('institutionId', { header: 'Entidade' }),
    col.accessor('installmentValue', {
      header: 'Parcela (R$)',
      cell: (info) => formatCurrency(info.getValue()),
    }),
    col.accessor('installments', { header: 'Prazo' }),
    col.accessor('installmentsRemaining', { header: 'Saldo (parc.)' }),
    col.accessor('interestRate', {
      header: 'Taxa a.m.',
      cell: (info) => formatPercentage(info.getValue()),
    }),
    col.accessor('remainingBalance', {
      header: 'Saldo Devedor',
      cell: (info) => formatCurrency(info.getValue()),
    }),
    col.accessor('startDate', {
      header: 'Início',
      cell: (info) => formatDate(info.getValue()),
    }),
    col.accessor('status', {
      header: 'Status',
      cell: (info) => <StatusBadge status={info.getValue()} />,
      enableSorting: false,
    }),
    ...(can('approve', 'consignment') || can('cancel', 'consignment')
      ? [
          col.display({
            id: 'actions',
            header: 'Ações',
            cell: (info) => (
              <div className="flex gap-2">
                {can('approve', 'consignment') && info.row.original.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-700 border-green-300 hover:bg-green-50 h-7 text-xs"
                    disabled={updateStatus.isPending}
                    onClick={() =>
                      updateStatus.mutate({ id: info.row.original.id, status: 'active' })
                    }
                  >
                    Aprovar
                  </Button>
                )}
                {can('reject', 'consignment') && info.row.original.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-700 border-red-300 hover:bg-red-50 h-7 text-xs"
                    disabled={updateStatus.isPending}
                    onClick={() =>
                      updateStatus.mutate({ id: info.row.original.id, status: 'cancelled' })
                    }
                  >
                    Rejeitar
                  </Button>
                )}
                {can('cancel', 'consignment') && info.row.original.status === 'active' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-slate-600 h-7 text-xs"
                    disabled={updateStatus.isPending}
                    onClick={() =>
                      updateStatus.mutate({ id: info.row.original.id, status: 'cancelled' })
                    }
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            ),
          }),
        ]
      : []),
  ]

  return (
    <PageShell
      title="Consignações"
      description="Lista de todas as consignações registradas no sistema."
      action={
        can('create', 'consignment') ? (
          <Button className="bg-blue-600 hover:bg-blue-700">+ Nova Consignação</Button>
        ) : undefined
      }
    >
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchPlaceholder="Buscar por matrícula, entidade..."
      />
    </PageShell>
  )
}
```

- [ ] **Step 5: Run tests to confirm they pass**

Run: `cd frontend && npm run test:run -- consignments-page`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add src/mocks/handlers/consignments.ts src/pages/consignments/
git commit -m "feat: wire consignment approve/reject/cancel mutations"
```

---

## Task 6: HR home KPIs

**Files:**
- Modify: `frontend/src/mocks/handlers/dashboard.ts`
- Modify: `frontend/src/pages/home/home-page.tsx`

- [ ] **Step 1: Extend the dashboard stats handler**

Replace `frontend/src/mocks/handlers/dashboard.ts`:

```ts
import { http, HttpResponse } from 'msw'
import { CONSIGNMENTS } from '../fixtures/consignments'
import { EMPLOYEES } from '../fixtures/employees'
import { PORTABILITIES } from '../fixtures/portabilities'
import type { DashboardStats, Alert } from '@/types'

export const dashboardHandlers = [
  http.get('/api/dashboard/stats', () => {
    const activeConsignments = CONSIGNMENTS.filter((c) => c.status === 'active')
    const employeeIdsWithActive = new Set(activeConsignments.map((c) => c.employeeId))

    const stats: DashboardStats = {
      activeConsignments: activeConsignments.length,
      pendingApproval: CONSIGNMENTS.filter((c) => c.status === 'pending').length,
      activePortabilities: PORTABILITIES.filter((p) => p.status === 'requested').length,
      totalConsignedValue: activeConsignments.reduce((sum, c) => sum + c.remainingBalance, 0),
      totalEmployees: EMPLOYEES.length,
      employeesWithConsignments: employeeIdsWithActive.size,
    }
    return HttpResponse.json(stats)
  }),

  http.get('/api/dashboard/alerts', () => {
    const data: Alert[] = [
      {
        id: 'alert-1',
        type: 'warning',
        message: 'Prazo de fechamento da folha: 05/04/2026',
        date: '2026-04-03',
      },
      {
        id: 'alert-2',
        type: 'info',
        message: '2 consignações aguardam aprovação do órgão',
        date: '2026-04-03',
      },
    ]
    return HttpResponse.json({ data })
  }),
]
```

- [ ] **Step 2: Add HR KPI cards to the home page**

In `frontend/src/pages/home/home-page.tsx`, replace the KPI cards grid section (lines 59–87):

```tsx
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Consignações Ativas"
          value={stats?.activeConsignments ?? '—'}
          accentColor="#2563eb"
        />
        {can('approve', 'consignment') && (
          <KpiCard
            label="Pendentes de Aprovação"
            value={stats?.pendingApproval ?? '—'}
            trend={stats?.pendingApproval ? 'Requer atenção' : undefined}
            accentColor="#f59e0b"
          />
        )}
        {can('view', 'portability') && (
          <KpiCard
            label="Portabilidades"
            value={stats?.activePortabilities ?? '—'}
            trend="Em andamento"
            accentColor="#22c55e"
          />
        )}
        <KpiCard
          label="Valor Total Consignado"
          value={stats ? formatCurrency(stats.totalConsignedValue) : '—'}
          accentColor="#dc2626"
        />
        {can('view', 'employees') && (
          <KpiCard
            label="Total de Servidores"
            value={stats?.totalEmployees ?? '—'}
            accentColor="#0ea5e9"
          />
        )}
        {can('view', 'employees') && (
          <KpiCard
            label="Servidores com Consignação"
            value={stats?.employeesWithConsignments ?? '—'}
            accentColor="#8b5cf6"
          />
        )}
      </div>
```

- [ ] **Step 3: Verify the full test suite passes**

Run: `cd frontend && npm run test:run`
Expected: all tests PASS

- [ ] **Step 4: Verify the build compiles**

Run: `cd frontend && npm run build`
Expected: build succeeds

- [ ] **Step 5: Commit**

```bash
cd frontend && git add src/mocks/handlers/dashboard.ts src/pages/home/home-page.tsx
git commit -m "feat: add HR KPI cards to home page and extend dashboard stats"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|-----------------|------|
| Servidores page (`/employees`) | Task 3 |
| Relatórios page (`/reports`) | Task 4 |
| HR consignment approve/reject | Task 5 |
| HR home KPIs (employee coverage, margin info) | Task 6 |
| 404 for unmatched routes (Relatórios was 404 in Phase 1) | Task 2 |
| `api.patch` for status mutations | Task 1 |
| DashboardStats HR fields | Task 1 |

### Placeholder scan

No TBD/TODO/placeholder steps remain. All code blocks are complete.

### Type consistency

- `ConsignmentStatus` used in `api.patch` call matches type defined in `src/types/index.ts`
- `DashboardStats.totalEmployees` and `.employeesWithConsignments` added in Task 1 and used in Tasks 4 and 6
- `employeeHandlers` / `reportHandlers` are defined before being imported in `browser.ts` (Tasks 3/4 must complete before browser.ts compiles — noted in plan)
- `EMPLOYEES` fixture is imported in dashboard handler — it exists at `src/mocks/fixtures/employees.ts`
