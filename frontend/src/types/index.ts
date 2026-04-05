export type Role =
  | 'admin'
  | 'hr_manager'
  | 'employee'
  | 'institution_manager'
  | 'representative'

export interface CurrentUser {
  id: string
  name: string
  email: string
  role: Role
  institutionId?: string // representative & institution_manager only
  employeeId?: string    // employee only
}

export type ConsignmentStatus = 'active' | 'pending' | 'cancelled' | 'finished'

export interface Consignment {
  id: string
  employeeId: string
  institutionId: string
  installmentValue: number
  installments: number
  installmentsRemaining: number
  interestRate: number       // % a.m.
  totalValue: number
  remainingBalance: number
  startDate: string          // ISO date string
  status: ConsignmentStatus
}

export interface Employee {
  id: string
  registration: string
  name: string
  cpf: string                // 11 digits, no punctuation
  orgId: string
  grossSalary: number
  availableMargin?: number   // only if org releases this info
}

export interface Institution {
  id: string
  name: string
  cnpj: string               // 14 digits, no punctuation
  isActive: boolean
}

export type PortabilityStatus = 'requested' | 'approved' | 'rejected'

export interface Portability {
  id: string
  consignmentId: string
  originInstitutionId: string
  destinationInstitutionId: string
  requestedAt: string        // ISO date string
  status: PortabilityStatus
}

export type DeductionStatus = 'processed' | 'pending' | 'rejected'

export interface DeductionEntry {
  id: string
  consignmentId: string
  employeeId: string
  institutionId: string
  amount: number
  competence: string         // "YYYY-MM"
  status: DeductionStatus
}

export interface RateRankingEntry {
  rank: number
  institutionId: string
  institutionName: string
  interestRate: number       // % a.m.
}

export interface DashboardStats {
  activeConsignments: number
  pendingApproval: number
  activePortabilities: number
  totalConsignedValue: number
  totalEmployees: number
  employeesWithConsignments: number
}

export type AlertType = 'warning' | 'info' | 'error'

export interface Alert {
  id: string
  type: AlertType
  message: string
  date: string               // ISO date string
}

export interface SimulationResult {
  releasedValue: number
  totalValue: number
  financingCost: number
}
