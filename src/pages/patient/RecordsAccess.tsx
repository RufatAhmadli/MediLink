import { Eye, QrCode, ShieldCheck, ShieldOff } from 'lucide-react'
import { useState } from 'react'
import { Avatar, Badge, Button, ButtonLink, Card, EmptyState, Loading, PageHeader, SectionTitle } from '../../components/ui'
import { t } from '../../i18n/strings'
import { fmtDate, fmtDateTime } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { answerAccessRequest, getAccessOverview, revokeConsent } from '../../services/consent'
import type { ConsentView } from '../../services/shared'
import { useCurrentUser } from '../../store/auth'
import { toast } from '../../store/toast'

const sourceLabel: Record<ConsentView['source'], string> = {
  booking: t.patient.viaBooking,
  qr: t.patient.viaQr,
  request: t.patient.viaRequest,
  manual: t.patient.viaManual,
}

const untilText = (c: ConsentView) => (c.end ? t.expiry.until(fmtDate(c.end)) : t.expiry.untilRevoked)

export function RecordsAccess() {
  const user = useCurrentUser()
  const { data } = useQuery(() => getAccessOverview(user.refId), [user.refId])
  const [showHistory, setShowHistory] = useState(false)

  if (!data) return <Loading />

  return (
    <div className="space-y-7">
      <PageHeader title={t.patient.access} subtitle={t.patient.accessIntro} />

      <ButtonLink to="/patient/access/share" block size="lg" className="-mt-2">
        <QrCode className="size-5" /> {t.patient.shareQr}
      </ButtonLink>

      {data.pending.length > 0 && (
        <section>
          <SectionTitle>{t.patient.pendingRequests}</SectionTitle>
          <div className="space-y-3">
            {data.pending.map((c) => (
              <Card key={c.id} className="border-low/30 bg-low-soft/40 p-4">
                <GranteeLine c={c} />
                <p className="mt-2 text-sm text-navy-700">{t.patient.requestedScope(t.scope[c.scope], untilText(c))}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => answerAccessRequest(c.id, true).then(() => toast(t.patient.approved))}>
                    {t.patient.approve}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => answerAccessRequest(c.id, false).then(() => toast(t.patient.declined, 'info'))}>
                    {t.patient.decline}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle>{t.patient.activeGrants}</SectionTitle>
        {data.active.length === 0 ? (
          <EmptyState icon={<ShieldOff className="size-6" />}>{t.patient.noActive}</EmptyState>
        ) : (
          <div className="space-y-3">
            {data.active.map((c) => (
              <Card key={c.id} className="p-4">
                <GranteeLine c={c} />
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge tone="teal">
                    <ShieldCheck className="size-3.5" /> {t.scope[c.scope]}
                  </Badge>
                  <Badge tone="gray">{untilText(c)}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-navy-500">
                    {sourceLabel[c.source]} · {fmtDate(c.createdAt)}
                  </span>
                  <Button size="sm" variant="danger" onClick={() => revokeConsent(c.id).then(() => toast(t.patient.revoked, 'info'))}>
                    {t.patient.revoke}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>{t.patient.accessLog}</SectionTitle>
        <p className="-mt-2 mb-3 text-sm text-navy-500">{t.patient.accessLogIntro}</p>
        {data.log.length === 0 ? (
          <EmptyState icon={<Eye className="size-6" />}>{t.patient.noLog}</EmptyState>
        ) : (
          <Card className="divide-y divide-line">
            {data.log.slice(0, 12).map((e) => (
              <div key={e.id} className="flex gap-3 px-4 py-3">
                <Eye className="mt-0.5 size-4 shrink-0 text-navy-300" />
                <p className="text-sm">
                  <span className="font-semibold">{e.actor.name}</span>, {e.organization.name} — {e.action},{' '}
                  <span className="text-navy-500">{fmtDateTime(e.recorded)}</span>
                </p>
              </div>
            ))}
          </Card>
        )}
      </section>

      {data.history.length > 0 && (
        <section>
          <button onClick={() => setShowHistory((v) => !v)} className="text-sm font-semibold text-teal">
            {t.patient.pastAccess} ({data.history.length}) {showHistory ? '▲' : '▼'}
          </button>
          {showHistory && (
            <Card className="mt-3 divide-y divide-line">
              {data.history.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{c.grantee.name}</div>
                    <div className="text-xs text-navy-500">
                      {t.scope[c.scope]} · {fmtDate(c.start)}
                      {c.end && ` – ${fmtDate(c.end)}`}
                    </div>
                  </div>
                  <Badge tone={c.state === 'revoked' ? 'red' : 'gray'}>{t.status.consent[c.state]}</Badge>
                </div>
              ))}
            </Card>
          )}
        </section>
      )}
    </div>
  )
}

function GranteeLine({ c }: { c: ConsentView }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={c.grantee.name} size="sm" />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{c.grantee.name}</div>
        <div className="truncate text-xs text-navy-500">
          {c.grantee.specialty} · {c.organization.name}
        </div>
      </div>
    </div>
  )
}
