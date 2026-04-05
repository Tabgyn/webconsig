import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string | number
  trend?: string
  trendPositive?: boolean
  accentColor?: string
}

export function KpiCard({ label, value, trend, trendPositive, accentColor = '#2563eb' }: KpiCardProps) {
  return (
    <div
      className="rounded-lg border bg-white p-4 shadow-sm"
      style={{ borderLeftWidth: 3, borderLeftColor: accentColor }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
      {trend && (
        <p className={cn('mt-1 text-xs', trendPositive ? 'text-green-600' : 'text-slate-400')}>
          {trend}
        </p>
      )}
    </div>
  )
}
