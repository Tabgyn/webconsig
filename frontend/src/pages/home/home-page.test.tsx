import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '@/app/auth-context'
import type { CurrentUser, DashboardStats } from '@/types'
import { HomePage } from './home-page'

const mockGet = vi.hoisted(() =>
  vi.fn().mockImplementation((path: unknown) => {
    const p = typeof path === 'string' ? path : ''
    if (p.includes('/dashboard/stats')) {
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

function renderAs(auth: typeof employeeAuth | typeof institutionManagerAuth) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={auth}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

function renderPage() {
  return renderAs(employeeAuth)
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
    const paths = mockGet.mock.calls.map((c: unknown[]) => (typeof c[0] === 'string' ? c[0] : ''))
    expect(paths.some((p) => p.includes('employeeId=emp-1'))).toBe(true)
  })

  it('fetches consignments scoped to the employee', async () => {
    renderPage()
    await screen.findByText('Próxima Parcela')
    const paths = mockGet.mock.calls.map((c: unknown[]) => (typeof c[0] === 'string' ? c[0] : ''))
    expect(
      paths.some((p) => p.includes('/consignments') && p.includes('employeeId=emp-1')),
    ).toBe(true)
  })
})

describe('HomePage — institution_manager', () => {
  beforeEach(() => mockGet.mockClear())

  it('fetches dashboard stats scoped to the institution', async () => {
    renderAs(institutionManagerAuth)
    expect(await screen.findByText(/bom/i)).toBeInTheDocument()
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('institutionId=inst-1'))
  })
})
