import { http, HttpResponse } from 'msw'
import { MOCK_USERS } from '../fixtures/users'
import type { CurrentUser, Role } from '@/types'

type MockUserInternal = (typeof MOCK_USERS)[number]

let usersData: MockUserInternal[] = [...MOCK_USERS]

function toPublic(u: MockUserInternal): CurrentUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    ...(u.institutionId ? { institutionId: u.institutionId } : {}),
    ...(u.employeeId ? { employeeId: u.employeeId } : {}),
  }
}

export const userHandlers = [
  http.get('/api/users', () => {
    const data = usersData.map(toPublic)
    return HttpResponse.json({ data, total: data.length })
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json() as { name: string; email: string; role: Role }
    const newUser: MockUserInternal = {
      id: `u-${Date.now()}`,
      name: body.name,
      email: body.email,
      role: body.role,
      password: 'password',
    }
    usersData = [...usersData, newUser]
    return HttpResponse.json({ data: toPublic(newUser) }, { status: 201 })
  }),

  http.patch('/api/users/:id', async ({ params, request }) => {
    const body = await request.json() as { role: Role }
    const index = usersData.findIndex((u) => u.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ message: 'Usuário não encontrado' }, { status: 404 })
    }
    usersData = usersData.map((u) =>
      u.id === params.id ? { ...u, role: body.role } : u,
    )
    return HttpResponse.json({ data: toPublic(usersData.find((u) => u.id === params.id)!) })
  }),

  http.delete('/api/users/:id', ({ params }) => {
    const exists = usersData.some((u) => u.id === params.id)
    if (!exists) {
      return HttpResponse.json({ message: 'Usuário não encontrado' }, { status: 404 })
    }
    usersData = usersData.filter((u) => u.id !== params.id)
    return HttpResponse.json({})
  }),
]
