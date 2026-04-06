import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '@/app/auth-context'
import type { CurrentUser, Institution, Representative } from '@/types'
import { InstitutionsPage } from './institutions-page'

const mockInstitution: Institution = {
  id: 'inst-1',
  name: 'Banco Alfa S.A.',
  cnpj: '12345678000195',
  isActive: true,
}

const mockRepresentatives: Representative[] = [
  { id: 'rep-1', name: 'João Silva', email: 'joao@bancalfa.com', institutionId: 'inst-1', isActive: true },
  { id: 'rep-2', name: 'Fernanda Lima', email: 'fernanda@bancalfa.com', institutionId: 'inst-1', isActive: true },
]

const mockGet = vi.hoisted(() =>
  vi.fn().mockImplementation((path: string) => {
    if (path.endsWith('/representatives')) {
      return Promise.resolve({ data: mockRepresentatives })
    }
    return Promise.resolve({ data: mockInstitution })
  }),
)
const mockPut = vi.hoisted(() => vi.fn().mockResolvedValue({ data: { id: 'inst-1', name: 'Banco Alfa Atualizado', cnpj: '12345678000195', isActive: true } }))
const mockPost = vi.hoisted(() => vi.fn().mockResolvedValue({ data: { id: 'rep-new', name: 'Novo Rep', email: 'novo@bancalfa.com', institutionId: 'inst-1', isActive: true } }))
const mockPatch = vi.hoisted(() => vi.fn().mockResolvedValue({ data: { id: 'rep-1', isActive: false } }))

vi.mock('@/lib/api', () => ({
  api: { get: mockGet, put: mockPut, post: mockPost, patch: mockPatch },
}))

const managerUser: CurrentUser = {
  id: 'u-4',
  name: 'Ana Costa',
  email: 'gestor@bancalfa.com',
  role: 'institution_manager',
  institutionId: 'inst-1',
}
const managerAuth = { user: managerUser, token: 'tok', isAuthenticated: true, login: vi.fn(), logout: vi.fn() }

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={managerAuth}>
        <MemoryRouter>
          <InstitutionsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

describe('InstitutionsPage — profile', () => {
  it('renders page title', () => {
    renderPage()
    expect(screen.getByText('Entidades')).toBeInTheDocument()
  })

  it('shows institution name from API', async () => {
    renderPage()
    expect(await screen.findByText('Banco Alfa S.A.')).toBeInTheDocument()
  })

  it('shows formatted CNPJ', async () => {
    renderPage()
    expect(await screen.findByText('12.345.678/0001-95')).toBeInTheDocument()
  })

  it('shows Editar button', async () => {
    renderPage()
    expect(await screen.findByRole('button', { name: /editar/i })).toBeInTheDocument()
  })
})

describe('InstitutionsPage — edit institution', () => {
  beforeEach(() => mockPut.mockClear())

  it('shows edit form when Editar is clicked', async () => {
    renderPage()
    const editBtn = await screen.findByRole('button', { name: /editar/i })
    await userEvent.click(editBtn)
    expect(screen.getByLabelText(/nome da entidade/i)).toBeInTheDocument()
  })

  it('calls api.put with updated name when Salvar is clicked', async () => {
    renderPage()
    const editBtn = await screen.findByRole('button', { name: /editar/i })
    await userEvent.click(editBtn)
    const input = screen.getByLabelText(/nome da entidade/i)
    await userEvent.clear(input)
    await userEvent.type(input, 'Banco Alfa Atualizado')
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(mockPut).toHaveBeenCalledWith('/institutions/inst-1', { name: 'Banco Alfa Atualizado' })
  })
})

describe('InstitutionsPage — representatives', () => {
  it('shows representatives table with names', async () => {
    renderPage()
    expect(await screen.findByText('João Silva')).toBeInTheDocument()
    expect(await screen.findByText('Fernanda Lima')).toBeInTheDocument()
  })

  it('shows Adicionar Representante button', async () => {
    renderPage()
    expect(await screen.findByRole('button', { name: /adicionar representante/i })).toBeInTheDocument()
  })

  it('shows add form when Adicionar Representante is clicked', async () => {
    renderPage()
    const addBtn = await screen.findByRole('button', { name: /adicionar representante/i })
    await userEvent.click(addBtn)
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
  })

  it('calls api.post when new representative form is submitted', async () => {
    renderPage()
    const addBtn = await screen.findByRole('button', { name: /adicionar representante/i })
    await userEvent.click(addBtn)
    await userEvent.type(screen.getByLabelText(/nome/i), 'Novo Representante')
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'novo@bancalfa.com')
    const saveButtons = screen.getAllByRole('button', { name: /salvar/i })
    await userEvent.click(saveButtons[saveButtons.length - 1])
    expect(mockPost).toHaveBeenCalledWith('/institutions/inst-1/representatives', {
      name: 'Novo Representante',
      email: 'novo@bancalfa.com',
    })
  })

  it('calls api.patch with isActive false when Desativar is clicked', async () => {
    renderPage()
    const deactivateButtons = await screen.findAllByRole('button', { name: /desativar/i })
    await userEvent.click(deactivateButtons[0])
    expect(mockPatch).toHaveBeenCalledWith('/institutions/inst-1/representatives/rep-1', { isActive: false })
  })
})
