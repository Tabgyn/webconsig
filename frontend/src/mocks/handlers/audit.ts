import { http, HttpResponse } from 'msw'
import { AUDIT_ENTRIES } from '../fixtures/audit'

export const auditHandlers = [
  http.get('/api/audit', () => {
    const sorted = [...AUDIT_ENTRIES].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    return HttpResponse.json({ data: sorted, total: sorted.length })
  }),
]
