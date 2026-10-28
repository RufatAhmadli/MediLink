import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '../../lib/useQuery'
import { getDemoAccounts } from '../../services/auth'
import { useAuth } from '../../store/auth'
import { toast } from '../../store/toast'
import type { User } from '../../types'

/** Logs in with a demo account and opens a screen — used by "Try it" buttons. */
export function useDemoLogin() {
  const [busy, setBusy] = useState<string | null>(null)
  const setUser = useAuth((s) => s.setUser)
  const navigate = useNavigate()
  const { data: accounts } = useQuery(getDemoAccounts, [])

  const loginAs = (user: User, path: string, key = user.id) => {
    setBusy(key)
    // Short pause so the click feels acknowledged.
    setTimeout(() => {
      setUser(user)
      toast(`Welcome, ${user.displayName}`)
      navigate(path, { replace: true })
    }, 350)
  }

  const tryFeature = (userId: string, path: string) => {
    const user = accounts?.find((a) => a.id === userId)
    if (user) loginAs(user, path, `${userId}${path}`)
  }

  return { accounts, busy, setBusy, loginAs, tryFeature }
}
