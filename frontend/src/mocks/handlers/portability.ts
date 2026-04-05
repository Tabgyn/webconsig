import { http, HttpResponse } from 'msw'
import { PORTABILITIES } from '../fixtures/portabilities'
import type { Portability } from '@/types'

export const portabilityHandlers = [
  http.get('/api/portability', () => {
    return HttpResponse.json({ data: PORTABILITIES, total: PORTABILITIES.length })
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
    return HttpResponse.json({ data: newPortability }, { status: 201 })
  }),
]
