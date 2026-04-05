import type { Employee } from '@/types'

export const EMPLOYEES: Employee[] = [
  { id: 'emp-1', registration: '001234', name: 'Carlos Oliveira', cpf: '12345678901', orgId: 'org-1', grossSalary: 4500.0, availableMargin: 900.0 },
  { id: 'emp-2', registration: '001891', name: 'Ana Paula Ferreira', cpf: '23456789012', orgId: 'org-1', grossSalary: 6000.0, availableMargin: 1200.0 },
  { id: 'emp-3', registration: '002203', name: 'Maria Santos', cpf: '34567890123', orgId: 'org-1', grossSalary: 3800.0, availableMargin: 380.0 },
  { id: 'emp-4', registration: '003410', name: 'Robson Alves', cpf: '45678901234', orgId: 'org-2', grossSalary: 5200.0 },
  { id: 'emp-5', registration: '004122', name: 'Fernanda Lima', cpf: '56789012345', orgId: 'org-2', grossSalary: 7100.0, availableMargin: 1420.0 },
]
