import { Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button, Card, Input, Loading, PageHeader, Segmented, SectionTitle } from '../../components/ui'
import { WorkingHours } from '../../components/WeeklyHours'
import { t } from '../../i18n/strings'
import { newId } from '../../lib/clinical'
import { useQuery } from '../../lib/useQuery'
import { getAvailability, saveVisitType, saveWeeklyHours } from '../../services/doctor'
import { useCurrentUser } from '../../store/auth'
import { toast } from '../../store/toast'
import type { BookingMode, VisitType } from '../../types'

export function DoctorSettings() {
  const user = useCurrentUser()
  const { data } = useQuery(() => getAvailability(user.refId), [user.refId])
  if (!data) return <Loading />

  return (
    <div className="space-y-8">
      <PageHeader title={t.doctor.settings} />

      <section>
        <SectionTitle>{t.doctor.visitTypes}</SectionTitle>
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-navy-300">
                <th className="px-4 py-3 font-semibold">{t.doctor.name}</th>
                <th className="px-4 py-3 font-semibold">{t.doctor.duration}</th>
                <th className="px-4 py-3 font-semibold">{t.doctor.price}</th>
                <th className="px-4 py-3 font-semibold">{t.doctor.bookingMode}</th>
                <th className="px-4 py-3 font-semibold">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.visitTypes.map((v) => (
                <VisitTypeRow key={v.id} v={v} />
              ))}
            </tbody>
          </table>
          <AddVisitType practitionerId={user.refId} />
        </Card>
        <p className="mt-2 text-xs text-navy-500">
          <b>{t.status.instant}</b>: {t.doctor.instantHint}. <b>{t.status.request}</b>: {t.doctor.requestHint}.
        </p>
      </section>

      <section>
        <SectionTitle>{t.doctor.workingHours}</SectionTitle>
        <WorkingHours initial={data.weeklyHours} onSave={(hours) => saveWeeklyHours(user.refId, hours)} />
      </section>
    </div>
  )
}

function VisitTypeRow({ v }: { v: VisitType }) {
  const [duration, setDuration] = useState(String(v.durationMin))
  const [price, setPrice] = useState(String(v.priceAzn))
  const save = (patch: Partial<VisitType>) => saveVisitType({ ...v, ...patch }).then(() => toast(t.app.saved))

  return (
    <tr className={v.active ? '' : 'opacity-50'}>
      <td className="px-4 py-3 font-medium">{v.name}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Input
            className="w-20 py-1.5"
            type="number"
            min={10}
            step={5}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            onBlur={() => Number(duration) !== v.durationMin && save({ durationMin: Number(duration) })}
          />
          <span className="text-xs text-navy-500">{t.app.min}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Input
            className="w-20 py-1.5"
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={() => Number(price) !== v.priceAzn && save({ priceAzn: Number(price) })}
          />
          <span className="text-xs text-navy-500">{t.app.azn}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <Segmented<BookingMode>
          value={v.bookingMode}
          onChange={(bookingMode) => save({ bookingMode })}
          options={[
            { value: 'instant', label: `⚡ ${t.status.instant}` },
            { value: 'request', label: t.status.request },
          ]}
        />
      </td>
      <td className="px-4 py-3">
        <input type="checkbox" className="size-4 accent-teal" checked={v.active} onChange={(e) => save({ active: e.target.checked })} aria-label="Active" />
      </td>
    </tr>
  )
}

function AddVisitType({ practitionerId }: { practitionerId: string }) {
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('30')
  const [price, setPrice] = useState('50')
  const [mode, setMode] = useState<BookingMode>('instant')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await saveVisitType({
      id: newId('vt'),
      practitionerId,
      name: name.trim(),
      durationMin: Number(duration),
      priceAzn: Number(price),
      bookingMode: mode,
      active: true,
    })
    setName('')
    toast(t.app.saved)
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2 border-t border-line bg-canvas/50 px-4 py-3">
      <Input className="w-64 py-1.5" required value={name} onChange={(e) => setName(e.target.value)} placeholder={t.doctor.addVisitType} />
      <Input className="w-20 py-1.5" type="number" min={10} step={5} value={duration} onChange={(e) => setDuration(e.target.value)} aria-label={t.doctor.duration} />
      <Input className="w-20 py-1.5" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} aria-label={t.doctor.price} />
      <Segmented<BookingMode>
        value={mode}
        onChange={setMode}
        options={[
          { value: 'instant', label: t.status.instant },
          { value: 'request', label: t.status.request },
        ]}
      />
      <Button type="submit" size="sm" variant="subtle">
        <Plus className="size-4" /> Add
      </Button>
    </form>
  )
}
