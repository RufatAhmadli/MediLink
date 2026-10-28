import { CalendarDays, Inbox, MessageSquareHeart, Settings, UserCheck, Users } from 'lucide-react'
import { t } from '../i18n/strings'
import { useQuery } from '../lib/useQuery'
import { getDoctorMe, getUnreadCounts } from '../services/doctor'
import { useCurrentUser } from '../store/auth'
import { DashboardLayout } from './DashboardLayout'

export function DoctorShell() {
  const user = useCurrentUser()
  const { data: me } = useQuery(() => getDoctorMe(user.refId), [user.refId])
  const { data: counts } = useQuery(() => getUnreadCounts(user.refId), [user.refId])
  const n = t.nav.doctor
  return (
    <DashboardLayout
      name={me?.practitioner.name ?? user.displayName}
      subtitle={me ? `${me.practitioner.specialty} · ${me.organization.name}` : ''}
      items={[
        { to: '/doctor/schedule', label: n.schedule, icon: CalendarDays },
        { to: '/doctor/requests', label: n.requests, icon: UserCheck, badge: counts?.requests },
        { to: '/doctor/patients', label: n.patients, icon: Users },
        { to: '/doctor/inbox', label: n.inbox, icon: Inbox, badge: counts?.inbox },
        { to: '/doctor/feedback', label: n.feedback, icon: MessageSquareHeart },
        { to: '/doctor/settings', label: n.settings, icon: Settings },
      ]}
    />
  )
}
