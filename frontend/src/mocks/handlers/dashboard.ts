import { http, HttpResponse } from 'msw'
import { consignmentsData } from './consignments'
import { EMPLOYEES } from '../fixtures/employees'
import { PORTABILITIES } from '../fixtures/portabilities'
import type { DashboardStats, Alert } from '@/types'

export const dashboardHandlers = [
  http.get('/api/dashboard/stats', ({ request }) => {
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')

    const activeConsignments = consignmentsData.filter((c) => c.status === 'active')
    const employeeIdsWithActive = new Set(activeConsignments.map((c) => c.employeeId))

    const stats: DashboardStats = {
      activeConsignments: activeConsignments.length,
      pendingApproval: consignmentsData.filter((c) => c.status === 'pending').length,
      activePortabilities: PORTABILITIES.filter((p) => p.status === 'requested').length,
      totalConsignedValue: activeConsignments.reduce((sum, c) => sum + c.remainingBalance, 0),
      totalEmployees: EMPLOYEES.length,
      employeesWithConsignments: employeeIdsWithActive.size,
    }

    if (employeeId) {
      const mine = consignmentsData.filter(
        (c) => c.employeeId === employeeId && (c.status === 'active' || c.status === 'pending'),
      )
      stats.myActiveConsignments = mine.length
      stats.myTotalDebt = mine.reduce((sum, c) => sum + c.remainingBalance, 0)
      stats.myNextDeduction = mine.length > 0
        ? Math.min(...mine.map((c) => c.installmentValue))
        : 0
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
