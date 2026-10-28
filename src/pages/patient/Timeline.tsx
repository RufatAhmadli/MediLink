import clsx from 'clsx'
import { Link, useSearchParams } from 'react-router-dom'
import { LabLegend, rangeText, TimelineChart } from '../../components/TimelineChart'
import { Card, InterpretationTag, Loading, PageHeader } from '../../components/ui'
import { t } from '../../i18n/strings'
import { formatValue } from '../../lib/clinical'
import { labColor } from '../../lib/labColors'
import { fmtDate } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { getMeasuredTests, getObservationSeries } from '../../services/patient'
import { useCurrentUser } from '../../store/auth'

export function Timeline() {
  const user = useCurrentUser()
  const [params, setParams] = useSearchParams()
  const { data: tests } = useQuery(() => getMeasuredTests(user.refId), [user.refId])
  const selected = params.get('test') ?? tests?.find((x) => x.definition.loinc === '4548-4')?.definition.loinc ?? tests?.[0]?.definition.loinc

  return (
    <div>
      <PageHeader title={t.patient.timeline} subtitle={t.patient.timelineIntro} back />
      {!tests ? (
        <Loading />
      ) : (
        <>
          <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {tests.map(({ definition: d, labs }) => (
              <button
                key={d.loinc}
                onClick={() => setParams({ test: d.loinc }, { replace: true })}
                className={clsx(
                  'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                  selected === d.loinc ? 'border-teal bg-teal text-white' : 'border-line bg-white text-navy hover:border-teal',
                )}
              >
                {d.shortName}
                {labs > 1 && <span className={clsx('ml-1.5 text-xs font-medium', selected === d.loinc ? 'text-white/80' : 'text-navy-300')}>{labs} labs</span>}
              </button>
            ))}
          </div>
          {selected && <SeriesView patientId={user.refId} loinc={selected} />}
        </>
      )}
    </div>
  )
}

function SeriesView({ patientId, loinc }: { patientId: string; loinc: string }) {
  const { data } = useQuery(() => getObservationSeries(patientId, loinc), [patientId, loinc])
  if (!data) return <Loading />
  const latest = data.points[data.points.length - 1]
  const labs = new Set(data.points.map((p) => p.lab.id)).size

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-navy-300">{data.definition.name}</div>
            {latest && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-4xl font-bold tabular-nums">{formatValue(latest.value, loinc)}</span>
                <span className="text-sm text-navy-500">{data.definition.unit}</span>
                <InterpretationTag value={latest.interpretation} />
              </div>
            )}
            <div className="mt-1 text-xs text-navy-500">
              {t.patient.normalRange}: {rangeText(data)} · {t.patient.resultsFromLabs(data.points.length, labs)}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <TimelineChart series={data} height={250} />
        </div>
        <div className="mt-2">
          <LabLegend points={data.points} />
        </div>
      </Card>

      <Card className="divide-y divide-line">
        {[...data.points].reverse().map((p) => (
          <Link key={p.reportId} to={`/patient/results/${p.reportId}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-canvas">
            <div className="min-w-0">
              <div className="text-sm font-medium">{fmtDate(p.date)}</div>
              <div className="flex items-center gap-1.5 text-xs text-navy-500">
                <span className="size-2 rounded-full" style={{ background: labColor(p.lab.id) }} />
                {p.lab.name} · “{p.localName}”
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="whitespace-nowrap font-bold tabular-nums">
                {formatValue(p.value, loinc)} <span className="text-xs font-normal text-navy-500">{data.definition.unit}</span>
              </span>
              <InterpretationTag value={p.interpretation} />
            </div>
          </Link>
        ))}
      </Card>
    </div>
  )
}
