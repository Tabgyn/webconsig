import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { PageShell } from '@/components/page-shell'
import { Button } from '@/components/ui/button'

interface ReportType {
  type: string
  label: string
  description: string
}

const REPORT_TYPES: ReportType[] = [
  { type: 'consignments', label: 'Consignações', description: 'Todas as consignações registradas no período.' },
  { type: 'employees', label: 'Servidores', description: 'Lista de servidores com margem consignável.' },
  { type: 'deductions', label: 'Descontos', description: 'Extrato consolidado de descontos por competência.' },
]

export function ReportsPage() {
  const [exported, setExported] = useState<string | null>(null)

  const exportMutation = useMutation({
    mutationFn: (type: string) =>
      api.post<{ message: string }>('/reports/export', { type }),
    onSuccess: (_, type) => setExported(type),
  })

  return (
    <PageShell
      title="Relatórios"
      description="Exporte relatórios gerenciais do sistema."
    >
      <div className="space-y-3">
        {REPORT_TYPES.map((r) => (
          <div key={r.type} className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-sm font-medium text-slate-800">{r.label}</p>
              <p className="text-xs text-slate-500">{r.description}</p>
            </div>
            <div className="flex items-center gap-3">
              {exported === r.type && (
                <span className="text-xs text-green-600">Exportado!</span>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={exportMutation.isPending}
                onClick={() => exportMutation.mutate(r.type)}
              >
                Exportar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  )
}
