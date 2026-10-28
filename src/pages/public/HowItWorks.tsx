import clsx from 'clsx'
import { ArrowRight, CalendarCheck2, Check, FlaskConical, PlayCircle, ShieldCheck, Stethoscope, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { t } from '../../i18n/strings'

const STEP_STYLE = [
  { icon: CalendarCheck2, color: '#0B7A6F' },
  { icon: FlaskConical, color: '#2F5DD1' },
  { icon: ShieldCheck, color: '#0B7A6F' },
  { icon: Stethoscope, color: '#13233A' },
]

/** Patient → lab → patient → doctor: the journey of one result, with the active step cycling. */
export function HowItWorks() {
  const how = t.landing.how
  const [active, setActive] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % how.steps.length), 2600)
    return () => clearInterval(id)
  }, [how.steps.length])

  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal">{how.eyebrow}</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{how.title}</h2>
        <p className="mt-4 text-lg leading-relaxed text-navy-500">{how.subtitle}</p>
      </div>

      <div className="relative mt-14">
        {/* The rail that links the four steps; dashes flow in the direction of the data. */}
        <div className="flow-line absolute left-[12.5%] right-[12.5%] top-8 hidden h-0.5 lg:block" />
        <div className="flow-line-v absolute bottom-8 left-8 top-8 w-0.5 lg:hidden" />

        <ol className="relative grid gap-6 lg:grid-cols-4">
          {how.steps.map((s, i) => {
            const { icon: Icon, color } = STEP_STYLE[i]
            const on = i === active
            return (
              <li key={s.title} className="flex gap-4 lg:flex-col lg:items-center lg:text-center">
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={s.title}
                  className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-lift transition-transform duration-300"
                  style={{ background: color, transform: on ? 'scale(1.12)' : undefined }}
                >
                  {on && <span className="absolute inset-0 animate-pulse-ring rounded-2xl" style={{ background: color }} />}
                  <Icon className="relative size-7" />
                  <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-white text-xs font-bold text-navy shadow-card ring-1 ring-line">
                    {i + 1}
                  </span>
                </button>
                <div
                  className={clsx(
                    'flex-1 rounded-2xl border bg-white p-5 transition-all duration-300 lg:mt-5 lg:w-full',
                    on ? '-translate-y-1 border-teal/40 shadow-lift' : 'border-line/80 shadow-card',
                  )}
                >
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                    {s.who}
                  </div>
                  <h3 className="mt-1 text-lg font-semibold leading-snug">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{s.text}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-navy-700 ring-1 ring-line">
                    <span className="size-1.5 rounded-full" style={{ background: color }} /> {s.chip}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

/** Before / after: the problem MediLink solves. */
export function Compare() {
  const c = t.landing.compare
  return (
    <section className="mx-auto max-w-6xl px-5 pb-20">
      <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">{c.title}</h2>
      <div className="relative mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-line bg-white/60 p-7">
          <div className="text-sm font-bold uppercase tracking-wider text-navy-300">{c.before}</div>
          <ul className="mt-5 space-y-4">
            {c.beforeItems.map((item) => (
              <li key={item} className="flex items-start gap-3 text-navy-500">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-high-soft text-high">
                  <X className="size-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <span className="absolute left-1/2 top-1/2 z-10 hidden size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-teal text-white shadow-glow md:flex">
          <ArrowRight className="size-5" />
        </span>
        <div className="relative overflow-hidden rounded-3xl border border-teal/30 bg-white p-7 shadow-lift">
          <div className="absolute -right-16 -top-16 size-48 rounded-full bg-teal-glow/20 blur-2xl" />
          <div className="relative text-sm font-bold uppercase tracking-wider text-teal">{c.after}</div>
          <ul className="relative mt-5 space-y-4">
            {c.afterItems.map((item) => (
              <li key={item} className="flex items-start gap-3 font-medium text-navy">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-teal text-white">
                  <Check className="size-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/** Closing call to action. */
export function CtaBand() {
  const c = t.landing.cta
  return (
    <section className="px-5 pb-16">
      <div className="dot-grid relative isolate mx-auto max-w-6xl overflow-hidden rounded-3xl bg-navy px-6 py-14 text-center text-white shadow-lift sm:px-10">
        <div className="absolute -left-20 -top-24 -z-10 size-80 animate-blob rounded-full bg-teal/40 blur-3xl" />
        <div className="absolute -bottom-32 right-10 -z-10 size-96 animate-blob rounded-full bg-[#2F5DD1]/25 blur-3xl [animation-delay:-6s]" />
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{c.title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-lg text-white/75">{c.text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 rounded-xl bg-teal-glow px-6 py-3.5 font-semibold text-navy shadow-glow transition-all hover:-translate-y-0.5 hover:bg-white"
          >
            <PlayCircle className="size-5" /> {c.demo}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/features"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-white ring-1 ring-white/25 transition-all hover:-translate-y-0.5 hover:bg-white/10"
          >
            {c.tour}
          </Link>
        </div>
      </div>
    </section>
  )
}
