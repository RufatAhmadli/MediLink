import { Lock, MessageSquare } from 'lucide-react'
import { Card, EmptyState, Loading, PageHeader, Stars } from '../../components/ui'
import { t } from '../../i18n/strings'
import { fmtDate } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { getDoctorFeedback } from '../../services/doctor'
import { useCurrentUser } from '../../store/auth'

export function DoctorFeedback() {
  const user = useCurrentUser()
  const { data } = useQuery(() => getDoctorFeedback(user.refId), [user.refId])
  if (!data) return <Loading />

  return (
    <div>
      <PageHeader title={t.doctor.feedback} subtitle={t.doctor.feedbackIntro} />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-navy-300">{t.doctor.average}</div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-5xl font-bold tabular-nums">{data.average.toFixed(1)}</span>
            <span className="pb-1.5 text-navy-500">/ 5</span>
          </div>
          <div className="mt-1">
            <Stars value={data.average} size="lg" />
          </div>
          <div className="mt-1 text-sm text-navy-500">{t.doctor.reviews(data.count)}</div>
          <div className="mt-5 space-y-1.5">
            {[5, 4, 3, 2, 1].map((n) => {
              const count = data.distribution[n]
              return (
                <div key={n} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-navy-500">{n}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas ring-1 ring-line">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${data.count ? (count / data.count) * 100 : 0}%` }} />
                  </div>
                  <span className="w-4 text-right tabular-nums text-navy-500">{count}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-canvas px-3 py-2.5 text-xs text-navy-500">
            <Lock className="mt-px size-3.5 shrink-0" /> Never shown publicly or to other patients.
          </div>
        </Card>

        {data.items.length === 0 ? (
          <EmptyState icon={<MessageSquare className="size-6" />}>{t.app.none}</EmptyState>
        ) : (
          <div className="space-y-3">
            {data.items.map((f) => (
              <Card key={f.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Stars value={f.rating} />
                  <span className="text-xs text-navy-500">{fmtDate(f.createdAt)}</span>
                </div>
                {f.comment ? <p className="mt-2 text-sm text-navy">“{f.comment}”</p> : <p className="mt-2 text-sm italic text-navy-300">No comment</p>}
                <div className="mt-2 text-xs text-navy-500">
                  {f.patientInitials}
                  {f.visitType && ` · ${f.visitType}`}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
