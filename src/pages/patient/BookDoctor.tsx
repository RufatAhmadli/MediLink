import { CheckCircle2, Clock, Hourglass, Languages, MapPin, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { SlotPicker } from '../../components/records'
import { Avatar, Badge, BookingModeBadge, Button, ButtonLink, Card, Loading, PageHeader, RadioCard } from '../../components/ui'
import { t } from '../../i18n/strings'
import { fmtTime, fmtWeekday } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { bookDoctorVisit, getDoctorAvailability, getDoctorProfile } from '../../services/booking'
import { getFollowUp } from '../../services/patient'
import { useCurrentUser } from '../../store/auth'
import { toast } from '../../store/toast'
import type { BookingMode } from '../../types'

type Step = 'visit' | 'slot' | 'consent' | 'review' | 'done'
type Share = 'all' | 'labs'

export function BookDoctor() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const followUpId = params.get('followUp') ?? undefined
  const rescheduleOf = params.get('reschedule') ?? undefined
  const user = useCurrentUser()
  const navigate = useNavigate()

  const [visitTypeId, setVisitTypeId] = useState<string | null>(params.get('visitType'))
  const [step, setStep] = useState<Step>(params.get('visitType') ? 'slot' : 'visit')
  const [start, setStart] = useState<string | null>(null)
  const [share, setShare] = useState<Share | null>('all')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<BookingMode | null>(null)

  const { data: profile } = useQuery(() => getDoctorProfile(id), [id])
  const { data: followUp } = useQuery(() => (followUpId ? getFollowUp(followUpId) : Promise.resolve(null)), [followUpId])
  const { data: days } = useQuery(
    () => (visitTypeId ? getDoctorAvailability(id, visitTypeId) : Promise.resolve([])),
    [id, visitTypeId],
  )

  if (!profile) return <Loading />
  const { practitioner: doctor, organization: clinic, visitTypes } = profile
  const vt = visitTypes.find((v) => v.id === visitTypeId)

  const confirm = async () => {
    if (!vt || !start) return
    setBusy(true)
    const { mode } = await bookDoctorVisit({
      patientId: user.refId,
      practitionerId: doctor.id,
      visitTypeId: vt.id,
      start,
      shareScope: share,
      followUpRequestId: followUpId,
      rescheduleOf,
    })
    setResult(mode)
    setStep('done')
    setBusy(false)
    toast(mode === 'instant' ? t.patient.bookedTitle : t.patient.requestedTitle)
  }

  if (step === 'done' && vt && start) {
    return (
      <div className="pt-6 text-center">
        <div className={`mx-auto flex size-16 items-center justify-center rounded-full ${result === 'instant' ? 'bg-teal-soft text-teal' : 'bg-low-soft text-low'}`}>
          {result === 'instant' ? <CheckCircle2 className="size-8" /> : <Hourglass className="size-8" />}
        </div>
        <h1 className="mt-5 text-2xl font-bold">{result === 'instant' ? t.patient.bookedTitle : t.patient.requestedTitle}</h1>
        {result === 'request' && <p className="mx-auto mt-2 max-w-xs text-sm text-navy-500">{t.patient.requestedText}</p>}
        <Card className="mt-6 p-4 text-left">
          <div className="font-semibold">{doctor.name}</div>
          <div className="text-sm text-navy-500">
            {vt.name} · {clinic.name}
          </div>
          <div className="mt-2 text-sm font-medium">
            {fmtWeekday(start)}, {fmtTime(start)}
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-canvas px-3 py-2 text-xs text-navy-500">
            <ShieldCheck className="size-4 shrink-0 text-teal" />
            {share ? t.patient.sharedNote(t.scope[share]) : t.patient.notSharedNote}
          </div>
        </Card>
        <div className="mt-6 space-y-2">
          <ButtonLink to="/patient/appointments" block>
            {t.patient.toAppointments}
          </ButtonLink>
          <ButtonLink to="/patient" block variant="ghost">
            {t.patient.toHome}
          </ButtonLink>
        </div>
      </div>
    )
  }

  const back = () => {
    if (step === 'slot' && !params.get('visitType')) setStep('visit')
    else if (step === 'consent') setStep('slot')
    else if (step === 'review') setStep('consent')
    else navigate(-1)
  }

  return (
    <div>
      <PageHeader title={rescheduleOf ? t.patient.rescheduling : doctor.name} />
      <button onClick={back} className="-mt-3 mb-4 text-sm font-medium text-navy-500 hover:text-navy">
        ← {t.app.back}
      </button>

      <Card className="p-4">
        <div className="flex gap-3">
          <Avatar name={doctor.name} size="lg" />
          <div className="min-w-0">
            <div className="text-lg font-semibold leading-tight">{doctor.name}</div>
            <div className="text-sm text-teal-dark">{doctor.specialty}</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-navy-500">
              <MapPin className="size-3.5" /> {clinic.name}, {clinic.address}
            </div>
          </div>
        </div>
        {step === 'visit' && (
          <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm text-navy-700">
            <p>{doctor.bio}</p>
            <p className="flex items-center gap-1.5 text-xs text-navy-500">
              <Languages className="size-4" /> {doctor.languages.join(', ')} · {t.patient.yearsExperience(doctor.yearsExperience)}
            </p>
            {clinic.partner && <Badge tone="teal">{t.patient.partner}</Badge>}
          </div>
        )}
        {followUp && (
          <div className="mt-3 rounded-xl bg-teal-soft/60 px-3 py-2 text-xs font-medium text-teal-dark">{t.patient.fromFollowUp(followUp.requester.name)}</div>
        )}
      </Card>

      <Stepper step={step} />

      {step === 'visit' && (
        <section className="mt-5">
          <h2 className="mb-3 font-semibold">{t.patient.chooseVisit}</h2>
          <div className="space-y-2">
            {visitTypes.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setVisitTypeId(v.id)
                  setStart(null)
                  setStep('slot')
                }}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line/80 bg-white shadow-card p-4 text-left hover:border-teal"
              >
                <div className="min-w-0">
                  <div className="font-semibold">{v.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-navy-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" /> {v.durationMin} {t.app.min}
                    </span>
                    <BookingModeBadge mode={v.bookingMode} />
                  </div>
                </div>
                <div className="shrink-0 text-right text-lg font-bold">
                  {v.priceAzn} <span className="text-xs font-medium text-navy-500">{t.app.azn}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 'slot' && vt && (
        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold">{t.patient.chooseSlot}</h2>
            <BookingModeBadge mode={vt.bookingMode} />
          </div>
          <p className="-mt-2 mb-3 text-sm text-navy-500">
            {vt.name} · {vt.durationMin} {t.app.min} · {vt.priceAzn} {t.app.azn}
          </p>
          {days ? <SlotPicker days={days} value={start} onChange={setStart} /> : <Loading />}
          <Button className="mt-5" block size="lg" disabled={!start} onClick={() => setStep('consent')}>
            {t.app.continue}
          </Button>
        </section>
      )}

      {step === 'consent' && (
        <section className="mt-5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-teal-soft text-teal">
            <ShieldCheck className="size-6" />
          </div>
          <h2 className="mt-3 text-lg font-semibold leading-snug">{t.patient.consentTitle(doctor.name)}</h2>
          <p className="mt-1 text-sm text-navy-500">{t.patient.consentIntro}</p>
          <div className="mt-4 space-y-2">
            <RadioCard checked={share === 'all'} onSelect={() => setShare('all')} title={t.scope.all} description="Lab results and previous doctors’ summaries" />
            <RadioCard checked={share === 'labs'} onSelect={() => setShare('labs')} title={t.scope.labs} description="Verified results from partner labs" />
          </div>
          <p className="mt-3 text-xs text-navy-500">{t.patient.consentExpiry}</p>
          <div className="mt-5 space-y-2">
            <Button block size="lg" disabled={!share} onClick={() => setStep('review')}>
              {t.patient.shareThis}
            </Button>
            <Button
              block
              variant="ghost"
              onClick={() => {
                setShare(null)
                setStep('review')
              }}
            >
              {t.patient.dontShare}
            </Button>
          </div>
        </section>
      )}

      {step === 'review' && vt && start && (
        <section className="mt-5">
          <h2 className="mb-3 font-semibold">{t.patient.review}</h2>
          <Card className="divide-y divide-line">
            {[
              ['Visit', vt.name],
              ['When', `${fmtWeekday(start)}, ${fmtTime(start)} (${vt.durationMin} ${t.app.min})`],
              ['Where', `${clinic.name}, ${clinic.address}`],
              ['Price', `${vt.priceAzn} ${t.app.azn} · paid at the clinic`],
              ['Records', share ? `${t.scope[share]} · until 7 days after the visit` : 'Not shared'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
                <span className="text-navy-500">{k}</span>
                <span className="text-right font-medium">{v}</span>
              </div>
            ))}
          </Card>
          <div className="mt-3">
            <BookingModeBadge mode={vt.bookingMode} />
            {vt.bookingMode === 'request' && <p className="mt-2 text-xs text-navy-500">{t.status.waitingForDoctor} — the doctor approves this visit type.</p>}
          </div>
          <Button className="mt-5" block size="lg" loading={busy} onClick={confirm}>
            {vt.bookingMode === 'instant' ? t.patient.confirmBooking : t.patient.sendRequest}
          </Button>
        </section>
      )}
    </div>
  )
}

function Stepper({ step }: { step: Step }) {
  const steps: Step[] = ['visit', 'slot', 'consent', 'review']
  const index = steps.indexOf(step)
  return (
    <div className="mt-4 flex gap-1.5" aria-hidden="true">
      {steps.map((s, i) => (
        <span key={s} className={`h-1 flex-1 rounded-full ${i <= index ? 'bg-teal' : 'bg-line'}`} />
      ))}
    </div>
  )
}
