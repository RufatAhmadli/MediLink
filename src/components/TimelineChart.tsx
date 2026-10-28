import { format } from 'date-fns'
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { t } from '../i18n/strings'
import { formatRange, formatValue } from '../lib/clinical'
import { labColor } from '../lib/labColors'
import type { ObservationSeries, SeriesPoint } from '../services/patient'
import { InterpretationTag } from './ui'

function yDomain(series: ObservationSeries): [number, number] {
  const { refLow, refHigh } = series.definition
  const values = series.points.map((p) => p.value)
  const lo = Math.min(...values, refLow ?? Infinity)
  const hi = Math.max(...values, refHigh ?? -Infinity)
  const pad = (hi - lo) * 0.15 || 1
  return [Math.max(0, lo - pad), hi + pad]
}

interface DotProps {
  cx?: number
  cy?: number
  payload?: SeriesPoint
  index?: number
}

function LabDot({ cx, cy, payload, showLabel }: DotProps & { showLabel: boolean }) {
  if (cx === undefined || cy === undefined || !payload) return null
  const color = labColor(payload.lab.id)
  const flagged = payload.interpretation !== 'N'
  return (
    <g>
      {flagged && <circle cx={cx} cy={cy} r={9} fill="none" stroke={payload.interpretation === 'H' ? '#B42318' : '#A15C07'} strokeWidth={1.5} strokeDasharray="2 2" />}
      <circle cx={cx} cy={cy} r={5.5} fill={color} stroke="#fff" strokeWidth={2} />
      {showLabel && (
        <text x={cx} y={cy - 14} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={color}>
          {payload.lab.shortName}
        </text>
      )}
    </g>
  )
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: SeriesPoint }[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold text-navy">{format(new Date(p.date), 'd MMM yyyy')}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-base font-bold text-navy">{p.value}</span>
        <InterpretationTag value={p.interpretation} />
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-navy-500">
        <span className="size-2 rounded-full" style={{ background: labColor(p.lab.id) }} />
        {p.lab.name} · “{p.localName}”
      </div>
    </div>
  )
}

export function LabLegend({ points }: { points: SeriesPoint[] }) {
  const labs = [...new Map(points.map((p) => [p.lab.id, p.lab])).values()]
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-500">
      {labs.map((lab) => (
        <span key={lab.id} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: labColor(lab.id) }} />
          {lab.name}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-4 rounded-sm bg-teal/15 ring-1 ring-teal/30" />
        {t.patient.normalRange}
      </span>
    </div>
  )
}

export function TimelineChart({ series, height = 260, compact = false }: { series: ObservationSeries; height?: number; compact?: boolean }) {
  const { definition, points } = series
  const [yMin, yMax] = yDomain(series)
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: compact ? 8 : 24, right: 16, bottom: 0, left: compact ? 0 : -8 }}>
          {!compact && <CartesianGrid stroke="#E4E6EA" strokeDasharray="3 3" vertical={false} />}
          <ReferenceArea
            y1={definition.refLow ?? yMin}
            y2={definition.refHigh ?? yMax}
            fill="#0B7A6F"
            fillOpacity={0.08}
            stroke="#0B7A6F"
            strokeOpacity={0.15}
            ifOverflow="hidden"
          />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            padding={{ left: 20, right: 20 }}
            tickFormatter={(v: number) => format(new Date(v), compact ? 'MMM' : 'MMM yy')}
            tick={{ fontSize: 13, fill: '#5A6B84' }}
            axisLine={{ stroke: '#D3D7DE' }}
            tickLine={false}
            hide={compact}
          />
          <YAxis
            domain={[yMin, yMax]}
            tickFormatter={(v: number) => formatValue(v, definition.loinc)}
            tick={{ fontSize: 13, fill: '#5A6B84' }}
            axisLine={false}
            tickLine={false}
            width={44}
            hide={compact}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#9AA7B8', strokeDasharray: '3 3' }} />
          <Line
            dataKey="value"
            type="monotone"
            stroke="#9AA7B8"
            strokeWidth={2}
            isAnimationActive={!compact}
            dot={(props: DotProps) => <LabDot key={props.index} {...props} showLabel={!compact} />}
            activeDot={(props: DotProps) => <LabDot key={`a${props.index}`} {...props} showLabel={false} />}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function rangeText(series: ObservationSeries) {
  const d = series.definition
  return `${formatRange(d.refLow, d.refHigh, d.loinc)} ${d.unit}`
}
