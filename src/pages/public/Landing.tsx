import { BadgeCheck, Bell, CalendarCheck2, Check, LineChart, ShieldCheck } from 'lucide-react'
import { Logo } from '../../components/Logo'
import { Badge, ButtonLink } from '../../components/ui'
import { t } from '../../i18n/strings'
import { Compare, CtaBand, HowItWorks } from './HowItWorks'

const icons = [CalendarCheck2, LineChart, ShieldCheck]
const minis = [MiniBooking, MiniTimeline, MiniConsent]

export function Landing() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute -right-32 -top-32 -z-10 size-[32rem] animate-blob rounded-full bg-teal-glow/25 blur-3xl" />
      <div className="absolute -left-40 top-80 -z-10 size-[26rem] animate-blob rounded-full bg-[#2F5DD1]/10 blur-3xl [animation-delay:-7s]" />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <ButtonLink to="/login" variant="secondary">
          {t.landing.logIn}
        </ButtonLink>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-14">
        <div className="stagger">
          <Badge tone="teal" className="mb-5">
            Private clinics &amp; labs · Baku
          </Badge>
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-navy sm:text-5xl lg:text-6xl">{t.landing.headlineLead} <span className="text-gradient">{t.landing.headlineHighlight}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-navy-500">{t.landing.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/signup" size="lg">
              {t.landing.getStarted}
            </ButtonLink>
            <ButtonLink to="/features" size="lg" variant="secondary">
              {t.tour.seeAll}
            </ButtonLink>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-navy-700">
            {t.landing.trust.map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-teal-soft text-teal">
                  <Check className="size-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-navy-500">{t.landing.forProviders}</p>
        </div>

        <HeroPreview />
      </section>

      <section className="border-t border-line bg-white/80 backdrop-blur">
        <div className="stagger mx-auto grid max-w-6xl gap-5 px-5 py-14 md:grid-cols-3">
          {t.landing.points.map((p, i) => {
            const Icon = icons[i]
            const Mini = minis[i]
            return (
              <div key={p.title} className="group rounded-2xl border border-line/80 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-teal-soft text-teal transition-colors group-hover:bg-teal group-hover:text-white">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-xs font-semibold text-navy-300">{t.landing.pointTags[i]}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{p.title}</h3>
                <p className="mt-1.5 leading-relaxed text-navy-500">{p.text}</p>
                <Mini />
              </div>
            )
          })}
        </div>
      </section>

      <HowItWorks />
      <Compare />
      <CtaBand />

      <footer className="mx-auto max-w-6xl px-5 py-8 text-xs text-navy-500">{t.app.fictional}</footer>
    </div>
  )
}

/** Static illustration of the product: one result shared across labs. */
function HeroPreview() {
  const points = [
    { x: 8, y: 30, lab: '#9A3FC9' },
    { x: 24, y: 38, lab: '#2F5DD1' },
    { x: 40, y: 52, lab: '#0B7A6F' },
    { x: 56, y: 60, lab: '#9A3FC9' },
    { x: 72, y: 68, lab: '#2F5DD1' },
    { x: 88, y: 73, lab: '#0B7A6F' },
  ]
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-teal-soft to-transparent" />
      <div className="animate-float-slow rounded-3xl border border-line/80 bg-white p-5 shadow-lift">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-navy-300">HbA1c · 2 years</div>
            <div className="mt-1 text-3xl font-bold text-navy">
              6.9<span className="ml-1 text-sm font-medium text-navy-500">%</span>
            </div>
          </div>
          <Badge tone="teal">
            <BadgeCheck className="size-3.5" /> Verified
          </Badge>
        </div>
        <svg viewBox="0 0 100 90" className="mt-4 h-40 w-full">
          <rect x="0" y="62" width="100" height="22" fill="#0B7A6F" opacity="0.08" />
          <polyline points={points.map((p) => `${p.x},${100 - p.y - 10}`).join(' ')} fill="none" stroke="#9AA7B8" strokeWidth="1.2" />
          {points.map((p) => (
            <circle key={p.x} cx={p.x} cy={100 - p.y - 10} r="2.6" fill={p.lab} stroke="#fff" strokeWidth="1" />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-navy-500">
          {[
            ['Nur Lab', '#0B7A6F'],
            ['Caspian Diagnostics', '#2F5DD1'],
            ['Mərkəz Lab', '#9A3FC9'],
          ].map(([name, color]) => (
            <span key={name} className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: color }} /> {name}
            </span>
          ))}
        </div>
      </div>
      <div className="absolute -right-3 -top-8 animate-float rounded-2xl border border-line/80 bg-white px-4 py-3 shadow-lift [animation-delay:-1.5s] sm:-right-10">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-8 items-center justify-center rounded-full bg-[#2F5DD1] text-white">
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-[#2F5DD1]" />
            <Bell className="relative size-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">New verified result</div>
            <div className="text-xs text-navy-500">Caspian Diagnostics · just now</div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 -left-4 animate-float rounded-2xl border border-line/80 bg-white px-4 py-3 shadow-lift [animation-delay:-3s] sm:-left-10">
        <div className="text-xs text-navy-500">Shared with</div>
        <div className="text-sm font-semibold">Dr. Leyla Hasanova</div>
        <div className="text-xs text-teal">Lab results · until 7 days after visit</div>
      </div>
    </div>
  )
}

/* Tiny illustrations under each landing card. */
function MiniBooking() {
  return (
    <div className="mt-5 grid grid-cols-4 gap-1.5 text-center text-xs font-semibold">
      {['09:00', '10:30', '11:00', '14:30'].map((time) => (
        <span key={time} className={time === '10:30' ? 'rounded-lg bg-teal py-1.5 text-white shadow-glow' : 'rounded-lg bg-canvas py-1.5 text-navy-500 ring-1 ring-line'}>
          {time}
        </span>
      ))}
    </div>
  )
}

function MiniTimeline() {
  const pts = [
    [6, 26, '#9A3FC9'],
    [30, 20, '#2F5DD1'],
    [54, 16, '#0B7A6F'],
    [78, 11, '#9A3FC9'],
    [100, 8, '#2F5DD1'],
  ] as const
  return (
    <svg viewBox="0 0 106 34" className="mt-5 h-12 w-full">
      <rect x="0" y="12" width="106" height="12" fill="#0B7A6F" opacity="0.08" />
      <polyline points={pts.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke="#9AA7B8" strokeWidth="1" strokeDasharray="400" className="animate-draw" />
      {pts.map(([x, y, c]) => (
        <circle key={x} cx={x} cy={y} r="2.6" fill={c} stroke="#fff" strokeWidth="1" />
      ))}
    </svg>
  )
}

function MiniConsent() {
  return (
    <div className="mt-5 flex items-center gap-3 rounded-xl bg-canvas px-3 py-2.5 ring-1 ring-line">
      <span className="flex size-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">LH</span>
      <div className="min-w-0 flex-1 text-xs">
        <div className="truncate font-semibold text-navy">Dr. Hasanova</div>
        <div className="text-navy-500">Lab results · 7 days</div>
      </div>
      <span className="relative h-5 w-9 rounded-full bg-teal">
        <span className="absolute right-0.5 top-0.5 size-4 rounded-full bg-white shadow" />
      </span>
    </div>
  )
}
