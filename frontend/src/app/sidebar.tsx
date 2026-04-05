import { NavLink } from 'react-router'
import {
  Home, FileText, ArrowLeftRight, Calculator, Wallet,
  Receipt, TrendingUp, BarChart2, Users, Building2,
  UserCog, Shield, Settings,
} from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  to: string
  resource: string
  icon: React.ElementType
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Consignações',
    items: [
      { label: 'Consignações',    to: '/consignments',        resource: 'consignment',          icon: FileText },
      { label: 'Portabilidade',   to: '/portability',         resource: 'portability',          icon: ArrowLeftRight },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { label: 'Simulação',         to: '/simulation',          resource: 'simulation',           icon: Calculator },
      { label: 'Saldo Devedor',     to: '/outstanding-balance', resource: 'outstanding-balance',  icon: Wallet },
      { label: 'Extrato de Descontos', to: '/deduction-statement', resource: 'deduction-statement', icon: Receipt },
      { label: 'Ranking de Taxas',  to: '/rate-ranking',        resource: 'rate-ranking',         icon: TrendingUp },
    ],
  },
  {
    label: 'Relatórios',
    items: [
      { label: 'Relatórios', to: '/reports', resource: 'reports', icon: BarChart2 },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { label: 'Servidores', to: '/employees',    resource: 'employees',    icon: Users },
      { label: 'Entidades',  to: '/institutions', resource: 'institutions', icon: Building2 },
      { label: 'Usuários',   to: '/users',        resource: 'users',        icon: UserCog },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { label: 'Auditoria',      to: '/audit',     resource: 'audit',     icon: Shield },
      { label: 'Configurações',  to: '/settings',  resource: 'settings',  icon: Settings },
    ],
  },
]

export function Sidebar() {
  const { can } = usePermissions()

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col"
      style={{ backgroundColor: 'var(--sidebar-bg)' }}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-4"
        style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <FileText className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-wide">WEBCONSIG</p>
          <p className="text-[10px]" style={{ color: 'var(--sidebar-text)' }}>
            Sistema de Consignações
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {/* Home always visible */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors mb-2',
              isActive
                ? 'font-semibold text-white'
                : 'hover:text-white',
            )
          }
          style={({ isActive }) => ({
            backgroundColor: isActive ? 'var(--sidebar-bg-active)' : undefined,
            color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
          })}
        >
          <Home className="h-4 w-4 flex-shrink-0" />
          Início
        </NavLink>

        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => can('view', item.resource))
          if (visibleItems.length === 0) return null
          return (
            <div key={group.label} className="mb-4">
              <p className="px-3 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-widest"
                style={{ color: 'var(--sidebar-text)', opacity: 0.6 }}>
                {group.label}
              </p>
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                      isActive ? 'font-semibold' : 'hover:text-white',
                    )
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? 'var(--sidebar-bg-active)' : undefined,
                    color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                  })}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
