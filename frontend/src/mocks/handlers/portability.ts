import { http, HttpResponse } from 'msw'
import { PORTABILITIES } from '../fixtures/portabilities'
import type { Portability, PortabilityStatus } from '@/types'

export let portabilitiesData: Portability[] = [...PORTABILITIES]

export const portabilityHandlers = [
  http.get('/api/portability', ({ request }) => {
    const url = new URL(request.url)
    const institutionId = url.searchParams.get('institutionId')
    const result = institutionId
      ? portabilitiesData.filter(
          (p) =>
            p.originInstitutionId === institutionId ||
            p.destinationInstitutionId === institutionId,
        )
      : portabilitiesData
    return HttpResponse.json({ data: result, total: result.length })
  }),

  http.post('/api/portability', async ({ request }) => {
    const body = await request.json() as Partial<Portability>
    const newPortability: Portability = {
      id: `port-${Date.now()}`,
      consignmentId: body.consignmentId ?? '',
      originInstitutionId: body.originInstitutionId ?? '',
      destinationInstitutionId: body.destinationInstitutionId ?? '',
      requestedAt: new Date().toISOString().split('T')[0],
      status: 'requested',
    }
    portabilitiesData = [...portabilitiesData, newPortability]
    return HttpResponse.json({ data: newPortability }, { status: 201 })
  }),

  http.patch('/api/portability/:id', async ({ params, request }) => {
    const body = await request.json() as { status: PortabilityStatus }
    portabilitiesData = portabilitiesData.map((p) =>
      p.id === params.id ? { ...p, status: body.status } : p,
    )
    const updated = portabilitiesData.find((p) => p.id === params.id)
    if (!updated) {
      return HttpResponse.json({ message: 'Portabilidade não encontrada' }, { status: 404 })
    }
    return HttpResponse.json({ data: updated })
  }),
]
