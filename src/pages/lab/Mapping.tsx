import { ArrowRight } from 'lucide-react'
import { Card, Loading, PageHeader } from '../../components/ui'
import { t } from '../../i18n/strings'
import { formatRange, testDef } from '../../lib/clinical'
import { useQuery } from '../../lib/useQuery'
import { getLab } from '../../services/lab'
import { useCurrentUser } from '../../store/auth'

export function Mapping() {
  const user = useCurrentUser()
  const { data: lab } = useQuery(() => getLab(user.refId), [user.refId])
  if (!lab?.lab) return <Loading />
  return (
    <div>
      <PageHeader title={t.lab.mapping} subtitle={t.lab.mappingIntro} />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-navy-300">
              <th className="px-4 py-3 font-semibold">{t.lab.yourName}</th>
              <th className="w-8" />
              <th className="px-4 py-3 font-semibold">{t.lab.standardTest}</th>
              <th className="px-4 py-3 font-semibold">{t.lab.unit}</th>
              <th className="px-4 py-3 font-semibold">{t.lab.range}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {lab.lab.localNames.map((n) => {
              const def = testDef(n.loinc)
              return (
                <tr key={n.loinc}>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-canvas px-2 py-1 font-mono text-[13px] ring-1 ring-line">“{n.localName}”</span>
                  </td>
                  <td>
                    <ArrowRight className="size-4 text-teal" />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{def.shortName}</span>
                    <span className="text-navy-500"> · LOINC {def.loinc}</span>
                  </td>
                  <td className="px-4 py-3 text-navy-700">{def.unit}</td>
                  <td className="px-4 py-3 tabular-nums text-navy-700">{formatRange(def.refLow, def.refHigh, def.loinc)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
