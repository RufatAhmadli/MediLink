import { useState } from 'react'
import { t } from '../i18n/strings'
import { toast } from '../store/toast'
import type { OpeningHours } from '../types'
import { Button, Card } from './ui'

/** Local draft of the weekly hours, saved with one button. */
export function WorkingHours({ initial, onSave }: { initial: OpeningHours; onSave: (hours: OpeningHours) => Promise<void> }) {
  const [hours, setHours] = useState(initial)
  const [busy, setBusy] = useState(false)
  return (
    <>
      <Card className="max-w-xl px-5 py-2">
        <WeeklyHoursEditor value={hours} onChange={setHours} />
      </Card>
      <Button
        className="mt-3"
        loading={busy}
        onClick={async () => {
          setBusy(true)
          await onSave(hours)
          setBusy(false)
          toast(t.app.saved)
        }}
      >
        {t.app.save}
      </Button>
    </>
  )
}

const DAYS: [number, string][] = [
  [1, 'Monday'],
  [2, 'Tuesday'],
  [3, 'Wednesday'],
  [4, 'Thursday'],
  [5, 'Friday'],
  [6, 'Saturday'],
  [0, 'Sunday'],
]

const timeInput =
  'rounded-lg border border-line-strong bg-white px-2.5 py-1.5 text-sm tabular-nums focus:border-teal focus:outline-none disabled:bg-canvas disabled:text-navy-300'

export function WeeklyHoursEditor({ value, onChange }: { value: OpeningHours; onChange: (v: OpeningHours) => void }) {
  return (
    <div className="divide-y divide-line">
      {DAYS.map(([d, label]) => {
        const h = value[d]
        return (
          <div key={d} className="flex flex-wrap items-center gap-3 py-2.5">
            <label className="flex w-36 items-center gap-2.5 text-sm font-medium">
              <input
                type="checkbox"
                className="size-4 accent-teal"
                checked={!!h}
                onChange={(e) => onChange({ ...value, [d]: e.target.checked ? { start: '09:00', end: '17:00' } : null })}
              />
              {label}
            </label>
            {h ? (
              <div className="flex items-center gap-2">
                <input type="time" className={timeInput} value={h.start} onChange={(e) => onChange({ ...value, [d]: { ...h, start: e.target.value } })} />
                <span className="text-navy-300">–</span>
                <input type="time" className={timeInput} value={h.end} onChange={(e) => onChange({ ...value, [d]: { ...h, end: e.target.value } })} />
              </div>
            ) : (
              <span className="text-sm text-navy-300">{t.doctor.closed}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
