import clsx from 'clsx'
import { CalendarPlus, FlaskConical, Home, ShieldCheck, UserRound } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Avatar } from '../components/ui'
import { t } from '../i18n/strings'
import { useQuery } from '../lib/useQuery'
import { getAccessOverview } from '../services/consent'
import { useCurrentUser } from '../store/auth'

const tabs = [
  { to: '/patient', label: t.nav.patient.home, icon: Home, end: true },
  { to: '/patient/book', label: t.nav.patient.book, icon: CalendarPlus },
  { to: '/patient/results', label: t.nav.patient.results, icon: FlaskConical },
  { to: '/patient/access', label: t.nav.patient.access, icon: ShieldCheck, badge: true },
  { to: '/patient/profile', label: t.nav.patient.profile, icon: UserRound },
]

/** Mobile-first shell: a phone-width column with a bottom tab bar. */
export function PatientLayout() {
  const user = useCurrentUser()
  const { pathname } = useLocation()
  const { data: access } = useQuery(() => getAccessOverview(user.refId), [user.refId])
  const pending = access?.pending.length ?? 0

  return (
    <div className="min-h-screen bg-[#ECEAE4]">
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-canvas shadow-[0_0_0_1px_rgba(19,35,58,0.06)]">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line/70 bg-canvas/90 px-4 py-3 backdrop-blur">
          <Link to="/patient">
            <Logo />
          </Link>
          <Link to="/patient/profile" aria-label={t.nav.patient.profile}>
            <Avatar name={user.displayName} size="sm" />
          </Link>
        </header>
        <main key={pathname} className="flex-1 animate-fade-up px-4 pb-28 pt-5">
          <Outlet />
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <ul className="grid grid-cols-5">
            {tabs.map(({ to, label, icon: Icon, end, badge }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    clsx('relative flex flex-col items-center gap-1 px-1 pb-2.5 pt-2 text-xs font-medium', isActive ? 'text-teal' : 'text-navy-500')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={clsx('absolute inset-x-5 top-0 h-0.5 rounded-full', isActive ? 'bg-teal' : 'bg-transparent')} />
                      <span className="relative">
                        <Icon className="size-[22px]" strokeWidth={isActive ? 2.3 : 1.8} />
                        {badge && pending > 0 && (
                          <span className="absolute -right-2 -top-1 flex size-4 items-center justify-center rounded-full bg-high text-xs font-bold text-white">
                            {pending}
                          </span>
                        )}
                      </span>
                      <span className="text-center leading-tight">{label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
