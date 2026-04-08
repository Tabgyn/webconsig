# Phase 4 — Gestor de Entidade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the `institution_manager` role experience: an Entidades page with institution profile editing and representative management, plus institution-scoped data across consignments, portability, dashboard, and reports.

**Architecture:** The `institution_manager` user already has permissions wired (`institutions: ['view', 'edit']`) and appears in the sidebar, but `/institutions` has no route or page yet. The pattern mirrors Phases 1–3: a new page under `src/pages/institutions/`, new MSW handlers under `src/mocks/handlers/institutions.ts`, and scope filtering added to existing handlers and pages. All data scoping is done by passing `?institutionId=` as a query param — matching the `?employeeId=` pattern established in Phase 3.

**Tech Stack:** React, TypeScript, TanStack Query, TanStack Table, react-hook-form, Zod, MSW, Shadcn/ui, Vitest + Testing Library

---

## File Structure

**Create:**
- `frontend/src/pages/institutions/institutions-page.tsx` — InstitutionsPage: institution profile card, edit form, representatives table + add form
- `frontend/src/pages/institutions/institutions-page.test.tsx` — Tests for profile view, edit, and representative management
- `frontend/src/mocks/fixtures/representatives.ts` — Static representative mock data
- `frontend/src/mocks/handlers/institutions.ts` — MSW handlers: GET/PUT `/institutions/:id`, GET/POST/PATCH `/institutions/:id/representatives`

**Modify:**
- `frontend/src/types/index.ts` — Add `Representative` interface; add `institutionActiveRepresentatives?: number` to `DashboardStats`
- `frontend/src/mocks/browser.ts` — Register `institutionHandlers`
- `frontend/src/app/router.tsx` — Add `/institutions` route
- `frontend/src/mocks/handlers/consignments.ts` — Filter by `institutionId` query param
- `frontend/src/mocks/handlers/portability.ts` — Filter by `institutionId` query param; export mutable array for dashboard use
- `frontend/src/mocks/handlers/reports.ts` — Accept `institutionId` in body; add `representatives` report type
- `frontend/src/mocks/handlers/dashboard.ts` — Filter stats by `institutionId` when provided; count active representatives
- `frontend/src/pages/home/home-page.tsx` — Pass `?institutionId=` for `institution_manager`; show representative KPI
- `frontend/src/pages/consignments/consignments-page.tsx` — Pass `?institutionId=` for `institution_manager`
- `frontend/src/pages/portability/portability-page.tsx` — Pass `?institutionId=` for `institution_manager`
- `frontend/src/pages/reports/reports-page.tsx` — Pass `institutionId` in export body; show "Atividade de Representantes" for `institution_manager`

---

### Task 1: Add `Representative` type and extend `DashboardStats`

**Files:**
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Add `Representative` and extend `DashboardStats`**

In `frontend/src/types/index.ts`, add after the `Institution` interface and extend `DashboardStats`:

```ts
export interface Representative {
  id: string
  name: string
  email: string
  institutionId: string
  isActive: boolean
}
```

In `DashboardStats`, add one optional field after `employeesWithConsignments`:

```ts
institutionActiveRepresentatives?: number // populated when ?institutionId= is provided
```

- [ ] **Step 2: Verify the project typechecks**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat: add Representative type and institutionActiveRepresentatives to DashboardStats"
```

---

### Task 2: Representative fixtures + institution MSW handlers

**Files:**
- Create: `frontend/src/mocks/fixtures/representatives.ts`
- Create: `frontend/src/mocks/handlers/institutions.ts`

- [ ] **Step 1: Create representative fixtures**

Create `frontend/src/mocks/fixtures/representatives.ts`:

```ts
import type { Representative } from '@/types'

export const REPRESENTATIVES: Representative[] = [
  {
    id: 'rep-1',
    name: 'João Silva',
    email: 'representante@bancalfa.com',
    institutionId: 'inst-1',
    isActive: true,
  },
  {
    id: 'rep-2',
    name: 'Fernanda Lima',
    email: 'fernanda@bancalfa.com',
    institutionId: 'inst-1',
    isActive: true,
  },
  {
    id: 'rep-3',
    name: 'Roberto Faria',
    email: 'roberto@financeirabeta.com',
    institutionId: 'inst-2',
    isActive: true,
  },
]
```

- [ ] **Step 2: Create institution MSW handlers**

Create `frontend/src/mocks/handlers/institutions.ts`:

```ts
import { http, HttpResponse } from 'msw'
import { INSTITUTIONS } from '../fixtures/institutions'
import { REPRESENTATIVES } from '../fixtures/representatives'
import type { Institution, Representative } from '@/types'

let institutionsData: Institution[] = [...INSTITUTIONS]
export let representativesData: Representative[] = [...REPRESENTATIVES]

export const institutionHandlers = [
  http.get('/api/institutions/:id', ({ params }) => {
    const institution = institutionsData.find((i) => i.id === params.id)
    if (!institution) {
      return HttpResponse.json({ message: 'Entidade não encontrada' }, { status: 404 })
    }
    return HttpResponse.json({ data: institution })
  }),

  http.put('/api/institutions/:id', async ({ params, request }) => {
    const body = await request.json() as { name: string }
    const index = institutionsData.findIndex((i) => i.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ message: 'Entidade não encontrada' }, { status: 404 })
    }
    institutionsData = institutionsData.map((i) =>
      i.id === params.id ? { ...i, name: body.name } : i,
    )
    return HttpResponse.json({ data: institutionsData.find((i) => i.id === params.id) })
  }),

  http.get('/api/institutions/:id/representatives', ({ params }) => {
    const reps = representativesData.filter((r) => r.institutionId === params.id)
    return HttpResponse.json({ data: reps, total: reps.length })
  }),

  http.post('/api/institutions/:id/representatives', async ({ params, request }) => {
    const body = await request.json() as { name: string; email: string }
    const newRep: Representative = {
      id: `rep-${Date.now()}`,
      name: body.name,
      email: body.email,
      institutionId: params.id as string,
      isActive: true,
    }
    representativesData = [...representativesData, newRep]
    return HttpResponse.json({ data: newRep }, { status: 201 })
  }),

  http.patch('/api/institutions/:id/representatives/:repId', async ({ params, request }) => {
    const body = await request.json() as { isActive: boolean }
    representativesData = representativesData.map((r) =>
      r.id === params.repId ? { ...r, isActive: body.isActive } : r,
    )
    const updated = representativesData.find((r) => r.id === params.repId)
    return HttpResponse.json({ data: updated })
  }),
]
```

- [ ] **Step 3: Verify typechecks**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/mocks/fixtures/representatives.ts frontend/src/mocks/handlers/institutions.ts
git commit -m "feat: add representative fixtures and institution MSW handlers"
```

---

### Task 3: Wire up handlers and route

**Files:**
- Modify: `frontend/src/mocks/browser.ts`
- Modify: `frontend/src/app/router.tsx`

- [ ] **Step 1: Register institution handlers in browser.ts**

In `frontend/src/mocks/browser.ts`, add the import and spread:

```ts
import { institutionHandlers } from './handlers/institutions'
```

Add `...institutionHandlers,` to the `setupWorker(...)` call alongside the other handlers.

The final `setupWorker` call becomes:
```ts
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
  ...institutionHandlers,
)
```

- [ ] **Step 2: Add `/institutions` route to router**

In `frontend/src/app/router.tsx`, add:

```ts
import { InstitutionsPage } from '@/pages/institutions/institutions-page'
```

Add the route inside the children array (alongside the other routes):

```ts
{ path: 'institutions', element: <InstitutionsPage /> },
```

The `InstitutionsPage` component doesn't exist yet — the app will not compile until Task 4 creates it. That's fine; keep the import and proceed.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/mocks/browser.ts frontend/src/app/router.tsx
git commit -m "chore: register institution handlers and add /institutions route"
```

---

### Task 4: InstitutionsPage — profile view (TDD)

**Files:**
- Create: `frontend/src/pages/institutions/institutions-page.test.tsx`
- Create: `frontend/src/pages/institutions/institutions-page.tsx`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/pages/institutions/institutions-page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '@/app/auth-context'
import type { CurrentUser, Institution, Representative } from '@/types'
import { InstitutionsPage } from './institutions-page'

const mockInstitution: Institution = {
  id: 'inst-1',
  name: 'Banco Alfa S.A.',
  cnpj: '12345678000195',
  isActive: true,
}

const mockRepresentatives: Representative[] = [
  { id: 'rep-1', name: 'João Silva', email: 'joao@bancalfa.com', institutionId: 'inst-1', isActive: true },
  { id: 'rep-2', name: 'Fernanda Lima', email: 'fernanda@bancalfa.com', institutionId: 'inst-1', isActive: true },
]

const mockGet = vi.hoisted(() =>
  vi.fn().mockImplementation((path: string) => {
    if (path.endsWith('/representatives')) {
      return Promise.resolve({ data: mockRepresentatives })
    }
    return Promise.resolve({ data: mockInstitution })
  }),
)
const mockPut = vi.hoisted(() => vi.fn().mockResolvedValue({ data: { ...mockInstitution, name: 'Banco Alfa Atualizado' } }))
const mockPost = vi.hoisted(() => vi.fn().mockResolvedValue({ data: { id: 'rep-new', name: 'Novo Rep', email: 'novo@bancalfa.com', institutionId: 'inst-1', isActive: true } }))
const mockPatch = vi.hoisted(() => vi.fn().mockResolvedValue({ data: { id: 'rep-1', isActive: false } }))

vi.mock('@/lib/api', () => ({
  api: { get: mockGet, put: mockPut, post: mockPost, patch: mockPatch },
}))

const managerUser: CurrentUser = {
  id: 'u-4',
  name: 'Ana Costa',
  email: 'gestor@bancalfa.com',
  role: 'institution_manager',
  institutionId: 'inst-1',
}
const managerAuth = { user: managerUser, token: 'tok', isAuthenticated: true, login: vi.fn(), logout: vi.fn() }

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={managerAuth}>
        <MemoryRouter>
          <InstitutionsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

describe('InstitutionsPage — profile', () => {
  it('renders page title', () => {
    renderPage()
    expect(screen.getByText('Entidades')).toBeInTheDocument()
  })

  it('shows institution name from API', async () => {
    renderPage()
    expect(await screen.findByText('Banco Alfa S.A.')).toBeInTheDocument()
  })

  it('shows formatted CNPJ', async () => {
    renderPage()
    expect(await screen.findByText('12.345.678/0001-95')).toBeInTheDocument()
  })

  it('shows Editar button', async () => {
    renderPage()
    expect(await screen.findByRole('button', { name: /editar/i })).toBeInTheDocument()
  })
})

describe('InstitutionsPage — edit institution', () => {
  beforeEach(() => mockPut.mockClear())

  it('shows edit form when Editar is clicked', async () => {
    renderPage()
    const editBtn = await screen.findByRole('button', { name: /editar/i })
    await userEvent.click(editBtn)
    expect(screen.getByLabelText(/nome da entidade/i)).toBeInTheDocument()
  })

  it('calls api.put with updated name when Salvar is clicked', async () => {
    renderPage()
    const editBtn = await screen.findByRole('button', { name: /editar/i })
    await userEvent.click(editBtn)
    const input = screen.getByLabelText(/nome da entidade/i)
    await userEvent.clear(input)
    await userEvent.type(input, 'Banco Alfa Atualizado')
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(mockPut).toHaveBeenCalledWith('/institutions/inst-1', { name: 'Banco Alfa Atualizado' })
  })
})

describe('InstitutionsPage — representatives', () => {
  it('shows representatives table with names', async () => {
    renderPage()
    expect(await screen.findByText('João Silva')).toBeInTheDocument()
    expect(await screen.findByText('Fernanda Lima')).toBeInTheDocument()
  })

  it('shows Adicionar Representante button', async () => {
    renderPage()
    expect(await screen.findByRole('button', { name: /adicionar representante/i })).toBeInTheDocument()
  })

  it('shows add form when Adicionar Representante is clicked', async () => {
    renderPage()
    const addBtn = await screen.findByRole('button', { name: /adicionar representante/i })
    await userEvent.click(addBtn)
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
  })

  it('calls api.post when new representative form is submitted', async () => {
    renderPage()
    const addBtn = await screen.findByRole('button', { name: /adicionar representante/i })
    await userEvent.click(addBtn)
    await userEvent.type(screen.getByLabelText(/nome/i), 'Novo Representante')
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'novo@bancalfa.com')
    const saveButtons = screen.getAllByRole('button', { name: /salvar/i })
    await userEvent.click(saveButtons[saveButtons.length - 1])
    expect(mockPost).toHaveBeenCalledWith('/institutions/inst-1/representatives', {
      name: 'Novo Representante',
      email: 'novo@bancalfa.com',
    })
  })

  it('calls api.patch with isActive false when Desativar is clicked', async () => {
    renderPage()
    const deactivateButtons = await screen.findAllByRole('button', { name: /desativar/i })
    await userEvent.click(deactivateButtons[0])
    expect(mockPatch).toHaveBeenCalledWith('/institutions/inst-1/representatives/rep-1', { isActive: false })
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `cd frontend && npx vitest run src/pages/institutions/institutions-page.test.tsx`
Expected: FAIL — `InstitutionsPage` not found

- [ ] **Step 3: Implement InstitutionsPage**

Create `frontend/src/pages/institutions/institutions-page.tsx`:

```tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { api } from '@/lib/api'
import { useCurrentUser } from '@/hooks/use-current-user'
import { usePermissions } from '@/hooks/use-permissions'
import { formatCNPJ } from '@/lib/formatters'
import { PageShell } from '@/components/page-shell'
import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Institution, Representative } from '@/types'

const col = createColumnHelper<Representative>()

export function InstitutionsPage() {
  const user = useCurrentUser()
  const { can } = usePermissions()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [showAddRep, setShowAddRep] = useState(false)
  const [newRepName, setNewRepName] = useState('')
  const [newRepEmail, setNewRepEmail] = useState('')

  const institutionId = user.institutionId!

  const { data: instResponse } = useQuery({
    queryKey: ['institution', institutionId],
    queryFn: () => api.get<{ data: Institution }>(`/institutions/${institutionId}`),
  })

  const { data: repsResponse, isLoading: repsLoading } = useQuery({
    queryKey: ['representatives', institutionId],
    queryFn: () =>
      api.get<{ data: Representative[] }>(`/institutions/${institutionId}/representatives`),
  })

  const updateInstitution = useMutation({
    mutationFn: (name: string) =>
      api.put<{ data: Institution }>(`/institutions/${institutionId}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution', institutionId] })
      setIsEditing(false)
    },
  })

  const addRep = useMutation({
    mutationFn: ({ name, email }: { name: string; email: string }) =>
      api.post<{ data: Representative }>(
        `/institutions/${institutionId}/representatives`,
        { name, email },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representatives', institutionId] })
      setShowAddRep(false)
      setNewRepName('')
      setNewRepEmail('')
    },
  })

  const deactivateRep = useMutation({
    mutationFn: (repId: string) =>
      api.patch<{ data: Representative }>(
        `/institutions/${institutionId}/representatives/${repId}`,
        { isActive: false },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['representatives', institutionId] }),
  })

  const institution = instResponse?.data
  const representatives = repsResponse?.data ?? []

  const repColumns = [
    col.accessor('name', { header: 'Nome' }),
    col.accessor('email', { header: 'E-mail' }),
    col.accessor('isActive', {
      header: 'Status',
      cell: (info) => (
        <span className={info.getValue() ? 'text-green-600 font-medium' : 'text-slate-400'}>
          {info.getValue() ? 'Ativo' : 'Inativo'}
        </span>
      ),
    }),
    ...(can('edit', 'institutions')
      ? [
          col.display({
            id: 'actions',
            header: 'Ações',
            cell: (info) =>
              info.row.original.isActive ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-700 border-red-300 hover:bg-red-50 h-7 text-xs"
                  disabled={deactivateRep.isPending}
                  onClick={() => deactivateRep.mutate(info.row.original.id)}
                >
                  Desativar
                </Button>
              ) : null,
          }),
        ]
      : []),
  ]

  return (
    <PageShell
      title="Entidades"
      description="Perfil e configurações da sua entidade credenciada."
    >
      <div className="space-y-6">
        {/* Institution profile card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Dados da Entidade</CardTitle>
            {can('edit', 'institutions') && !isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditName(institution?.name ?? '')
                  setIsEditing(true)
                }}
              >
                Editar
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {institution ? (
              isEditing ? (
                <div className="space-y-3 max-w-sm">
                  <div className="space-y-1">
                    <Label htmlFor="inst-name">Nome da Entidade</Label>
                    <Input
                      id="inst-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={updateInstitution.isPending || !editName.trim()}
                      onClick={() => updateInstitution.mutate(editName.trim())}
                    >
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Nome</dt>
                    <dd className="font-medium text-slate-900 mt-0.5">{institution.name}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">CNPJ</dt>
                    <dd className="font-medium text-slate-900 mt-0.5">{formatCNPJ(institution.cnpj)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Status</dt>
                    <dd className={`font-medium mt-0.5 ${institution.isActive ? 'text-green-600' : 'text-slate-400'}`}>
                      {institution.isActive ? 'Ativa' : 'Inativa'}
                    </dd>
                  </div>
                </dl>
              )
            ) : (
              <p className="text-sm text-slate-400">Carregando...</p>
            )}
          </CardContent>
        </Card>

        {/* Representatives section */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Representantes</h3>
            {can('edit', 'institutions') && (
              <Button size="sm" onClick={() => setShowAddRep((v) => !v)}>
                + Adicionar Representante
              </Button>
            )}
          </div>

          {showAddRep && (
            <div className="mb-4 rounded-lg border bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-medium text-slate-800">Novo Representante</p>
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-[180px] space-y-1">
                  <Label htmlFor="rep-name">Nome</Label>
                  <Input
                    id="rep-name"
                    value={newRepName}
                    onChange={(e) => setNewRepName(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label htmlFor="rep-email">E-mail</Label>
                  <Input
                    id="rep-email"
                    type="email"
                    value={newRepEmail}
                    onChange={(e) => setNewRepEmail(e.target.value)}
                    placeholder="email@entidade.com"
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  disabled={addRep.isPending || !newRepName.trim() || !newRepEmail.trim()}
                  onClick={() => addRep.mutate({ name: newRepName, email: newRepEmail })}
                >
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddRep(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <DataTable
            columns={repColumns}
            data={representatives}
            isLoading={repsLoading}
            searchPlaceholder="Buscar por nome ou e-mail..."
          />
        </div>
      </div>
    </PageShell>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `cd frontend && npx vitest run src/pages/institutions/institutions-page.test.tsx`
Expected: all tests PASS

- [ ] **Step 5: Start the dev server and smoke-test as `gestor@bancalfa.com`**

Run: `cd frontend && npm run dev`
Log in as `gestor@bancalfa.com` / `password`. Navigate to Entidades. Verify:
- Institution profile card shows name, formatted CNPJ, status
- Editar button opens inline form
- Saving updates the displayed name
- Representatives table shows João Silva and Fernanda Lima
- "Desativar" button appears on active reps
- "+ Adicionar Representante" opens the inline form

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/institutions/
git commit -m "feat: add InstitutionsPage with profile editing and representative management"
```

---

### Task 5: Scope consignments and portability by `institutionId`

**Files:**
- Modify: `frontend/src/mocks/handlers/consignments.ts`
- Modify: `frontend/src/mocks/handlers/portability.ts`
- Modify: `frontend/src/pages/consignments/consignments-page.tsx`
- Modify: `frontend/src/pages/portability/portability-page.tsx`

This task adds `?institutionId=` filtering to the MSW handlers and makes the frontend pass it when the logged-in user is `institution_manager`.

- [ ] **Step 1: Write a failing test for institution_manager scoping in ConsignmentsPage**

Add to `frontend/src/pages/consignments/consignments-page.test.tsx`:

```tsx
// Add at the top with existing imports
import type { CurrentUser } from '@/types'

const institutionManagerUser: CurrentUser = {
  id: 'u-4',
  name: 'Ana Costa',
  email: 'gestor@bancalfa.com',
  role: 'institution_manager',
  institutionId: 'inst-1',
}
const institutionManagerAuth = {
  user: institutionManagerUser,
  token: 'tok',
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
}

// Add a new describe block at the bottom:
describe('ConsignmentsPage — institution_manager scope', () => {
  beforeEach(() => mockGet.mockClear())

  it('fetches consignments scoped to the logged-in institution', async () => {
    renderAs(institutionManagerAuth)
    expect(await screen.findByText('Consignações')).toBeInTheDocument()
    expect(mockGet).toHaveBeenCalledWith('/consignments?institutionId=inst-1')
  })
})
```

Run: `cd frontend && npx vitest run src/pages/consignments/consignments-page.test.tsx`
Expected: new test FAILS — `mockGet` was called with `/consignments` (no filter)

- [ ] **Step 2: Update ConsignmentsPage to pass `institutionId`**

In `frontend/src/pages/consignments/consignments-page.tsx`, change the scope-building logic (currently handles only `employeeId`):

Replace:
```ts
const employeeId = user.role === 'employee' ? user.employeeId : undefined
const path = employeeId ? `/consignments?employeeId=${employeeId}` : '/consignments'
```

With:
```ts
const employeeId = user.role === 'employee' ? user.employeeId : undefined
const institutionId = user.role === 'institution_manager' ? user.institutionId : undefined
const path = employeeId
  ? `/consignments?employeeId=${employeeId}`
  : institutionId
  ? `/consignments?institutionId=${institutionId}`
  : '/consignments'
```

Also update the `queryKey` to include `institutionId`:
```ts
queryKey: ['consignments', employeeId, institutionId],
```

- [ ] **Step 3: Run tests to confirm they pass**

Run: `cd frontend && npx vitest run src/pages/consignments/consignments-page.test.tsx`
Expected: all tests PASS including the new institution_manager test

- [ ] **Step 4: Update consignments MSW handler to filter by `institutionId`**

In `frontend/src/mocks/handlers/consignments.ts`, extend the GET handler:

Replace:
```ts
http.get('/api/consignments', ({ request }) => {
  const url = new URL(request.url)
  const employeeId = url.searchParams.get('employeeId')
  const result = employeeId
    ? consignmentsData.filter((c) => c.employeeId === employeeId)
    : consignmentsData
  return HttpResponse.json({ data: result, total: result.length })
}),
```

With:
```ts
http.get('/api/consignments', ({ request }) => {
  const url = new URL(request.url)
  const employeeId = url.searchParams.get('employeeId')
  const institutionId = url.searchParams.get('institutionId')
  let result = consignmentsData
  if (employeeId) result = result.filter((c) => c.employeeId === employeeId)
  if (institutionId) result = result.filter((c) => c.institutionId === institutionId)
  return HttpResponse.json({ data: result, total: result.length })
}),
```

- [ ] **Step 5: Update PortabilityPage to pass `institutionId`**

In `frontend/src/pages/portability/portability-page.tsx`, update `useCurrentUser` import and query:

Add at the top of the component (after existing hooks):
```ts
const user = useCurrentUser()
const institutionId = user.role === 'institution_manager' ? user.institutionId : undefined
```

Update the query:
```ts
const { data, isLoading } = useQuery({
  queryKey: ['portability', institutionId],
  queryFn: () => {
    const path = institutionId ? `/portability?institutionId=${institutionId}` : '/portability'
    return api.get<{ data: Portability[] }>(path)
  },
})
```

Also add the import at the top of the file:
```ts
import { useCurrentUser } from '@/hooks/use-current-user'
```

- [ ] **Step 6: Export mutable portabilities and add `institutionId` filter to portability handler**

In `frontend/src/mocks/handlers/portability.ts`:

```ts
import { http, HttpResponse } from 'msw'
import { PORTABILITIES } from '../fixtures/portabilities'
import type { Portability } from '@/types'

export let portabilitiesData: Portability[] = [...PORTABILITIES]

export const portabilityHandlers = [
  http.get('/api/portability', ({ request }) => {
    const url = new URL(request.url)
    const institutionId = url.searchParams.get('institutionId')
    const result = institutionId
      ? portabilitiesData.filter(
          (p) =>
            p.originInstitutionId === institutionId ||
            p.destinationInstitutionId === institutionId,
        )
      : portabilitiesData
    return HttpResponse.json({ data: result, total: result.length })
  }),

  http.post('/api/portability', async ({ request }) => {
    const body = await request.json() as Partial<Portability>
    const newPortability: Portability = {
      id: `port-${Date.now()}`,
      consignmentId: body.consignmentId ?? '',
      originInstitutionId: body.originInstitutionId ?? '',
      destinationInstitutionId: body.destinationInstitutionId ?? '',
      requestedAt: new Date().toISOString().split('T')[0],
      status: 'requested',
    }
    portabilitiesData = [...portabilitiesData, newPortability]
    return HttpResponse.json({ data: newPortability }, { status: 201 })
  }),
]
```

- [ ] **Step 7: Verify typechecks and run all tests**

Run: `cd frontend && npx tsc --noEmit && npx vitest run`
Expected: no type errors, all tests PASS

- [ ] **Step 8: Commit**

```bash
git add frontend/src/mocks/handlers/consignments.ts \
        frontend/src/mocks/handlers/portability.ts \
        frontend/src/pages/consignments/consignments-page.tsx \
        frontend/src/pages/portability/portability-page.tsx \
        frontend/src/pages/consignments/consignments-page.test.tsx
git commit -m "feat: scope consignments and portability by institutionId for institution_manager"
```

---

### Task 6: Institution-scoped dashboard stats and home page KPIs

**Files:**
- Modify: `frontend/src/mocks/handlers/dashboard.ts`
- Modify: `frontend/src/pages/home/home-page.tsx`

- [ ] **Step 1: Update dashboard handler to support `institutionId` filtering**

In `frontend/src/mocks/handlers/dashboard.ts`, add imports for `representativesData` and `portabilitiesData`, then add `institutionId` filtering:

```ts
import { http, HttpResponse } from 'msw'
import { consignmentsData } from './consignments'
import { portabilitiesData } from './portability'
import { representativesData } from './institutions'
import { EMPLOYEES } from '../fixtures/employees'
import type { DashboardStats, Alert } from '@/types'

export const dashboardHandlers = [
  http.get('/api/dashboard/stats', ({ request }) => {
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')
    const institutionId = url.searchParams.get('institutionId')

    const baseConsignments = institutionId
      ? consignmentsData.filter((c) => c.institutionId === institutionId)
      : consignmentsData

    const activeConsignments = baseConsignments.filter((c) => c.status === 'active')
    const employeeIdsWithActive = new Set(activeConsignments.map((c) => c.employeeId))

    const basePortabilities = institutionId
      ? portabilitiesData.filter(
          (p) =>
            p.originInstitutionId === institutionId ||
            p.destinationInstitutionId === institutionId,
        )
      : portabilitiesData

    const stats: DashboardStats = {
      activeConsignments: activeConsignments.length,
      pendingApproval: baseConsignments.filter((c) => c.status === 'pending').length,
      activePortabilities: basePortabilities.filter((p) => p.status === 'requested').length,
      totalConsignedValue: activeConsignments.reduce((sum, c) => sum + c.remainingBalance, 0),
      totalEmployees: EMPLOYEES.length,
      employeesWithConsignments: employeeIdsWithActive.size,
    }

    if (institutionId) {
      stats.institutionActiveRepresentatives = representativesData.filter(
        (r) => r.institutionId === institutionId && r.isActive,
      ).length
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

- [ ] **Step 2: Write a failing test for institution_manager KPIs in HomePage**

In `frontend/src/pages/home/home-page.test.tsx`, add:

```tsx
// At the top of the file, add a new mock user:
const institutionManagerUser: CurrentUser = {
  id: 'u-4',
  name: 'Ana Costa',
  email: 'gestor@bancalfa.com',
  role: 'institution_manager',
  institutionId: 'inst-1',
}
const institutionManagerAuth = {
  user: institutionManagerUser,
  token: 'tok',
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
}

// Add a new describe block:
describe('HomePage — institution_manager', () => {
  it('fetches dashboard stats scoped to the institution', async () => {
    // Using renderAs from existing test setup
    renderAs(institutionManagerAuth)
    expect(await screen.findByText(/bom/i)).toBeInTheDocument()
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('institutionId=inst-1'))
  })
})
```

Run: `cd frontend && npx vitest run src/pages/home/home-page.test.tsx`
Expected: new test FAILS

- [ ] **Step 3: Update HomePage to pass `institutionId` for `institution_manager`**

In `frontend/src/pages/home/home-page.tsx`, update the `employeeId` / stats query section:

Replace:
```ts
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
```

With:
```ts
const employeeId = user.role === 'employee' ? user.employeeId : undefined
const institutionId = user.role === 'institution_manager' ? user.institutionId : undefined

const { data: stats } = useQuery({
  queryKey: ['dashboard', 'stats', employeeId, institutionId],
  queryFn: () => {
    if (employeeId) return api.get<DashboardStats>(`/dashboard/stats?employeeId=${employeeId}`)
    if (institutionId) return api.get<DashboardStats>(`/dashboard/stats?institutionId=${institutionId}`)
    return api.get<DashboardStats>('/dashboard/stats')
  },
})
```

Then add a KPI card for active representatives in the non-employee section of the KPI grid. Find the block:

```tsx
{can('view', 'employees') && (
  <KpiCard
    label="Servidores com Consignação"
    value={stats?.employeesWithConsignments ?? '—'}
    accentColor="#8b5cf6"
  />
)}
```

After it, add:
```tsx
{stats?.institutionActiveRepresentatives !== undefined && (
  <KpiCard
    label="Representantes Ativos"
    value={stats.institutionActiveRepresentatives}
    accentColor="#0891b2"
  />
)}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `cd frontend && npx vitest run src/pages/home/home-page.test.tsx`
Expected: all tests PASS

- [ ] **Step 5: Verify typechecks**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add frontend/src/mocks/handlers/dashboard.ts \
        frontend/src/pages/home/home-page.tsx \
        frontend/src/pages/home/home-page.test.tsx
git commit -m "feat: institution-scoped dashboard stats and representative KPI for institution_manager"
```

---

### Task 7: Institution-scoped reports

**Files:**
- Modify: `frontend/src/mocks/handlers/reports.ts`
- Modify: `frontend/src/pages/reports/reports-page.tsx`

The spec calls for "institution-scoped reports (own consignments, representatives activity)". This task adds an `institutionId` parameter to the export API and introduces a "Atividade de Representantes" report type visible only to `institution_manager` (and `admin`).

- [ ] **Step 1: Update the reports MSW handler**

Replace the entire `frontend/src/mocks/handlers/reports.ts`:

```ts
import { http, HttpResponse } from 'msw'

const REPORT_TYPES = ['consignments', 'employees', 'deductions', 'representatives'] as const

export const reportHandlers = [
  http.post('/api/reports/export', async ({ request }) => {
    const body = await request.json() as { type: string; institutionId?: string }
    if (!REPORT_TYPES.includes(body.type as typeof REPORT_TYPES[number])) {
      return HttpResponse.json({ message: 'Tipo de relatório inválido' }, { status: 400 })
    }
    const scope = body.institutionId ? ` (entidade ${body.institutionId})` : ''
    return HttpResponse.json({ message: `Relatório "${body.type}"${scope} exportado com sucesso.` })
  }),
]
```

- [ ] **Step 2: Write a failing test for reports page showing representatives report**

In `frontend/src/pages/reports/reports-page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '@/app/auth-context'
import type { CurrentUser } from '@/types'
import { ReportsPage } from './reports-page'

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn().mockResolvedValue({ message: 'ok' }) },
}))

function renderAs(user: CurrentUser) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const auth = { user, token: 'tok', isAuthenticated: true, login: vi.fn(), logout: vi.fn() }
  return render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={auth}>
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

const representativeUser: CurrentUser = {
  id: 'u-1', name: 'João Silva', email: 'representante@bancalfa.com',
  role: 'representative', institutionId: 'inst-1',
}

const institutionManagerUser: CurrentUser = {
  id: 'u-4', name: 'Ana Costa', email: 'gestor@bancalfa.com',
  role: 'institution_manager', institutionId: 'inst-1',
}

describe('ReportsPage', () => {
  it('shows standard report types for representative', () => {
    renderAs(representativeUser)
    expect(screen.getByText('Consignações')).toBeInTheDocument()
    expect(screen.getByText('Servidores')).toBeInTheDocument()
    expect(screen.getByText('Descontos')).toBeInTheDocument()
    expect(screen.queryByText('Atividade de Representantes')).not.toBeInTheDocument()
  })

  it('shows Atividade de Representantes only for institution_manager', () => {
    renderAs(institutionManagerUser)
    expect(screen.getByText('Atividade de Representantes')).toBeInTheDocument()
  })
})
```

Run: `cd frontend && npx vitest run src/pages/reports/reports-page.test.tsx`
Expected: "shows Atividade de Representantes" test FAILS

- [ ] **Step 3: Update ReportsPage to show the representative activity report and pass `institutionId`**

Replace the entire contents of `frontend/src/pages/reports/reports-page.tsx`:

```tsx
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useCurrentUser } from '@/hooks/use-current-user'
import { PageShell } from '@/components/page-shell'
import { Button } from '@/components/ui/button'

interface ReportType {
  type: string
  label: string
  description: string
  institutionManagerOnly?: boolean
}

const REPORT_TYPES: ReportType[] = [
  {
    type: 'consignments',
    label: 'Consignações',
    description: 'Todas as consignações registradas no período.',
  },
  {
    type: 'employees',
    label: 'Servidores',
    description: 'Lista de servidores com margem consignável.',
  },
  {
    type: 'deductions',
    label: 'Descontos',
    description: 'Extrato consolidado de descontos por competência.',
  },
  {
    type: 'representatives',
    label: 'Atividade de Representantes',
    description: 'Consignações registradas por cada representante da entidade.',
    institutionManagerOnly: true,
  },
]

export function ReportsPage() {
  const user = useCurrentUser()
  const [exported, setExported] = useState<string | null>(null)

  const exportMutation = useMutation({
    mutationFn: (type: string) =>
      api.post<{ message: string }>('/reports/export', {
        type,
        ...(user.institutionId ? { institutionId: user.institutionId } : {}),
      }),
    onSuccess: (_, type) => setExported(type),
  })

  const visibleReports = REPORT_TYPES.filter((r) => {
    if (r.institutionManagerOnly) {
      return user.role === 'institution_manager' || user.role === 'admin'
    }
    return true
  })

  return (
    <PageShell
      title="Relatórios"
      description="Exporte relatórios gerenciais do sistema."
    >
      <div className="space-y-3">
        {visibleReports.map((r) => (
          <div
            key={r.type}
            className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 shadow-sm"
          >
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

- [ ] **Step 4: Run tests to confirm they pass**

Run: `cd frontend && npx vitest run src/pages/reports/reports-page.test.tsx`
Expected: all tests PASS

- [ ] **Step 5: Run full test suite and typecheck**

Run: `cd frontend && npx tsc --noEmit && npx vitest run`
Expected: no type errors, all tests PASS

- [ ] **Step 6: Smoke-test the full institution_manager flow**

Start the dev server. Log in as `gestor@bancalfa.com` / `password`. Verify:
- Home page shows institution-scoped KPIs (3 active consignments for inst-1, 2 portabilities, 2 active representatives)
- Consignações page shows only inst-1 consignments (cons-1, cons-2, cons-3, cons-5)
- Portabilidade page shows only portabilities involving inst-1 (all 3 fixture portabilities qualify)
- Entidades page loads, shows "Banco Alfa S.A.", edit form works, representatives table shows 2 reps
- Relatórios page shows 4 report types including "Atividade de Representantes"

- [ ] **Step 7: Commit**

```bash
git add frontend/src/mocks/handlers/reports.ts \
        frontend/src/pages/reports/reports-page.tsx \
        frontend/src/pages/reports/reports-page.test.tsx
git commit -m "feat: institution-scoped reports and Atividade de Representantes for institution_manager"
```
