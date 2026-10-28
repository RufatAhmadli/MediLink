import clsx from 'clsx'
import { ArrowRight, Eye, EyeOff, FlaskConical, Lock, Mail, RotateCcw, ShieldCheck, Sparkles, Stethoscope, UserRound, type LucideIcon } from 'lucide-react'
import { Fragment, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { Avatar, Button } from '../../components/ui'
import { t } from '../../i18n/strings'
import { homeFor } from '../../layouts/RequireRole'
import { useQuery } from '../../lib/useQuery'
import { getDemoAccounts, logIn } from '../../services/auth'
import { useAuth } from '../../store/auth'
import { resetDemoData } from '../../store/db'
import { toast } from '../../store/toast'
import type { Role, User } from '../../types'
import { FeatureTour, firstFeatureOf, useFeatureParam } from './FeatureTour'

const DEMO_HINTS: Record<string, string> = {
  'u-elshad': '58 · type 2 diabetes, hypertension',
  'u-aysel': '29 · pregnancy',
  'u-hasanova': 'Cardiologist · Baku Cardio Clinic',
  'u-aliyev': 'Endocrinologist · Ailə Medical Center',
  'u-huseynova': "Gynecologist · Sahil Women's Clinic",
  'u-nur': 'Narimanov · publishes the demo result',
  'u-caspian': 'Khatai',
  'u-merkez': 'Nizami',
}

const ROLES: { role: Role; icon: LucideIcon }[] = [
  { role: 'patient', icon: UserRound },
  { role: 'doctor', icon: Stethoscope },
  { role: 'lab', icon: FlaskConical },
]

export function Login() {
  const location = useLocation()
  const state = location.state as { from?: string; role?: Role } | null
  const [role, setRoleState] = useState<Role>(state?.role ?? 'patient')
  const { select: selectFeature } = useFeatureParam()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const setUser = useAuth((s) => s.setUser)
  const navigate = useNavigate()
  const { data: accounts } = useQuery(getDemoAccounts, [])

  // Picking a role also opens that role's first feature in the tour below.
  const setRole = (r: Role) => {
    setRoleState(r)
    selectFeature(firstFeatureOf(r))
  }

  const finish = (user: User, path?: string) => {
    setUser(user)
    toast(`Welcome, ${user.displayName}`)
    const from = state?.from?.startsWith(`/${user.role}`) ? state.from : homeFor(user.role)
    navigate(path ?? from, { replace: true })
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy('form')
    finish(await logIn(role, email))
  }

  const demo = (u: User, path?: string, key = u.id) => {
    setBusy(key)
    // Short pause so the click feels acknowledged.
    setTimeout(() => finish(u, path), 350)
  }

  const tryFeature = (userId: string, path: string) => {
    const user = accounts?.find((a) => a.id === userId)
    if (user) demo(user, path, `${userId}${path}`)
  }

  const demos = accounts?.filter((a) => a.role === role) ?? []
  const roleIndex = ROLES.findIndex((r) => r.role === role)

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute -right-40 -top-40 -z-10 size-[34rem] animate-blob rounded-full bg-teal-glow/25 blur-3xl" />
      <div className="absolute -left-40 top-64 -z-10 size-[28rem] animate-blob rounded-full bg-[#2F5DD1]/10 blur-3xl [animation-delay:-7s]" />

      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/">
          <Logo />
        </Link>
        <nav className="flex items-center gap-5 text-sm font-semibold">
          <Link to="/features" className="text-navy-700 hover:text-teal">
            {t.tour.pageTitle}
          </Link>
          <Link to="/signup" className="text-teal hover:underline">
            {t.auth.createAccount} →
          </Link>
        </nav>
      </header>

      {/* ---------------------------------------------------------- login card */}
      <section className="px-5 pb-14 pt-4 sm:px-8">
        <div className="mx-auto max-w-xl">
          <div className="animate-fade-up text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">{t.auth.welcomeBack}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{t.auth.logInTitle}</h1>
            <p className="mt-2 text-navy-500">{t.app.tagline}</p>
          </div>

          <div className="mt-8 animate-fade-up rounded-3xl border border-line/80 bg-white/90 p-5 shadow-lift backdrop-blur [animation-delay:80ms] sm:p-7">
            <div className="mb-2 text-sm font-medium text-navy-700">{t.auth.chooseRole}</div>
            <div className="relative grid grid-cols-3 gap-1 rounded-2xl bg-canvas p-1.5 ring-1 ring-line/80">
              <span
                className="absolute inset-y-1.5 rounded-xl bg-gradient-to-br from-[#0e8a7e] to-teal-dark shadow-glow transition-transform duration-300 ease-out"
                style={{ width: 'calc((100% - 1.25rem) / 3)', left: '0.375rem', transform: `translateX(calc(${roleIndex} * (100% + 0.25rem)))` }}
              />
              {ROLES.map(({ role: r, icon: Icon }) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={clsx(
                    'relative z-10 flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-center transition-colors duration-300',
                    role === r ? 'text-white' : 'text-navy-500 hover:text-navy',
                  )}
                >
                  <Icon className={clsx('size-5 transition-transform duration-300', role === r && 'scale-110')} />
                  <span className="text-sm font-semibold">{t.auth.roles[r]}</span>
                  <span className={clsx('hidden text-xs leading-tight sm:block', role === r ? 'text-white/80' : 'text-navy-300')}>{t.auth.roleHints[r]}</span>
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <IconInput icon={Mail} label={t.auth.email}>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={demos[0]?.email ?? 'you@example.az'}
                  className="w-full bg-transparent py-3 pr-3 text-sm outline-none placeholder:text-navy-300"
                />
              </IconInput>
              <IconInput
                icon={Lock}
                label={t.auth.password}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="rounded-lg p-1.5 text-navy-300 hover:bg-canvas hover:text-navy"
                    aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                }
              >
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-navy-300"
                />
              </IconInput>
              <Button type="submit" block size="lg" loading={busy === 'form'} className="group">
                {t.auth.logIn} as {t.auth.roles[role].toLowerCase()}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-navy-500">
                <ShieldCheck className="size-3.5 text-teal" /> {t.auth.secure}
              </p>
            </form>

            {role !== 'patient' && <p className="mt-4 animate-fade-in rounded-xl bg-canvas px-4 py-3 text-center text-sm text-navy-500">{t.auth.staffNote}</p>}

            <div className="mt-6">
              <div className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-navy-300">
                <span className="h-px flex-1 bg-line" />
                <Sparkles className="size-3.5 text-teal" /> {t.auth.or}
                <span className="h-px flex-1 bg-line" />
              </div>
              <div key={role} className="stagger grid gap-2">
                {demos.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => demo(u)}
                    disabled={!!busy}
                    className={clsx(
                      'group flex w-full items-center gap-3 rounded-2xl border bg-white px-3.5 py-3 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/50 hover:shadow-lift',
                      busy === u.id ? 'border-teal ring-2 ring-teal/30' : 'border-line/80',
                    )}
                  >
                    <Avatar name={u.displayName} size="sm" tone={u.role === 'patient' ? 'teal' : 'navy'} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">Demo: {u.displayName}</div>
                      <div className="truncate text-xs text-navy-500">{DEMO_HINTS[u.id]}</div>
                    </div>
                    <span className="flex size-8 items-center justify-center rounded-full bg-teal-soft text-teal transition-all group-hover:bg-teal group-hover:text-white">
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <InfoBand role={role} />

      <FeatureTour onTry={tryFeature} busy={busy} />

      <footer className="border-t border-line bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-navy-500 sm:px-8">
          <span>{t.app.fictional}</span>
          <button
            onClick={() => {
              resetDemoData()
              toast(t.app.resetDone, 'info')
            }}
            className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold hover:text-navy"
          >
            <RotateCcw className="size-3.5" /> {t.app.resetDemo}
          </button>
        </div>
      </footer>
    </div>
  )
}

function IconInput({ icon: Icon, label, trailing, children }: { icon: LucideIcon; label: string; trailing?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-navy-700">{label}</span>
      <span className="flex items-center gap-2.5 rounded-xl border border-line-strong bg-white pl-3.5 pr-1.5 transition-all focus-within:border-teal focus-within:ring-4 focus-within:ring-teal/15">
        <Icon className="size-4 shrink-0 text-navy-300" />
        {children}
        {trailing}
      </span>
    </label>
  )
}

/** Role-specific pitch shown under the login card. */
function InfoBand({ role }: { role: Role }) {
  const panel = t.auth.panels[role]
  return (
    <section className="px-5 sm:px-8">
      <div className="dot-grid relative isolate mx-auto max-w-7xl overflow-hidden rounded-3xl bg-navy px-6 py-10 text-white shadow-lift sm:px-10 lg:py-12">
        <div className="absolute -left-20 -top-24 -z-10 size-80 animate-blob rounded-full bg-teal/40 blur-3xl" />
        <div className="absolute -bottom-32 right-10 -z-10 size-96 animate-blob rounded-full bg-[#2F5DD1]/25 blur-3xl [animation-delay:-6s]" />
        <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div key={role} className="animate-fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-teal-glow ring-1 ring-white/15">
              <span className="size-1.5 rounded-full bg-teal-glow" /> {panel.eyebrow}
            </span>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              {panel.title} <span className="text-shimmer">{panel.highlight}</span>
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-white/75">{panel.text}</p>
            <EcosystemFlow role={role} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {t.auth.stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/[0.07] p-4 text-center ring-1 ring-white/10 backdrop-blur">
                <div className="text-4xl font-bold text-teal-glow">{s.value}</div>
                <div className="mt-1 text-sm text-white/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const FLOW: { role: Role; icon: LucideIcon; label: string }[] = [
  { role: 'lab', icon: FlaskConical, label: 'Lab publishes' },
  { role: 'patient', icon: UserRound, label: 'Patient shares' },
  { role: 'doctor', icon: Stethoscope, label: 'Doctor sees history' },
]

/** Where the selected role sits in the flow of one result. */
function EcosystemFlow({ role }: { role: Role }) {
  return (
    <div className="mt-6 flex max-w-xl items-center">
      {FLOW.map(({ role: r, icon: Icon, label }, i) => (
        <Fragment key={r}>
          {i > 0 && <span className="flow-line mx-2 h-0.5 min-w-4 flex-1 opacity-70 [filter:brightness(1.8)]" />}
          <span
            className={clsx(
              'inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-all duration-300 sm:text-sm',
              r === role ? 'bg-teal-glow text-navy shadow-glow ring-teal-glow' : 'bg-white/[0.06] text-white/70 ring-white/15',
            )}
          >
            <Icon className="size-4" /> <span className={clsx(r !== role && 'hidden sm:inline')}>{label}</span>
          </span>
        </Fragment>
      ))}
    </div>
  )
}
