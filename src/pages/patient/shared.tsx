import { format } from 'date-fns'
import { Building2, Clock, FlaskConical } from 'lucide-react'
import type { ReactNode } from 'react'
import { AppointmentStatusBadge, Badge } from '../../components/ui'
import { t } from '../../i18n/strings'
import { fmtTime, fmtWeekday } from '../../lib/format'
import type { AppointmentView, LabOrderStatusLabel } from '../../services/shared'

export function DateBlock({ iso, tone = 'light' }: { iso: string; tone?: 'light' | 'dark' }) {
  const d = new Date(iso)
  return (
    <div
      className={
        tone === 'dark'
          ? 'flex w-14 shrink-0 flex-col items-center rounded-xl bg-white/15 py-2 text-white'
          : 'flex w-14 shrink-0 flex-col items-center rounded-xl bg-teal-soft py-2 text-teal-dark'
      }
    >
      <span className="text-xs font-semibold uppercase">{format(d, 'MMM')}</span>
      <span className="text-xl font-bold leading-none">{format(d, 'd')}</span>
      <span className="text-xs">{format(d, 'EEE')}</span>
    </div>
  )
}

export function AppointmentCard({ a, children }: { a: AppointmentView; children?: ReactNode }) {
  const isLab = a.kind === 'lab'
  return (
    <div className="rounded-2xl border border-line/80 bg-white shadow-card p-4">
      <div className="flex gap-3">
        <DateBlock iso={a.status === 'proposed' && a.proposedStart ? a.proposedStart : a.start} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-semibold text-navy">{isLab ? a.organization.name : a.practitioner?.name}</div>
              <div className="truncate text-sm text-navy-500">
                {isLab ? (
                  <span className="inline-flex items-center gap-1">
                    <FlaskConical className="size-3.5" /> {a.tests.map((x) => x.name).join(', ')}
                  </span>
                ) : (
                  `${a.practitioner?.specialty} · ${a.visitType?.name}`
                )}
              </div>
            </div>
            <AppointmentStatusBadge status={a.status} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> {fmtWeekday(a.start)}, {fmtTime(a.start)}
            </span>
            {!isLab && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="size-3.5" /> {a.organization.name}
              </span>
            )}
          </div>
          {a.status === 'proposed' && a.proposedStart && (
            <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
              {t.patient.proposalTitle}: <b>{fmtWeekday(a.proposedStart)}, {fmtTime(a.proposedStart)}</b>
            </div>
          )}
          {a.status === 'pending' && <div className="mt-2 text-xs font-medium text-low">{t.status.waitingForDoctor}</div>}
          {children && <div className="mt-3 flex flex-wrap gap-2">{children}</div>}
        </div>
      </div>
    </div>
  )
}

export function OrderStatusBadge({ status }: { status: LabOrderStatusLabel }) {
  const tone = status === 'to-book' ? 'amber' : status === 'booked' ? 'teal' : status === 'result-ready' ? 'navy' : 'gray'
  return <Badge tone={tone}>{t.status.order[status]}</Badge>
}
