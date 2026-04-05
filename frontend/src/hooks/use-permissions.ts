import { useAuth } from './use-auth'
import { buildCan } from '@/lib/permissions'

export function usePermissions() {
  const { user } = useAuth()
  const can = user ? buildCan(user.role) : () => false
  return { can }
}
