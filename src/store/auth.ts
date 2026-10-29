import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  user: User | null
  setUser: (user: User) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: 'healthtrail-auth', storage: createJSONStorage(() => localStorage) },
  ),
)

/** The logged-in user inside a role-protected route. */
export function useCurrentUser(): User {
  const user = useAuth((s) => s.user)
  if (!user) throw new Error('useCurrentUser used outside a protected route')
  return user
}
