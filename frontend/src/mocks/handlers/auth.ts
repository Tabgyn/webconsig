import { http, HttpResponse } from 'msw'
import { MOCK_USERS } from '../fixtures/users'
import type { CurrentUser } from '@/types'

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    const found = MOCK_USERS.find(
      (u) => u.email === body.email && u.password === body.password,
    )
    if (!found) {
      return HttpResponse.json({ message: 'E-mail ou senha inválidos' }, { status: 401 })
    }
    const { password, ...user } = found
    return HttpResponse.json({ user: user as CurrentUser, token: 'mock-jwt-token' })
  }),
]
