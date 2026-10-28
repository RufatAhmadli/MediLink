import clsx from 'clsx'
import { ArrowRight, BadgeCheck, BellRing, Eye, FlaskConical, Star, Upload } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState, type ReactNode } from 'react'
import { interpret, testDef } from '../../lib/clinical'
import { labColor } from '../../lib/labColors'

// Small, self-contained feature illustrations with fixed sample data.
// Used by the feature tour on the login and /features pages.

export const Row = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={clsx('flex items-center justify-between gap-3 rounded-xl bg-canvas px-3 py-2.5', className)}>{children}</div>
)

export function Flag({ value }: { value: 'H' | 'L' | 'N' }) {
  if (value === 'N') return <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-navy-500 ring-1 ring-line">Normal</span>
  return (
    <span className={clsx('rounded-full px-2 py-0.5 text-xs font-semibold', value === 'H' ? 'bg-high-soft text-high' : 'bg-low-soft text-low')}>
      {value === 'H' ? '▲ High' : '▼ Low'}
    </span>
  )
}

export function TimelineWidget() {
  const points = [
    { date: 'Nov 24', v: 8.6, lab: 'lab-merkez', name: 'Mərkəz' },
    { date: 'Mar 25', v: 8.2, lab: 'lab-caspian', name: 'Caspian' },
    { date: 'Jun 25', v: 7.7, lab: 'lab-nur', name: 'Nur' },
    { date: 'Oct 25', v: 7.4, lab: 'lab-merkez', name: 'Mərkəz' },
    { date: 'Jan 26', v: 7.1, lab: 'lab-caspian', name: 'Caspian' },
    { date: 'May 26', v: 6.9, lab: 'lab-nur', name: 'Nur' },
    { date: 'Aug 26', v: 7.2, lab: 'lab-merkez', name: 'Mərkəz' },
  ]
  const [hover, setHover] = useState(points.length - 1)
  const x = (i: number) => 24 + i * 72
  const y = (v: number) => 150 - (v - 3.5) * 26
  const p = points[hover]
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums">{p.v}</span>
        <span className="text-sm text-navy-500">%</span>
        <Flag value="H" />
        <span className="ml-auto text-sm text-navy-500">
          {p.date} · <span style={{ color: labColor(p.lab) }} className="font-semibold">{p.name}</span>
        </span>
      </div>
      <svg viewBox="0 0 480 160" className="mt-2 h-44 w-full">
        <rect x="0" y={y(5.6)} width="480" height={y(4) - y(5.6)} rx="6" fill="#0B7A6F" opacity="0.09" />
        <text x="476" y={y(5.6) - 6} textAnchor="end" fontSize="12" fill="#0B7A6F">normal 4.0–5.6</text>
        <polyline points={points.map((pt, i) => `${x(i)},${y(pt.v)}`).join(' ')} fill="none" stroke="#74829a" strokeWidth="2.5" strokeDasharray="600" className="animate-draw" />
        {points.map((pt, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} className="cursor-pointer">
            <circle cx={x(i)} cy={y(pt.v)} r="16" fill="transparent" />
            <circle cx={x(i)} cy={y(pt.v)} r={hover === i ? 9 : 6.5} fill={labColor(pt.lab)} stroke="#fff" strokeWidth="2.5" className="transition-all duration-200" />
            {hover === i && <circle cx={x(i)} cy={y(pt.v)} r="14" fill="none" stroke={labColor(pt.lab)} strokeOpacity="0.35" strokeWidth="2" />}
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap gap-4 text-sm text-navy-500">
        {[
          ['lab-merkez', 'Mərkəz Lab'],
          ['lab-caspian', 'Caspian Diagnostics'],
          ['lab-nur', 'Nur Lab'],
        ].map(([id, name]) => (
          <span key={id} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: labColor(id) }} /> {name}
          </span>
        ))}
      </div>
    </div>
  )
}

export function ResultsWidget() {
  return (
    <div className="space-y-2">
      <span className="inline-flex items-center gap-1 rounded-full bg-teal-soft px-2.5 py-0.5 text-xs font-semibold text-teal-dark">
        <BadgeCheck className="size-3.5" /> Verified · from Mərkəz Lab
      </span>
      {[
        ['HbA1c', '7.2', '%', 'H'],
        ['Cholesterol', '5.0', 'mmol/L', 'N'],
        ['Creatinine', '118', 'µmol/L', 'H'],
      ].map(([name, v, unit, flag]) => (
        <Row key={name} className={flag === 'H' ? 'bg-high-soft/60' : ''}>
          <span className="text-sm font-semibold">{name}</span>
          <span className="flex items-center gap-2">
            <b className={clsx('tabular-nums', flag === 'H' && 'text-high')}>{v}</b>
            <span className="text-xs text-navy-500">{unit}</span>
            <Flag value={flag as 'H' | 'N'} />
          </span>
        </Row>
      ))}
    </div>
  )
}

export function BookingWidget() {
  const slots = ['09:00', '09:30', '10:30', '11:00', '14:00', '15:30']
  const [picked, setPicked] = useState('10:30')
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-teal-soft text-sm font-bold text-teal-dark">LH</span>
        <div>
          <div className="text-sm font-semibold">Dr. Leyla Hasanova</div>
          <div className="text-xs text-navy-500">Cardiology consultation · 60 AZN</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {slots.map((s) => (
          <button
            key={s}
            onClick={() => setPicked(s)}
            className={clsx(
              'rounded-lg border py-1.5 text-sm font-semibold tabular-nums transition-colors',
              picked === s ? 'border-teal bg-teal text-white' : 'border-line hover:border-teal hover:text-teal',
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-teal-soft px-2.5 py-0.5 text-xs font-semibold text-teal-dark">⚡ Instant booking</span>
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Request</span>
      </div>
    </div>
  )
}

export function ScheduleWidget() {
  const rows = [
    ['09:30', 'Farid Novruzov', 'Cardiology consultation', 'booked'],
    ['11:00', 'Orkhan Babayev', 'ECG + consultation', 'booked'],
    ['12:00', 'Gunay Aliyeva', 'Cardiology consultation', 'booked'],
    ['15:00', 'Farid Novruzov', 'Extended consultation with echo', 'pending'],
  ]
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rows.map(([time, name, type, status]) => (
        <div
          key={time}
          className={clsx(
            'flex items-center gap-3 rounded-xl px-3 py-2.5',
            status === 'pending' ? 'border border-dashed border-low bg-low-soft' : 'bg-teal-soft/60 ring-1 ring-teal/25',
          )}
        >
          <span className="text-sm font-bold tabular-nums text-navy-700">{time}</span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{name}</div>
            <div className={clsx('truncate text-xs', status === 'pending' ? 'font-semibold text-low' : 'text-navy-500')}>
              {status === 'pending' ? 'Waiting for confirmation' : type}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function InboxWidget() {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2.5 rounded-xl bg-navy px-3 py-3 text-white">
        <span className="relative mt-0.5 flex size-7 shrink-0 items-center justify-center">
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-teal-glow/40" />
          <BellRing className="relative size-4 text-teal-glow" />
        </span>
        <span className="text-sm font-medium">Results ready for Elshad Mammadov — HbA1c, Creatinine</span>
      </div>
      <Row>
        <span className="text-sm font-semibold">Farid Novruzov</span>
        <span className="text-xs text-navy-500">Lipid panel · Caspian</span>
      </Row>
    </div>
  )
}

export function FeedbackWidget() {
  const dist = [3, 2, 0, 0, 0]
  return (
    <div className="flex items-center gap-4">
      <div>
        <div className="text-4xl font-bold tabular-nums">4.6</div>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className={clsx('size-4', i <= 4 ? 'fill-amber-400 text-amber-400' : 'fill-amber-200 text-amber-200')} />
          ))}
        </div>
        <div className="text-xs text-navy-500">5 reviews</div>
      </div>
      <div className="flex-1 space-y-1">
        {dist.map((n, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-navy-500">
            <span className="w-2">{5 - i}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas ring-1 ring-line">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${(n / 5) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SummariesWidget() {
  return (
    <div className="space-y-2">
      {[
        ['Dr. Rauf Aliyev', 'Endocrinologist', 'E11 · Type 2 diabetes'],
        ['Dr. Leyla Hasanova', 'Cardiologist', 'I10 · Hypertension'],
      ].map(([doc, spec, dx]) => (
        <div key={doc} className="rounded-xl bg-canvas px-3 py-2.5">
          <div className="text-sm font-semibold">{doc}</div>
          <div className="text-xs text-navy-500">{spec}</div>
          <span className="mt-1.5 inline-block rounded-full bg-navy px-2 py-0.5 text-xs font-semibold text-white">{dx}</span>
        </div>
      ))}
    </div>
  )
}

export function ConsentWidget() {
  const [revoked, setRevoked] = useState(false)
  return (
    <div className="space-y-2">
      <div className={clsx('rounded-xl p-3 transition-colors', revoked ? 'bg-canvas' : 'bg-teal-soft/60 ring-1 ring-teal/25')}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">Dr. Leyla Hasanova</div>
            <div className="text-xs text-navy-500">{revoked ? 'Access revoked' : 'Lab results · until 7 days after visit'}</div>
          </div>
          <button
            onClick={() => setRevoked((v) => !v)}
            className={clsx(
              'rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors',
              revoked ? 'bg-white text-teal ring-1 ring-line' : 'bg-white text-high ring-1 ring-high/30 hover:bg-high-soft',
            )}
          >
            {revoked ? 'Undo' : 'Revoke'}
          </button>
        </div>
      </div>
      <div className="flex items-start gap-2 px-1 text-xs text-navy-500">
        <Eye className="mt-0.5 size-3.5 shrink-0" />
        <span>
          <b className="text-navy">Dr. Rauf Aliyev</b> viewed lab results · 16:20
        </span>
      </div>
    </div>
  )
}

export function QrWidget() {
  const [left, setLeft] = useState(600)
  useEffect(() => {
    const id = setInterval(() => setLeft((s) => (s <= 1 ? 600 : s - 1)), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="flex items-center gap-4">
      <div className="rounded-xl bg-white p-2 ring-1 ring-line">
        <QRCodeSVG value="https://medilink.demo/share/K7P-4QX" size={92} fgColor="#13233A" />
      </div>
      <div>
        <div className="font-mono text-xl font-bold tracking-widest">K7P-4QX</div>
        <div className="mt-1 inline-block rounded-full bg-teal-soft px-2.5 py-0.5 text-xs font-semibold tabular-nums text-teal-dark">
          Valid for {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
        </div>
      </div>
    </div>
  )
}

export function FollowUpWidget() {
  return (
    <div className="rounded-xl bg-canvas p-3">
      <p className="text-sm font-semibold">Dr. Nigar Huseynova asks you to book a follow-up in about 2 weeks.</p>
      <p className="mt-1 text-xs text-navy-500">Antenatal visit · Sahil Women's Clinic</p>
      <span className="mt-2 inline-block rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white">Choose a time</span>
    </div>
  )
}

export function PublishWidget() {
  const codes = ['4548-4', '2160-0', '2345-7']
  const [values, setValues] = useState<Record<string, string>>({ '4548-4': '7.0', '2160-0': '96', '2345-7': '' })
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[440px] text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-navy-300">
            <th className="pb-2 font-semibold">Test</th>
            <th className="pb-2 font-semibold">Value</th>
            <th className="pb-2 font-semibold">Range</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {codes.map((code) => {
            const def = testDef(code)
            const raw = values[code]
            const flag = raw !== '' && !Number.isNaN(Number(raw)) ? interpret(Number(raw), def.refLow, def.refHigh) : null
            return (
              <tr key={code} className="border-t border-line">
                <td className="py-2 pr-2">
                  <div className="font-semibold">{def.shortName}</div>
                  <div className="text-xs text-navy-500">LOINC {code}</div>
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="number"
                    step="any"
                    value={raw}
                    placeholder="type…"
                    onChange={(e) => setValues((v) => ({ ...v, [code]: e.target.value }))}
                    className={clsx(
                      'w-24 rounded-lg border px-2.5 py-1.5 text-right font-semibold tabular-nums outline-none focus:ring-2 focus:ring-teal/20',
                      flag === 'H' ? 'border-high bg-high-soft' : flag === 'L' ? 'border-low bg-low-soft' : 'border-line-strong',
                    )}
                  />
                  <span className="ml-1.5 text-xs text-navy-500">{def.unit}</span>
                </td>
                <td className="py-2 pr-2 tabular-nums text-navy-500">
                  {def.refLow ?? '<'}
                  {def.refLow !== null && '–'}
                  {def.refHigh}
                </td>
                <td className="py-2">{flag && <Flag value={flag} />}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-2.5 py-0.5 text-xs font-semibold text-teal-dark">
        <Upload className="size-3.5" /> Publish → delivered to patient and Dr. Hasanova
      </div>
    </div>
  )
}

export function MappingWidget() {
  return (
    <div className="space-y-2">
      {[
        ['Qan şəkəri', 'Glucose', '2345-7'],
        ['GLU', 'Glucose', '2345-7'],
        ['Glycated Hb', 'HbA1c', '4548-4'],
      ].map(([local, std, code]) => (
        <Row key={local}>
          <span className="font-mono text-xs">“{local}”</span>
          <ArrowRight className="size-3.5 shrink-0 text-teal" />
          <span className="text-right text-sm">
            <b>{std}</b> <span className="text-xs text-navy-500">{code}</span>
          </span>
        </Row>
      ))}
    </div>
  )
}

export function OrdersWidget() {
  return (
    <div className="rounded-xl bg-canvas p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">Elshad Mammadov</span>
        <span className="rounded-full bg-low-soft px-2 py-0.5 text-xs font-semibold text-low">To book</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {['HbA1c', 'Creatinine'].map((x) => (
          <span key={x} className="rounded-full bg-navy px-2 py-0.5 text-xs font-semibold text-white">
            {x}
          </span>
        ))}
      </div>
      <p className="mt-2 flex items-start gap-1.5 text-xs text-navy-500">
        <FlaskConical className="mt-0.5 size-3.5 shrink-0" /> Dr. Leyla Hasanova · “Kidney function and diabetes control.”
      </p>
    </div>
  )
}
