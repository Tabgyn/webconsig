import { LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useAuth } from '@/hooks/use-auth'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDate } from '@/lib/formatters'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  hr_manager: 'Gestor de RH',
  employee: 'Servidor',
  institution_manager: 'Gestor de Entidade',
  representative: 'Representante',
}

export function Header() {
  const user = useCurrentUser()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const today = formatDate(new Date().toISOString())

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="fixed top-0 left-60 right-0 z-40 flex h-16 items-center justify-between border-b bg-white px-6">
      <div>
        <p className="text-sm font-semibold text-slate-800">
          Bom dia, {user.name.split(' ')[0]}
        </p>
        <p className="text-xs text-slate-400">
          {ROLE_LABELS[user.role]} · {today}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem className="gap-2 text-slate-600 cursor-default" disabled>
            <User className="h-4 w-4" />
            {user.email}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-red-600 cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
