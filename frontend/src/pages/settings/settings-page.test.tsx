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

const mockGet = vi.hoisted(() =>
  vi.fn().mockImplementation(() => Promise.resolve({ data: mockSettings })),
)
const mockPut = vi.hoisted(() =>
  vi.fn().mockImplementation(() =>
    Promise.resolve({ data: { key: 'payroll_cutoff_day', label: 'Dia de Fechamento da Folha', value: '10', description: 'Dia do mês em que a folha é fechada.' } }),
  ),
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
