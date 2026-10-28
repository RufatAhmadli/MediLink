import { CalendarClock, Check, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SlotPicker } from '../../components/records'
import { Avatar, Badge, Button, Card, EmptyState, Loading, Modal, PageHeader, SectionTitle } from '../../components/ui'
import { t } from '../../i18n/strings'
import { ageFrom } from '../../lib/clinical'
import { fmtAgo, fmtDate, fmtTime, fmtWeekday } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { getDoctorAvailability } from '../../services/booking'
import { approveAppointment, cancelAccessRequest, declineAppointment, getDoctorRequests, proposeNewTime } from '../../services/doctor'
import type { AppointmentView } from '../../services/shared'
import { useCurrentUser } from '../../store/auth'
import { toast } from '../../store/toast'

export function Requests() {
  const user = useCurrentUser()
  const { data } = useQuery(() => getDoctorRequests(user.refId), [user.refId])
  const [proposing, setProposing] = useState<AppointmentView | null>(null)

  if (!data) return <Loading />

  return (
    <div className="space-y-8">
      <PageHeader title={t.doctor.requests} />

      <section>
        <SectionTitle>{t.doctor.appointmentRequests}</SectionTitle>
        {data.appointmentRequests.length === 0 ? (
          <EmptyState icon={<CalendarClock className="size-6" />}>{t.doctor.noRequests}</EmptyState>
        ) : (
          <div className="stagger space-y-3">
            {data.appointmentRequests.map((a) => (
              <Card key={a.id} className="flex flex-wrap items-center gap-4 p-4">
                <Avatar name={a.patient.name} />
                <div className="min-w-[200px] flex-1">
                  <Link to={`/doctor/patients/${a.patientId}`} className="font-semibold hover:underline">
                    {a.patient.name}
                  </Link>
                  <div className="text-sm text-navy-500">
                    {ageFrom(a.patient.birthDate)} y · {a.visitType?.name} · {a.visitType?.priceAzn} {t.app.azn}
                  </div>
                  <div className="mt-1 text-sm">
                    <b>
                      {fmtWeekday(a.start)}, {fmtTime(a.start)}
                    </b>{' '}
                    <span className="text-xs text-navy-500">· requested {fmtAgo(a.createdAt)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => approveAppointment(a.id).then(() => toast(t.doctor.approved))}>
                    <Check className="size-4" /> {t.doctor.approve}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setProposing(a)}>
                    <CalendarClock className="size-4" /> {t.doctor.proposeTime}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => declineAppointment(a.id).then(() => toast(t.doctor.declinedMsg, 'info'))}>
                    <X className="size-4" /> {t.doctor.decline}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {data.proposed.length > 0 && (
        <section>
          <SectionTitle>{t.doctor.awaitingPatient}</SectionTitle>
          <Card className="divide-y divide-line">
            {data.proposed.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="font-medium">{a.patient.name}</span>
                <span className="text-navy-500">
                  <s>
                    {fmtWeekday(a.start)} {fmtTime(a.start)}
                  </s>{' '}
                  →{' '}
                  <b className="text-navy">
                    {fmtWeekday(a.proposedStart!)} {fmtTime(a.proposedStart!)}
                  </b>
                </span>
                <Badge tone="blue">{t.status.appointment.proposed}</Badge>
              </div>
            ))}
          </Card>
        </section>
      )}

      <section>
        <SectionTitle>{t.doctor.accessRequestsSent}</SectionTitle>
        {data.accessRequests.length === 0 ? (
          <EmptyState>{t.doctor.noAccessRequests}</EmptyState>
        ) : (
          <Card className="divide-y divide-line">
            {data.accessRequests.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <Link to={`/doctor/patients/${c.patientId}`} className="font-semibold hover:underline">
                    {c.patient.name}
                  </Link>
                  <div className="text-xs text-navy-500">
                    {t.scope[c.scope]} · sent {fmtDate(c.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="amber">{t.status.consent.pending}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => cancelAccessRequest(c.id)}>
                    {t.doctor.withdraw}
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>

      <ProposeModal appointment={proposing} onClose={() => setProposing(null)} />
    </div>
  )
}

function ProposeModal({ appointment, onClose }: { appointment: AppointmentView | null; onClose: () => void }) {
  const [start, setStart] = useState<string | null>(null)
  const { data: days } = useQuery(
    () => (appointment ? getDoctorAvailability(appointment.practitionerId!, appointment.visitTypeId!) : Promise.resolve([])),
    [appointment?.id],
  )
  return (
    <Modal open={!!appointment} onClose={onClose} title={t.doctor.proposeTitle}>
      {appointment && (
        <>
          <p className="mb-4 text-sm text-navy-500">
            {appointment.patient.name} · {appointment.visitType?.name}
          </p>
          {days ? <SlotPicker days={days} value={start} onChange={setStart} /> : <Loading />}
          <Button
            className="mt-5"
            block
            disabled={!start}
            onClick={async () => {
              await proposeNewTime(appointment.id, start!)
              toast(t.doctor.proposed)
              setStart(null)
              onClose()
            }}
          >
            {t.doctor.propose}
          </Button>
        </>
      )}
    </Modal>
  )
}
