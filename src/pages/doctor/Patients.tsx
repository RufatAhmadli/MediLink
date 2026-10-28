import { KeyRound, Lock, Search, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button, Card, EmptyState, Input, Loading, PageHeader } from '../../components/ui'
import { t } from '../../i18n/strings'
import { ageFrom } from '../../lib/clinical'
import { fmtDate, fmtShortDate } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { redeemShareToken } from '../../services/consent'
import { getDoctorPatients, type DoctorPatientRow } from '../../services/doctor'
import { useCurrentUser } from '../../store/auth'
import { toast } from '../../store/toast'

export function AccessBadge({ row }: { row: Pick<DoctorPatientRow, 'access' | 'pendingRequest'> }) {
  if (row.access) {
    return (
      <Badge tone="teal">
        <ShieldCheck className="size-3.5" /> {t.doctor.accessGranted}
      </Badge>
    )
  }
  if (row.pendingRequest) return <Badge tone="amber">{t.doctor.requested}</Badge>
  return (
    <Badge tone="gray">
      <Lock className="size-3" /> {t.doctor.noAccess}
    </Badge>
  )
}

export function Patients() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const { data } = useQuery(() => getDoctorPatients(user.refId, query), [user.refId, query])

  const redeem = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const consent = await redeemShareToken(code, user.refId)
      toast(t.doctor.redeemed)
      navigate(`/doctor/patients/${consent.patientId}`)
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title={t.doctor.patients} />
      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-300" />
          <Input className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.doctor.searchPatients} />
        </div>
        <form onSubmit={redeem} className="flex gap-2" title={t.doctor.addByCodeHint}>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-300" />
            <Input
              className="w-56 pl-10 font-mono uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ABC-123"
              aria-label={t.doctor.addByCode}
            />
          </div>
          <Button type="submit" variant="secondary" loading={busy} disabled={code.replace(/\W/g, '').length < 6}>
            {t.doctor.redeem}
          </Button>
        </form>
      </div>

      {!data ? (
        <Loading />
      ) : data.length === 0 ? (
        <EmptyState icon={<Search className="size-6" />}>{t.app.none}</EmptyState>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-navy-300">
                <th className="px-4 py-3 font-semibold">Patient</th>
                <th className="px-4 py-3 font-semibold">Age / sex</th>
                <th className="px-4 py-3 font-semibold">{t.doctor.accessScope}</th>
                <th className="px-4 py-3 font-semibold">{t.doctor.lastVisit}</th>
                <th className="px-4 py-3 font-semibold">{t.doctor.nextVisit}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((row) => (
                <tr key={row.patient.id} onClick={() => navigate(`/doctor/patients/${row.patient.id}`)} className="cursor-pointer hover:bg-canvas">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={row.patient.name} size="sm" />
                      <div>
                        <div className="font-semibold">{row.patient.name}</div>
                        <div className="text-xs text-navy-500">{row.patient.identifier}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-navy-700">
                    {ageFrom(row.patient.birthDate)} · {row.patient.sex === 'male' ? 'M' : 'F'}
                  </td>
                  <td className="px-4 py-3">
                    <AccessBadge row={row} />
                    {row.access && (
                      <div className="mt-1 text-xs text-navy-500">
                        {t.scope[row.access.scope]} · {row.access.end ? `until ${fmtShortDate(row.access.end)}` : t.expiry.untilRevoked.toLowerCase()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-navy-700">{row.lastVisit ? fmtDate(row.lastVisit) : '—'}</td>
                  <td className="px-4 py-3 text-navy-700">{row.nextVisit ? fmtDate(row.nextVisit) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <p className="mt-3 text-xs text-navy-500">{t.doctor.addByCodeHint}</p>
    </div>
  )
}
