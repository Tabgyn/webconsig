import type { ReactNode } from 'react'

interface PageShellProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}

export function PageShell({ title, description, action, children }: PageShellProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  )
}
