import { CalendarX2 } from 'lucide-react'
import { Badge, ButtonLink, Card, EmptyState, Loading, PageHeader, SectionTitle } from '../../components/ui'
import { t } from '../../i18n/strings'
import { fmtTime, fmtWeekday } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { getLabBookings } from '../../services/lab'
import type { AppointmentView } from '../../services/shared'
import { useCurrentUser } from '../../store/auth'

export function Bookings() {
  const user = useCurrentUser()
  const { data } = useQuery(() => getLabBookings(user.refId), [user.refId])
  if (!data) return <Loading />
  return (
    <div className="space-y-8">
      <PageHeader title={t.lab.bookings} subtitle={fmtWeekday(new Date().toISOString())} />
      <section>
        <SectionTitle>
          {t.lab.today} · {data.today.length}
        </SectionTitle>
        <BookingTable rows={data.today} showDate={false} />
      </section>
      <section>
        <SectionTitle>{t.lab.upcoming}</SectionTitle>
        <BookingTable rows={data.upcoming} showDate />
      </section>
    </div>
  )
}

function BookingTable({ rows, showDate }: { rows: AppointmentView[]; showDate: boolean }) {
  if (!rows.length) return <EmptyState icon={<CalendarX2 className="size-6" />}>{t.lab.noBookings}</EmptyState>
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-navy-300">
            <th className="px-4 py-3 font-semibold">Time</th>
            <th className="px-4 py-3 font-semibold">Patient</th>
            <th className="px-4 py-3 font-semibold">Tests</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((a) => (
            <tr key={a.id}>
              <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums">
                {showDate && <span className="mr-2 font-normal text-navy-500">{fmtWeekday(a.start)}</span>}
                {fmtTime(a.start)}
              </td>
              <td className="px-4 py-3">
                <div className="font-medium">{a.patient.name}</div>
                <div className="text-xs text-navy-500">{a.patient.identifier}</div>
              </td>
              <td className="px-4 py-3">{a.tests.map((x) => x.name).join(', ')}</td>
              <td className="px-4 py-3">
                {a.order ? (
                  <div>
                    <Badge tone="blue">{t.lab.doctorOrdered}</Badge>
                    <div className="mt-1 text-xs text-navy-500">{a.orderedBy?.name}</div>
                  </div>
                ) : (
                  <Badge tone="gray">{t.lab.selfBooked}</Badge>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {a.status === 'fulfilled' ? (
                  <Badge tone="teal">{t.lab.published}</Badge>
                ) : (
                  <ButtonLink to={`/lab/publish?booking=${a.id}`} size="sm" variant="subtle">
                    {t.lab.enterResults}
                  </ButtonLink>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
