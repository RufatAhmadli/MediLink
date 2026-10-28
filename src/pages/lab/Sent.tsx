import { CheckCircle2, Send } from 'lucide-react'
import { Badge, Card, EmptyState, Loading, PageHeader } from '../../components/ui'
import { t } from '../../i18n/strings'
import { testNames } from '../../lib/clinical'
import { fmtDateTime } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { getResultsSent } from '../../services/lab'
import { useCurrentUser } from '../../store/auth'

export function Sent() {
  const user = useCurrentUser()
  const { data } = useQuery(() => getResultsSent(user.refId), [user.refId])
  if (!data) return <Loading />
  return (
    <div>
      <PageHeader title={t.lab.sent} />
      {data.length === 0 ? (
        <EmptyState icon={<Send className="size-6" />}>{t.app.none}</EmptyState>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-navy-300">
                <th className="px-4 py-3 font-semibold">Delivered</th>
                <th className="px-4 py-3 font-semibold">Patient</th>
                <th className="px-4 py-3 font-semibold">Tests</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">{t.lab.receivedBy}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-navy-700">{fmtDateTime(r.issued)}</td>
                  <td className="px-4 py-3 font-medium">{r.patient.name}</td>
                  <td className="px-4 py-3">
                    {testNames(r.testIds)}
                    {r.observations.some((o) => o.interpretation !== 'N') && (
                      <Badge tone="red" className="ml-2">
                        Out of range
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="teal">
                      <CheckCircle2 className="size-3.5" /> {t.lab.deliveredTo}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-navy-700">{r.recipients.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
