import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Alert } from '@/types'

function alertBg(type: Alert['type']) {
  return {
    warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
    info: 'bg-blue-50 border-blue-400 text-blue-800',
    error: 'bg-red-50 border-red-400 text-red-800',
  }[type]
}

export function AlertsPanel() {
  const { data } = useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: () => api.get<{ data: Alert[] }>('/dashboard/alerts'),
  })

  const alerts = data?.data ?? []

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-slate-800">Avisos</h3>
      {alerts.length === 0 ? (
        <p className="text-xs text-slate-400">Nenhum aviso no momento.</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={`rounded border-l-2 px-3 py-2 text-xs ${alertBg(alert.type)}`}
            >
              {alert.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
