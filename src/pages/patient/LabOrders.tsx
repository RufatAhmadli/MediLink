import { ClipboardList, FlaskConical, MapPin } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ButtonLink, Card, EmptyState, Loading, Modal, PageHeader } from '../../components/ui'
import { t } from '../../i18n/strings'
import { fmtDate, fmtTime, fmtWeekday } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { getPartnerLabs } from '../../services/booking'
import { getMyLabOrders } from '../../services/patient'
import type { LabOrderView } from '../../services/shared'
import { useCurrentUser } from '../../store/auth'
import { OrderStatusBadge } from './shared'

export function LabOrders() {
  const user = useCurrentUser()
  const { data } = useQuery(() => getMyLabOrders(user.refId), [user.refId])
  const [choosing, setChoosing] = useState<LabOrderView | null>(null)

  return (
    <div>
      <PageHeader title={t.patient.orders} subtitle={t.patient.ordersIntro} back="/patient" />
      {!data ? (
        <Loading />
      ) : data.length === 0 ? (
        <EmptyState icon={<ClipboardList className="size-6" />}>{t.app.none}</EmptyState>
      ) : (
        <div className="stagger space-y-3">
          {data.map((o) => (
            <Card key={o.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold">{o.tests.map((x) => x.name).join(', ')}</div>
                  <div className="text-xs text-navy-500">
                    {t.status.orderedBy(o.requester.name)} · {o.requesterOrg.name} · {fmtDate(o.authoredOn)}
                  </div>
                </div>
                <OrderStatusBadge status={o.display} />
              </div>
              {o.note && (
                <p className="mt-3 rounded-xl bg-canvas px-3 py-2 text-sm text-navy-700">
                  <span className="text-xs font-semibold text-navy-500">{t.patient.clinicalNote}: </span>
                  {o.note}
                </p>
              )}
              <div className="mt-3 flex items-center gap-1.5 text-xs text-navy-500">
                <FlaskConical className="size-3.5" />
                {o.appointment ? o.appointment.organization.name : (o.lab?.name ?? t.patient.anyPartnerLab)}
                {o.appointment && o.display === 'booked' && (
                  <span className="font-semibold text-navy">
                    · {fmtWeekday(o.appointment.start)}, {fmtTime(o.appointment.start)}
                  </span>
                )}
              </div>
              <div className="mt-3">
                {o.display === 'to-book' &&
                  (o.labId ? (
                    <ButtonLink size="sm" to={`/patient/book/lab/${o.labId}?order=${o.id}`}>
                      {t.patient.bookAtLab}
                    </ButtonLink>
                  ) : (
                    <Button size="sm" onClick={() => setChoosing(o)}>
                      {t.patient.bookAtLab}
                    </Button>
                  ))}
                {o.display === 'booked' && o.appointment && (
                  <ButtonLink size="sm" variant="secondary" to={`/patient/book/lab/${o.appointment.organizationId}?reschedule=${o.appointment.id}`}>
                    {t.patient.reschedule}
                  </ButtonLink>
                )}
                {o.display === 'result-ready' && o.report && (
                  <ButtonLink size="sm" variant="subtle" to={`/patient/results/${o.report.id}`}>
                    {t.patient.viewResult}
                  </ButtonLink>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      <ChooseLab order={choosing} onClose={() => setChoosing(null)} />
    </div>
  )
}

function ChooseLab({ order, onClose }: { order: LabOrderView | null; onClose: () => void }) {
  const navigate = useNavigate()
  const { data: labs } = useQuery(() => getPartnerLabs(order?.testIds ?? []), [order?.id])
  return (
    <Modal open={!!order} onClose={onClose} title={t.patient.chooseLab}>
      {!labs ? (
        <Loading />
      ) : (
        <div className="space-y-2">
          {labs.map((lab) => (
            <button
              key={lab.id}
              onClick={() => navigate(`/patient/book/lab/${lab.id}?order=${order!.id}`)}
              className="flex w-full items-center gap-3 rounded-xl border border-line p-3 text-left hover:border-teal"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-navy text-white">
                <FlaskConical className="size-5" />
              </div>
              <div>
                <div className="font-semibold">{lab.name}</div>
                <div className="flex items-center gap-1 text-xs text-navy-500">
                  <MapPin className="size-3.5" /> {lab.address}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
