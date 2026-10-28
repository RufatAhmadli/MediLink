import clsx from 'clsx'
import { BellRing, ChevronDown, Inbox as InboxIcon } from 'lucide-react'
import { useState } from 'react'
import { ObservationRow } from '../../components/records'
import { Badge, ButtonLink, Card, EmptyState, Loading, PageHeader, VerifiedBadge } from '../../components/ui'
import { t } from '../../i18n/strings'
import { testDef } from '../../lib/clinical'
import { fmtDate, fmtDateTime } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { getResultsInbox, markReportRead } from '../../services/doctor'
import type { ReportView } from '../../services/shared'
import { useCurrentUser } from '../../store/auth'

const shortNames = (r: ReportView) => r.observations.map((o) => testDef(o.loinc).shortName).join(', ')

export function Inbox() {
  const user = useCurrentUser()
  const { data } = useQuery(() => getResultsInbox(user.refId), [user.refId])
  const [open, setOpen] = useState<string | null>(null)

  if (!data) return <Loading />
  const unread = data.filter((r) => r.unreadByRequester)

  const toggle = (r: ReportView) => {
    setOpen((cur) => (cur === r.id ? null : r.id))
    if (r.unreadByRequester) markReportRead(r.id)
  }

  return (
    <div>
      <PageHeader title={t.doctor.inbox} subtitle={t.doctor.inboxIntro} />

      {unread.length > 0 && (
        <div className="mb-5 space-y-2">
          {unread.map((r) => (
            <button
              key={r.id}
              onClick={() => toggle(r)}
              className="flex w-full items-center gap-3 rounded-2xl bg-navy px-4 py-3 text-left text-sm font-medium text-white"
            >
              <BellRing className="size-5 shrink-0 text-teal-glow" />
              {t.doctor.resultsReady(r.patient.name, shortNames(r))}
            </button>
          ))}
        </div>
      )}

      {data.length === 0 ? (
        <EmptyState icon={<InboxIcon className="size-6" />}>{t.app.none}</EmptyState>
      ) : (
        <Card className="divide-y divide-line">
          {data.map((r) => (
            <div key={r.id}>
              <button onClick={() => toggle(r)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 text-left hover:bg-canvas">
                <span className={clsx('size-2 shrink-0 rounded-full', r.unreadByRequester ? 'bg-teal' : 'bg-transparent')} />
                <div className="min-w-[180px] flex-1">
                  <div className={clsx('text-sm', r.unreadByRequester ? 'font-bold' : 'font-semibold')}>{r.patient.name}</div>
                  <div className="text-xs text-navy-500">{shortNames(r)}</div>
                </div>
                <div className="flex items-center gap-2">
                  {r.observations.some((o) => o.interpretation !== 'N') && <Badge tone="red">Out of range</Badge>}
                  {r.unreadByRequester && <Badge tone="blue">{t.app.new}</Badge>}
                  <span className="hidden text-xs text-navy-500 sm:inline">{r.lab.name}</span>
                  <span className="w-24 text-right text-xs text-navy-500">{fmtDate(r.issued)}</span>
                  <ChevronDown className={clsx('size-4 text-navy-300 transition-transform', open === r.id && 'rotate-180')} />
                </div>
              </button>
              {open === r.id && (
                <div className="bg-canvas/60 px-4 pb-4 pt-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-navy-500">
                    <VerifiedBadge lab={r.lab.name} /> Delivered {fmtDateTime(r.issued)}
                  </div>
                  <div className="space-y-1 rounded-xl bg-white p-2 ring-1 ring-line">
                    {r.observations.map((o) => (
                      <ObservationRow key={o.id} obs={o} />
                    ))}
                  </div>
                  <ButtonLink to={`/doctor/patients/${r.patientId}`} size="sm" variant="secondary" className="mt-3">
                    {t.doctor.openPatient}
                  </ButtonLink>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
