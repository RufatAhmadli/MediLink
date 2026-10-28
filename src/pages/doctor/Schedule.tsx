import { addDays, addWeeks, differenceInMinutes, format, isSameDay, startOfDay, startOfWeek } from 'date-fns'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, PageHeader, Segmented } from '../../components/ui'
import { t } from '../../i18n/strings'
import { fmtTime } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { getDoctorSchedule, getUnreadCounts } from '../../services/doctor'
import type { AppointmentView } from '../../services/shared'
import { useCurrentUser } from '../../store/auth'

const START_HOUR = 8
const END_HOUR = 19
const PX_PER_MIN = 1.1

export function Schedule() {
  const user = useCurrentUser()
  const [view, setView] = useState<'day' | 'week'>('week')
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()))

  const days = view === 'week' ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor, { weekStartsOn: 1 }), i)) : [anchor]
  const from = days[0]
  const to = addDays(days[days.length - 1], 1)
  const { data } = useQuery(() => getDoctorSchedule(user.refId, from, to), [user.refId, from.toISOString(), view])
  const { data: counts } = useQuery(() => getUnreadCounts(user.refId), [user.refId])

  const today = startOfDay(new Date())
  const { data: todayItems } = useQuery(() => getDoctorSchedule(user.refId, today, addDays(today, 1)), [user.refId, today.toISOString()])

  const step = (dir: 1 | -1) => setAnchor((a) => (view === 'week' ? addWeeks(a, dir) : addDays(a, dir)))
  const todays = todayItems?.filter((a) => a.status === 'booked' || a.status === 'fulfilled') ?? []

  return (
    <div>
      <PageHeader
        title={t.nav.doctor.schedule}
        subtitle={format(new Date(), 'EEEE, d MMMM yyyy')}
        actions={
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: 'day', label: t.doctor.day },
              { value: 'week', label: t.doctor.week },
            ]}
          />
        }
      />

      <div className="stagger mb-5 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-navy-300">{t.doctor.today}</div>
          <div className="mt-1 text-3xl font-bold">{todays.length}</div>
          <div className="text-sm text-navy-500">appointments</div>
        </Card>
        <Link to="/doctor/requests" className="rounded-2xl border border-line/80 bg-white shadow-card p-4 hover:shadow-md">
          <div className="text-xs font-semibold uppercase tracking-wide text-navy-300">{t.doctor.requests}</div>
          <div className="mt-1 text-3xl font-bold text-low">{counts?.requests ?? 0}</div>
          <div className="text-sm text-navy-500">waiting for your approval</div>
        </Link>
        <Link to="/doctor/inbox" className="rounded-2xl border border-line/80 bg-white shadow-card p-4 hover:shadow-md">
          <div className="text-xs font-semibold uppercase tracking-wide text-navy-300">{t.doctor.inbox}</div>
          <div className="mt-1 text-3xl font-bold text-teal">{counts?.inbox ?? 0}</div>
          <div className="text-sm text-navy-500">new results</div>
        </Link>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => step(-1)} aria-label="Previous">
          <ChevronLeft className="size-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setAnchor(startOfDay(new Date()))}>
          {t.doctor.today}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => step(1)} aria-label="Next">
          <ChevronRight className="size-4" />
        </Button>
        <span className="ml-2 font-semibold">
          {view === 'week' ? `${format(days[0], 'd MMM')} – ${format(days[6], 'd MMM yyyy')}` : format(anchor, 'EEEE, d MMMM yyyy')}
        </span>
      </div>

      <Card className="overflow-x-auto">
        <div className={clsx('flex', view === 'week' && 'min-w-[860px]')}>
          <div className="w-14 shrink-0 border-r border-line pt-10">
            {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
              <div key={i} style={{ height: 60 * PX_PER_MIN }} className="pr-2 text-right text-xs text-navy-300">
                {String(START_HOUR + i).padStart(2, '0')}:00
              </div>
            ))}
          </div>
          {days.map((day) => (
            <DayColumn key={day.toISOString()} day={day} items={data?.filter((a) => isSameDay(new Date(a.start), day)) ?? []} detailed={view === 'day'} />
          ))}
        </div>
      </Card>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-navy-500">
        <Legend className="bg-teal-soft ring-teal/40">{t.status.appointment.booked}</Legend>
        <Legend className="border border-dashed border-low bg-low-soft">{t.status.appointment.pending}</Legend>
        <Legend className="bg-canvas ring-line-strong">{t.status.appointment.fulfilled}</Legend>
      </div>
    </div>
  )
}

function Legend({ className, children }: { className: string; children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={clsx('h-3 w-5 rounded ring-1', className)} /> {children}
    </span>
  )
}

function DayColumn({ day, items, detailed }: { day: Date; items: AppointmentView[]; detailed: boolean }) {
  const navigate = useNavigate()
  const today = isSameDay(day, new Date())
  const height = (END_HOUR - START_HOUR) * 60 * PX_PER_MIN
  const nowOffset = differenceInMinutes(new Date(), day) - START_HOUR * 60

  return (
    <div className="min-w-0 flex-1 border-r border-line last:border-r-0">
      <div className={clsx('flex h-10 items-center justify-center gap-1.5 border-b border-line text-sm', today ? 'font-bold text-teal' : 'text-navy-500')}>
        {format(day, 'EEE')}
        <span className={clsx('flex size-6 items-center justify-center rounded-full', today && 'bg-teal text-white')}>{format(day, 'd')}</span>
      </div>
      <div className="relative" style={{ height }}>
        {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
          <div key={i} className="absolute inset-x-0 border-t border-line/70" style={{ top: i * 60 * PX_PER_MIN }} />
        ))}
        {today && nowOffset > 0 && nowOffset < (END_HOUR - START_HOUR) * 60 && (
          <div className="absolute inset-x-0 z-10 border-t-2 border-high" style={{ top: nowOffset * PX_PER_MIN }}>
            <span className="absolute -left-1 -top-[5px] size-2 rounded-full bg-high" />
          </div>
        )}
        {items.map((a) => {
          const s = new Date(a.start)
          const top = (s.getHours() * 60 + s.getMinutes() - START_HOUR * 60) * PX_PER_MIN
          const h = Math.max(differenceInMinutes(new Date(a.end), s) * PX_PER_MIN - 2, 22)
          return (
            <button
              key={a.id}
              onClick={() => navigate(`/doctor/patients/${a.patientId}`)}
              style={{ top, height: h }}
              className={clsx(
                'absolute inset-x-1 overflow-hidden rounded-lg px-2 py-1 text-left text-xs leading-tight transition-shadow hover:z-20 hover:shadow-md',
                a.status === 'pending' || a.status === 'proposed'
                  ? 'border border-dashed border-low bg-low-soft text-low'
                  : a.status === 'fulfilled'
                    ? 'bg-canvas text-navy-500 ring-1 ring-line-strong'
                    : 'bg-teal-soft text-teal-dark ring-1 ring-teal/40',
              )}
            >
              <div className="font-semibold">
                {fmtTime(a.start)} {a.patient.name}
              </div>
              {(detailed || h > 40) && (
                <div className="truncate opacity-80">
                  {a.visitType?.name}
                  {a.status === 'pending' && ` · ${t.doctor.pendingBadge}`}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
