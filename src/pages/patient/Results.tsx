import { differenceInHours, format } from 'date-fns'
import { ChevronRight, FlaskConical, Info, LineChart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ObservationRow, ReportCard } from '../../components/records'
import { LabLegend, TimelineChart } from '../../components/TimelineChart'
import { Card, EmptyState, KeyValue, Loading, PageHeader, Select, VerifiedBadge } from '../../components/ui'
import { t } from '../../i18n/strings'
import { testDef, testNames } from '../../lib/clinical'
import { fmtDate, fmtDateTime } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { getMyReports, getObservationSeries, getReport } from '../../services/patient'
import { useCurrentUser } from '../../store/auth'

export function Results() {
  const user = useCurrentUser()
  const { data } = useQuery(() => getMyReports(user.refId), [user.refId])
  const [test, setTest] = useState('')
  const [lab, setLab] = useState('')

  const { tests, labs } = useMemo(() => {
    const obs = data?.flatMap((r) => r.observations) ?? []
    return {
      tests: [...new Set(obs.map((o) => o.loinc))].map(testDef),
      labs: [...new Map(data?.map((r) => [r.lab.id, r.lab]) ?? []).values()],
    }
  }, [data])

  if (!data) return <Loading />

  const filtered = data
    .filter((r) => !lab || r.labId === lab)
    .map((r) => ({ ...r, observations: test ? r.observations.filter((o) => o.loinc === test) : r.observations }))
    .filter((r) => r.observations.length)

  const groups = new Map<string, typeof filtered>()
  for (const r of filtered) {
    const key = format(new Date(r.issued), 'MMMM yyyy')
    groups.set(key, [...(groups.get(key) ?? []), r])
  }

  return (
    <div>
      <PageHeader
        title={t.patient.results}
        subtitle={t.patient.resultsIntro}
        actions={
          <Link to={`/patient/timeline${test ? `?test=${test}` : ''}`} className="inline-flex items-center gap-1.5 rounded-xl bg-teal-soft px-3 py-2 text-sm font-semibold text-teal-dark">
            <LineChart className="size-4" /> {t.patient.timeline}
          </Link>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-2">
        <Select value={test} onChange={(e) => setTest(e.target.value)} aria-label={t.patient.allTests}>
          <option value="">{t.patient.allTests}</option>
          {tests.map((d) => (
            <option key={d.loinc} value={d.loinc}>
              {d.shortName}
            </option>
          ))}
        </Select>
        <Select value={lab} onChange={(e) => setLab(e.target.value)} aria-label={t.patient.allLabs}>
          <option value="">{t.patient.allLabs}</option>
          {labs.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<FlaskConical className="size-6" />}>{t.app.none}</EmptyState>
      ) : (
        <div className="stagger space-y-6">
          {[...groups.entries()].map(([month, reports]) => (
            <section key={month}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">{month}</h2>
              <div className="space-y-3">
                {reports.map((r) => (
                  <ReportCard key={r.id} report={r} to={`/patient/results/${r.id}`} isNew={differenceInHours(new Date(), new Date(r.issued)) < 48} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      <p className="mt-6 flex items-start gap-2 text-xs text-navy-500">
        <Info className="mt-px size-3.5 shrink-0" /> {t.patient.noUpload}
      </p>
    </div>
  )
}

export function ResultDetail() {
  const { id = '' } = useParams()
  const { data: report, error } = useQuery(() => getReport(id), [id])
  if (error) return <EmptyState>{error.message}</EmptyState>
  if (!report) return <Loading />

  return (
    <div>
      <PageHeader title={testNames(report.testIds)} back />
      <Card className="p-4">
        <VerifiedBadge lab={report.lab.name} />
        <dl className="mt-4 grid grid-cols-2 gap-4">
          <KeyValue label="Test date">{fmtDate(report.observations[0].effective)}</KeyValue>
          <KeyValue label="Delivered">{fmtDateTime(report.issued)}</KeyValue>
          <KeyValue label="Lab">{report.lab.name}</KeyValue>
          <KeyValue label="Ordered by">{report.orderedBy ? `${report.orderedBy.name}` : 'Self-booked'}</KeyValue>
        </dl>
      </Card>

      <div className="mt-5 space-y-4">
        {report.observations.map((o) => (
          <Card key={o.id} className="p-2">
            <ObservationRow obs={o} large />
            <div className="px-3 pb-1 pt-1 text-xs text-navy-300">
              {t.patient.yourLabName(o.localName)} → {testDef(o.loinc).name} · LOINC {o.loinc}
            </div>
            <MiniHistory patientId={report.patientId} loinc={o.loinc} />
          </Card>
        ))}
      </div>
    </div>
  )
}

function MiniHistory({ patientId, loinc }: { patientId: string; loinc: string }) {
  const { data } = useQuery(() => getObservationSeries(patientId, loinc), [patientId, loinc])
  if (!data || data.points.length < 2) return null
  return (
    <Link to={`/patient/timeline?test=${loinc}`} className="mx-1 mb-1 mt-2 block rounded-xl bg-canvas px-3 pb-2 pt-2 hover:bg-teal-soft/40">
      <div className="flex items-center justify-between text-xs font-semibold text-navy-500">
        <span>
          {t.patient.history} · {t.patient.resultsFromLabs(data.points.length, new Set(data.points.map((p) => p.lab.id)).size)}
        </span>
        <span className="inline-flex items-center text-teal">
          {t.patient.openTimeline} <ChevronRight className="size-3.5" />
        </span>
      </div>
      <TimelineChart series={data} height={70} compact />
      <LabLegend points={data.points} />
    </Link>
  )
}
