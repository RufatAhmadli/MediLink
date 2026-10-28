import { Search, X } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Card, Field, Input, Loading, PageHeader, Select, Textarea } from '../../components/ui'
import { t } from '../../i18n/strings'
import { fmtShortDate, fmtTime } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { ICD10 } from '../../mock/catalog'
import { getPatientRecord, writeSummary } from '../../services/doctor'
import { useCurrentUser } from '../../store/auth'
import { toast } from '../../store/toast'
import type { Diagnosis } from '../../types'

export function WriteSummary() {
  const { id = '' } = useParams()
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { data: rec } = useQuery(() => getPatientRecord(user.refId, id), [user.refId, id])

  const [appointmentId, setAppointmentId] = useState<string | null>(null)
  const [form, setForm] = useState({ reason: '', findings: '', treatment: '', recommendations: '', followUp: '' })
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [icdQuery, setIcdQuery] = useState('')
  const [busy, setBusy] = useState(false)

  const matches = useMemo(() => {
    const q = icdQuery.trim().toLowerCase()
    if (!q) return []
    return ICD10.filter((c) => (c.code.toLowerCase().startsWith(q) || c.name.toLowerCase().includes(q)) && !diagnoses.some((d) => d.code === c.code)).slice(0, 6)
  }, [icdQuery, diagnoses])

  if (!rec) return <Loading />

  // Visits this summary can belong to: booked or recent ones with this doctor.
  const visits = rec.appointmentsWithMe.filter((a) => a.status === 'booked' || a.status === 'fulfilled').slice(0, 8)
  const defaultVisit = visits.find((a) => a.status === 'booked')?.id ?? ''
  const selectedVisit = appointmentId ?? defaultVisit

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    await writeSummary({ practitionerId: user.refId, patientId: id, appointmentId: selectedVisit || undefined, diagnoses, ...form })
    toast(t.doctor.summarySaved)
    navigate(`/doctor/patients/${id}`)
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title={t.doctor.summaryTitle} subtitle={rec.patient.name} back />
      <form onSubmit={submit} className="space-y-5">
        <Card className="space-y-5 p-5">
          <Field label={t.doctor.forVisit}>
            <Select value={selectedVisit} onChange={(e) => setAppointmentId(e.target.value)}>
              <option value="">{t.doctor.noVisit}</option>
              {visits.map((a) => (
                <option key={a.id} value={a.id}>
                  {fmtShortDate(a.start)}, {fmtTime(a.start)} · {a.visitType?.name} · {t.status.appointment[a.status]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.doctor.reason}>
            <Textarea required rows={2} value={form.reason} onChange={set('reason')} placeholder="e.g. Blood pressure review, new lab results." />
          </Field>
          <Field label={t.doctor.findings}>
            <Textarea rows={3} value={form.findings} onChange={set('findings')} placeholder="Examination, vitals, relevant results." />
          </Field>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-navy-700">{t.doctor.diagnosis}</span>
            {diagnoses.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {diagnoses.map((d) => (
                  <Badge key={d.code} tone="navy" className="py-1 pr-1">
                    {d.code} · {d.name}
                    <button type="button" onClick={() => setDiagnoses((x) => x.filter((y) => y.code !== d.code))} className="ml-1 rounded-full p-0.5 hover:bg-white/20" aria-label={`Remove ${d.code}`}>
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-300" />
              <Input className="pl-10" value={icdQuery} onChange={(e) => setIcdQuery(e.target.value)} placeholder={t.doctor.icdSearch} />
              {matches.length > 0 && (
                <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-line bg-white shadow-lg">
                  {matches.map((c) => (
                    <li key={c.code}>
                      <button
                        type="button"
                        onClick={() => {
                          setDiagnoses((x) => [...x, c])
                          setIcdQuery('')
                        }}
                        className="flex w-full gap-3 px-4 py-2.5 text-left text-sm hover:bg-teal-soft/50"
                      >
                        <span className="w-10 font-mono font-semibold text-teal-dark">{c.code}</span>
                        {c.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <Field label={t.doctor.treatment}>
            <Textarea rows={2} value={form.treatment} onChange={set('treatment')} placeholder="Medication, dose, procedures." />
          </Field>
          <Field label={t.doctor.recommendations}>
            <Textarea rows={2} value={form.recommendations} onChange={set('recommendations')} />
          </Field>
          <Field label={t.doctor.followUp}>
            <Input value={form.followUp} onChange={set('followUp')} placeholder="e.g. Review in 3 months with HbA1c." />
          </Field>
        </Card>
        <div className="flex gap-2">
          <Button type="submit" size="lg" loading={busy} disabled={!diagnoses.length}>
            {t.doctor.saveSummary}
          </Button>
          <Button type="button" size="lg" variant="ghost" onClick={() => navigate(-1)}>
            {t.app.cancel}
          </Button>
        </div>
      </form>
    </div>
  )
}
