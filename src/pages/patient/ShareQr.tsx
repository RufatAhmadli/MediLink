import clsx from 'clsx'
import { CheckCircle2, RefreshCw } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import { Button, Card, PageHeader } from '../../components/ui'
import { t } from '../../i18n/strings'
import { useQuery } from '../../lib/useQuery'
import { createShareToken, getShareToken } from '../../services/consent'
import { useCurrentUser } from '../../store/auth'
import type { ConsentScope, ExpiryOption, ShareToken } from '../../types'

function useCountdown(until: string | undefined) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const left = until ? Math.max(0, Math.floor((new Date(until).getTime() - now) / 1000)) : 0
  return { left, text: `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` }
}

function Chips<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
            value === o.value ? 'border-teal bg-teal text-white' : 'border-line bg-white hover:border-teal',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ShareQr() {
  const user = useCurrentUser()
  const [scope, setScope] = useState<ConsentScope>('all')
  const [expiry, setExpiry] = useState<ExpiryOption>('visit')
  const [token, setToken] = useState<ShareToken | null>(null)
  const [round, setRound] = useState(0)

  useEffect(() => {
    let alive = true
    createShareToken(user.refId, scope, expiry).then((tk) => alive && setToken(tk))
    return () => {
      alive = false
    }
  }, [user.refId, scope, expiry, round])

  // Notice when reception redeems the code.
  const { data: live } = useQuery(() => (token ? getShareToken(token.code) : Promise.resolve(undefined)), [token?.code])
  const { left, text } = useCountdown(token?.expiresAt)
  const expired = !!token && left === 0
  const redeemed = !!live?.redeemedBy

  return (
    <div>
      <PageHeader title={t.patient.qrTitle} subtitle={t.patient.qrIntro} back />

      <Card className="flex flex-col items-center p-6">
        <div className="relative">
          <div className={clsx('rounded-2xl bg-white p-3 ring-1 ring-line', (expired || redeemed) && 'opacity-15')}>
            {token ? (
              <QRCodeSVG value={`https://medilink.demo/share/${token.code}`} size={220} fgColor="#13233A" level="M" />
            ) : (
              <div className="size-[220px] animate-pulse rounded-lg bg-canvas" />
            )}
          </div>
          {(redeemed || expired) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              {redeemed ? (
                <>
                  <CheckCircle2 className="size-12 text-teal" />
                  <div className="mt-2 font-semibold">{t.patient.qrShared}</div>
                </>
              ) : (
                <>
                  <div className="font-semibold">{t.patient.qrExpired}</div>
                  <Button className="mt-3" size="sm" onClick={() => setRound((r) => r + 1)}>
                    <RefreshCw className="size-4" /> {t.patient.qrNew}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-navy-300">{t.patient.code}</div>
        <div className="font-mono text-3xl font-bold tracking-widest">{token?.code ?? '···-···'}</div>
        {!redeemed && (
          <div className={clsx('mt-2 rounded-full px-3 py-1 text-sm font-semibold tabular-nums', left < 60 ? 'bg-high-soft text-high' : 'bg-teal-soft text-teal-dark')}>
            {expired ? t.patient.qrExpired : t.patient.qrValid(text)}
          </div>
        )}
      </Card>

      <div className="mt-6 space-y-5">
        <div>
          <h2 className="mb-2 text-sm font-semibold">{t.patient.whatToShare}</h2>
          <Chips
            value={scope}
            onChange={setScope}
            options={(['all', 'labs', 'summaries'] as ConsentScope[]).map((s) => ({ value: s, label: t.scope[s] }))}
          />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold">{t.patient.howLong}</h2>
          <Chips
            value={expiry}
            onChange={setExpiry}
            options={(['visit', '30d', 'revoked'] as ExpiryOption[]).map((e) => ({ value: e, label: t.expiry[e] }))}
          />
        </div>
      </div>
    </div>
  )
}
