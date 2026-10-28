import { ClipboardList } from 'lucide-react'
import { Badge, ButtonLink, Card, EmptyState, Loading, PageHeader } from '../../components/ui'
import { t } from '../../i18n/strings'
import { fmtDate, fmtTime, fmtWeekday } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { getIncomingOrders } from '../../services/lab'
import type { LabOrderView } from '../../services/shared'
import { useCurrentUser } from '../../store/auth'

function OrderStatus({ o }: { o: LabOrderView }) {
  if (o.status === 'completed') return <Badge tone="teal">{t.lab.delivered}</Badge>
  if (o.status === 'booked' && o.appointment)
    return <Badge tone="blue">{t.lab.bookedFor(`${fmtWeekday(o.appointment.start)}, ${fmtTime(o.appointment.start)}`)}</Badge>
  return <Badge tone="amber">{t.lab.waitingToBook}</Badge>
}

export function Orders() {
  const user = useCurrentUser()
  const { data } = useQuery(() => getIncomingOrders(user.refId), [user.refId])
  if (!data) return <Loading />
  return (
    <div>
      <PageHeader title={t.lab.orders} subtitle={t.lab.ordersIntro} />
      {data.length === 0 ? (
        <EmptyState icon={<ClipboardList className="size-6" />}>{t.app.none}</EmptyState>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {data.map((o) => (
            <Card key={o.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{o.patient.name}</div>
                  <div className="text-xs text-navy-500">
                    {o.patient.identifier} · ordered {fmtDate(o.authoredOn)}
                  </div>
                </div>
                <OrderStatus o={o} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {o.tests.map((x) => (
                  <Badge key={x.id} tone="navy">
                    {x.name}
                  </Badge>
                ))}
              </div>
              <div className="mt-3 rounded-xl bg-canvas px-3 py-2.5 text-sm">
                <div className="text-xs font-semibold text-navy-500">
                  {o.requester.name} · {o.requester.specialty}, {o.requesterOrg.name}
                </div>
                <p className="mt-0.5">“{o.note}”</p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs text-navy-500">{o.labId ? 'Sent to your lab' : t.lab.openToAny}</span>
                {o.status === 'booked' && o.appointment && (
                  <ButtonLink to={`/lab/publish?booking=${o.appointment.id}`} size="sm" variant="subtle">
                    {t.lab.enterResults}
                  </ButtonLink>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
