import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../store/auth'
import type { Role } from '../types'

export const homeFor = (role: Role) => (role === 'patient' ? '/patient' : role === 'doctor' ? '/doctor/schedule' : '/lab/bookings')

export function RequireRole({ role }: { role: Role }) {
  const user = useAuth((s) => s.user)
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname, role }} />
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />
  return <Outlet />
}
