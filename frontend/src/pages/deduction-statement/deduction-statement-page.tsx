import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { api } from '@/lib/api'
import { formatCurrency, formatCompetence } from '@/lib/formatters'
import { PageShell } from '@/components/page-shell'
import { DataTable } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { DeductionEntry } from '@/types'

const col = createColumnHelper<DeductionEntry>()

const columns = [
  col.accessor('id', { header: 'Nº' }),
  col.accessor('consignmentId', { header: 'Consignação' }),
  col.accessor('employeeId', { header: 'Servidor' }),
  col.accessor('institutionId', { header: 'Entidade' }),
  col.accessor('amount', {
    header: 'Valor Desconto',
    cell: (info) => formatCurrency(info.getValue()),
  }),
  col.accessor('competence', {
    header: 'Competência',
    cell: (info) => formatCompetence(info.getValue()),
  }),
  col.accessor('status', {
    header: 'Status',
    cell: (info) => <StatusBadge status={info.getValue()} />,
    enableSorting: false,
  }),
]

function currentCompetence() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function DeductionStatementPage() {
  const [competence, setCompetence] = useState(currentCompetence())
  const [applied, setApplied] = useState(currentCompetence())

  const { data, isLoading } = useQuery({
    queryKey: ['deduction-statement', applied],
    queryFn: () =>
      api.get<{ data: DeductionEntry[] }>(`/deduction-statement?competence=${applied}`),
  })

  return (
    <PageShell
      title="Extrato de Descontos"
      description="Histórico de descontos processados na folha de pagamento."
    >
      <div className="flex items-end gap-3">
        <div>
          <Label htmlFor="competence" className="text-xs">Competência (AAAA-MM)</Label>
          <Input
            id="competence"
            type="month"
            value={competence}
            onChange={(e) => setCompetence(e.target.value)}
            className="mt-1 w-40"
          />
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setApplied(competence)}
        >
          Consultar
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchPlaceholder="Buscar por servidor, entidade..."
      />
    </PageShell>
  )
}
