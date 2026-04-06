import { http, HttpResponse } from 'msw'
import { INSTITUTIONS } from '../fixtures/institutions'
import { REPRESENTATIVES } from '../fixtures/representatives'
import type { Institution, Representative } from '@/types'

let institutionsData: Institution[] = [...INSTITUTIONS]
export let representativesData: Representative[] = [...REPRESENTATIVES]

export const institutionHandlers = [
  http.get('/api/institutions/:id', ({ params }) => {
    const institution = institutionsData.find((i) => i.id === params.id)
    if (!institution) {
      return HttpResponse.json({ message: 'Entidade não encontrada' }, { status: 404 })
    }
    return HttpResponse.json({ data: institution })
  }),

  http.put('/api/institutions/:id', async ({ params, request }) => {
    const body = await request.json() as { name: string }
    const index = institutionsData.findIndex((i) => i.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ message: 'Entidade não encontrada' }, { status: 404 })
    }
    institutionsData = institutionsData.map((i) =>
      i.id === params.id ? { ...i, name: body.name } : i,
    )
    return HttpResponse.json({ data: institutionsData.find((i) => i.id === params.id) })
  }),

  http.get('/api/institutions/:id/representatives', ({ params }) => {
    const reps = representativesData.filter((r) => r.institutionId === params.id)
    return HttpResponse.json({ data: reps, total: reps.length })
  }),

  http.post('/api/institutions/:id/representatives', async ({ params, request }) => {
    const body = await request.json() as { name: string; email: string }
    const newRep: Representative = {
      id: `rep-${Date.now()}`,
      name: body.name,
      email: body.email,
      institutionId: params.id as string,
      isActive: true,
    }
    representativesData = [...representativesData, newRep]
    return HttpResponse.json({ data: newRep }, { status: 201 })
  }),

  http.patch('/api/institutions/:id/representatives/:repId', async ({ params, request }) => {
    const body = await request.json() as { isActive: boolean }
    representativesData = representativesData.map((r) =>
      r.id === params.repId ? { ...r, isActive: body.isActive } : r,
    )
    const updated = representativesData.find((r) => r.id === params.repId)
    return HttpResponse.json({ data: updated })
  }),
]
