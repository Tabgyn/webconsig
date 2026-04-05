import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { api } from '@/lib/api'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/formatters'
import { PageShell } from '@/components/page-shell'
import { DataTable } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import type { Portability } from '@/types'

const col = createColumnHelper<Portability>()

export function PortabilityPage() {
  const { can } = usePermissions()

  const { data, isLoading } = useQuery({
    queryKey: ['portability'],
    queryFn: () => api.get<{ data: Portability[] }>('/portability'),
  })

  const columns = [
    col.accessor('id', { header: 'Nº' }),
    col.accessor('consignmentId', { header: 'Consignação' }),
    col.accessor('originInstitutionId', { header: 'Entidade Origem' }),
    col.accessor('destinationInstitutionId', { header: 'Entidade Destino' }),
    col.accessor('requestedAt', {
      header: 'Solicitada em',
      cell: (info) => formatDate(info.getValue()),
    }),
    col.accessor('status', {
      header: 'Status',
      cell: (info) => <StatusBadge status={info.getValue()} />,
      enableSorting: false,
    }),
    ...(can('approve', 'portability') || can('reject', 'portability')
      ? [
          col.display({
            id: 'actions',
            header: 'Ações',
            cell: (info) =>
              info.row.original.status === 'requested' ? (
                <div className="flex gap-2">
                  {can('approve', 'portability') && (
                    <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50 h-7 text-xs">
                      Aprovar
                    </Button>
                  )}
                  {can('reject', 'portability') && (
                    <Button size="sm" variant="outline" className="text-red-700 border-red-300 hover:bg-red-50 h-7 text-xs">
                      Rejeitar
                    </Button>
                  )}
                </div>
              ) : null,
          }),
        ]
      : []),
  ]

  return (
    <PageShell
      title="Portabilidade"
      description="Solicitações de portabilidade de consignações entre entidades."
      action={
        can('create', 'portability') ? (
          <Button className="bg-blue-600 hover:bg-blue-700">+ Nova Portabilidade</Button>
        ) : undefined
      }
    >
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchPlaceholder="Buscar por consignação, entidade..."
      />
    </PageShell>
  )
}
