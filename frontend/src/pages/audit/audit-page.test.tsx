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

const mockGet = vi.hoisted(() =>
  vi.fn().mockImplementation(() => Promise.resolve({ data: mockEntries })),
)

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
