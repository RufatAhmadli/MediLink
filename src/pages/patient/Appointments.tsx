import { CalendarX2, Check } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, ButtonLink, EmptyState, Loading, PageHeader, Segmented } from '../../components/ui'
import { t } from '../../i18n/strings'
import { useQuery } from '../../lib/useQuery'
import { cancelAppointment, getMyAppointments, respondToProposal } from '../../services/patient'
import type { AppointmentView } from '../../services/shared'
import { useCurrentUser } from '../../store/auth'
import { toast } from '../../store/toast'
import { AppointmentCard } from './shared'

export function Appointments() {
  const user = useCurrentUser()
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const { data } = useQuery(() => getMyAppointments(user.refId), [user.refId])

  return (
    <div>
      <PageHeader title={t.patient.appointments} back="/patient" />
      <Segmented
        className="mb-4 w-full"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'upcoming', label: `${t.patient.upcoming}${data ? ` (${data.upcoming.length})` : ''}` },
          { value: 'past', label: t.patient.past },
        ]}
      />
      {!data ? (
        <Loading />
      ) : data[tab].length === 0 ? (
        <EmptyState icon={<CalendarX2 className="size-6" />}>{t.app.none}</EmptyState>
      ) : (
        <div className="stagger space-y-3">
          {data[tab].map((a) => (tab === 'upcoming' ? <UpcomingCard key={a.id} a={a} /> : <PastCard key={a.id} a={a} />))}
        </div>
      )}
    </div>
  )
}

function rescheduleLink(a: AppointmentView) {
  return a.kind === 'lab'
    ? `/patient/book/lab/${a.organizationId}?reschedule=${a.id}`
    : `/patient/book/doctor/${a.practitionerId}?visitType=${a.visitTypeId}&reschedule=${a.id}`
}

function UpcomingCard({ a }: { a: AppointmentView }) {
  const [confirming, setConfirming] = useState(false)

  if (a.status === 'proposed') {
    return (
      <AppointmentCard a={a}>
        <Button size="sm" onClick={() => respondToProposal(a.id, true).then(() => toast(t.status.appointment.booked))}>
          {t.patient.accept}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => respondToProposal(a.id, false)}>
          {t.patient.decline}
        </Button>
      </AppointmentCard>
    )
  }

  return (
    <AppointmentCard a={a}>
      {confirming ? (
        <>
          <span className="self-center text-sm font-medium">{t.patient.cancelConfirm}</span>
          <Button size="sm" variant="danger" onClick={() => cancelAppointment(a.id).then(() => toast(t.patient.cancelled, 'info'))}>
            {t.patient.cancel}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
            {t.app.back}
          </Button>
        </>
      ) : (
        <>
          <ButtonLink size="sm" variant="secondary" to={rescheduleLink(a)}>
            {t.patient.reschedule}
          </ButtonLink>
          <Button size="sm" variant="ghost" className="text-high hover:bg-high-soft" onClick={() => setConfirming(true)}>
            {t.patient.cancel}
          </Button>
        </>
      )}
    </AppointmentCard>
  )
}

function PastCard({ a }: { a: AppointmentView }) {
  if (a.kind !== 'doctor' || a.status !== 'fulfilled') return <AppointmentCard a={a} />
  return (
    <AppointmentCard a={a}>
      {a.hasFeedback ? (
        <Badge tone="gray">
          <Check className="size-3" /> {t.patient.feedbackSent}
        </Badge>
      ) : (
        <ButtonLink size="sm" variant="subtle" to={`/patient/feedback/${a.id}`}>
          {t.patient.giveFeedback}
        </ButtonLink>
      )}
    </AppointmentCard>
  )
}
