import { Card, Checkbox, Loading, PageHeader, SectionTitle } from '../../components/ui'
import { t } from '../../i18n/strings'
import { catalogTest } from '../../lib/clinical'
import { useQuery } from '../../lib/useQuery'
import { getLab, saveLabSettings } from '../../services/lab'
import { useCurrentUser } from '../../store/auth'
import { toast } from '../../store/toast'
import { WorkingHours } from '../../components/WeeklyHours'

export function LabSettings() {
  const user = useCurrentUser()
  const { data: lab } = useQuery(() => getLab(user.refId), [user.refId])
  if (!lab?.lab) return <Loading />
  const allowed = lab.lab.availableWithoutOrder

  return (
    <div className="space-y-8">
      <PageHeader title={t.lab.settings} />
      <section>
        <SectionTitle>{t.lab.withoutOrderTitle}</SectionTitle>
        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          {lab.lab.offeredTests.map((id) => {
            const test = catalogTest(id)
            return (
              <Checkbox
                key={id}
                checked={allowed.includes(id)}
                label={test.name}
                description={allowed.includes(id) ? t.patient.withoutOrder : t.patient.requiresOrder}
                onChange={(on) =>
                  saveLabSettings(lab.id, { availableWithoutOrder: on ? [...allowed, id] : allowed.filter((x) => x !== id) }).then(() => toast(t.app.saved))
                }
              />
            )
          })}
        </Card>
      </section>

      <section>
        <SectionTitle>{t.lab.openingHours}</SectionTitle>
        <WorkingHours initial={lab.lab.openingHours} onSave={(openingHours) => saveLabSettings(lab.id, { openingHours })} />
      </section>
    </div>
  )
}
