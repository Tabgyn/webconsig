import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '@/app/auth-context'
import type { CurrentUser, Consignment } from '@/types'
import { ConsignmentsPage } from './consignments-page'

const mockPatch = vi.hoisted(() => vi.fn().mockResolvedValue({ data: {} }))
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
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
    patch: mockPatch,
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
          <ConsignmentsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

describe('ConsignmentsPage mutations', () => {
  it('renders Aprovar button for pending consignment viewed by hr_manager', async () => {
    renderPage()
    expect(await screen.findByRole('button', { name: /aprovar/i })).toBeInTheDocument()
  })

  it('calls api.patch with status active when Aprovar is clicked', async () => {
    renderPage()
    const btn = await screen.findByRole('button', { name: /aprovar/i })
    await userEvent.click(btn)
    expect(mockPatch).toHaveBeenCalledWith('/consignments/cons-1', { status: 'active' })
  })

  it('renders Rejeitar button for pending consignment viewed by hr_manager', async () => {
    renderPage()
    expect(await screen.findByRole('button', { name: /rejeitar/i })).toBeInTheDocument()
  })
})
