import { http, HttpResponse } from 'msw'
import { CONSIGNMENTS } from '../fixtures/consignments'
import type { Consignment } from '@/types'

export const consignmentHandlers = [
  http.get('/api/consignments', () => {
    return HttpResponse.json({ data: CONSIGNMENTS, total: CONSIGNMENTS.length })
  }),

  http.post('/api/consignments', async ({ request }) => {
    const body = await request.json() as Partial<Consignment>
    const newConsignment: Consignment = {
      id: `cons-${Date.now()}`,
      employeeId: body.employeeId ?? '',
      institutionId: body.institutionId ?? '',
      installmentValue: body.installmentValue ?? 0,
      installments: body.installments ?? 0,
      installmentsRemaining: body.installments ?? 0,
      interestRate: body.interestRate ?? 0,
      totalValue: (body.installmentValue ?? 0) * (body.installments ?? 0),
      remainingBalance: (body.installmentValue ?? 0) * (body.installments ?? 0),
      startDate: new Date().toISOString().split('T')[0],
      status: 'pending',
    }
    return HttpResponse.json({ data: newConsignment }, { status: 201 })
  }),
]
