import { FileText } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { SummaryCard, SummaryDetails } from '../../components/records'
import { Badge, Card, EmptyState, Loading, PageHeader } from '../../components/ui'
import { t } from '../../i18n/strings'
import { fmtDate } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { getMySummaries, getSummary } from '../../services/patient'
import { useCurrentUser } from '../../store/auth'

export function Summaries() {
  const user = useCurrentUser()
  const { data } = useQuery(() => getMySummaries(user.refId), [user.refId])
  return (
    <div>
      <PageHeader title={t.patient.summaries} subtitle={t.patient.summariesIntro} back="/patient" />
      {!data ? (
        <Loading />
      ) : data.length === 0 ? (
        <EmptyState icon={<FileText className="size-6" />}>{t.app.none}</EmptyState>
      ) : (
        <div className="stagger space-y-3">
          {data.map((s) => (
            <SummaryCard key={s.id} summary={s} to={`/patient/summaries/${s.id}`} />
          ))}
        </div>
      )}
    </div>
  )
}

export function SummaryDetail() {
  const { id = '' } = useParams()
  const { data: s, error } = useQuery(() => getSummary(id), [id])
  if (error) return <EmptyState>{error.message}</EmptyState>
  if (!s) return <Loading />
  return (
    <div>
      <PageHeader title={t.doctor.summaryTitle} subtitle={fmtDate(s.date)} back />
      <Card className="p-4">
        <div className="font-semibold">{s.author.name}</div>
        <div className="text-sm text-navy-500">
          {s.author.specialty} · {s.organization.name}
        </div>
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-navy-300">{t.doctor.reason}</div>
          <p className="mt-0.5 text-sm">{s.reason}</p>
        </div>
        <div className="mt-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-navy-300">{t.doctor.diagnosis}</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {s.diagnoses.map((d) => (
              <Badge key={d.code} tone="navy">
                {d.code} · {d.name}
              </Badge>
            ))}
          </div>
        </div>
        <SummaryDetails summary={s} />
      </Card>
    </div>
  )
}
