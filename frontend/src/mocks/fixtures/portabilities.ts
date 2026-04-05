import type { Portability } from '@/types'

export const PORTABILITIES: Portability[] = [
  {
    id: 'port-1', consignmentId: 'cons-1',
    originInstitutionId: 'inst-2', destinationInstitutionId: 'inst-1',
    requestedAt: '2026-03-15', status: 'requested',
  },
  {
    id: 'port-2', consignmentId: 'cons-5',
    originInstitutionId: 'inst-3', destinationInstitutionId: 'inst-1',
    requestedAt: '2026-03-20', status: 'approved',
  },
  {
    id: 'port-3', consignmentId: 'cons-2',
    originInstitutionId: 'inst-1', destinationInstitutionId: 'inst-2',
    requestedAt: '2026-03-28', status: 'rejected',
  },
]
