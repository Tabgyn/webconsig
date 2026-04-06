import { http, HttpResponse } from 'msw'
import { consignmentsData } from './consignments'
import { portabilitiesData } from './portability'
import { representativesData } from './institutions'
import { EMPLOYEES } from '../fixtures/employees'
import type { DashboardStats, Alert } from '@/types'

export const dashboardHandlers = [
  http.get('/api/dashboard/stats', ({ request }) => {
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')
    const institutionId = url.searchParams.get('institutionId')

    const baseConsignments = institutionId
      ? consignmentsData.filter((c) => c.institutionId === institutionId)
      : consignmentsData

    const activeConsignments = baseConsignments.filter((c) => c.status === 'active')
    const employeeIdsWithActive = new Set(activeConsignments.map((c) => c.employeeId))

    const basePortabilities = institutionId
      ? portabilitiesData.filter(
          (p) =>
            p.originInstitutionId === institutionId ||
            p.destinationInstitutionId === institutionId,
        )
      : portabilitiesData

    const stats: DashboardStats = {
      activeConsignments: activeConsignments.length,
      pendingApproval: baseConsignments.filter((c) => c.status === 'pending').length,
      activePortabilities: basePortabilities.filter((p) => p.status === 'requested').length,
      totalConsignedValue: activeConsignments.reduce((sum, c) => sum + c.remainingBalance, 0),
      totalEmployees: EMPLOYEES.length,
      employeesWithConsignments: employeeIdsWithActive.size,
    }

    if (institutionId) {
      stats.institutionActiveRepresentatives = representativesData.filter(
        (r) => r.institutionId === institutionId && r.isActive,
      ).length
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
