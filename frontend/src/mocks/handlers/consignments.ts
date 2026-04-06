import { http, HttpResponse } from 'msw'
import { CONSIGNMENTS } from '../fixtures/consignments'
import type { Consignment, ConsignmentStatus } from '@/types'

// Mutable in-memory copy — persists across requests in the same browser session
// Exported so other handlers (e.g. dashboard) can read the live state
export let consignmentsData: Consignment[] = [...CONSIGNMENTS]

export const consignmentHandlers = [
  http.get('/api/consignments', ({ request }) => {
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')
    const result = employeeId
      ? consignmentsData.filter((c) => c.employeeId === employeeId)
      : consignmentsData
    return HttpResponse.json({ data: result, total: result.length })
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
    consignmentsData = [...consignmentsData, newConsignment]
    return HttpResponse.json({ data: newConsignment }, { status: 201 })
  }),

  http.patch('/api/consignments/:id', async ({ params, request }) => {
    const body = await request.json() as { status: ConsignmentStatus }
    const index = consignmentsData.findIndex((c) => c.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ message: 'Consignação não encontrada' }, { status: 404 })
    }
    consignmentsData = consignmentsData.map((c) =>
      c.id === params.id ? { ...c, status: body.status } : c,
    )
    return HttpResponse.json({ data: consignmentsData[index] })
  }),
]
