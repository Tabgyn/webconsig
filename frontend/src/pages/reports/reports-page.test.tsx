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
