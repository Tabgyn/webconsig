import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { api } from '@/lib/api'
import { usePermissions } from '@/hooks/use-permissions'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/formatters'
import { PageShell } from '@/components/page-shell'
import { DataTable } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import type { Consignment } from '@/types'

const col = createColumnHelper<Consignment>()

export function ConsignmentsPage() {
  const { can } = usePermissions()

  const { data, isLoading } = useQuery({
    queryKey: ['consignments'],
    queryFn: () => api.get<{ data: Consignment[] }>('/consignments'),
  })

  const columns = [
    col.accessor('id', { header: 'Nº' }),
    col.accessor('employeeId', { header: 'Matrícula' }),
    col.accessor('institutionId', { header: 'Entidade' }),
    col.accessor('installmentValue', {
      header: 'Parcela (R$)',
      cell: (info) => formatCurrency(info.getValue()),
    }),
    col.accessor('installments', { header: 'Prazo' }),
    col.accessor('installmentsRemaining', { header: 'Saldo (parc.)' }),
    col.accessor('interestRate', {
      header: 'Taxa a.m.',
      cell: (info) => formatPercentage(info.getValue()),
    }),
    col.accessor('remainingBalance', {
      header: 'Saldo Devedor',
      cell: (info) => formatCurrency(info.getValue()),
    }),
    col.accessor('startDate', {
      header: 'Início',
      cell: (info) => formatDate(info.getValue()),
    }),
    col.accessor('status', {
      header: 'Status',
      cell: (info) => <StatusBadge status={info.getValue()} />,
      enableSorting: false,
    }),
    ...(can('approve', 'consignment') || can('cancel', 'consignment')
      ? [
          col.display({
            id: 'actions',
            header: 'Ações',
            cell: (info) => (
              <div className="flex gap-2">
                {can('approve', 'consignment') && info.row.original.status === 'pending' && (
                  <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50 h-7 text-xs">
                    Aprovar
                  </Button>
                )}
                {can('reject', 'consignment') && info.row.original.status === 'pending' && (
                  <Button size="sm" variant="outline" className="text-red-700 border-red-300 hover:bg-red-50 h-7 text-xs">
                    Rejeitar
                  </Button>
                )}
                {can('cancel', 'consignment') && info.row.original.status === 'active' && (
                  <Button size="sm" variant="outline" className="text-slate-600 h-7 text-xs">
                    Cancelar
                  </Button>
                )}
              </div>
            ),
          }),
        ]
      : []),
  ]

  return (
    <PageShell
      title="Consignações"
      description="Lista de todas as consignações registradas no sistema."
      action={
        can('create', 'consignment') ? (
          <Button className="bg-blue-600 hover:bg-blue-700">+ Nova Consignação</Button>
        ) : undefined
      }
    >
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchPlaceholder="Buscar por matrícula, entidade..."
      />
    </PageShell>
  )
}
