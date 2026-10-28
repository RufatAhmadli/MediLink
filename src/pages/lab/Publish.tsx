import clsx from 'clsx'
import { CheckCircle2, Upload } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge, Button, ButtonLink, Card, EmptyState, InterpretationTag, Loading, PageHeader } from '../../components/ui'
import { t } from '../../i18n/strings'
import { formatRange, interpret } from '../../lib/clinical'
import { fmtTime, fmtWeekday } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { getPublishContext, getPublishQueue, publishResult } from '../../services/lab'
import { useCurrentUser } from '../../store/auth'
import { toast } from '../../store/toast'

export function Publish() {
  const user = useCurrentUser()
  const [params, setParams] = useSearchParams()
  const selected = params.get('booking')
  const [delivered, setDelivered] = useState<string | null>(null)
  const { data: queue } = useQuery(() => getPublishQueue(user.refId), [user.refId])

  return (
    <div>
      <PageHeader title={t.lab.publish} subtitle={t.lab.publishIntro} />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div>
          <h2 className="mb-2 text-sm font-semibold">{t.lab.chooseBooking}</h2>
          {!queue ? (
            <Loading />
          ) : queue.length === 0 ? (
            <EmptyState>{t.lab.nothingToPublish}</EmptyState>
          ) : (
            <div className="space-y-2">
              {queue.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setDelivered(null)
                    setParams({ booking: a.id })
                  }}
                  className={clsx(
                    'w-full rounded-xl border p-3 text-left transition-colors',
                    selected === a.id ? 'border-teal bg-teal-soft/60 ring-1 ring-teal' : 'border-line bg-white hover:border-line-strong',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{a.patient.name}</span>
                    <span className="text-xs tabular-nums text-navy-500">
                      {fmtWeekday(a.start)} {fmtTime(a.start)}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-navy-500">{a.tests.map((x) => x.name).join(', ')}</div>
                  <div className="mt-1.5">{a.order ? <Badge tone="blue">{t.lab.doctorOrdered}</Badge> : <Badge tone="gray">{t.lab.selfBooked}</Badge>}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {delivered ? (
            <Card className="flex flex-col items-center px-6 py-14 text-center">
              <CheckCircle2 className="size-14 text-teal" />
              <h2 className="mt-4 text-xl font-semibold">{t.lab.publishedMsg}</h2>
              <p className="mt-1 text-sm text-navy-500">{delivered}</p>
              <div className="mt-5">
                <Badge tone="teal" className="px-3 py-1 text-sm">
                  {t.lab.published}
                </Badge>
              </div>
              <ButtonLink to="/lab/sent" variant="secondary" className="mt-6">
                {t.lab.sent}
              </ButtonLink>
            </Card>
          ) : selected ? (
            <ResultForm
              key={selected}
              appointmentId={selected}
              onDone={(text) => {
                setDelivered(text)
                setParams({})
              }}
            />
          ) : (
            <EmptyState icon={<Upload className="size-6" />}>{t.lab.chooseBooking}</EmptyState>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultForm({ appointmentId, onDone }: { appointmentId: string; onDone: (text: string) => void }) {
  const { data: ctx, error } = useQuery(() => getPublishContext(appointmentId), [appointmentId])
  const [values, setValues] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  if (error) return <EmptyState>{error.message}</EmptyState>
  if (!ctx) return <Loading />
  const { appointment: a } = ctx
  const complete = ctx.components.every((c) => values[c.loinc] !== undefined && values[c.loinc] !== '' && !Number.isNaN(Number(values[c.loinc])))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await publishResult(a.id, Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Number(v)])))
      toast(t.lab.publishedMsg)
      const recipients = a.orderedBy ? `${a.patient.name} and ${a.orderedBy.name}` : a.patient.name
      onDone(`${a.tests.map((x) => x.name).join(', ')} · sent to ${recipients}`)
    } catch (err) {
      toast((err as Error).message, 'error')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">{a.patient.name}</div>
            <div className="text-sm text-navy-500">
              {a.patient.identifier} · {fmtWeekday(a.start)}, {fmtTime(a.start)}
            </div>
          </div>
          {a.order ? <Badge tone="blue">{t.lab.doctorOrdered}</Badge> : <Badge tone="gray">{t.lab.selfBooked}</Badge>}
        </div>
        {a.order && (
          <div className="mt-3 rounded-xl bg-canvas px-3 py-2 text-sm">
            <span className="text-xs font-semibold text-navy-500">{a.orderedBy?.name} · </span>
            {a.order.note}
          </div>
        )}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-navy-300">
                <th className="py-2 pr-3 font-semibold">{t.lab.localName}</th>
                <th className="py-2 pr-3 font-semibold">{t.lab.standard}</th>
                <th className="py-2 pr-3 font-semibold">{t.lab.value}</th>
                <th className="py-2 pr-3 font-semibold">{t.lab.unit}</th>
                <th className="py-2 pr-3 font-semibold">{t.lab.range}</th>
                <th className="py-2 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ctx.components.map((c) => {
                const raw = values[c.loinc] ?? ''
                const num = Number(raw)
                const flag = raw !== '' && !Number.isNaN(num) ? interpret(num, c.refLow, c.refHigh) : null
                return (
                  <tr key={c.loinc}>
                    <td className="py-3 pr-3 font-mono text-xs">{ctx.localNames[c.loinc]}</td>
                    <td className="py-3 pr-3">
                      <div className="font-medium">{c.shortName}</div>
                      <div className="text-xs text-navy-500">LOINC {c.loinc}</div>
                    </td>
                    <td className="py-3 pr-3">
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        required
                        value={raw}
                        onChange={(e) => setValues((v) => ({ ...v, [c.loinc]: e.target.value }))}
                        className={clsx(
                          'w-24 rounded-lg border px-2.5 py-1.5 text-right font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-teal/20',
                          flag === 'H' ? 'border-high bg-high-soft' : flag === 'L' ? 'border-low bg-low-soft' : 'border-line-strong focus:border-teal',
                        )}
                      />
                    </td>
                    <td className="py-3 pr-3 text-navy-500">{c.unit}</td>
                    <td className="py-3 pr-3 tabular-nums text-navy-500">{formatRange(c.refLow, c.refHigh, c.loinc)}</td>
                    <td className="py-3">{flag && <InterpretationTag value={flag} />}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <Button type="submit" size="lg" className="mt-4" loading={busy} disabled={!complete}>
        <Upload className="size-4" /> {t.lab.publishButton}
      </Button>
    </form>
  )
}
