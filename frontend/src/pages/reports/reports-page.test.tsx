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
