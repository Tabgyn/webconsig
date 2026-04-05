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
