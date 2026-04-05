import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { api } from '@/lib/api'
import { formatCurrency, formatCPF } from '@/lib/formatters'
import { PageShell } from '@/components/page-shell'
import { DataTable } from '@/components/data-table'
import type { Employee } from '@/types'

const col = createColumnHelper<Employee>()

const columns = [
  col.accessor('registration', { header: 'Matrícula' }),
  col.accessor('name', { header: 'Nome' }),
  col.accessor('cpf', {
    header: 'CPF',
    cell: (info) => formatCPF(info.getValue()),
  }),
  col.accessor('grossSalary', {
    header: 'Salário Bruto',
    cell: (info) => formatCurrency(info.getValue()),
  }),
  col.accessor('availableMargin', {
    header: 'Margem Disponível',
    cell: (info) => {
      const v = info.getValue()
      return v !== undefined ? formatCurrency(v) : '—'
    },
  }),
]

export function EmployeesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get<{ data: Employee[] }>('/employees'),
  })

  return (
    <PageShell
      title="Servidores"
      description="Lista de servidores cadastrados no sistema."
    >
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchPlaceholder="Buscar por matrícula ou nome..."
      />
    </PageShell>
  )
}
