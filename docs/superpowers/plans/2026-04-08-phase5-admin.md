# Phase 5 — Administrador Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the `admin` role experience: Usuários CRUD, Auditoria log, Configurações editor, and admin-specific quick actions on the home page.

**Architecture:** The `admin` permissions are already fully wired in `permissions.ts` and the sidebar already renders `/users`, `/audit`, `/settings` links for admin — but those routes don't exist yet and there are no pages for them. This phase adds the three missing pages, their MSW handlers/fixtures, and wires routes + worker registration. Admin already has full data visibility on existing pages (no `employeeId`/`institutionId` scoping is applied when `user.role === 'admin'`), so no changes are needed to existing data-fetching code. The home page gets two new admin-gated quick action buttons.

**Tech Stack:** React, TypeScript, TanStack Query, TanStack Table, MSW, Shadcn/ui (`Button`, `Input`, `Label`), Vitest + Testing Library

---

## File Structure

**Create:**
- `frontend/src/pages/users/users-page.tsx` — UsersPage: full CRUD for all system users (list, add, change role, delete)
- `frontend/src/pages/users/users-page.test.tsx` — Tests for listing, add, edit role, delete
- `frontend/src/pages/audit/audit-page.tsx` — AuditPage: read-only log of all system actions
- `frontend/src/pages/audit/audit-page.test.tsx` — Tests for listing and label display
- `frontend/src/pages/settings/settings-page.tsx` — SettingsPage: inline edit for system settings
- `frontend/src/pages/settings/settings-page.test.tsx` — Tests for listing and edit flow
- `frontend/src/mocks/handlers/users.ts` — MSW handlers: GET/POST/PATCH/DELETE `/users`
- `frontend/src/mocks/handlers/audit.ts` — MSW handler: GET `/audit`
- `frontend/src/mocks/handlers/settings.ts` — MSW handlers: GET/PUT `/settings/:key`
- `frontend/src/mocks/fixtures/audit.ts` — Static audit log entries
- `frontend/src/mocks/fixtures/settings.ts` — Static system settings

**Modify:**
- `frontend/src/types/index.ts` — Add `AuditAction`, `AuditResource`, `AuditEntry`, `SystemSetting`
- `frontend/src/lib/formatters.ts` — Add `formatDateTime`
- `frontend/src/mocks/browser.ts` — Register `userHandlers`, `auditHandlers`, `settingsHandlers`
- `frontend/src/app/router.tsx` — Add `/users`, `/audit`, `/settings` routes
- `frontend/src/pages/home/home-page.tsx` — Add admin quick actions (Gerenciar Usuários, Auditoria do Sistema)
- `frontend/src/pages/home/home-page.test.tsx` — Add admin role test

---

### Task 1: Add types and `formatDateTime`

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/lib/formatters.ts`

- [ ] **Step 1: Add new types to `frontend/src/types/index.ts`**

Append at the end of the file:

```ts
export type AuditAction = 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'login' | 'logout'

export type AuditResource =
  | 'consignment'
  | 'portability'
  | 'user'
  | 'institution'
  | 'representative'
  | 'settings'
  | 'session'

export interface AuditEntry {
  id: string
  userId: string
  userName: string
  action: AuditAction
  resource: AuditResource
  resourceId: string
  description: string
  timestamp: string   // ISO datetime
  ipAddress: string
}

export interface SystemSetting {
  key: string
  label: string
  value: string
  description: string
}
```

- [ ] **Step 2: Add `formatDateTime` to `frontend/src/lib/formatters.ts`**

Append at the end of the file:

```ts
export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}
```

- [ ] **Step 3: Verify the project typechecks**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/lib/formatters.ts
git commit -m "feat: add AuditEntry, SystemSetting types and formatDateTime"
```

---

### Task 2: Users MSW handler

**Files:**
- Modify: `frontend/src/mocks/fixtures/users.ts` (the existing file already has `MOCK_USERS` — keep it as-is)
- Create: `frontend/src/mocks/handlers/users.ts`

- [ ] **Step 1: Create `frontend/src/mocks/handlers/users.ts`**

```ts
import { http, HttpResponse } from 'msw'
import { MOCK_USERS } from '../fixtures/users'
import type { CurrentUser, Role } from '@/types'

type MockUserInternal = (typeof MOCK_USERS)[number]

let usersData: MockUserInternal[] = [...MOCK_USERS]

function toPublic(u: MockUserInternal): CurrentUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    ...(u.institutionId ? { institutionId: u.institutionId } : {}),
    ...(u.employeeId ? { employeeId: u.employeeId } : {}),
  }
}

export const userHandlers = [
  http.get('/api/users', () => {
    const data = usersData.map(toPublic)
    return HttpResponse.json({ data, total: data.length })
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json() as { name: string; email: string; role: Role }
    const newUser: MockUserInternal = {
      id: `u-${Date.now()}`,
      name: body.name,
      email: body.email,
      role: body.role,
      password: 'password',
    }
    usersData = [...usersData, newUser]
    return HttpResponse.json({ data: toPublic(newUser) }, { status: 201 })
  }),

  http.patch('/api/users/:id', async ({ params, request }) => {
    const body = await request.json() as { role: Role }
    usersData = usersData.map((u) =>
      u.id === params.id ? { ...u, role: body.role } : u,
    )
    const updated = usersData.find((u) => u.id === params.id)!
    return HttpResponse.json({ data: toPublic(updated) })
  }),

  http.delete('/api/users/:id', ({ params }) => {
    usersData = usersData.filter((u) => u.id !== params.id)
    return HttpResponse.json({})
  }),
]
```

- [ ] **Step 2: Verify the file typechecks**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/mocks/handlers/users.ts
git commit -m "feat: add users MSW handler (CRUD)"
```

---

### Task 3: Users page + tests

**Files:**
- Create: `frontend/src/pages/users/users-page.tsx`
- Create: `frontend/src/pages/users/users-page.test.tsx`

- [ ] **Step 1: Write the failing test — `frontend/src/pages/users/users-page.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '@/app/auth-context'
import type { CurrentUser } from '@/types'
import { UsersPage } from './users-page'

const mockUsers: CurrentUser[] = [
  { id: 'u-1', name: 'João Silva', email: 'representante@bancalfa.com', role: 'representative', institutionId: 'inst-1' },
  { id: 'u-2', name: 'Maria Santos', email: 'rh@prefeitura.gov.br', role: 'hr_manager' },
  { id: 'u-5', name: 'Admin Sistema', email: 'admin@webconsig.com', role: 'admin' },
]

const mockGet = vi.hoisted(() => vi.fn().mockResolvedValue({ data: mockUsers }))
const mockPost = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { id: 'u-new', name: 'Novo Usuário', email: 'novo@test.com', role: 'representative' } }),
)
const mockPatch = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { id: 'u-1', name: 'João Silva', email: 'representante@bancalfa.com', role: 'hr_manager' } }),
)
const mockDelete = vi.hoisted(() => vi.fn().mockResolvedValue({}))

vi.mock('@/lib/api', () => ({
  api: { get: mockGet, post: mockPost, patch: mockPatch, delete: mockDelete },
}))

const adminUser: CurrentUser = {
  id: 'u-5',
  name: 'Admin Sistema',
  email: 'admin@webconsig.com',
  role: 'admin',
}
const adminAuth = {
  user: adminUser,
  token: 'tok',
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={adminAuth}>
        <MemoryRouter>
          <UsersPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

describe('UsersPage — listing', () => {
  it('renders page title', () => {
    renderPage()
    expect(screen.getByText('Usuários')).toBeInTheDocument()
  })

  it('shows all users from API', async () => {
    renderPage()
    expect(await screen.findByText('João Silva')).toBeInTheDocument()
    expect(await screen.findByText('Maria Santos')).toBeInTheDocument()
  })

  it('shows Adicionar Usuário button', async () => {
    renderPage()
    expect(await screen.findByRole('button', { name: /adicionar usuário/i })).toBeInTheDocument()
  })
})

describe('UsersPage — add user', () => {
  beforeEach(() => mockPost.mockClear())

  it('opens add form when Adicionar Usuário is clicked', async () => {
    renderPage()
    const btn = await screen.findByRole('button', { name: /adicionar usuário/i })
    await userEvent.click(btn)
    expect(screen.getByLabelText(/^nome$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^e-mail$/i)).toBeInTheDocument()
  })

  it('calls api.post with name, email, and role when form is submitted', async () => {
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: /adicionar usuário/i }))
    await userEvent.type(screen.getByLabelText(/^nome$/i), 'Novo Usuário')
    await userEvent.type(screen.getByLabelText(/^e-mail$/i), 'novo@test.com')
    const saveButtons = screen.getAllByRole('button', { name: /salvar/i })
    await userEvent.click(saveButtons[saveButtons.length - 1])
    expect(mockPost).toHaveBeenCalledWith('/users', {
      name: 'Novo Usuário',
      email: 'novo@test.com',
      role: 'representative',
    })
  })
})

describe('UsersPage — edit role', () => {
  beforeEach(() => mockPatch.mockClear())

  it('calls api.patch when Alterar Papel is clicked and saved', async () => {
    renderPage()
    const editButtons = await screen.findAllByRole('button', { name: /alterar papel/i })
    await userEvent.click(editButtons[0])
    const roleSelect = screen.getByRole('combobox', { name: /papel/i })
    await userEvent.selectOptions(roleSelect, 'hr_manager')
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(mockPatch).toHaveBeenCalledWith('/users/u-1', { role: 'hr_manager' })
  })
})

describe('UsersPage — delete user', () => {
  beforeEach(() => mockDelete.mockClear())

  it('calls api.delete when Excluir is clicked for another user', async () => {
    renderPage()
    const deleteButtons = await screen.findAllByRole('button', { name: /excluir/i })
    await userEvent.click(deleteButtons[0])
    expect(mockDelete).toHaveBeenCalledWith('/users/u-1')
  })

  it('Excluir button is disabled for the current user', async () => {
    renderPage()
    await screen.findByText('Admin Sistema')
    const deleteButtons = screen.getAllByRole('button', { name: /excluir/i })
    // Admin (u-5) is the last row — its delete button must be disabled
    expect(deleteButtons[deleteButtons.length - 1]).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `cd frontend && npx vitest run src/pages/users/users-page.test.tsx`
Expected: FAIL (module not found / no export `UsersPage`)

- [ ] **Step 3: Create `frontend/src/pages/users/users-page.tsx`**

```tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { api } from '@/lib/api'
import { useCurrentUser } from '@/hooks/use-current-user'
import { usePermissions } from '@/hooks/use-permissions'
import { PageShell } from '@/components/page-shell'
import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CurrentUser, Role } from '@/types'

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  hr_manager: 'Gestor de RH',
  employee: 'Servidor',
  institution_manager: 'Gestor de Entidade',
  representative: 'Representante',
}

const ROLE_OPTIONS = (Object.entries(ROLE_LABELS) as [Role, string][]).map(
  ([value, label]) => ({ value, label }),
)

const col = createColumnHelper<CurrentUser>()

export function UsersPage() {
  const user = useCurrentUser()
  const { can } = usePermissions()
  const queryClient = useQueryClient()

  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<Role>('representative')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState<Role>('representative')

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<{ data: CurrentUser[] }>('/users'),
  })

  const addUser = useMutation({
    mutationFn: (body: { name: string; email: string; role: Role }) =>
      api.post<{ data: CurrentUser }>('/users', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowAddForm(false)
      setNewName('')
      setNewEmail('')
      setNewRole('representative')
    },
  })

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      api.patch<{ data: CurrentUser }>(`/users/${id}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditingId(null)
    },
  })

  const removeUser = useMutation({
    mutationFn: (id: string) => api.delete<Record<string, never>>(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const users = data?.data ?? []

  const columns = [
    col.accessor('name', { header: 'Nome' }),
    col.accessor('email', { header: 'E-mail' }),
    col.accessor('role', {
      header: 'Papel',
      cell: (info) => {
        const u = info.row.original
        if (editingId === u.id) {
          return (
            <select
              aria-label="Papel"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as Role)}
              className="rounded border px-2 py-1 text-sm"
            >
              {ROLE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          )
        }
        return ROLE_LABELS[info.getValue()]
      },
    }),
    ...(can('edit', 'users') || can('delete', 'users')
      ? [
          col.display({
            id: 'actions',
            header: 'Ações',
            cell: (info) => {
              const u = info.row.original
              const isSelf = u.id === user.id
              if (editingId === u.id) {
                return (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={updateRole.isPending}
                      onClick={() => updateRole.mutate({ id: u.id, role: editRole })}
                    >
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                )
              }
              return (
                <div className="flex gap-2">
                  {can('edit', 'users') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        setEditingId(u.id)
                        setEditRole(u.role)
                      }}
                    >
                      Alterar Papel
                    </Button>
                  )}
                  {can('delete', 'users') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700 border-red-300 hover:bg-red-50 h-7 text-xs"
                      disabled={isSelf || removeUser.isPending}
                      onClick={() => removeUser.mutate(u.id)}
                    >
                      Excluir
                    </Button>
                  )}
                </div>
              )
            },
          }),
        ]
      : []),
  ]

  return (
    <PageShell
      title="Usuários"
      description="Gerenciamento de usuários do sistema."
      action={
        can('create', 'users') ? (
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowAddForm((v) => !v)}
          >
            + Adicionar Usuário
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {showAddForm && (
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-medium text-slate-800">Novo Usuário</p>
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[180px] space-y-1">
                <Label htmlFor="new-name">Nome</Label>
                <Input
                  id="new-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div className="flex-1 min-w-[200px] space-y-1">
                <Label htmlFor="new-email">E-mail</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="min-w-[180px] space-y-1">
                <Label htmlFor="new-role">Papel</Label>
                <select
                  id="new-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
                >
                  {ROLE_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                disabled={addUser.isPending || !newName.trim() || !newEmail.trim()}
                onClick={() =>
                  addUser.mutate({ name: newName.trim(), email: newEmail.trim(), role: newRole })
                }
              >
                Salvar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          searchPlaceholder="Buscar por nome ou e-mail..."
        />
      </div>
    </PageShell>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `cd frontend && npx vitest run src/pages/users/users-page.test.tsx`
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/users/users-page.tsx frontend/src/pages/users/users-page.test.tsx
git commit -m "feat: add UsersPage with CRUD for admin role"
```

---

### Task 4: Audit fixtures and MSW handler

**Files:**
- Create: `frontend/src/mocks/fixtures/audit.ts`
- Create: `frontend/src/mocks/handlers/audit.ts`

- [ ] **Step 1: Create `frontend/src/mocks/fixtures/audit.ts`**

```ts
import type { AuditEntry } from '@/types'

export const AUDIT_ENTRIES: AuditEntry[] = [
  {
    id: 'aud-1',
    userId: 'u-3',
    userName: 'Carlos Oliveira',
    action: 'login',
    resource: 'session',
    resourceId: 'u-3',
    description: 'Login realizado com sucesso',
    timestamp: '2026-04-08T08:30:00Z',
    ipAddress: '172.16.0.50',
  },
  {
    id: 'aud-2',
    userId: 'u-1',
    userName: 'João Silva',
    action: 'create',
    resource: 'consignment',
    resourceId: 'con-1',
    description: 'Consignação criada para servidor emp-1',
    timestamp: '2026-04-07T14:23:00Z',
    ipAddress: '192.168.1.10',
  },
  {
    id: 'aud-3',
    userId: 'u-2',
    userName: 'Maria Santos',
    action: 'approve',
    resource: 'consignment',
    resourceId: 'con-2',
    description: 'Consignação aprovada',
    timestamp: '2026-04-07T15:10:00Z',
    ipAddress: '192.168.1.20',
  },
  {
    id: 'aud-4',
    userId: 'u-2',
    userName: 'Maria Santos',
    action: 'reject',
    resource: 'consignment',
    resourceId: 'con-3',
    description: 'Consignação rejeitada — margem insuficiente',
    timestamp: '2026-04-07T15:35:00Z',
    ipAddress: '192.168.1.20',
  },
  {
    id: 'aud-5',
    userId: 'u-4',
    userName: 'Ana Costa',
    action: 'update',
    resource: 'institution',
    resourceId: 'inst-1',
    description: 'Dados da entidade atualizados',
    timestamp: '2026-04-08T09:00:00Z',
    ipAddress: '192.168.2.5',
  },
  {
    id: 'aud-6',
    userId: 'u-1',
    userName: 'João Silva',
    action: 'create',
    resource: 'portability',
    resourceId: 'port-1',
    description: 'Portabilidade solicitada para consignação con-4',
    timestamp: '2026-04-08T10:22:00Z',
    ipAddress: '192.168.1.10',
  },
  {
    id: 'aud-7',
    userId: 'u-4',
    userName: 'Ana Costa',
    action: 'approve',
    resource: 'portability',
    resourceId: 'port-1',
    description: 'Portabilidade aprovada',
    timestamp: '2026-04-08T11:00:00Z',
    ipAddress: '192.168.2.5',
  },
  {
    id: 'aud-8',
    userId: 'u-5',
    userName: 'Admin Sistema',
    action: 'create',
    resource: 'user',
    resourceId: 'u-new',
    description: 'Novo usuário cadastrado: gestor2@bancalfa.com',
    timestamp: '2026-04-07T16:00:00Z',
    ipAddress: '10.0.0.1',
  },
  {
    id: 'aud-9',
    userId: 'u-5',
    userName: 'Admin Sistema',
    action: 'update',
    resource: 'settings',
    resourceId: 'payroll_cutoff_day',
    description: 'Configuração "Dia de Fechamento da Folha" alterada para 5',
    timestamp: '2026-04-07T16:15:00Z',
    ipAddress: '10.0.0.1',
  },
  {
    id: 'aud-10',
    userId: 'u-5',
    userName: 'Admin Sistema',
    action: 'delete',
    resource: 'user',
    resourceId: 'u-old',
    description: 'Usuário removido: antigo@bancalfa.com',
    timestamp: '2026-04-08T12:45:00Z',
    ipAddress: '10.0.0.1',
  },
]
```

- [ ] **Step 2: Create `frontend/src/mocks/handlers/audit.ts`**

```ts
import { http, HttpResponse } from 'msw'
import { AUDIT_ENTRIES } from '../fixtures/audit'

export const auditHandlers = [
  http.get('/api/audit', () => {
    const sorted = [...AUDIT_ENTRIES].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    return HttpResponse.json({ data: sorted, total: sorted.length })
  }),
]
```

- [ ] **Step 3: Verify the files typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/mocks/fixtures/audit.ts frontend/src/mocks/handlers/audit.ts
git commit -m "feat: add audit fixtures and MSW handler"
```

---

### Task 5: Audit page + tests

**Files:**
- Create: `frontend/src/pages/audit/audit-page.tsx`
- Create: `frontend/src/pages/audit/audit-page.test.tsx`

- [ ] **Step 1: Write the failing test — `frontend/src/pages/audit/audit-page.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '@/app/auth-context'
import type { CurrentUser, AuditEntry } from '@/types'
import { AuditPage } from './audit-page'

const mockEntries: AuditEntry[] = [
  {
    id: 'aud-1',
    userId: 'u-1',
    userName: 'João Silva',
    action: 'create',
    resource: 'consignment',
    resourceId: 'con-1',
    description: 'Consignação criada para servidor emp-1',
    timestamp: '2026-04-07T14:23:00Z',
    ipAddress: '192.168.1.10',
  },
  {
    id: 'aud-2',
    userId: 'u-2',
    userName: 'Maria Santos',
    action: 'approve',
    resource: 'consignment',
    resourceId: 'con-2',
    description: 'Consignação aprovada',
    timestamp: '2026-04-07T15:10:00Z',
    ipAddress: '192.168.1.20',
  },
]

const mockGet = vi.hoisted(() => vi.fn().mockResolvedValue({ data: mockEntries }))

vi.mock('@/lib/api', () => ({ api: { get: mockGet } }))

const adminUser: CurrentUser = {
  id: 'u-5',
  name: 'Admin Sistema',
  email: 'admin@webconsig.com',
  role: 'admin',
}
const adminAuth = {
  user: adminUser,
  token: 'tok',
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={adminAuth}>
        <MemoryRouter>
          <AuditPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

describe('AuditPage', () => {
  it('renders page title', () => {
    renderPage()
    expect(screen.getByText('Auditoria')).toBeInTheDocument()
  })

  it('shows user names from API', async () => {
    renderPage()
    expect(await screen.findByText('João Silva')).toBeInTheDocument()
    expect(await screen.findByText('Maria Santos')).toBeInTheDocument()
  })

  it('shows human-readable action labels', async () => {
    renderPage()
    expect(await screen.findByText('Criação')).toBeInTheDocument()
    expect(await screen.findByText('Aprovação')).toBeInTheDocument()
  })

  it('shows descriptions', async () => {
    renderPage()
    expect(await screen.findByText('Consignação criada para servidor emp-1')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `cd frontend && npx vitest run src/pages/audit/audit-page.test.tsx`
Expected: FAIL (module not found)

- [ ] **Step 3: Create `frontend/src/pages/audit/audit-page.tsx`**

```tsx
import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/formatters'
import { PageShell } from '@/components/page-shell'
import { DataTable } from '@/components/data-table'
import type { AuditEntry, AuditAction, AuditResource } from '@/types'

const ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Criação',
  update: 'Atualização',
  delete: 'Exclusão',
  approve: 'Aprovação',
  reject: 'Rejeição',
  login: 'Login',
  logout: 'Logout',
}

const RESOURCE_LABELS: Record<AuditResource, string> = {
  consignment: 'Consignação',
  portability: 'Portabilidade',
  user: 'Usuário',
  institution: 'Entidade',
  representative: 'Representante',
  settings: 'Configurações',
  session: 'Sessão',
}

const col = createColumnHelper<AuditEntry>()

const columns = [
  col.accessor('timestamp', {
    header: 'Data/Hora',
    cell: (info) => formatDateTime(info.getValue()),
  }),
  col.accessor('userName', { header: 'Usuário' }),
  col.accessor('action', {
    header: 'Ação',
    cell: (info) => ACTION_LABELS[info.getValue()],
  }),
  col.accessor('resource', {
    header: 'Recurso',
    cell: (info) => RESOURCE_LABELS[info.getValue()],
  }),
  col.accessor('description', { header: 'Descrição', enableSorting: false }),
  col.accessor('ipAddress', { header: 'IP', enableSorting: false }),
]

export function AuditPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn: () => api.get<{ data: AuditEntry[] }>('/audit'),
  })

  return (
    <PageShell
      title="Auditoria"
      description="Histórico de ações realizadas no sistema."
    >
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchPlaceholder="Buscar por usuário, ação ou descrição..."
      />
    </PageShell>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `cd frontend && npx vitest run src/pages/audit/audit-page.test.tsx`
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/audit/audit-page.tsx frontend/src/pages/audit/audit-page.test.tsx
git commit -m "feat: add AuditPage with read-only action log"
```

---

### Task 6: Settings fixtures and MSW handler

**Files:**
- Create: `frontend/src/mocks/fixtures/settings.ts`
- Create: `frontend/src/mocks/handlers/settings.ts`

- [ ] **Step 1: Create `frontend/src/mocks/fixtures/settings.ts`**

```ts
import type { SystemSetting } from '@/types'

export const SETTINGS: SystemSetting[] = [
  {
    key: 'payroll_cutoff_day',
    label: 'Dia de Fechamento da Folha',
    value: '5',
    description: 'Dia do mês em que a folha de pagamento é fechada para novas consignações.',
  },
  {
    key: 'max_interest_rate',
    label: 'Taxa Máxima de Juros',
    value: '2.50',
    description: 'Taxa máxima de juros mensal permitida para consignações (% a.m.).',
  },
  {
    key: 'max_margin_percentage',
    label: 'Margem Máxima de Consignação',
    value: '35',
    description: 'Percentual máximo da remuneração bruta que pode ser comprometido com consignações.',
  },
  {
    key: 'session_timeout_minutes',
    label: 'Tempo de Sessão',
    value: '60',
    description: 'Tempo máximo de inatividade antes da sessão expirar (em minutos).',
  },
]
```

- [ ] **Step 2: Create `frontend/src/mocks/handlers/settings.ts`**

```ts
import { http, HttpResponse } from 'msw'
import { SETTINGS } from '../fixtures/settings'
import type { SystemSetting } from '@/types'

let settingsData: SystemSetting[] = [...SETTINGS]

export const settingsHandlers = [
  http.get('/api/settings', () => {
    return HttpResponse.json({ data: settingsData })
  }),

  http.put('/api/settings/:key', async ({ params, request }) => {
    const body = await request.json() as { value: string }
    settingsData = settingsData.map((s) =>
      s.key === params.key ? { ...s, value: body.value } : s,
    )
    const updated = settingsData.find((s) => s.key === params.key)!
    return HttpResponse.json({ data: updated })
  }),
]
```

- [ ] **Step 3: Verify the files typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/mocks/fixtures/settings.ts frontend/src/mocks/handlers/settings.ts
git commit -m "feat: add settings fixtures and MSW handler"
```

---

### Task 7: Settings page + tests

**Files:**
- Create: `frontend/src/pages/settings/settings-page.tsx`
- Create: `frontend/src/pages/settings/settings-page.test.tsx`

- [ ] **Step 1: Write the failing test — `frontend/src/pages/settings/settings-page.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '@/app/auth-context'
import type { CurrentUser, SystemSetting } from '@/types'
import { SettingsPage } from './settings-page'

const mockSettings: SystemSetting[] = [
  {
    key: 'payroll_cutoff_day',
    label: 'Dia de Fechamento da Folha',
    value: '5',
    description: 'Dia do mês em que a folha é fechada.',
  },
  {
    key: 'max_interest_rate',
    label: 'Taxa Máxima de Juros',
    value: '2.50',
    description: 'Taxa máxima de juros mensal (% a.m.).',
  },
]

const mockGet = vi.hoisted(() => vi.fn().mockResolvedValue({ data: mockSettings }))
const mockPut = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { key: 'payroll_cutoff_day', label: 'Dia de Fechamento da Folha', value: '10', description: 'Dia do mês em que a folha é fechada.' } }),
)

vi.mock('@/lib/api', () => ({ api: { get: mockGet, put: mockPut } }))

const adminUser: CurrentUser = {
  id: 'u-5',
  name: 'Admin Sistema',
  email: 'admin@webconsig.com',
  role: 'admin',
}
const adminAuth = {
  user: adminUser,
  token: 'tok',
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={adminAuth}>
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

describe('SettingsPage — listing', () => {
  it('renders page title', () => {
    renderPage()
    expect(screen.getByText('Configurações')).toBeInTheDocument()
  })

  it('shows settings labels from API', async () => {
    renderPage()
    expect(await screen.findByText('Dia de Fechamento da Folha')).toBeInTheDocument()
    expect(await screen.findByText('Taxa Máxima de Juros')).toBeInTheDocument()
  })

  it('shows current values', async () => {
    renderPage()
    expect(await screen.findByText('5')).toBeInTheDocument()
    expect(await screen.findByText('2.50')).toBeInTheDocument()
  })

  it('shows Editar button for each setting', async () => {
    renderPage()
    const editButtons = await screen.findAllByRole('button', { name: /editar/i })
    expect(editButtons).toHaveLength(2)
  })
})

describe('SettingsPage — edit', () => {
  beforeEach(() => mockPut.mockClear())

  it('shows text input when Editar is clicked', async () => {
    renderPage()
    const editButtons = await screen.findAllByRole('button', { name: /editar/i })
    await userEvent.click(editButtons[0])
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('calls api.put with new value when Salvar is clicked', async () => {
    renderPage()
    const editButtons = await screen.findAllByRole('button', { name: /editar/i })
    await userEvent.click(editButtons[0]) // payroll_cutoff_day
    const input = screen.getByRole('textbox')
    await userEvent.clear(input)
    await userEvent.type(input, '10')
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(mockPut).toHaveBeenCalledWith('/settings/payroll_cutoff_day', { value: '10' })
  })

  it('hides edit form when Cancelar is clicked', async () => {
    renderPage()
    const editButtons = await screen.findAllByRole('button', { name: /editar/i })
    await userEvent.click(editButtons[0])
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `cd frontend && npx vitest run src/pages/settings/settings-page.test.tsx`
Expected: FAIL (module not found)

- [ ] **Step 3: Create `frontend/src/pages/settings/settings-page.tsx`**

```tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { usePermissions } from '@/hooks/use-permissions'
import { PageShell } from '@/components/page-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SystemSetting } from '@/types'

export function SettingsPage() {
  const { can } = usePermissions()
  const queryClient = useQueryClient()
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<{ data: SystemSetting[] }>('/settings'),
  })

  const updateSetting = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.put<{ data: SystemSetting }>(`/settings/${key}`, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setEditingKey(null)
    },
  })

  const settings = data?.data ?? []

  return (
    <PageShell
      title="Configurações"
      description="Parâmetros do sistema Webconsig."
    >
      {isLoading ? (
        <p className="text-sm text-slate-400">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {settings.map((setting) => (
            <div key={setting.key} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{setting.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{setting.description}</p>
                </div>
                {editingKey === setting.key ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-32 h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      disabled={updateSetting.isPending || !editValue.trim()}
                      onClick={() =>
                        updateSetting.mutate({ key: setting.key, value: editValue.trim() })
                      }
                    >
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingKey(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-mono font-bold text-slate-900">
                      {setting.value}
                    </span>
                    {can('edit', 'settings') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingKey(setting.key)
                          setEditValue(setting.value)
                        }}
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `cd frontend && npx vitest run src/pages/settings/settings-page.test.tsx`
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/settings/settings-page.tsx frontend/src/pages/settings/settings-page.test.tsx
git commit -m "feat: add SettingsPage with inline edit for admin"
```

---

### Task 8: Wire routes and MSW worker

**Files:**
- Modify: `frontend/src/app/router.tsx`
- Modify: `frontend/src/mocks/browser.ts`

- [ ] **Step 1: Add routes to `frontend/src/app/router.tsx`**

Add three imports after the `InstitutionsPage` import:

```ts
import { UsersPage } from '@/pages/users/users-page'
import { AuditPage } from '@/pages/audit/audit-page'
import { SettingsPage } from '@/pages/settings/settings-page'
```

Add three routes inside the children array, after `{ path: 'institutions', element: <InstitutionsPage /> }`:

```ts
{ path: 'users', element: <UsersPage /> },
{ path: 'audit', element: <AuditPage /> },
{ path: 'settings', element: <SettingsPage /> },
```

The full updated `router.tsx` should look like:

```ts
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
import { InstitutionsPage } from '@/pages/institutions/institutions-page'
import { UsersPage } from '@/pages/users/users-page'
import { AuditPage } from '@/pages/audit/audit-page'
import { SettingsPage } from '@/pages/settings/settings-page'
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
      { path: 'institutions', element: <InstitutionsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'audit', element: <AuditPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
```

- [ ] **Step 2: Register handlers in `frontend/src/mocks/browser.ts`**

Add three imports after the `institutionHandlers` import:

```ts
import { userHandlers } from './handlers/users'
import { auditHandlers } from './handlers/audit'
import { settingsHandlers } from './handlers/settings'
```

Spread them in the `setupWorker` call after `...institutionHandlers`:

```ts
...userHandlers,
...auditHandlers,
...settingsHandlers,
```

The full updated `browser.ts`:

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
import { institutionHandlers } from './handlers/institutions'
import { userHandlers } from './handlers/users'
import { auditHandlers } from './handlers/audit'
import { settingsHandlers } from './handlers/settings'

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
  ...userHandlers,
  ...auditHandlers,
  ...settingsHandlers,
)
```

- [ ] **Step 3: Verify the project typechecks and builds**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/router.tsx frontend/src/mocks/browser.ts
git commit -m "feat: wire /users, /audit, /settings routes and MSW handlers"
```

---

### Task 9: Admin quick actions on the home page

**Files:**
- Modify: `frontend/src/pages/home/home-page.tsx`
- Modify: `frontend/src/pages/home/home-page.test.tsx`

- [ ] **Step 1: Write the failing test addition — append to `frontend/src/pages/home/home-page.test.tsx`**

Add the following after the last `describe` block in the file (after the closing `}` of `describe('HomePage — institution_manager', ...)`):

```ts
const adminUser: CurrentUser = {
  id: 'u-5',
  name: 'Admin Sistema',
  email: 'admin@webconsig.com',
  role: 'admin',
}
const adminAuth = {
  user: adminUser,
  token: 'tok',
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
}

describe('HomePage — admin', () => {
  beforeEach(() => mockGet.mockClear())

  it('shows admin quick action buttons for users and audit', async () => {
    renderAs(adminAuth)
    expect(await screen.findByRole('button', { name: /gerenciar usuários/i })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /auditoria do sistema/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `cd frontend && npx vitest run src/pages/home/home-page.test.tsx`
Expected: FAIL — buttons not found

- [ ] **Step 3: Add admin quick actions to `frontend/src/pages/home/home-page.tsx`**

In the "Ações Rápidas" section, after the existing `{can('export', 'deduction-statement') && ...}` button, add:

```tsx
{can('view', 'users') && (
  <Button variant="outline" className="w-full" onClick={() => navigate('/users')}>
    Gerenciar Usuários
  </Button>
)}
{can('view', 'audit') && (
  <Button variant="outline" className="w-full" onClick={() => navigate('/audit')}>
    Auditoria do Sistema
  </Button>
)}
```

The full updated quick actions section in `home-page.tsx` (replace the existing block):

```tsx
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
    {can('view', 'users') && (
      <Button variant="outline" className="w-full" onClick={() => navigate('/users')}>
        Gerenciar Usuários
      </Button>
    )}
    {can('view', 'audit') && (
      <Button variant="outline" className="w-full" onClick={() => navigate('/audit')}>
        Auditoria do Sistema
      </Button>
    )}
  </div>
</div>
```

- [ ] **Step 4: Run all home page tests**

Run: `cd frontend && npx vitest run src/pages/home/home-page.test.tsx`
Expected: all tests pass

- [ ] **Step 5: Run the full test suite**

Run: `cd frontend && npm run test:run`
Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/home/home-page.tsx frontend/src/pages/home/home-page.test.tsx
git commit -m "feat: add admin quick actions (Gerenciar Usuários, Auditoria do Sistema) to home page"
```

---

## Self-Review

### 1. Spec Coverage

| Requirement | Task |
|---|---|
| Usuários CRUD | Task 2 (handler) + Task 3 (page) |
| Auditoria log | Task 4 (handler/fixture) + Task 5 (page) |
| Configurações editor | Task 6 (handler/fixture) + Task 7 (page) |
| Full data visibility (no filtering for admin) | Already implemented — no changes needed |
| Routes wired | Task 8 |
| Admin home experience | Task 9 |

All spec requirements are covered.

### 2. Placeholder Scan

No TBD, TODO, or stub language present. Every step includes full code.

### 3. Type Consistency

- `AuditEntry`, `AuditAction`, `AuditResource` defined in Task 1, used in Task 4 (`audit.ts` fixture) and Task 5 (`audit-page.tsx`)
- `SystemSetting` defined in Task 1, used in Task 6 (`settings.ts` fixture) and Task 7 (`settings-page.tsx`)
- `Role` (existing type) used in Task 2 and Task 3 for `ROLE_LABELS`, `ROLE_OPTIONS`, `newRole`, `editRole`
- `CurrentUser` (existing type) used in Task 2 (`toPublic`) and Task 3 (`users-page.tsx`)
- `formatDateTime` added in Task 1, imported in Task 5 (`audit-page.tsx`)
- All handler exports match their import names: `userHandlers`, `auditHandlers`, `settingsHandlers`
