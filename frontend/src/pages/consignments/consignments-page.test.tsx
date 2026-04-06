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

describe('ConsignmentsPage — institution_manager scope', () => {
  beforeEach(() => mockGet.mockClear())

  it('fetches consignments scoped to the logged-in institution', async () => {
    renderAs(institutionManagerAuth)
    expect(await screen.findByText('Consignações')).toBeInTheDocument()
    expect(mockGet).toHaveBeenCalledWith('/consignments?institutionId=inst-1')
  })
})
