import { http, HttpResponse } from 'msw'
import { CONSIGNMENTS } from '../fixtures/consignments'

export const outstandingBalanceHandlers = [
  http.get('/api/outstanding-balance', () => {
    const data = CONSIGNMENTS
      .filter((c) => c.status === 'active' && c.remainingBalance > 0)
      .map((c) => ({
        consignmentId: c.id,
        employeeId: c.employeeId,
        institutionId: c.institutionId,
        remainingBalance: c.remainingBalance,
        requestedAt: new Date().toISOString().split('T')[0],
      }))
    return HttpResponse.json({ data })
  }),
]
