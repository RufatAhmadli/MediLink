import { CalendarDays, ChevronRight, ClipboardList, FileText, LineChart, LogOut, RotateCcw } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Button, Card, KeyValue, Loading, PageHeader } from '../../components/ui'
import { t } from '../../i18n/strings'
import { ageFrom } from '../../lib/clinical'
import { fmtDate } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { getPatient } from '../../services/patient'
import { useAuth, useCurrentUser } from '../../store/auth'
import { resetDemoData } from '../../store/db'
import { toast } from '../../store/toast'

export function Profile() {
  const user = useCurrentUser()
  const logout = useAuth((s) => s.logout)
  const navigate = useNavigate()
  const { data: p } = useQuery(() => getPatient(user.refId), [user.refId])
  if (!p) return <Loading />

  return (
    <div className="space-y-5">
      <PageHeader title={t.patient.profile} />
      <Card className="flex items-center gap-4 p-4">
        <Avatar name={p.name} size="lg" />
        <div>
          <div className="text-lg font-semibold">{p.name}</div>
          <div className="text-sm text-navy-500">
            {ageFrom(p.birthDate)} y · {p.sex === 'male' ? t.auth.male : t.auth.female}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">{t.patient.personal}</h2>
        <dl className="grid grid-cols-2 gap-4">
          <KeyValue label={t.auth.dateOfBirth}>{fmtDate(p.birthDate)}</KeyValue>
          <KeyValue label={t.patient.patientId}>{p.identifier}</KeyValue>
          <KeyValue label={t.auth.phone}>{p.phone}</KeyValue>
          <KeyValue label={t.patient.area}>{p.area}</KeyValue>
          <div className="col-span-2">
            <KeyValue label={t.auth.email}>{p.email}</KeyValue>
          </div>
        </dl>
      </Card>

      <Card className="divide-y divide-line">
        {[
          { to: '/patient/appointments', label: t.patient.quick.appointments, icon: CalendarDays },
          { to: '/patient/lab-orders', label: t.patient.quick.orders, icon: ClipboardList },
          { to: '/patient/timeline', label: t.patient.quick.timeline, icon: LineChart },
          { to: '/patient/summaries', label: t.patient.quick.summaries, icon: FileText },
        ].map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium hover:bg-canvas">
            <Icon className="size-5 text-teal" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="size-4 text-navy-300" />
          </Link>
        ))}
      </Card>

      <div className="space-y-2">
        <Button
          block
          variant="secondary"
          onClick={() => {
            logout()
            navigate('/login')
          }}
        >
          <LogOut className="size-4" /> {t.app.logOut}
        </Button>
        <Button
          block
          variant="ghost"
          onClick={() => {
            resetDemoData()
            toast(t.app.resetDone, 'info')
          }}
        >
          <RotateCcw className="size-4" /> {t.app.resetDemo}
        </Button>
      </div>
      <p className="text-center text-xs text-navy-500">{t.patient.privacy}</p>
    </div>
  )
}
