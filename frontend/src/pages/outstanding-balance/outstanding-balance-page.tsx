import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { PageShell } from '@/components/page-shell'
import { DataTable } from '@/components/data-table'

interface OutstandingBalanceRow {
  consignmentId: string
  employeeId: string
  institutionId: string
  remainingBalance: number
  requestedAt: string
}

const col = createColumnHelper<OutstandingBalanceRow>()

const columns = [
  col.accessor('consignmentId', { header: 'Consignação' }),
  col.accessor('employeeId', { header: 'Servidor' }),
  col.accessor('institutionId', { header: 'Entidade' }),
  col.accessor('remainingBalance', {
    header: 'Saldo Devedor',
    cell: (info) => formatCurrency(info.getValue()),
  }),
  col.accessor('requestedAt', {
    header: 'Data',
    cell: (info) => formatDate(info.getValue()),
  }),
]

export function OutstandingBalancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['outstanding-balance'],
    queryFn: () => api.get<{ data: OutstandingBalanceRow[] }>('/outstanding-balance'),
  })

  return (
    <PageShell
      title="Saldo Devedor"
      description="Saldo devedor das consignações ativas."
    >
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchPlaceholder="Buscar por consignação, servidor..."
      />
    </PageShell>
  )
}
