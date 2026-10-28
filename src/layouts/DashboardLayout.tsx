import clsx from 'clsx'
import { LogOut, RotateCcw, type LucideIcon } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Avatar } from '../components/ui'
import { t } from '../i18n/strings'
import { useAuth } from '../store/auth'
import { resetDemoData } from '../store/db'
import { toast } from '../store/toast'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  badge?: number
}

/** Desktop shell for doctors and lab staff: dark left sidebar, wide content area. */
export function DashboardLayout({ items, name, subtitle }: { items: NavItem[]; name: string; subtitle: string }) {
  const logout = useAuth((s) => s.logout)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const doLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className="relative isolate flex flex-col overflow-hidden bg-gradient-to-b from-navy to-[#0d1a2c] text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0">
        <div className="pointer-events-none absolute -left-20 top-1/3 -z-10 size-64 animate-blob rounded-full bg-teal/25 blur-3xl" />
        <div className="px-5 py-4 lg:py-6">
          <Logo dark />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {items.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-white/10 text-teal-glow' : 'text-white/70 hover:bg-white/5 hover:text-white',
                )
              }
            >
              <Icon className="size-[18px]" />
              <span className="whitespace-nowrap">{label}</span>
              {!!badge && <span className="ml-auto rounded-full bg-teal-glow px-2 py-0.5 text-xs font-bold text-navy">{badge}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 p-4 lg:block">
          <div className="flex items-center gap-3">
            <Avatar name={name} size="sm" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{name}</div>
              <div className="truncate text-xs text-white/60">{subtitle}</div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={doLogout}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15"
            >
              <LogOut className="size-3.5" /> {t.app.logOut}
            </button>
            <button
              onClick={() => {
                resetDemoData()
                toast(t.app.resetDone, 'info')
              }}
              title={t.app.resetDemo}
              aria-label={t.app.resetDemo}
              className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/15"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b border-line bg-white px-5 py-3 lg:hidden">
          <div className="text-sm">
            <span className="font-semibold">{name}</span> <span className="text-navy-500">· {subtitle}</span>
          </div>
          <button onClick={doLogout} className="flex items-center gap-1.5 text-sm font-semibold text-teal">
            <LogOut className="size-4" /> {t.app.logOut}
          </button>
        </div>
        <main key={pathname} className="mx-auto max-w-6xl animate-fade-up px-5 py-6 lg:px-10 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
