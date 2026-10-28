import { ClipboardPlus, FilePenLine, Lock, Send, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { SummaryCard } from '../../components/records'
import { LabLegend, rangeText, TimelineChart } from '../../components/TimelineChart'
import {
  AppointmentStatusBadge,
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Field,
  InterpretationTag,
  Loading,
  Modal,
  SectionTitle,
  Select,
  Textarea,
  VerifiedBadge,
} from '../../components/ui'
import { t } from '../../i18n/strings'
import { ageFrom, formatRange, formatValue, testDef } from '../../lib/clinical'
import { fmtDate, fmtShortDate, fmtTime } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { getDoctorRecordSeries, getPatientRecord, getVisitTypes, logRecordAccess, requestAccess, sendFollowUpRequest } from '../../services/doctor'
import { useCurrentUser } from '../../store/auth'
import { toast } from '../../store/toast'
import type { AuditAction, FollowUpTimeframe } from '../../types'
import { AccessBadge } from './Patients'

export function PatientPage() {
  const { id = '' } = useParams()
  const user = useCurrentUser()
  const { data: rec, error } = useQuery(() => getPatientRecord(user.refId, id), [user.refId, id])
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const scope = rec?.access?.scope

  // Opening a record with access is written to the patient's access log.
  useEffect(() => {
    if (!scope) return
    const action: AuditAction = scope === 'all' ? 'viewed record' : scope === 'labs' ? 'viewed lab results' : 'viewed summaries'
    logRecordAccess(user.refId, id, action)
  }, [scope, user.refId, id])

  if (error) return <EmptyState>{error.message}</EmptyState>
  if (!rec) return <Loading />
  const { patient: p, access } = rec

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={p.name} size="lg" tone="navy" />
          <div className="min-w-[220px] flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{p.name}</h1>
            <div className="mt-1 text-sm text-navy-500">
              {ageFrom(p.birthDate)} y · {p.sex === 'male' ? t.auth.male : t.auth.female} · {fmtDate(p.birthDate)} · <span className="whitespace-nowrap">ID {p.identifier}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <AccessBadge row={rec} />
              {access && (
                <span className="text-sm text-navy-700">
                  {t.scope[access.scope]} · {access.end ? `until ${fmtDate(access.end)}` : t.expiry.untilRevoked.toLowerCase()}
                </span>
              )}
            </div>
          </div>
          {access && (
            <div className="flex flex-wrap gap-2">
              <ButtonLink to={`/doctor/patients/${p.id}/summary`}>
                <FilePenLine className="size-4" /> {t.doctor.writeSummary}
              </ButtonLink>
              <ButtonLink to={`/doctor/patients/${p.id}/order`} variant="secondary">
                <ClipboardPlus className="size-4" /> {t.doctor.orderTests}
              </ButtonLink>
              <Button variant="secondary" onClick={() => setFollowUpOpen(true)}>
                <Send className="size-4" /> {t.doctor.sendFollowUp}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {!access ? (
        <Locked patientId={p.id} pending={rec.pendingRequest} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <section>
              <SectionTitle>{t.doctor.recentResults}</SectionTitle>
              {!rec.canSeeLabs ? (
                <NotInScope />
              ) : rec.latest.length === 0 ? (
                <EmptyState>{t.doctor.noResults}</EmptyState>
              ) : (
                <div className="stagger grid gap-3 sm:grid-cols-2">
                  {rec.latest.map((o) => {
                    const report = rec.reports.find((r) => r.id === o.reportId)!
                    const tint = o.interpretation === 'H' ? 'border-high/30 bg-high-soft/50' : o.interpretation === 'L' ? 'border-low/30 bg-low-soft/60' : ''
                    return (
                      <Card key={o.id} className={`p-4 ${tint}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-semibold">{testDef(o.loinc).shortName}</div>
                          <InterpretationTag value={o.interpretation} />
                        </div>
                        <div className="mt-1">
                          <span className="text-3xl font-bold tabular-nums">{formatValue(o.value, o.loinc)}</span>
                          <span className="ml-1 text-sm text-navy-500">{o.unit}</span>
                        </div>
                        <div className="text-xs text-navy-500">Range {formatRange(o.refLow, o.refHigh, o.loinc)} {o.unit}</div>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-navy-500">
                          <VerifiedBadge lab={report.lab.name} />
                          <span>{fmtDate(o.effective)}</span>
                        </div>
                        {report.orderedBy && <div className="mt-1 text-xs text-navy-500">{t.status.orderedBy(report.orderedBy.name)}</div>}
                      </Card>
                    )
                  })}
                </div>
              )}
            </section>

            {rec.canSeeLabs && rec.measured.length > 0 && <TimelineSection patientId={p.id} codes={rec.measured} />}
          </div>

          <div className="space-y-6">
            <section>
              <SectionTitle>{t.doctor.previousSummaries}</SectionTitle>
              {!rec.canSeeSummaries ? (
                <NotInScope />
              ) : rec.summaries.length === 0 ? (
                <EmptyState>{t.doctor.noSummaries}</EmptyState>
              ) : (
                <div className="space-y-3">
                  {rec.summaries.map((s) => (
                    <SummaryCard key={s.id} summary={s} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <SectionTitle>{t.doctor.visitsWithYou}</SectionTitle>
              <Card className="divide-y divide-line">
                {rec.appointmentsWithMe.length === 0 && <p className="px-4 py-3 text-sm text-navy-500">{t.app.none}</p>}
                {rec.appointmentsWithMe.slice(0, 6).map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div>
                      <div className="font-medium">
                        {fmtShortDate(a.start)}, {fmtTime(a.start)}
                      </div>
                      <div className="text-xs text-navy-500">{a.visitType?.name}</div>
                    </div>
                    <AppointmentStatusBadge status={a.status} />
                  </div>
                ))}
              </Card>
            </section>
          </div>
        </div>
      )}

      <FollowUpModal open={followUpOpen} onClose={() => setFollowUpOpen(false)} patientId={p.id} patientName={p.name} />
    </div>
  )
}

function NotInScope() {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-dashed border-line-strong px-4 py-6 text-sm text-navy-500">
      <Lock className="size-4" /> {t.doctor.notInScope}
    </div>
  )
}

function Locked({ patientId, pending }: { patientId: string; pending: boolean }) {
  const user = useCurrentUser()
  const [busy, setBusy] = useState(false)
  return (
    <Card className="flex flex-col items-center px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-canvas text-navy-500 ring-1 ring-line">
        <Lock className="size-7" />
      </div>
      <h2 className="mt-5 max-w-md text-xl font-semibold">{t.doctor.lockedTitle}</h2>
      <p className="mt-2 max-w-md text-sm text-navy-500">{t.doctor.lockedText}</p>
      {pending ? (
        <Badge tone="amber" className="mt-6 px-4 py-1.5 text-sm">
          {t.doctor.requestSent}
        </Badge>
      ) : (
        <Button
          className="mt-6"
          size="lg"
          loading={busy}
          onClick={async () => {
            setBusy(true)
            await requestAccess(user.refId, patientId)
            toast(t.doctor.requestSent)
            setBusy(false)
          }}
        >
          <ShieldCheck className="size-5" /> {t.doctor.requestAccess}
        </Button>
      )}
    </Card>
  )
}

function TimelineSection({ patientId, codes }: { patientId: string; codes: string[] }) {
  const user = useCurrentUser()
  const [code, setCode] = useState(codes.includes('4548-4') ? '4548-4' : codes[0])
  const { data } = useQuery(() => getDoctorRecordSeries(user.refId, patientId, code), [user.refId, patientId, code])
  return (
    <section>
      <SectionTitle
        action={
          <Select className="w-auto py-1.5" value={code} onChange={(e) => setCode(e.target.value)} aria-label={t.doctor.timeline}>
            {codes.map((c) => (
              <option key={c} value={c}>
                {testDef(c).shortName}
              </option>
            ))}
          </Select>
        }
      >
        {t.doctor.timeline}
      </SectionTitle>
      <Card className="p-4">
        {data ? (
          <>
            <div className="mb-1 text-xs text-navy-500">
              {data.definition.name} · normal {rangeText(data)}
            </div>
            <TimelineChart series={data} height={240} />
            <div className="mt-2">
              <LabLegend points={data.points} />
            </div>
          </>
        ) : (
          <Loading />
        )}
      </Card>
    </section>
  )
}

function FollowUpModal({ open, onClose, patientId, patientName }: { open: boolean; onClose: () => void; patientId: string; patientName: string }) {
  const user = useCurrentUser()
  const { data: visitTypes } = useQuery(() => getVisitTypes(user.refId), [user.refId])
  const [visitTypeId, setVisitTypeId] = useState('')
  const [timeframe, setTimeframe] = useState<FollowUpTimeframe>('3m')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const send = async () => {
    setBusy(true)
    await sendFollowUpRequest({ practitionerId: user.refId, patientId, visitTypeId: visitTypeId || visitTypes![0].id, timeframe, note })
    toast(t.doctor.followUpSent)
    setBusy(false)
    setNote('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t.doctor.followUpTitle}>
      <p className="-mt-2 mb-4 text-sm text-navy-500">{patientName}</p>
      <div className="space-y-4">
        <Field label={t.doctor.visitType}>
          <Select value={visitTypeId || visitTypes?.[0]?.id || ''} onChange={(e) => setVisitTypeId(e.target.value)}>
            {visitTypes?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} · {v.durationMin} {t.app.min}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.doctor.timeframe}>
          <Select value={timeframe} onChange={(e) => setTimeframe(e.target.value as FollowUpTimeframe)}>
            {(Object.keys(t.timeframe) as FollowUpTimeframe[]).map((k) => (
              <option key={k} value={k}>
                In {t.timeframe[k]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.doctor.note}>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Blood pressure check after starting new medication." />
        </Field>
        <Button block loading={busy} disabled={!visitTypes?.length} onClick={send}>
          {t.doctor.send}
        </Button>
      </div>
    </Modal>
  )
}
