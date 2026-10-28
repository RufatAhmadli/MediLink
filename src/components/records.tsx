import clsx from 'clsx'
import { format, parseISO } from 'date-fns'
import { ChevronRight, Stethoscope } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { t } from '../i18n/strings'
import { formatRange, formatValue, testDef } from '../lib/clinical'
import { fmtDate, fmtTime } from '../lib/format'
import type { DayAvailability } from '../services/booking'
import type { ReportView, SummaryView } from '../services/shared'
import type { Observation } from '../types'
import { Badge, BookingModeBadge, Card, InterpretationTag, VerifiedBadge } from './ui'

/** One normalised lab value with its range and a text status. */
export function ObservationRow({ obs, large }: { obs: Observation; large?: boolean }) {
  const def = testDef(obs.loinc)
  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-3 rounded-xl px-3 py-2.5',
        obs.interpretation === 'H' && 'bg-high-soft/70',
        obs.interpretation === 'L' && 'bg-low-soft/80',
      )}
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-navy">{def.shortName}</div>
        <div className="text-xs text-navy-500">
          {t.patient.range}: {formatRange(obs.refLow, obs.refHigh, obs.loinc)} {obs.unit}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <div className="text-right">
          <span
            className={clsx(
              'font-bold tabular-nums',
              large ? 'text-2xl' : 'text-lg',
              obs.interpretation === 'H' ? 'text-high' : obs.interpretation === 'L' ? 'text-low' : 'text-navy',
            )}
          >
            {formatValue(obs.value, obs.loinc)}
          </span>
          <span className="ml-1 text-xs text-navy-500">{obs.unit}</span>
        </div>
        <InterpretationTag value={obs.interpretation} />
      </div>
    </div>
  )
}

export function ReportCard({ report, to, isNew }: { report: ReportView; to?: string; isNew?: boolean }) {
  const body = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-4">
        <div>
          <div className="text-sm font-semibold text-navy">{fmtDate(report.observations[0]?.effective ?? report.issued)}</div>
          <div className="mt-0.5 text-xs text-navy-500">
            {report.lab.name}
            {report.orderedBy && <> · {t.status.orderedBy(report.orderedBy.name)}</>}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isNew && <Badge tone="blue">{t.app.new}</Badge>}
          <VerifiedBadge lab={report.lab.name} />
        </div>
      </div>
      <div className="space-y-1 p-2">
        {report.observations.map((o) => (
          <ObservationRow key={o.id} obs={o} />
        ))}
      </div>
    </>
  )
  return to ? (
    <Link to={to} className="block rounded-2xl border border-line/80 bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      {body}
    </Link>
  ) : (
    <Card>{body}</Card>
  )
}

export function SummaryCard({ summary, to, defaultOpen = false }: { summary: SummaryView; to?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const header = (
    <div className="flex items-start gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-soft text-teal">
        <Stethoscope className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-3">
          <div className="text-sm font-semibold text-navy">{summary.author.name}</div>
          <div className="text-xs text-navy-500">{fmtDate(summary.date)}</div>
        </div>
        <div className="text-xs text-navy-500">
          {summary.author.specialty} · {summary.organization.name}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {summary.diagnoses.map((d) => (
            <Badge key={d.code} tone="navy">
              {d.code} · {d.name}
            </Badge>
          ))}
        </div>
        <p className="mt-2 text-sm text-navy-700">{summary.reason}</p>
      </div>
      {to && <ChevronRight className="mt-2 size-4 shrink-0 text-navy-300" />}
    </div>
  )
  if (to) {
    return (
      <Link to={to} className="block rounded-2xl border border-line/80 bg-white shadow-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
        {header}
      </Link>
    )
  }
  return (
    <Card className="p-4">
      {header}
      {open ? (
        <SummaryDetails summary={summary} />
      ) : (
        <button className="mt-2 pl-[52px] text-sm font-semibold text-teal hover:underline" onClick={() => setOpen(true)}>
          Read full summary
        </button>
      )}
    </Card>
  )
}

export function SummaryDetails({ summary }: { summary: SummaryView }) {
  const rows: [string, string][] = [
    [t.doctor.findings, summary.findings],
    [t.doctor.treatment, summary.treatment],
    [t.doctor.recommendations, summary.recommendations],
    [t.doctor.followUp, summary.followUp],
  ]
  return (
    <dl className="mt-4 space-y-3 border-t border-line pt-4">
      {rows
        .filter(([, v]) => v)
        .map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-navy-300">{label}</dt>
            <dd className="mt-0.5 text-sm text-navy">{value}</dd>
          </div>
        ))}
    </dl>
  )
}

/** Date strip + time grid used for doctor and lab booking. */
export function SlotPicker({
  days,
  value,
  onChange,
  showMode,
}: {
  days: DayAvailability[]
  value: string | null
  onChange: (start: string) => void
  showMode?: boolean
}) {
  const firstWithSlots = days.find((d) => d.slots.length)?.date ?? days[0]?.date
  const [selectedDay, setSelectedDay] = useState<string>(value ? format(new Date(value), 'yyyy-MM-dd') : firstWithSlots)
  const day = days.find((d) => d.date === selectedDay) ?? days[0]
  const mode = days.flatMap((d) => d.slots)[0]?.bookingMode

  return (
    <div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {days.map((d) => {
          const date = parseISO(d.date)
          const active = d.date === selectedDay
          const free = d.slots.length
          return (
            <button
              key={d.date}
              type="button"
              onClick={() => setSelectedDay(d.date)}
              className={clsx(
                'flex w-14 shrink-0 flex-col items-center rounded-xl border py-2 transition-colors',
                active ? 'border-teal bg-teal text-white' : free ? 'border-line bg-white hover:border-teal' : 'border-line bg-canvas text-navy-300',
              )}
            >
              <span className={clsx('text-xs font-medium uppercase', active ? 'text-white/80' : 'text-navy-500')}>{format(date, 'EEE')}</span>
              <span className="text-lg font-bold leading-tight">{format(date, 'd')}</span>
              <span className={clsx('text-xs', active ? 'text-white/80' : 'text-navy-300')}>{format(date, 'MMM')}</span>
              <span className={clsx('mt-1 size-1.5 rounded-full', free ? (active ? 'bg-white' : 'bg-teal') : 'bg-transparent')} />
            </button>
          )
        })}
      </div>
      {showMode && mode && (
        <div className="mt-2">
          <BookingModeBadge mode={mode} />
        </div>
      )}
      <div className="mt-3">
        {day && day.slots.length ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {day.slots.map((s) => (
              <button
                key={s.start}
                type="button"
                onClick={() => onChange(s.start)}
                className={clsx(
                  'rounded-lg border py-2 text-sm font-semibold tabular-nums transition-colors',
                  value === s.start ? 'border-teal bg-teal text-white' : 'border-line bg-white text-navy hover:border-teal hover:text-teal',
                )}
              >
                {fmtTime(s.start)}
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-canvas px-4 py-6 text-center text-sm text-navy-500">{t.patient.noSlots}</p>
        )}
      </div>
    </div>
  )
}
