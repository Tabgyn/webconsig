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
