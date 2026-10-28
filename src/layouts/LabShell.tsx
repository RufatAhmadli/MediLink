import { ArrowRightLeft, CalendarCheck, ClipboardList, Send, Settings, Upload } from 'lucide-react'
import { t } from '../i18n/strings'
import { useQuery } from '../lib/useQuery'
import { getLab, getPublishQueue } from '../services/lab'
import { useCurrentUser } from '../store/auth'
import { DashboardLayout } from './DashboardLayout'

export function LabShell() {
  const user = useCurrentUser()
  const { data: lab } = useQuery(() => getLab(user.refId), [user.refId])
  const { data: queue } = useQuery(() => getPublishQueue(user.refId), [user.refId])
  const n = t.nav.lab
  return (
    <DashboardLayout
      name={lab?.name ?? user.displayName}
      subtitle={lab ? `Lab staff · ${lab.area}` : ''}
      items={[
        { to: '/lab/bookings', label: n.bookings, icon: CalendarCheck },
        { to: '/lab/orders', label: n.orders, icon: ClipboardList },
        { to: '/lab/publish', label: n.publish, icon: Upload, badge: queue?.length },
        { to: '/lab/sent', label: n.sent, icon: Send },
        { to: '/lab/mapping', label: n.mapping, icon: ArrowRightLeft },
        { to: '/lab/settings', label: n.settings, icon: Settings },
      ]}
    />
  )
}
