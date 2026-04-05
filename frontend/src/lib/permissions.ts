import type { Role } from '@/types'

type Action = string
type Resource = string

const PERMISSION_MAP: Record<Role, Partial<Record<Resource, Action[]>>> = {
  admin: {
    consignment: ['view', 'create', 'approve', 'reject', 'cancel'],
    portability: ['view', 'create', 'approve', 'reject'],
    simulation: ['view', 'simulate'],
    'outstanding-balance': ['view', 'request'],
    'deduction-statement': ['view', 'export'],
    'rate-ranking': ['view'],
    reports: ['view', 'export'],
    employees: ['view', 'create', 'edit'],
    institutions: ['view', 'create', 'edit'],
    users: ['view', 'create', 'edit', 'delete'],
    audit: ['view'],
    settings: ['view', 'edit'],
  },
  representative: {
    consignment: ['view', 'create', 'cancel'],
    portability: ['view', 'create'],
    simulation: ['view', 'simulate'],
    'outstanding-balance': ['view', 'request'],
    'deduction-statement': ['view', 'export'],
    'rate-ranking': ['view'],
    reports: ['view', 'export'],
  },
  hr_manager: {
    consignment: ['view', 'approve', 'reject'],
    portability: ['view'],
    simulation: ['view', 'simulate'],
    'outstanding-balance': ['view', 'request'],
    'deduction-statement': ['view', 'export'],
    'rate-ranking': ['view'],
    reports: ['view', 'export'],
    employees: ['view', 'edit'],
  },
  employee: {
    consignment: ['view'],
    simulation: ['view', 'simulate'],
    'deduction-statement': ['view', 'export'],
    'rate-ranking': ['view'],
  },
  institution_manager: {
    consignment: ['view'],
    portability: ['view', 'approve', 'reject'],
    simulation: ['view', 'simulate'],
    'outstanding-balance': ['view', 'request'],
    'deduction-statement': ['view', 'export'],
    'rate-ranking': ['view'],
    reports: ['view', 'export'],
    institutions: ['view', 'edit'],
  },
}

export function buildCan(role: Role) {
  return function can(action: Action, resource: Resource): boolean {
    return PERMISSION_MAP[role]?.[resource]?.includes(action) ?? false
  }
}
