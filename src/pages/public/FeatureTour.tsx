import clsx from 'clsx'
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  BadgeCheck,
  BellRing,
  CalendarCheck2,
  CalendarDays,
  Check,
  ClipboardList,
  FileText,
  FlaskConical,
  Inbox,
  LineChart,
  MessageSquareHeart,
  Settings,
  ShieldCheck,
  Stethoscope,
  Upload,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LogoMark } from '../../components/Logo'
import { Button } from '../../components/ui'
import { t } from '../../i18n/strings'
import type { Role } from '../../types'
import {
  BookingWidget,
  ConsentWidget,
  FeedbackWidget,
  FollowUpWidget,
  InboxWidget,
  MappingWidget,
  OrdersWidget,
  PublishWidget,
  QrWidget,
  ResultsWidget,
  ScheduleWidget,
  SummariesWidget,
  TimelineWidget,
} from './FeatureWidgets'

type FeatureKey = keyof typeof t.tour.features

interface Feature {
  key: FeatureKey
  role: Role
  icon: LucideIcon
  try: { userId: string; name: string; path: string }
  visual: () => ReactNode
}

const ELSHAD = { userId: 'u-elshad', name: 'Elshad' }
const AYSEL = { userId: 'u-aysel', name: 'Aysel' }
const HASANOVA = { userId: 'u-hasanova', name: 'Dr. Hasanova' }
const ALIYEV = { userId: 'u-aliyev', name: 'Dr. Aliyev' }
const NUR = { userId: 'u-nur', name: 'Nur Lab' }

const FEATURES: Feature[] = [
  {
    key: 'booking',
    role: 'patient',
    icon: CalendarCheck2,
    try: { ...ELSHAD, path: '/patient/book' },
    visual: () => (
      <Phone title="Book" step="Choose a time">
        <BookingWidget />
        <StepBar step={2} />
      </Phone>
    ),
  },
  {
    key: 'timeline',
    role: 'patient',
    icon: LineChart,
    try: { ...ELSHAD, path: '/patient/timeline?test=4548-4' },
    visual: () => (
      <Phone title="Timeline" step="HbA1c · 7 results from 3 labs">
        <TimelineWidget />
      </Phone>
    ),
  },
  {
    key: 'results',
    role: 'patient',
    icon: BadgeCheck,
    try: { ...ELSHAD, path: '/patient/results' },
    visual: () => (
      <Phone title="Results" step="25 Aug 2026 · Ordered by Dr. Rauf Aliyev">
        <ResultsWidget />
      </Phone>
    ),
  },
  {
    key: 'consent',
    role: 'patient',
    icon: ShieldCheck,
    try: { ...ELSHAD, path: '/patient/access' },
    visual: () => (
      <Phone title="Records access" step="You decide who sees your records">
        <ConsentWidget />
        <div className="mt-4 rounded-2xl border border-line bg-white p-3">
          <QrWidget />
        </div>
      </Phone>
    ),
  },
  {
    key: 'followUp',
    role: 'patient',
    icon: Stethoscope,
    try: { ...AYSEL, path: '/patient' },
    visual: () => (
      <Phone title="Home" step="Good morning, Aysel">
        <FollowUpWidget />
        <div className="mt-3">
          <OrdersWidget />
        </div>
      </Phone>
    ),
  },
  {
    key: 'schedule',
    role: 'doctor',
    icon: CalendarDays,
    try: { ...HASANOVA, path: '/doctor/schedule' },
    visual: () => (
      <Browser role="doctor" active={0} title="Schedule" url={t.tour.features.schedule.url}>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {[
            ['Today', '3', 'text-navy'],
            ['Requests', '1', 'text-low'],
            ['New results', '1', 'text-teal'],
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-xl border border-line bg-white p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-navy-300">{label}</div>
              <div className={clsx('text-2xl font-bold', color)}>{value}</div>
            </div>
          ))}
        </div>
        <ScheduleWidget />
      </Browser>
    ),
  },
  {
    key: 'record',
    role: 'doctor',
    icon: Users,
    try: { ...ALIYEV, path: '/doctor/patients/pt-elshad' },
    visual: () => (
      <Browser role="doctor" active={2} title="Patient record" url={t.tour.features.record.url}>
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">EM</span>
          <div className="min-w-0 flex-1">
            <div className="font-bold">Elshad Mammadov</div>
            <div className="text-xs text-navy-500">58 y · Male · ID MDL-1043-7720</div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-soft px-2.5 py-0.5 text-xs font-semibold text-teal-dark">
            <ShieldCheck className="size-3.5" /> All records · until revoked
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ResultsWidget />
          <SummariesWidget />
        </div>
      </Browser>
    ),
  },
  {
    key: 'inbox',
    role: 'doctor',
    icon: BellRing,
    try: { ...HASANOVA, path: '/doctor/inbox' },
    visual: () => (
      <Browser role="doctor" active={3} title="Results inbox" url={t.tour.features.inbox.url}>
        <InboxWidget />
        <div className="mt-3">
          <ResultsWidget />
        </div>
      </Browser>
    ),
  },
  {
    key: 'feedback',
    role: 'doctor',
    icon: MessageSquareHeart,
    try: { ...HASANOVA, path: '/doctor/feedback' },
    visual: () => (
      <Browser role="doctor" active={4} title="Feedback" url={t.tour.features.feedback.url}>
        <FeedbackWidget />
        <div className="mt-4 space-y-2">
          {['Explained my results from three labs on one chart.', 'Very attentive, explained the ECG step by step.'].map((c) => (
            <div key={c} className="rounded-xl bg-canvas px-3 py-2.5 text-sm">
              <span className="text-amber-500">★★★★★</span> “{c}”
            </div>
          ))}
        </div>
      </Browser>
    ),
  },
  {
    key: 'orders',
    role: 'lab',
    icon: ClipboardList,
    try: { ...NUR, path: '/lab/orders' },
    visual: () => (
      <Browser role="lab" active={1} title="Orders" url={t.tour.features.orders.url}>
        <OrdersWidget />
        <div className="mt-3 rounded-xl bg-canvas p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">Gunay Aliyeva</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-navy-500 ring-1 ring-line">Self-booked</span>
          </div>
          <div className="mt-1 text-xs text-navy-500">Complete blood count, Vitamin D · Today 09:20</div>
        </div>
      </Browser>
    ),
  },
  {
    key: 'publish',
    role: 'lab',
    icon: Upload,
    try: { ...NUR, path: '/lab/publish' },
    visual: () => (
      <Browser role="lab" active={2} title="Publish result" url={t.tour.features.publish.url}>
        <div className="mb-3 text-sm">
          <b>Elshad Mammadov</b> <span className="text-navy-500">· Doctor order · Dr. Leyla Hasanova</span>
        </div>
        <PublishWidget />
      </Browser>
    ),
  },
  {
    key: 'mapping',
    role: 'lab',
    icon: ArrowRightLeft,
    try: { ...NUR, path: '/lab/mapping' },
    visual: () => (
      <Browser role="lab" active={4} title="Format mapping" url={t.tour.features.mapping.url}>
        <MappingWidget />
      </Browser>
    ),
  },
]

const ROLE_ICONS: Record<Role, LucideIcon> = { patient: UserRound, doctor: Stethoscope, lab: FlaskConical }
const ROLE_TONE: Record<Role, string> = {
  patient: 'bg-teal-soft text-teal-dark',
  doctor: 'bg-blue-50 text-blue-700',
  lab: 'bg-purple-50 text-purple-700',
}

export const firstFeatureOf = (role: Role) => FEATURES.find((f) => f.role === role)!.key

/** The selected feature lives in the URL (?feature=…) so every tab has its own link. */
export function useFeatureParam() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('feature')
  const current = FEATURES.find((f) => f.key === raw) ?? FEATURES[0]
  const select = (key: FeatureKey) => setParams({ feature: key }, { replace: true, preventScrollReset: true })
  return { current, select }
}

export function FeatureTour({ onTry, busy, heading = true }: { onTry: (userId: string, path: string) => void; busy: string | null; heading?: boolean }) {
  const { current, select } = useFeatureParam()
  const index = FEATURES.indexOf(current)
  const copy = t.tour.features[current.key]
  const roleFeatures = FEATURES.filter((f) => f.role === current.role)
  const go = (delta: number) => select(FEATURES[(index + delta + FEATURES.length) % FEATURES.length].key)

  return (
    <section className={clsx('mx-auto max-w-7xl px-5 sm:px-8', heading ? 'py-14' : 'pb-10 pt-2')}>
      {heading && (
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal">{t.tour.eyebrow}</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{t.tour.title}</h2>
          <p className="mt-2 text-navy-500">{t.tour.subtitle}</p>
        </div>
      )}

      {/* Level 1: role tabs */}
      <div role="tablist" aria-label="Role" className="mx-auto mt-6 grid max-w-2xl grid-cols-3 gap-2 rounded-2xl bg-white p-1.5 shadow-card ring-1 ring-line/80">
        {(['patient', 'doctor', 'lab'] as Role[]).map((r) => {
          const Icon = ROLE_ICONS[r]
          const active = current.role === r
          return (
            <button
              key={r}
              role="tab"
              aria-selected={active}
              onClick={() => select(firstFeatureOf(r))}
              className={clsx(
                'flex items-center justify-center gap-2 rounded-xl px-3 py-3 font-semibold transition-all duration-300',
                active ? 'bg-navy text-white shadow-lift' : 'text-navy-500 hover:bg-canvas hover:text-navy',
              )}
            >
              <Icon className="size-5" />
              {t.auth.roles[r]}
              <span className={clsx('rounded-full px-2 py-0.5 text-xs', active ? 'bg-white/15' : 'bg-canvas')}>
                {FEATURES.filter((f) => f.role === r).length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Level 2: feature tabs */}
      <div role="tablist" aria-label="Feature" className="mt-4 flex justify-center">
        <div key={current.role} className="stagger flex max-w-full gap-2 overflow-x-auto px-1 pb-2">
          {roleFeatures.map((f) => {
            const Icon = f.icon
            const active = f.key === current.key
            return (
              <button
                key={f.key}
                role="tab"
                aria-selected={active}
                onClick={() => select(f.key)}
                className={clsx(
                  'flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
                  active ? 'bg-teal text-white shadow-glow' : 'bg-white text-navy-700 shadow-card ring-1 ring-line hover:-translate-y-0.5 hover:text-teal',
                )}
              >
                <Icon className="size-4" />
                {t.tour.features[f.key].tab}
              </button>
            )
          })}
        </div>
      </div>

      {/* Panel */}
      <div
        role="tabpanel"
        className="relative isolate mt-6 overflow-hidden rounded-[2rem] border border-line/80 bg-gradient-to-br from-white via-white to-teal-soft/70 p-6 shadow-lift sm:p-10"
      >
        <div className="absolute -right-24 -top-24 -z-10 size-96 animate-blob rounded-full bg-teal-glow/25 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 -z-10 size-72 animate-blob rounded-full bg-[#2F5DD1]/10 blur-3xl [animation-delay:-5s]" />

        <div key={current.key} className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="animate-fade-up">
            <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold', ROLE_TONE[current.role])}>
              <current.icon className="size-4" /> {t.auth.roles[current.role]} · {copy.tab}
            </span>
            <h3 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-[2.6rem]">{copy.title}</h3>
            <p className="mt-3 text-lg leading-relaxed text-navy-500">{copy.lead}</p>
            <ul className="mt-6 space-y-3">
              {copy.points.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-teal text-white">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <span className="font-medium">{p}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" loading={busy === `${current.try.userId}${current.try.path}`} disabled={!!busy} onClick={() => onTry(current.try.userId, current.try.path)}>
                {t.showcase.tryAs(current.try.name)} <ArrowRight className="size-4" />
              </Button>
              <div className="flex items-center gap-2">
                <button onClick={() => go(-1)} aria-label={t.tour.prev} className="flex size-11 items-center justify-center rounded-full bg-white shadow-card ring-1 ring-line transition hover:-translate-y-0.5 hover:text-teal">
                  <ArrowLeft className="size-5" />
                </button>
                <button onClick={() => go(1)} aria-label={t.tour.next} className="flex size-11 items-center justify-center rounded-full bg-white shadow-card ring-1 ring-line transition hover:-translate-y-0.5 hover:text-teal">
                  <ArrowRight className="size-5" />
                </button>
                <span className="ml-1 text-sm font-medium tabular-nums text-navy-500">{t.tour.of(index + 1, FEATURES.length)}</span>
              </div>
            </div>
          </div>

          <div className="animate-fade-up [animation-delay:120ms]">{current.visual()}</div>
        </div>

        {/* progress dots */}
        <div className="mt-10 flex justify-center gap-1.5">
          {FEATURES.map((f, i) => (
            <button
              key={f.key}
              onClick={() => select(f.key)}
              aria-label={t.tour.features[f.key].tab}
              className={clsx('h-2 rounded-full transition-all duration-300', i === index ? 'w-8 bg-teal' : 'w-2 bg-line-strong hover:bg-navy-300')}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- frames

function Phone({ title, step, children }: { title: string; step: string; children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[370px]">
      <div className="absolute inset-x-10 -bottom-6 -z-10 h-16 rounded-full bg-navy/25 blur-2xl" />
      <div className="rounded-[2.8rem] bg-navy p-3 shadow-2xl shadow-navy/30 ring-1 ring-black/10">
        <div className="overflow-hidden rounded-[2.2rem] bg-canvas">
          <div className="relative flex items-center justify-between px-6 pb-1 pt-3 text-xs font-semibold">
            <span>9:41</span>
            <span className="absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full bg-navy" />
            <span>●●● 5G</span>
          </div>
          <div className="flex items-center gap-2 border-b border-line/70 px-5 py-3">
            <LogoMark className="size-7" />
            <span className="font-bold">{title}</span>
          </div>
          <div className="min-h-[420px] px-4 py-4">
            <p className="mb-3 text-sm font-medium text-navy-500">{step}</p>
            {children}
          </div>
          <div className="grid grid-cols-5 border-t border-line bg-white py-2 text-center text-[0.65rem] font-medium text-navy-500">
            {['Home', 'Book', 'Results', 'Access', 'Profile'].map((l) => (
              <span key={l} className={clsx(title.toLowerCase().includes(l.toLowerCase()) && 'font-bold text-teal')}>
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const SIDEBARS: Record<'doctor' | 'lab', LucideIcon[]> = {
  doctor: [CalendarDays, ClipboardList, Users, Inbox, MessageSquareHeart, Settings],
  lab: [CalendarCheck2, ClipboardList, Upload, FileText, ArrowRightLeft, Settings],
}

function Browser({ role, active, title, url, children }: { role: 'doctor' | 'lab'; active: number; title: string; url: string; children: ReactNode }) {
  return (
    <div className="relative">
      <div className="absolute inset-x-16 -bottom-6 -z-10 h-16 rounded-full bg-navy/20 blur-2xl" />
      <div className="overflow-hidden rounded-2xl bg-white shadow-2xl shadow-navy/20 ring-1 ring-line">
        <div className="flex items-center gap-3 border-b border-line bg-canvas px-4 py-2.5">
          <span className="flex gap-1.5">
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
          </span>
          <span className="flex-1 truncate rounded-lg bg-white px-3 py-1 text-center text-xs text-navy-500 ring-1 ring-line">
            🔒 {url}
          </span>
        </div>
        <div className="flex">
          <div className="flex w-14 shrink-0 flex-col items-center gap-2 bg-navy py-4">
            <LogoMark className="mb-2 size-7" />
            {SIDEBARS[role].map((Icon, i) => (
              <span key={i} className={clsx('flex size-9 items-center justify-center rounded-lg', i === active ? 'bg-white/10 text-teal-glow' : 'text-white/50')}>
                <Icon className="size-[18px]" />
              </span>
            ))}
          </div>
          <div className="min-h-[400px] min-w-0 flex-1 bg-canvas/60 p-5">
            <div className="mb-4 text-xl font-bold">{title}</div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function StepBar({ step }: { step: number }) {
  return (
    <div className="mt-5">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={clsx('h-1.5 flex-1 rounded-full', i <= step ? 'bg-teal' : 'bg-line')} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-navy-500">
        <span>Visit</span>
        <span className="font-semibold text-teal">Time</span>
        <span>Consent</span>
        <span>Confirm</span>
      </div>
    </div>
  )
}
