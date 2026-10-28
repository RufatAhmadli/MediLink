import { FlaskConical, MapPin, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Avatar, Badge, Checkbox, EmptyState, Input, Loading, PageHeader, Segmented, Select } from '../../components/ui'
import { t } from '../../i18n/strings'
import { useQuery } from '../../lib/useQuery'
import { BAKU_AREAS } from '../../mock/catalog'
import { searchDoctors, searchLabs, type CareFilters } from '../../services/booking'

export function FindCare() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'labs' ? 'labs' : 'doctors'
  const [filters, setFilters] = useState<CareFilters>({ query: '', area: '', partnerOnly: false, date: '' })
  const set = <K extends keyof CareFilters>(k: K, v: CareFilters[K]) => setFilters((f) => ({ ...f, [k]: v }))

  return (
    <div>
      <PageHeader title={t.patient.findCare} />
      <Segmented
        className="w-full"
        value={tab}
        onChange={(v) => setParams(v === 'labs' ? { tab: 'labs' } : {}, { replace: true })}
        options={[
          { value: 'doctors', label: t.patient.doctors },
          { value: 'labs', label: t.patient.labs },
        ]}
      />

      <div className="mt-4 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-300" />
          <Input
            className="pl-10"
            value={filters.query}
            onChange={(e) => set('query', e.target.value)}
            placeholder={tab === 'doctors' ? t.patient.searchDoctors : t.patient.searchLabs}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={filters.area} onChange={(e) => set('area', e.target.value)} aria-label="Area">
            <option value="">{t.patient.anyArea}</option>
            {BAKU_AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            aria-label="Date"
            value={filters.date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => set('date', e.target.value)}
          />
        </div>
        <Checkbox
          checked={filters.partnerOnly}
          onChange={(v) => set('partnerOnly', v)}
          label={tab === 'doctors' ? t.patient.partnerOnly : t.patient.partnerLabsOnly}
        />
      </div>

      <div className="mt-5">{tab === 'doctors' ? <DoctorResults filters={filters} /> : <LabResults filters={filters} />}</div>
    </div>
  )
}

function DoctorResults({ filters }: { filters: CareFilters }) {
  const { data } = useQuery(() => searchDoctors(filters), [filters])
  if (!data) return <Loading />
  if (!data.length) return <EmptyState icon={<Search className="size-6" />}>{t.patient.noResults}</EmptyState>
  return (
    <ul className="stagger space-y-3">
      {data.map(({ practitioner: p, organization: o, fromPrice, hasInstant }) => (
        <li key={p.id}>
          <Link to={`/patient/book/doctor/${p.id}`} className="flex gap-3 rounded-2xl border border-line/80 bg-white shadow-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
            <Avatar name={p.name} />
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-teal-dark">{p.specialty}</div>
              <div className="mt-1 flex items-center gap-1 text-xs text-navy-500">
                <MapPin className="size-3.5" /> {o.name} · {o.area}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-sm font-semibold">{t.patient.fromPrice(fromPrice)}</span>
                {hasInstant && <Badge tone="teal">⚡ {t.status.instant}</Badge>}
                {o.partner && <Badge tone="gray">{t.patient.partner}</Badge>}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function LabResults({ filters }: { filters: CareFilters }) {
  const { data } = useQuery(() => searchLabs(filters), [filters])
  if (!data) return <Loading />
  if (!data.length) return <EmptyState icon={<Search className="size-6" />}>{t.patient.noResults}</EmptyState>
  return (
    <ul className="stagger space-y-3">
      {data.map(({ lab, tests, withoutOrder }) => (
        <li key={lab.id}>
          <Link to={`/patient/book/lab/${lab.id}`} className="block rounded-2xl border border-line/80 bg-white shadow-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
            <div className="flex gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy text-white">
                <FlaskConical className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold">{lab.name}</div>
                  {lab.partner && <Badge tone="gray">{t.patient.partner}</Badge>}
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-navy-500">
                  <MapPin className="size-3.5" /> {lab.address}
                </div>
                <div className="mt-2 text-xs text-navy-500">
                  {tests.length} tests · {t.patient.withoutOrder.toLowerCase()}:
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {withoutOrder.map((x) => (
                    <Badge key={x.id} tone="teal">
                      {x.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
