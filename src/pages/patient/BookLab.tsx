import { CheckCircle2, ClipboardList, Lock, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { SlotPicker } from '../../components/records'
import { Badge, Button, ButtonLink, Card, Checkbox, Loading, PageHeader } from '../../components/ui'
import { t } from '../../i18n/strings'
import { catalogTest } from '../../lib/clinical'
import { fmtTime, fmtWeekday } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { bookLabVisit, getLabAvailability, getLabProfile } from '../../services/booking'
import { getAppointment, getLabOrder } from '../../services/patient'
import { useCurrentUser } from '../../store/auth'
import { toast } from '../../store/toast'
import type { OpeningHours } from '../../types'

type Step = 'tests' | 'slot' | 'done'

function openingHoursText(hours: OpeningHours): string {
  const span = (d: number) => (hours[d] ? `${hours[d]!.start}–${hours[d]!.end}` : 'closed')
  return `Mon–Fri ${span(1)} · Sat ${span(6)} · Sun ${span(0)}`
}

export function BookLab() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const rescheduleOf = params.get('reschedule') ?? undefined
  const user = useCurrentUser()

  const { data: profile } = useQuery(() => getLabProfile(id), [id])
  const { data: days } = useQuery(() => getLabAvailability(id), [id])
  const { data: previous } = useQuery(() => (rescheduleOf ? getAppointment(rescheduleOf) : Promise.resolve(null)), [rescheduleOf])
  const orderId = params.get('order') ?? previous?.serviceRequestId
  const { data: order } = useQuery(() => (orderId ? getLabOrder(orderId) : Promise.resolve(null)), [orderId])

  const [selected, setSelected] = useState<string[]>([])
  const [step, setStep] = useState<Step>('tests')
  const [start, setStart] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Orders and reschedules come with a fixed set of tests.
  const fixedTests = order?.testIds ?? previous?.testIds
  useEffect(() => {
    if (fixedTests) {
      setSelected(fixedTests)
      setStep((s) => (s === 'tests' ? 'slot' : s))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixedTests?.join()])

  if (!profile || (orderId && !order) || (rescheduleOf && !previous)) return <Loading />
  const { lab, tests, withoutOrder } = profile
  const total = selected.reduce((s, id) => s + catalogTest(id).priceAzn, 0)

  const confirm = async () => {
    if (!start) return
    setBusy(true)
    try {
      await bookLabVisit({ patientId: user.refId, labId: lab.id, testIds: selected, start, orderId: orderId ?? undefined, rescheduleOf })
      setStep('done')
      toast(t.patient.bookedTitle)
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  if (step === 'done' && start) {
    return (
      <div className="pt-6 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-teal-soft text-teal">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">{t.patient.bookedTitle}</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-navy-500">{t.patient.labBookedText}</p>
        <Card className="mt-6 p-4 text-left">
          <div className="font-semibold">{lab.name}</div>
          <div className="text-sm text-navy-500">{selected.map((s) => catalogTest(s).name).join(', ')}</div>
          <div className="mt-2 text-sm font-medium">
            {fmtWeekday(start)}, {fmtTime(start)} · {lab.address}
          </div>
        </Card>
        <div className="mt-6 space-y-2">
          <ButtonLink to={order ? '/patient/lab-orders' : '/patient/appointments'} block>
            {order ? t.patient.orders : t.patient.toAppointments}
          </ButtonLink>
          <ButtonLink to="/patient" block variant="ghost">
            {t.patient.toHome}
          </ButtonLink>
        </div>
      </div>
    )
  }

  const hours = lab.lab!.openingHours

  return (
    <div>
      <PageHeader title={rescheduleOf ? t.patient.rescheduling : lab.name} back />
      <Card className="p-4">
        <div className="font-semibold">{lab.name}</div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-navy-500">
          <MapPin className="size-3.5" /> {lab.address}
        </div>
        <div className="mt-3 text-xs text-navy-500">
          <span className="font-semibold text-navy-700">{t.patient.openingHours}: </span>
          {openingHoursText(hours)}
        </div>
        {order && (
          <div className="mt-3 flex gap-2 rounded-xl bg-teal-soft/60 px-3 py-2.5 text-sm">
            <ClipboardList className="mt-0.5 size-4 shrink-0 text-teal" />
            <div>
              <div className="font-semibold text-teal-dark">{t.patient.forOrder(order.requester.name)}</div>
              <div className="text-xs text-navy-700">{order.tests.map((x) => x.name).join(', ')}</div>
            </div>
          </div>
        )}
      </Card>

      {step === 'tests' && (
        <section className="mt-5">
          <h2 className="mb-1 font-semibold">{t.patient.chooseTests}</h2>
          <p className="mb-3 text-sm text-navy-500">{t.patient.withoutOrder}.</p>
          <Card className="divide-y divide-line">
            {tests.map((test) => {
              const allowed = withoutOrder.has(test.id)
              return (
                <div key={test.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <Checkbox
                    disabled={!allowed}
                    checked={selected.includes(test.id)}
                    onChange={(on) => setSelected((s) => (on ? [...s, test.id] : s.filter((x) => x !== test.id)))}
                    label={test.name}
                    description={
                      allowed ? (
                        `LOINC ${test.loinc}`
                      ) : (
                        <span className="inline-flex items-center gap-1 text-low">
                          <Lock className="size-3" /> {t.patient.requiresOrder}
                        </span>
                      )
                    }
                  />
                  <span className="shrink-0 text-sm font-semibold">
                    {test.priceAzn} <span className="text-xs font-normal text-navy-500">{t.app.azn}</span>
                  </span>
                </div>
              )
            })}
          </Card>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-navy-500">{t.patient.total}</span>
            <span className="text-lg font-bold">
              {total} {t.app.azn}
            </span>
          </div>
          <Button className="mt-4" block size="lg" disabled={!selected.length} onClick={() => setStep('slot')}>
            {t.app.continue}
          </Button>
        </section>
      )}

      {step === 'slot' && (
        <section className="mt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">{t.patient.chooseSlot}</h2>
            <Badge tone="teal">⚡ {t.status.instant}</Badge>
          </div>
          {!fixedTests && (
            <button onClick={() => setStep('tests')} className="mb-3 text-sm text-navy-500 hover:text-navy">
              {selected.map((s) => catalogTest(s).name).join(', ')} · <span className="font-semibold text-teal">change</span>
            </button>
          )}
          {days ? <SlotPicker days={days} value={start} onChange={setStart} /> : <Loading />}
          <Button className="mt-5" block size="lg" disabled={!start} loading={busy} onClick={confirm}>
            {t.patient.confirmBooking}
            {start && ` · ${fmtWeekday(start)}, ${fmtTime(start)}`}
          </Button>
        </section>
      )}
    </div>
  )
}
