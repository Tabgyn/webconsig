import { useAuth } from './use-auth'
import type { CurrentUser } from '@/types'

export function useCurrentUser(): CurrentUser {
  const { user } = useAuth()
  if (!user) throw new Error('useCurrentUser called outside an authenticated route')
  return user
}
