import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/formatters'
import { PageShell } from '@/components/page-shell'
import { DataTable } from '@/components/data-table'
import type { AuditEntry, AuditAction, AuditResource } from '@/types'

const ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Criação',
  update: 'Atualização',
  delete: 'Exclusão',
  approve: 'Aprovação',
  reject: 'Rejeição',
  login: 'Login',
  logout: 'Logout',
}

const RESOURCE_LABELS: Record<AuditResource, string> = {
  consignment: 'Consignação',
  portability: 'Portabilidade',
  user: 'Usuário',
  institution: 'Entidade',
  representative: 'Representante',
  settings: 'Configurações',
  session: 'Sessão',
}

const col = createColumnHelper<AuditEntry>()

const columns = [
  col.accessor('timestamp', {
    header: 'Data/Hora',
    cell: (info) => formatDateTime(info.getValue()),
  }),
  col.accessor('userName', { header: 'Usuário' }),
  col.accessor('action', {
    header: 'Ação',
    cell: (info) => ACTION_LABELS[info.getValue()],
  }),
  col.accessor('resource', {
    header: 'Recurso',
    cell: (info) => RESOURCE_LABELS[info.getValue()],
  }),
  col.accessor('description', { header: 'Descrição', enableSorting: false }),
  col.accessor('ipAddress', { header: 'IP', enableSorting: false }),
]

export function AuditPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn: () => api.get<{ data: AuditEntry[] }>('/audit'),
  })

  return (
    <PageShell
      title="Auditoria"
      description="Histórico de ações realizadas no sistema."
    >
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchPlaceholder="Buscar por usuário, ação ou descrição..."
      />
    </PageShell>
  )
}
