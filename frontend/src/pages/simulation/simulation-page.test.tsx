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
