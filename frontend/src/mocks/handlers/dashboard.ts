import { http, HttpResponse } from 'msw'
import { CONSIGNMENTS } from '../fixtures/consignments'
import { PORTABILITIES } from '../fixtures/portabilities'
import type { DashboardStats, Alert } from '@/types'

export const dashboardHandlers = [
  http.get('/api/dashboard/stats', () => {
    const stats: DashboardStats = {
      activeConsignments: CONSIGNMENTS.filter((c) => c.status === 'active').length,
      pendingApproval: CONSIGNMENTS.filter((c) => c.status === 'pending').length,
      activePortabilities: PORTABILITIES.filter((p) => p.status === 'requested').length,
      totalConsignedValue: CONSIGNMENTS
        .filter((c) => c.status === 'active')
        .reduce((sum, c) => sum + c.remainingBalance, 0),
    }
    return HttpResponse.json(stats)
  }),

  http.get('/api/dashboard/alerts', () => {
    const data: Alert[] = [
      {
        id: 'alert-1',
        type: 'warning',
        message: 'Prazo de fechamento da folha: 05/04/2026',
        date: '2026-04-03',
      },
      {
        id: 'alert-2',
        type: 'info',
        message: '2 consignações aguardam aprovação do órgão',
        date: '2026-04-03',
      },
    ]
    return HttpResponse.json({ data })
  }),
]
