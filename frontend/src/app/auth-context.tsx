import { createContext, useState, useCallback, type ReactNode } from 'react'
import { api } from '@/lib/api'
import type { CurrentUser } from '@/types'

interface AuthState {
  user: CurrentUser | null
  token: string | null
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredAuth(): AuthState {
  try {
    const token = localStorage.getItem('token')
    const raw = localStorage.getItem('user')
    if (token && raw) {
      return { user: JSON.parse(raw) as CurrentUser, token, isAuthenticated: true }
    }
  } catch {
    // corrupted storage — ignore
  }
  return { user: null, token: null, isAuthenticated: false }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(readStoredAuth)

  const login = useCallback(async (email: string, password: string) => {
    const { user, token } = await api.post<{ user: CurrentUser; token: string }>(
      '/auth/login',
      { email, password },
    )
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setState({ user, token, isAuthenticated: true })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setState({ user: null, token: null, isAuthenticated: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
