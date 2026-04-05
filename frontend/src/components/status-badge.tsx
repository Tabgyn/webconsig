import { Badge } from '@/components/ui/badge'
import type { ConsignmentStatus, PortabilityStatus, DeductionStatus } from '@/types'

type Status = ConsignmentStatus | PortabilityStatus | DeductionStatus

const STATUS_CONFIG: Record<Status, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  active:    { label: 'Ativo',       variant: 'default',     className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  pending:   { label: 'Pendente',    variant: 'secondary',   className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  cancelled: { label: 'Cancelado',   variant: 'destructive', className: '' },
  finished:  { label: 'Encerrado',   variant: 'outline',     className: '' },
  requested: { label: 'Solicitada',  variant: 'secondary',   className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  approved:  { label: 'Aprovada',    variant: 'default',     className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  rejected:  { label: 'Rejeitada',   variant: 'destructive', className: '' },
  processed: { label: 'Processado',  variant: 'default',     className: 'bg-green-100 text-green-800 hover:bg-green-100' },
}

export function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  )
}
