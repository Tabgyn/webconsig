import { http, HttpResponse } from 'msw'
import { CONSIGNMENTS } from '../fixtures/consignments'
import type { DeductionEntry } from '@/types'

export const deductionStatementHandlers = [
  http.get('/api/deduction-statement', ({ request }) => {
    const url = new URL(request.url)
    const competence = url.searchParams.get('competence') ?? '2026-03'
    const employeeId = url.searchParams.get('employeeId')

    const data: DeductionEntry[] = CONSIGNMENTS
      .filter((c) => c.status === 'active' || c.status === 'pending')
      .filter((c) => !employeeId || c.employeeId === employeeId)
      .map((c, i) => ({
        id: `ded-${i + 1}`,
        consignmentId: c.id,
        employeeId: c.employeeId,
        institutionId: c.institutionId,
        amount: c.installmentValue,
        competence,
        status: c.status === 'active' ? 'processed' : 'pending',
      } as DeductionEntry))

    return HttpResponse.json({ data })
  }),
]
