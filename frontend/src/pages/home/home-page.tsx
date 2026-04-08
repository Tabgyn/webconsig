import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { api } from '@/lib/api'
import { usePermissions } from '@/hooks/use-permissions'
import { useCurrentUser } from '@/hooks/use-current-user'
import { formatCurrency } from '@/lib/formatters'
import { KpiCard } from './kpi-card'
import { AlertsPanel } from './alerts-panel'
import { DataTable } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import type { Consignment, DashboardStats } from '@/types'

const col = createColumnHelper<Consignment>()

const recentColumns = [
  col.accessor('id', { header: 'Nº', enableSorting: false }),
  col.accessor('employeeId', { header: 'Servidor' }),
  col.accessor('installmentValue', {
    header: 'Parcela',
    cell: (info) => formatCurrency(info.getValue()),
  }),
  col.accessor('status', {
    header: 'Status',
    cell: (info) => <StatusBadge status={info.getValue()} />,
    enableSorting: false,
  }),
]

export function HomePage() {
  const { can } = usePermissions()
  const user = useCurrentUser()
  const navigate = useNavigate()

  const employeeId = user.role === 'employee' ? user.employeeId : undefined
  const institutionId = user.role === 'institution_manager' ? user.institutionId : undefined

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats', employeeId, institutionId],
    queryFn: () => {
      if (employeeId) return api.get<DashboardStats>(`/dashboard/stats?employeeId=${employeeId}`)
      if (institutionId) return api.get<DashboardStats>(`/dashboard/stats?institutionId=${institutionId}`)
      return api.get<DashboardStats>('/dashboard/stats')
    },
  })

  const { data: consignmentsResponse } = useQuery({
    queryKey: ['consignments', employeeId, institutionId],
    queryFn: () => {
      const path = employeeId
        ? `/consignments?employeeId=${employeeId}`
        : institutionId
        ? `/consignments?institutionId=${institutionId}`
        : '/consignments'
      return api.get<{ data: Consignment[] }>(path)
    },
  })

  const recentConsignments = (consignmentsResponse?.data ?? []).slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Bom dia, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {user.role === 'employee' ? (
          <>
            <KpiCard
              label="Consignações Ativas"
              value={stats?.myActiveConsignments ?? '—'}
              accentColor="#2563eb"
            />
            <KpiCard
              label="Próxima Parcela"
              value={stats?.myNextDeduction !== undefined ? formatCurrency(stats.myNextDeduction) : '—'}
              accentColor="#f59e0b"
            />
            <KpiCard
              label="Saldo Devedor Total"
              value={stats?.myTotalDebt !== undefined ? formatCurrency(stats.myTotalDebt) : '—'}
              accentColor="#dc2626"
            />
          </>
        ) : (
          <>
            <KpiCard
              label="Consignações Ativas"
              value={stats?.activeConsignments ?? '—'}
              accentColor="#2563eb"
            />
            {can('approve', 'consignment') && (
              <KpiCard
                label="Pendentes de Aprovação"
                value={stats?.pendingApproval ?? '—'}
                trend={stats?.pendingApproval ? 'Requer atenção' : undefined}
                accentColor="#f59e0b"
              />
            )}
            {can('view', 'portability') && (
              <KpiCard
                label="Portabilidades"
                value={stats?.activePortabilities ?? '—'}
                trend="Em andamento"
                accentColor="#22c55e"
              />
            )}
            <KpiCard
              label="Valor Total Consignado"
              value={stats ? formatCurrency(stats.totalConsignedValue) : '—'}
              accentColor="#dc2626"
            />
            {can('view', 'employees') && (
              <KpiCard
                label="Total de Servidores"
                value={stats?.totalEmployees ?? '—'}
                accentColor="#0ea5e9"
              />
            )}
            {can('view', 'employees') && (
              <KpiCard
                label="Servidores com Consignação"
                value={stats?.employeesWithConsignments ?? '—'}
                accentColor="#8b5cf6"
              />
            )}
            {stats?.institutionActiveRepresentatives !== undefined && (
              <KpiCard
                label="Representantes Ativos"
                value={stats.institutionActiveRepresentatives}
                accentColor="#0891b2"
              />
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent consignments */}
        <div className="lg:col-span-2 rounded-lg border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Consignações Recentes</h3>
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={() => navigate('/consignments')}
            >
              Ver todas →
            </button>
          </div>
          <DataTable columns={recentColumns} data={recentConsignments} />
        </div>

        {/* Right column: quick actions + alerts */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-slate-800">Ações Rápidas</h3>
            <div className="space-y-2">
              {can('create', 'consignment') && (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate('/consignments')}
                >
                  + Nova Consignação
                </Button>
              )}
              {can('simulate', 'simulation') && (
                <Button variant="outline" className="w-full" onClick={() => navigate('/simulation')}>
                  Simular Empréstimo
                </Button>
              )}
              {can('request', 'outstanding-balance') && (
                <Button variant="outline" className="w-full" onClick={() => navigate('/outstanding-balance')}>
                  Solicitar Saldo Devedor
                </Button>
              )}
              {can('export', 'deduction-statement') && (
                <Button variant="outline" className="w-full" onClick={() => navigate('/deduction-statement')}>
                  Gerar Extrato
                </Button>
              )}
              {can('view', 'users') && (
                <Button variant="outline" className="w-full" onClick={() => navigate('/users')}>
                  Gerenciar Usuários
                </Button>
              )}
              {can('view', 'audit') && (
                <Button variant="outline" className="w-full" onClick={() => navigate('/audit')}>
                  Auditoria do Sistema
                </Button>
              )}
            </div>
          </div>

          <AlertsPanel />
        </div>
      </div>
    </div>
  )
}
