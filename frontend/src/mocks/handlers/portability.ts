import { http, HttpResponse } from 'msw'
import { PORTABILITIES } from '../fixtures/portabilities'
import type { Portability } from '@/types'

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
]
