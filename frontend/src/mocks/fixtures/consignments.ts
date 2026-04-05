import type { Consignment } from '@/types'

export const CONSIGNMENTS: Consignment[] = [
  {
    id: 'cons-1', employeeId: 'emp-2', institutionId: 'inst-1',
    installmentValue: 320.0, installments: 48, installmentsRemaining: 36,
    interestRate: 1.8, totalValue: 15360.0, remainingBalance: 9856.42,
    startDate: '2023-04-01', status: 'active',
  },
  {
    id: 'cons-2', employeeId: 'emp-3', institutionId: 'inst-1',
    installmentValue: 198.0, installments: 36, installmentsRemaining: 28,
    interestRate: 1.9, totalValue: 7128.0, remainingBalance: 4820.15,
    startDate: '2023-12-01', status: 'active',
  },
  {
    id: 'cons-3', employeeId: 'emp-1', institutionId: 'inst-1',
    installmentValue: 475.5, installments: 60, installmentsRemaining: 60,
    interestRate: 1.75, totalValue: 28530.0, remainingBalance: 28530.0,
    startDate: '2026-04-01', status: 'pending',
  },
  {
    id: 'cons-4', employeeId: 'emp-4', institutionId: 'inst-2',
    installmentValue: 612.0, installments: 24, installmentsRemaining: 0,
    interestRate: 2.1, totalValue: 14688.0, remainingBalance: 0,
    startDate: '2024-02-01', status: 'cancelled',
  },
  {
    id: 'cons-5', employeeId: 'emp-5', institutionId: 'inst-1',
    installmentValue: 380.0, installments: 48, installmentsRemaining: 12,
    interestRate: 1.85, totalValue: 18240.0, remainingBalance: 4280.0,
    startDate: '2022-04-01', status: 'active',
  },
  {
    id: 'cons-6', employeeId: 'emp-2', institutionId: 'inst-2',
    installmentValue: 290.0, installments: 36, installmentsRemaining: 36,
    interestRate: 2.0, totalValue: 10440.0, remainingBalance: 10440.0,
    startDate: '2026-04-01', status: 'pending',
  },
]
