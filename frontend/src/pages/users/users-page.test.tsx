import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '@/app/auth-context'
import type { CurrentUser } from '@/types'
import { UsersPage } from './users-page'

const mockUsers: CurrentUser[] = [
  { id: 'u-1', name: 'João Silva', email: 'representante@bancalfa.com', role: 'representative', institutionId: 'inst-1' },
  { id: 'u-2', name: 'Maria Santos', email: 'rh@prefeitura.gov.br', role: 'hr_manager' },
  { id: 'u-5', name: 'Admin Sistema', email: 'admin@webconsig.com', role: 'admin' },
]

const mockGet = vi.hoisted(() => vi.fn().mockImplementation(() => Promise.resolve({ data: mockUsers })))
const mockPost = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { id: 'u-new', name: 'Novo Usuário', email: 'novo@test.com', role: 'representative' } }),
)
const mockPatch = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { id: 'u-1', name: 'João Silva', email: 'representante@bancalfa.com', role: 'hr_manager' } }),
)
const mockDelete = vi.hoisted(() => vi.fn().mockResolvedValue({}))

vi.mock('@/lib/api', () => ({
  api: { get: mockGet, post: mockPost, patch: mockPatch, delete: mockDelete },
}))

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
          <UsersPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

describe('UsersPage — listing', () => {
  it('renders page title', () => {
    renderPage()
    expect(screen.getByText('Usuários')).toBeInTheDocument()
  })

  it('shows all users from API', async () => {
    renderPage()
    expect(await screen.findByText('João Silva')).toBeInTheDocument()
    expect(await screen.findByText('Maria Santos')).toBeInTheDocument()
  })

  it('shows Adicionar Usuário button', async () => {
    renderPage()
    expect(await screen.findByRole('button', { name: /adicionar usuário/i })).toBeInTheDocument()
  })
})

describe('UsersPage — add user', () => {
  beforeEach(() => mockPost.mockClear())

  it('opens add form when Adicionar Usuário is clicked', async () => {
    renderPage()
    const btn = await screen.findByRole('button', { name: /adicionar usuário/i })
    await userEvent.click(btn)
    expect(screen.getByLabelText(/^nome$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^e-mail$/i)).toBeInTheDocument()
  })

  it('calls api.post with name, email, and role when form is submitted', async () => {
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: /adicionar usuário/i }))
    await userEvent.type(screen.getByLabelText(/^nome$/i), 'Novo Usuário')
    await userEvent.type(screen.getByLabelText(/^e-mail$/i), 'novo@test.com')
    const saveButtons = screen.getAllByRole('button', { name: /salvar/i })
    await userEvent.click(saveButtons[saveButtons.length - 1])
    expect(mockPost).toHaveBeenCalledWith('/users', {
      name: 'Novo Usuário',
      email: 'novo@test.com',
      role: 'representative',
    })
  })
})

describe('UsersPage — edit role', () => {
  beforeEach(() => mockPatch.mockClear())

  it('calls api.patch when Alterar Papel is clicked and saved', async () => {
    renderPage()
    const editButtons = await screen.findAllByRole('button', { name: /alterar papel/i })
    await userEvent.click(editButtons[0])
    const roleSelect = screen.getByRole('combobox', { name: /papel/i })
    await userEvent.selectOptions(roleSelect, 'hr_manager')
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(mockPatch).toHaveBeenCalledWith('/users/u-1', { role: 'hr_manager' })
  })
})

describe('UsersPage — delete user', () => {
  beforeEach(() => mockDelete.mockClear())

  it('calls api.delete when Excluir is clicked for another user', async () => {
    renderPage()
    const deleteButtons = await screen.findAllByRole('button', { name: /excluir/i })
    await userEvent.click(deleteButtons[0])
    expect(mockDelete).toHaveBeenCalledWith('/users/u-1')
  })

  it('Excluir button is disabled for the current user', async () => {
    renderPage()
    await screen.findByText('Admin Sistema')
    const deleteButtons = screen.getAllByRole('button', { name: /excluir/i })
    // Admin (u-5) is the last row — its delete button must be disabled
    expect(deleteButtons[deleteButtons.length - 1]).toBeDisabled()
  })
})
