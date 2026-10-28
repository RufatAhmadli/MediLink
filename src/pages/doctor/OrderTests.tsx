import clsx from 'clsx'
import { Check } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Field, Loading, PageHeader, Select, Textarea } from '../../components/ui'
import { t } from '../../i18n/strings'
import { useQuery } from '../../lib/useQuery'
import { ALL_TESTS, getPartnerLabs } from '../../services/booking'
import { createLabOrder, getPatientRecord } from '../../services/doctor'
import { useCurrentUser } from '../../store/auth'
import { toast } from '../../store/toast'

export function OrderTests() {
  const { id = '' } = useParams()
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { data: rec } = useQuery(() => getPatientRecord(user.refId, id), [user.refId, id])
  const [selected, setSelected] = useState<string[]>([])
  const [labId, setLabId] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const { data: labs } = useQuery(() => getPartnerLabs(selected), [selected])

  if (!rec) return <Loading />
  const toggle = (testId: string) => setSelected((s) => (s.includes(testId) ? s.filter((x) => x !== testId) : [...s, testId]))
  const validLab = !labId || !labs || labs.some((l) => l.id === labId)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    await createLabOrder({ practitionerId: user.refId, patientId: id, testIds: selected, labId: labId || null, note })
    toast(t.doctor.orderSent)
    navigate(`/doctor/patients/${id}`)
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title={t.doctor.orderTitle} subtitle={rec.patient.name} back />
      <form onSubmit={submit} className="space-y-5">
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold">{t.doctor.catalog}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {ALL_TESTS.map((test) => {
              const on = selected.includes(test.id)
              return (
                <button
                  key={test.id}
                  type="button"
                  onClick={() => toggle(test.id)}
                  className={clsx(
                    'flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors',
                    on ? 'border-teal bg-teal-soft/60' : 'border-line hover:border-line-strong',
                  )}
                >
                  <span className={clsx('flex size-5 shrink-0 items-center justify-center rounded-md border', on ? 'border-teal bg-teal text-white' : 'border-line-strong')}>
                    {on && <Check className="size-3.5" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{test.name}</span>
                    <span className="block text-xs text-navy-500">LOINC {test.loinc}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </Card>
        <Card className="space-y-4 p-5">
          <Field label={t.doctor.lab} hint={!validLab ? 'This lab does not perform all selected tests.' : undefined}>
            <Select value={labId} onChange={(e) => setLabId(e.target.value)}>
              <option value="">{t.doctor.anyPartnerLab}</option>
              {labs?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} · {l.area}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.doctor.clinicalNote}>
            <Textarea required value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Kidney function on metformin; HbA1c control." />
          </Field>
        </Card>
        <div className="flex gap-2">
          <Button type="submit" size="lg" loading={busy} disabled={!selected.length || !validLab}>
            {t.doctor.sendOrder}
          </Button>
          <Button type="button" size="lg" variant="ghost" onClick={() => navigate(-1)}>
            {t.app.cancel}
          </Button>
        </div>
      </form>
    </div>
  )
}
