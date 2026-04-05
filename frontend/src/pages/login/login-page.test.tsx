import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { AuthContext } from '@/app/auth-context'
import { LoginPage } from './login-page'

const mockLogin = vi.fn()
const mockAuthValue = {
  user: null,
  token: null,
  isAuthenticated: false,
  login: mockLogin,
  logout: vi.fn(),
}

function renderLogin() {
  return render(
    <AuthContext.Provider value={mockAuthValue}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    renderLogin()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
  })

  it('shows validation error when submitted with empty fields', async () => {
    renderLogin()
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    expect(await screen.findByText(/e-mail obrigatório/i)).toBeInTheDocument()
  })

  it('calls login with email and password on valid submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    renderLogin()
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'user@test.com')
    await userEvent.type(screen.getByLabelText(/senha/i), 'password')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'password')
  })
})
