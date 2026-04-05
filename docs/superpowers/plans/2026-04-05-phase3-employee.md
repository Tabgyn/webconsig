# Phase 3 — Servidor (Self-Service) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scope consignments, deduction statement, and simulation to the logged-in employee, and add personal KPI cards to the home page.

**Architecture:** The frontend passes `?employeeId=<id>` to all relevant endpoints when `user.role === 'employee'`. MSW handlers filter responses based on this query param. The backend scopes data automatically from the auth token — removing the `?employeeId=` injection is the only change needed when connecting a real API. `DashboardStats` gains three optional employee-specific fields populated only when `?employeeId=` is provided.

**Tech Stack:** React 19, TanStack Query v5, MSW v2, Vitest v2 + Testing Library

**Test account for manual verification:** `servidor@prefeitura.gov.br` / `password` → Carlos Oliveira, `employeeId: 'emp-1'`, one pending consignment (cons-3, R$475,50/month, R$28.530,00 remaining balance).

---

## File Map

| Status | Path | Responsibility |
|--------|------|----------------|
| Modify | `frontend/src/types/index.ts` | Add optional `myActiveConsignments`, `myNextDeduction`, `myTotalDebt` to `DashboardStats` |
| Modify | `frontend/src/mocks/handlers/employees.ts` | Add `GET /api/employees/:id` handler |
| Modify | `frontend/src/mocks/handlers/consignments.ts` | Filter by `?employeeId=` query param |
| Modify | `frontend/src/mocks/handlers/deduction-statement.ts` | Filter by `?employeeId=` query param |
| Modify | `frontend/src/mocks/handlers/dashboard.ts` | Compute employee KPIs when `?employeeId=` is provided |
| Modify | `frontend/src/pages/consignments/consignments-page.tsx` | Pass `?employeeId=` when role is `employee`; hide redundant `employeeId` column |
| Modify | `frontend/src/pages/consignments/consignments-page.test.tsx` | Add employee-scope test cases |
| Modify | `frontend/src/pages/deduction-statement/deduction-statement-page.tsx` | Pass `?employeeId=` when role is `employee`; hide `employeeId` column |
| Create | `frontend/src/pages/deduction-statement/deduction-statement-page.test.tsx` | Employee scope tests |
| Modify | `frontend/src/pages/simulation/simulation-page.tsx` | Fetch and display employee salary + margin context |
| Create | `frontend/src/pages/simulation/simulation-page.test.tsx` | Margin context tests |
| Modify | `frontend/src/pages/home/home-page.tsx` | Employee KPI cards; scope both stats and consignments queries |
| Create | `frontend/src/pages/home/home-page.test.tsx` | Employee KPI tests |

---

## Task 1: Extend DashboardStats + add GET /api/employees/:id

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/mocks/handlers/employees.ts`

- [ ] **Step 1: Extend DashboardStats in types/index.ts**

Replace the `DashboardStats` interface (lines 80–87) with:

```ts
export interface DashboardStats {
  activeConsignments: number
  pendingApproval: number
  activePortabilities: number
  totalConsignedValue: number
  totalEmployees: number
  employeesWithConsignments: number
  // Populated only when ?employeeId= is in the request (employee self-service view)
  myActiveConsignments?: number
  myNextDeduction?: number  // installment value of the next payment
  myTotalDebt?: number      // total remaining balance across active + pending consignments
}
```

- [ ] **Step 2: Add GET /api/employees/:id to employees handler**

Replace `frontend/src/mocks/handlers/employees.ts`:

```ts
import { http, HttpResponse } from 'msw'
import { EMPLOYEES } from '../fixtures/employees'

export const employeeHandlers = [
  http.get('/api/employees', () => {
    return HttpResponse.json({ data: EMPLOYEES, total: EMPLOYEES.length })
  }),

  http.get('/api/employees/:id', ({ params }) => {
    const employee = EMPLOYEES.find((e) => e.id === params.id)
    if (!employee) {
      return HttpResponse.json({ message: 'Servidor não encontrado' }, { status: 404 })
    }
    return HttpResponse.json({ data: employee })
  }),
]
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npm run build`
Expected: build succeeds (no new type errors)

- [ ] **Step 4: Commit**

```bash
cd frontend && git add src/types/index.ts src/mocks/handlers/employees.ts
git commit -m "feat: extend DashboardStats with employee KPI fields, add GET /api/employees/:id"
```

---

## Task 2: Employee-scoped consignments

**Files:**
- Modify: `frontend/src/mocks/handlers/consignments.ts`
- Modify: `frontend/src/pages/consignments/consignments-page.tsx`
- Modify: `frontend/src/pages/consignments/consignments-page.test.tsx`

- [ ] **Step 1: Add employee-scope test cases to consignments-page.test.tsx**

Replace `frontend/src/pages/consignments/consignments-page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '@/app/auth-context'
import type { CurrentUser, Consignment } from '@/types'
import { ConsignmentsPage } from './consignments-page'

const mockGet = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
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
)
const mockPatch = vi.hoisted(() => vi.fn().mockResolvedValue({ data: {} }))

vi.mock('@/lib/api', () => ({
  api: {
    get: mockGet,
    patch: mockPatch,
  },
}))

const hrUser: CurrentUser = { id: 'u1', name: 'RH User', email: 'rh@test.com', role: 'hr_manager' }
const hrAuth = { user: hrUser, token: 'tok', isAuthenticated: true, login: vi.fn(), logout: vi.fn() }

const employeeUser: CurrentUser = {
  id: 'u3',
  name: 'Carlos Oliveira',
  email: 'servidor@test.com',
  role: 'employee',
  employeeId: 'emp-1',
}
const employeeAuth = { user: employeeUser, token: 'tok', isAuthenticated: true, login: vi.fn(), logout: vi.fn() }

function renderAs(auth: typeof hrAuth) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={auth}>
        <MemoryRouter>
          <ConsignmentsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

describe('ConsignmentsPage — hr_manager mutations', () => {
  it('renders Aprovar button for pending consignment viewed by hr_manager', async () => {
    renderAs(hrAuth)
    expect(await screen.findByRole('button', { name: /aprovar/i })).toBeInTheDocument()
  })

  it('calls api.patch with status active when Aprovar is clicked', async () => {
    renderAs(hrAuth)
    const btn = await screen.findByRole('button', { name: /aprovar/i })
    await userEvent.click(btn)
    expect(mockPatch).toHaveBeenCalledWith('/consignments/cons-1', { status: 'active' })
  })

  it('renders Rejeitar button for pending consignment viewed by hr_manager', async () => {
    renderAs(hrAuth)
    expect(await screen.findByRole('button', { name: /rejeitar/i })).toBeInTheDocument()
  })
})

describe('ConsignmentsPage — employee scope', () => {
  beforeEach(() => mockGet.mockClear())

  it('fetches consignments scoped to the logged-in employee', async () => {
    renderAs(employeeAuth)
    expect(await screen.findByText('Consignações')).toBeInTheDocument()
    expect(mockGet).toHaveBeenCalledWith('/consignments?employeeId=emp-1')
  })

  it('does not show Aprovar or Rejeitar buttons for employee', async () => {
    renderAs(employeeAuth)
    await screen.findByText('Consignações')
    expect(screen.queryByRole('button', { name: /aprovar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /rejeitar/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to confirm the new cases fail**

Run: `cd frontend && npx vitest run src/pages/consignments/consignments-page.test.tsx`
Expected: FAIL on the two new employee scope tests (`mockGet` called with `/consignments`, not `/consignments?employeeId=emp-1`)

- [ ] **Step 3: Update the GET handler to filter by ?employeeId=**

Replace `frontend/src/mocks/handlers/consignments.ts`:

```ts
import { http, HttpResponse } from 'msw'
import { CONSIGNMENTS } from '../fixtures/consignments'
import type { Consignment, ConsignmentStatus } from '@/types'

// Mutable in-memory copy — persists across requests in the same browser session
// Exported so other handlers (e.g. dashboard) can read the live state
export let consignmentsData: Consignment[] = [...CONSIGNMENTS]

export const consignmentHandlers = [
  http.get('/api/consignments', ({ request }) => {
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')
    const result = employeeId
      ? consignmentsData.filter((c) => c.employeeId === employeeId)
      : consignmentsData
    return HttpResponse.json({ data: result, total: result.length })
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

- [ ] **Step 4: Update ConsignmentsPage to scope the query and hide the redundant column**

Replace `frontend/src/pages/consignments/consignments-page.tsx`:

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { api } from '@/lib/api'
import { usePermissions } from '@/hooks/use-permissions'
import { useCurrentUser } from '@/hooks/use-current-user'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/formatters'
import { PageShell } from '@/components/page-shell'
import { DataTable } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import type { Consignment, ConsignmentStatus } from '@/types'

const col = createColumnHelper<Consignment>()

export function ConsignmentsPage() {
  const { can } = usePermissions()
  const user = useCurrentUser()
  const queryClient = useQueryClient()

  const employeeId = user.role === 'employee' ? user.employeeId : undefined
  const path = employeeId ? `/consignments?employeeId=${employeeId}` : '/consignments'

  const { data, isLoading } = useQuery({
    queryKey: ['consignments', employeeId],
    queryFn: () => api.get<{ data: Consignment[] }>(path),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ConsignmentStatus }) =>
      api.patch<{ data: Consignment }>(`/consignments/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consignments'] }),
  })

  const columns = [
    col.accessor('id', { header: 'Nº' }),
    // Hide the employeeId column when the employee is viewing their own consignments
    ...(user.role !== 'employee'
      ? [col.accessor('employeeId', { header: 'Matrícula' })]
      : []),
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

- [ ] **Step 5: Run tests to confirm all 5 pass**

Run: `cd frontend && npx vitest run src/pages/consignments/consignments-page.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add src/mocks/handlers/consignments.ts src/pages/consignments/
git commit -m "feat: scope consignments query to employee when role is employee"
```

---

## Task 3: Employee-scoped deduction statement

**Files:**
- Modify: `frontend/src/mocks/handlers/deduction-statement.ts`
- Modify: `frontend/src/pages/deduction-statement/deduction-statement-page.tsx`
- Create: `frontend/src/pages/deduction-statement/deduction-statement-page.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/pages/deduction-statement/deduction-statement-page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '@/app/auth-context'
import type { CurrentUser, DeductionEntry } from '@/types'
import { DeductionStatementPage } from './deduction-statement-page'

const mockGet = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    data: [
      {
        id: 'ded-1',
        consignmentId: 'cons-3',
        employeeId: 'emp-1',
        institutionId: 'inst-1',
        amount: 475.5,
        competence: '2026-04',
        status: 'pending',
      },
    ] as DeductionEntry[],
  }),
)

vi.mock('@/lib/api', () => ({ api: { get: mockGet } }))

const employeeUser: CurrentUser = {
  id: 'u3',
  name: 'Carlos Oliveira',
  email: 'servidor@test.com',
  role: 'employee',
  employeeId: 'emp-1',
}
const employeeAuth = {
  user: employeeUser,
  token: 'tok',
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={employeeAuth}>
        <MemoryRouter>
          <DeductionStatementPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

describe('DeductionStatementPage — employee scope', () => {
  beforeEach(() => mockGet.mockClear())

  it('renders page title', () => {
    renderPage()
    expect(screen.getByText('Extrato de Descontos')).toBeInTheDocument()
  })

  it('fetches deduction statement scoped to the employee', async () => {
    renderPage()
    expect(await screen.findByText('Extrato de Descontos')).toBeInTheDocument()
    const paths = mockGet.mock.calls.map((c: unknown[]) => c[0] as string)
    expect(paths.some((p) => p.includes('employeeId=emp-1'))).toBe(true)
  })

  it('does not show the Servidor column header for employee', async () => {
    renderPage()
    // Wait for render cycle with a known element
    expect(await screen.findByRole('button', { name: /consultar/i })).toBeInTheDocument()
    expect(screen.queryByText('Servidor')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `cd frontend && npx vitest run src/pages/deduction-statement/deduction-statement-page.test.tsx`
Expected: FAIL — employee scope test fails (path has no `employeeId=`), and "Servidor" column header exists

- [ ] **Step 3: Update the deduction-statement handler to filter by ?employeeId=**

Replace `frontend/src/mocks/handlers/deduction-statement.ts`:

```ts
import { http, HttpResponse } from 'msw'
import { CONSIGNMENTS } from '../fixtures/consignments'
import type { DeductionEntry } from '@/types'

export const deductionStatementHandlers = [
  http.get('/api/deduction-statement', ({ request }) => {
    const url = new URL(request.url)
    const competence = url.searchParams.get('competence') ?? '2026-03'
    const employeeId = url.searchParams.get('employeeId')

    const data: DeductionEntry[] = CONSIGNMENTS
      .filter((c) => c.status === 'active' || c.status === 'pending')
      .filter((c) => !employeeId || c.employeeId === employeeId)
      .map((c, i) => ({
        id: `ded-${i + 1}`,
        consignmentId: c.id,
        employeeId: c.employeeId,
        institutionId: c.institutionId,
        amount: c.installmentValue,
        competence,
        status: c.status === 'active' ? 'processed' : 'pending',
      } as DeductionEntry))

    return HttpResponse.json({ data })
  }),
]
```

- [ ] **Step 4: Update DeductionStatementPage to scope the query and hide the employeeId column**

Replace `frontend/src/pages/deduction-statement/deduction-statement-page.tsx`:

```tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { api } from '@/lib/api'
import { useCurrentUser } from '@/hooks/use-current-user'
import { formatCurrency, formatCompetence } from '@/lib/formatters'
import { PageShell } from '@/components/page-shell'
import { DataTable } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { DeductionEntry } from '@/types'

const col = createColumnHelper<DeductionEntry>()

function currentCompetence() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function DeductionStatementPage() {
  const user = useCurrentUser()
  const employeeId = user.role === 'employee' ? user.employeeId : undefined
  const [competence, setCompetence] = useState(currentCompetence())
  const [applied, setApplied] = useState(currentCompetence())

  const columns = [
    col.accessor('id', { header: 'Nº' }),
    col.accessor('consignmentId', { header: 'Consignação' }),
    // Hide the Servidor column for employee — all rows belong to them
    ...(user.role !== 'employee'
      ? [col.accessor('employeeId', { header: 'Servidor' })]
      : []),
    col.accessor('institutionId', { header: 'Entidade' }),
    col.accessor('amount', {
      header: 'Valor Desconto',
      cell: (info) => formatCurrency(info.getValue()),
    }),
    col.accessor('competence', {
      header: 'Competência',
      cell: (info) => formatCompetence(info.getValue()),
    }),
    col.accessor('status', {
      header: 'Status',
      cell: (info) => <StatusBadge status={info.getValue()} />,
      enableSorting: false,
    }),
  ]

  const queryPath = employeeId
    ? `/deduction-statement?competence=${applied}&employeeId=${employeeId}`
    : `/deduction-statement?competence=${applied}`

  const { data, isLoading } = useQuery({
    queryKey: ['deduction-statement', applied, employeeId],
    queryFn: () => api.get<{ data: DeductionEntry[] }>(queryPath),
  })

  return (
    <PageShell
      title="Extrato de Descontos"
      description="Histórico de descontos processados na folha de pagamento."
    >
      <div className="flex items-end gap-3">
        <div>
          <Label htmlFor="competence" className="text-xs">Competência (AAAA-MM)</Label>
          <Input
            id="competence"
            type="month"
            value={competence}
            onChange={(e) => setCompetence(e.target.value)}
            className="mt-1 w-40"
          />
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setApplied(competence)}
        >
          Consultar
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchPlaceholder="Buscar por entidade..."
      />
    </PageShell>
  )
}
```

- [ ] **Step 5: Run tests to confirm they pass**

Run: `cd frontend && npx vitest run src/pages/deduction-statement/deduction-statement-page.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add src/mocks/handlers/deduction-statement.ts src/pages/deduction-statement/
git commit -m "feat: scope deduction statement to employee when role is employee"
```

---

## Task 4: Simulation — employee margin context

**Files:**
- Modify: `frontend/src/pages/simulation/simulation-page.tsx`
- Create: `frontend/src/pages/simulation/simulation-page.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/pages/simulation/simulation-page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '@/app/auth-context'
import type { CurrentUser, Employee } from '@/types'
import { SimulationPage } from './simulation-page'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      data: {
        id: 'emp-1',
        registration: '001234',
        name: 'Carlos Oliveira',
        cpf: '12345678901',
        orgId: 'org-1',
        grossSalary: 4500,
        availableMargin: 900,
      } as Employee,
    }),
    post: vi.fn().mockResolvedValue({ releasedValue: 0, totalValue: 0, financingCost: 0 }),
  },
}))

const employeeUser: CurrentUser = {
  id: 'u3',
  name: 'Carlos Oliveira',
  email: 'servidor@test.com',
  role: 'employee',
  employeeId: 'emp-1',
}
const mockAuth = {
  user: employeeUser,
  token: 'tok',
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={mockAuth}>
        <MemoryRouter>
          <SimulationPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

describe('SimulationPage — employee margin context', () => {
  it('renders the page title', () => {
    renderPage()
    expect(screen.getByText('Simulação de Empréstimo')).toBeInTheDocument()
  })

  it('displays the employee available margin label', async () => {
    renderPage()
    expect(await screen.findByText(/margem disponível/i)).toBeInTheDocument()
  })

  it('displays the employee gross salary label', async () => {
    renderPage()
    expect(await screen.findByText(/salário bruto/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `cd frontend && npx vitest run src/pages/simulation/simulation-page.test.tsx`
Expected: FAIL — "margem disponível" and "salário bruto" not found (the current page has no employee context banner)

- [ ] **Step 3: Update SimulationPage to fetch and show employee margin context**

Replace `frontend/src/pages/simulation/simulation-page.tsx`:

```tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useCurrentUser } from '@/hooks/use-current-user'
import { formatCurrency } from '@/lib/formatters'
import { PageShell } from '@/components/page-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import type { Employee, SimulationResult } from '@/types'

const simulationSchema = z.object({
  installmentValue: z.coerce
    .number({ invalid_type_error: 'Informe um valor válido' })
    .positive('Valor da parcela deve ser positivo'),
  installments: z.coerce
    .number({ invalid_type_error: 'Informe um número válido' })
    .int()
    .min(1, 'Mínimo 1 parcela')
    .max(96, 'Máximo 96 parcelas'),
  interestRate: z.coerce
    .number({ invalid_type_error: 'Informe uma taxa válida' })
    .positive('Taxa deve ser positiva')
    .max(10, 'Taxa máxima: 10% a.m.'),
})

type SimulationFormValues = z.infer<typeof simulationSchema>

export function SimulationPage() {
  const user = useCurrentUser()
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const { data: employeeData } = useQuery({
    queryKey: ['employee', user.employeeId],
    queryFn: () => api.get<{ data: Employee }>(`/employees/${user.employeeId}`),
    enabled: user.role === 'employee' && !!user.employeeId,
  })

  const employee = employeeData?.data

  const form = useForm<SimulationFormValues>({
    resolver: zodResolver(simulationSchema),
    defaultValues: { installmentValue: undefined, installments: undefined, interestRate: undefined },
  })

  async function onSubmit(values: SimulationFormValues) {
    setIsCalculating(true)
    try {
      const data = await api.post<SimulationResult>('/simulation/calculate', values)
      setResult(data)
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <PageShell
      title="Simulação de Empréstimo"
      description="Calcule o valor liberado e o custo total de um empréstimo consignado."
    >
      {employee && (
        <div className="rounded-lg border bg-blue-50 px-4 py-3 text-sm text-blue-800 flex gap-6">
          <span>
            <span className="font-semibold">Salário Bruto:</span>{' '}
            {formatCurrency(employee.grossSalary)}
          </span>
          {employee.availableMargin !== undefined && (
            <span>
              <span className="font-semibold">Margem Disponível:</span>{' '}
              {formatCurrency(employee.availableMargin)}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input form */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-slate-800">Dados do Empréstimo</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="installmentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Parcela (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Ex: 350,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Parcelas</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 48" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interestRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa de Juros (% a.m.)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Ex: 1.80" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isCalculating}
              >
                {isCalculating ? 'Calculando...' : 'Calcular'}
              </Button>
            </form>
          </Form>
        </div>

        {/* Results */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-slate-800">Resultado da Simulação</h3>
          {result ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Valor Liberado ao Servidor</p>
                <p className="mt-1 text-3xl font-bold text-blue-600">
                  {formatCurrency(result.releasedValue)}
                </p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Total a Pagar</p>
                  <p className="mt-1 text-lg font-semibold text-slate-800">
                    {formatCurrency(result.totalValue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Custo do Financiamento</p>
                  <p className="mt-1 text-lg font-semibold text-red-600">
                    {formatCurrency(result.financingCost)}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">
                Simulação calculada com base nos dados informados. Sujeita a análise e aprovação da entidade conveniada.
              </div>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">
              Preencha os dados e clique em Calcular para ver o resultado.
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `cd frontend && npx vitest run src/pages/simulation/simulation-page.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add src/pages/simulation/
git commit -m "feat: show employee salary and available margin in simulation page"
```

---

## Task 5: Employee home KPIs

**Files:**
- Modify: `frontend/src/mocks/handlers/dashboard.ts`
- Modify: `frontend/src/pages/home/home-page.tsx`
- Create: `frontend/src/pages/home/home-page.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/pages/home/home-page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '@/app/auth-context'
import type { CurrentUser, DashboardStats } from '@/types'
import { HomePage } from './home-page'

const mockGet = vi.hoisted(() =>
  vi.fn().mockImplementation((path: string) => {
    if (path.includes('/dashboard/stats')) {
      return Promise.resolve({
        activeConsignments: 10,
        pendingApproval: 2,
        activePortabilities: 1,
        totalConsignedValue: 50000,
        totalEmployees: 50,
        employeesWithConsignments: 30,
        myActiveConsignments: 1,
        myNextDeduction: 475.5,
        myTotalDebt: 28530,
      } as DashboardStats)
    }
    // consignments, alerts, and anything else
    return Promise.resolve({ data: [] })
  }),
)

vi.mock('@/lib/api', () => ({ api: { get: mockGet } }))

const employeeUser: CurrentUser = {
  id: 'u3',
  name: 'Carlos Oliveira',
  email: 'servidor@test.com',
  role: 'employee',
  employeeId: 'emp-1',
}
const employeeAuth = {
  user: employeeUser,
  token: 'tok',
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={employeeAuth}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

describe('HomePage — employee view', () => {
  beforeEach(() => mockGet.mockClear())

  it('shows personal KPI labels for employee', async () => {
    renderPage()
    expect(await screen.findByText('Próxima Parcela')).toBeInTheDocument()
    expect(await screen.findByText('Saldo Devedor Total')).toBeInTheDocument()
  })

  it('fetches dashboard stats scoped to the employee', async () => {
    renderPage()
    await screen.findByText('Próxima Parcela')
    const paths = mockGet.mock.calls.map((c: unknown[]) => c[0] as string)
    expect(paths.some((p) => p.includes('employeeId=emp-1'))).toBe(true)
  })

  it('fetches consignments scoped to the employee', async () => {
    renderPage()
    await screen.findByText('Próxima Parcela')
    const paths = mockGet.mock.calls.map((c: unknown[]) => c[0] as string)
    expect(
      paths.some((p) => p.includes('/consignments') && p.includes('employeeId=emp-1')),
    ).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `cd frontend && npx vitest run src/pages/home/home-page.test.tsx`
Expected: FAIL — "Próxima Parcela" and "Saldo Devedor Total" not found; queries not scoped

- [ ] **Step 3: Update dashboard handler to compute employee KPIs**

Replace `frontend/src/mocks/handlers/dashboard.ts`:

```ts
import { http, HttpResponse } from 'msw'
import { consignmentsData } from './consignments'
import { EMPLOYEES } from '../fixtures/employees'
import { PORTABILITIES } from '../fixtures/portabilities'
import type { DashboardStats, Alert } from '@/types'

export const dashboardHandlers = [
  http.get('/api/dashboard/stats', ({ request }) => {
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')

    const activeConsignments = consignmentsData.filter((c) => c.status === 'active')
    const employeeIdsWithActive = new Set(activeConsignments.map((c) => c.employeeId))

    const stats: DashboardStats = {
      activeConsignments: activeConsignments.length,
      pendingApproval: consignmentsData.filter((c) => c.status === 'pending').length,
      activePortabilities: PORTABILITIES.filter((p) => p.status === 'requested').length,
      totalConsignedValue: activeConsignments.reduce((sum, c) => sum + c.remainingBalance, 0),
      totalEmployees: EMPLOYEES.length,
      employeesWithConsignments: employeeIdsWithActive.size,
    }

    if (employeeId) {
      const mine = consignmentsData.filter(
        (c) => c.employeeId === employeeId && (c.status === 'active' || c.status === 'pending'),
      )
      stats.myActiveConsignments = mine.length
      stats.myTotalDebt = mine.reduce((sum, c) => sum + c.remainingBalance, 0)
      stats.myNextDeduction = mine.length > 0
        ? Math.min(...mine.map((c) => c.installmentValue))
        : 0
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

- [ ] **Step 4: Update HomePage with employee KPI cards and scoped queries**

Replace `frontend/src/pages/home/home-page.tsx`:

```tsx
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { api } from '@/lib/api'
import { usePermissions } from '@/hooks/use-permissions'
import { useCurrentUser } from '@/hooks/use-current-user'
import { formatCurrency } from '@/lib/formatters'
import { KpiCard } from './kpi-card'
import { AlertsPanel } from './alerts-panel'
import { DataTable } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import type { Consignment, DashboardStats } from '@/types'

const col = createColumnHelper<Consignment>()

const recentColumns = [
  col.accessor('id', { header: 'Nº', enableSorting: false }),
  col.accessor('employeeId', { header: 'Servidor' }),
  col.accessor('installmentValue', {
    header: 'Parcela',
    cell: (info) => formatCurrency(info.getValue()),
  }),
  col.accessor('status', {
    header: 'Status',
    cell: (info) => <StatusBadge status={info.getValue()} />,
    enableSorting: false,
  }),
]

export function HomePage() {
  const { can } = usePermissions()
  const user = useCurrentUser()
  const navigate = useNavigate()

  const employeeId = user.role === 'employee' ? user.employeeId : undefined

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats', employeeId],
    queryFn: () => {
      const path = employeeId
        ? `/dashboard/stats?employeeId=${employeeId}`
        : '/dashboard/stats'
      return api.get<DashboardStats>(path)
    },
  })

  const { data: consignmentsResponse } = useQuery({
    queryKey: ['consignments', employeeId],
    queryFn: () => {
      const path = employeeId ? `/consignments?employeeId=${employeeId}` : '/consignments'
      return api.get<{ data: Consignment[] }>(path)
    },
  })

  const recentConsignments = (consignmentsResponse?.data ?? []).slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Bom dia, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {user.role === 'employee' ? (
          <>
            <KpiCard
              label="Consignações Ativas"
              value={stats?.myActiveConsignments ?? '—'}
              accentColor="#2563eb"
            />
            <KpiCard
              label="Próxima Parcela"
              value={stats?.myNextDeduction !== undefined ? formatCurrency(stats.myNextDeduction) : '—'}
              accentColor="#f59e0b"
            />
            <KpiCard
              label="Saldo Devedor Total"
              value={stats?.myTotalDebt !== undefined ? formatCurrency(stats.myTotalDebt) : '—'}
              accentColor="#dc2626"
            />
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent consignments */}
        <div className="lg:col-span-2 rounded-lg border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Consignações Recentes</h3>
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={() => navigate('/consignments')}
            >
              Ver todas →
            </button>
          </div>
          <DataTable columns={recentColumns} data={recentConsignments} />
        </div>

        {/* Right column: quick actions + alerts */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-slate-800">Ações Rápidas</h3>
            <div className="space-y-2">
              {can('create', 'consignment') && (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate('/consignments')}
                >
                  + Nova Consignação
                </Button>
              )}
              {can('simulate', 'simulation') && (
                <Button variant="outline" className="w-full" onClick={() => navigate('/simulation')}>
                  Simular Empréstimo
                </Button>
              )}
              {can('request', 'outstanding-balance') && (
                <Button variant="outline" className="w-full" onClick={() => navigate('/outstanding-balance')}>
                  Solicitar Saldo Devedor
                </Button>
              )}
              {can('export', 'deduction-statement') && (
                <Button variant="outline" className="w-full" onClick={() => navigate('/deduction-statement')}>
                  Gerar Extrato
                </Button>
              )}
            </div>
          </div>

          <AlertsPanel />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run home page tests to confirm they pass**

Run: `cd frontend && npx vitest run src/pages/home/home-page.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 6: Run the full test suite**

Run: `cd frontend && npm run test:run`
Expected: all tests PASS

- [ ] **Step 7: Verify the build compiles**

Run: `cd frontend && npm run build`
Expected: build succeeds

- [ ] **Step 8: Commit**

```bash
cd frontend && git add src/mocks/handlers/dashboard.ts src/pages/home/
git commit -m "feat: add employee personal KPIs to home page and scope queries"
```

---

## Self-Review

### Spec coverage

| Spec requirement | Task |
|---|---|
| Consignações: employee-scoped view (own records only) | Task 2 |
| Extrato de Descontos: employee-scoped | Task 3 |
| Simulação: employee context (salary + available margin) | Task 4 |
| Home: personal KPIs (active loans, next deduction, total debt) | Task 5 |

### Placeholder scan

No TBD/TODO/placeholder steps remain. All code blocks are complete.

### Type consistency

- `DashboardStats.myActiveConsignments`, `.myNextDeduction`, `.myTotalDebt` defined in Task 1 and consumed in Task 5
- `Employee` type used in `SimulationPage` (Task 4) already exists in `src/types/index.ts`
- `employeeId` is `user.employeeId` (`string | undefined`) — all usages guard with `user.role === 'employee'` first; the test account `emp-1` has an `employeeId` set
- `consignmentsData` export used by `dashboard.ts` is unchanged — only the GET handler gains a `?employeeId=` filter
- `GET /api/employees/:id` added in Task 1 is consumed by `SimulationPage` in Task 4
