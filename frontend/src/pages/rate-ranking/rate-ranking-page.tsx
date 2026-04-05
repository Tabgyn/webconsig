import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { api } from '@/lib/api'
import { formatPercentage } from '@/lib/formatters'
import { PageShell } from '@/components/page-shell'
import { DataTable } from '@/components/data-table'
import type { RateRankingEntry } from '@/types'

const col = createColumnHelper<RateRankingEntry>()

const columns = [
  col.accessor('rank', {
    header: '#',
    cell: (info) => (
      <span className={info.getValue() === 1 ? 'font-bold text-green-600' : ''}>
        {info.getValue()}º
      </span>
    ),
  }),
  col.accessor('institutionName', { header: 'Entidade' }),
  col.accessor('interestRate', {
    header: 'Taxa a.m.',
    cell: (info) => (
      <span className={info.getValue() <= 1.8 ? 'font-semibold text-green-600' : ''}>
        {formatPercentage(info.getValue())}
      </span>
    ),
  }),
]

export function RateRankingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['rate-ranking'],
    queryFn: () => api.get<{ data: RateRankingEntry[] }>('/rate-ranking'),
  })

  return (
    <PageShell
      title="Ranking de Taxas"
      description="Entidades conveniadas ordenadas da menor para a maior taxa de juros mensal."
    >
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchPlaceholder="Buscar entidade..."
      />
    </PageShell>
  )
}
