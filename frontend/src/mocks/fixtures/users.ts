import type { CurrentUser } from '@/types'

export interface MockUser extends CurrentUser {
  password: string
}

export const MOCK_USERS: MockUser[] = [
  {
    id: 'u-1',
    name: 'João Silva',
    email: 'representante@bancalfa.com',
    password: 'password',
    role: 'representative',
    institutionId: 'inst-1',
  },
  {
    id: 'u-2',
    name: 'Maria Santos',
    email: 'rh@prefeitura.gov.br',
    password: 'password',
    role: 'hr_manager',
  },
  {
    id: 'u-3',
    name: 'Carlos Oliveira',
    email: 'servidor@prefeitura.gov.br',
    password: 'password',
    role: 'employee',
    employeeId: 'emp-1',
  },
  {
    id: 'u-4',
    name: 'Ana Costa',
    email: 'gestor@bancalfa.com',
    password: 'password',
    role: 'institution_manager',
    institutionId: 'inst-1',
  },
  {
    id: 'u-5',
    name: 'Admin Sistema',
    email: 'admin@webconsig.com',
    password: 'password',
    role: 'admin',
  },
]
