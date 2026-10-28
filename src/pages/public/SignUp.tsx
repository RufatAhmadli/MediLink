import { MessageSquareText } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { Button, Field, Input, Select } from '../../components/ui'
import { t } from '../../i18n/strings'
import { requestSmsCode, verifySmsCode, type SignUpDraft } from '../../services/auth'
import { useAuth } from '../../store/auth'
import { toast } from '../../store/toast'

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas px-5 py-6">
      <Link to="/">
        <Logo />
      </Link>
      <div className="mx-auto w-full max-w-md py-10">{children}</div>
    </div>
  )
}

export function SignUp() {
  const navigate = useNavigate()
  const [draft, setDraft] = useState<SignUpDraft>({ name: '', birthDate: '', phone: '+994 ', email: '', sex: 'male' })
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof SignUpDraft>(key: K, value: SignUpDraft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    await requestSmsCode(draft.phone)
    navigate('/signup/verify', { state: draft })
  }

  return (
    <AuthShell>
      <h1 className="text-3xl font-bold tracking-tight">{t.auth.signUpTitle}</h1>
      <p className="mt-1 text-navy-500">{t.auth.signUpIntro}</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label={t.auth.fullName}>
          <Input required value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Nərmin Quliyeva" autoComplete="name" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.auth.dateOfBirth}>
            <Input required type="date" value={draft.birthDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set('birthDate', e.target.value)} />
          </Field>
          <Field label={t.auth.sex}>
            <Select value={draft.sex} onChange={(e) => set('sex', e.target.value as SignUpDraft['sex'])}>
              <option value="male">{t.auth.male}</option>
              <option value="female">{t.auth.female}</option>
            </Select>
          </Field>
        </div>
        <Field label={t.auth.phone}>
          <Input required type="tel" value={draft.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" />
        </Field>
        <Field label={t.auth.email}>
          <Input required type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
        </Field>
        <Field label={t.auth.createPassword}>
          <Input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </Field>
        <Button type="submit" block size="lg" loading={busy}>
          {t.auth.sendCode}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-navy-500">
        {t.auth.haveAccount}{' '}
        <Link to="/login" className="font-semibold text-teal hover:underline">
          {t.auth.logIn}
        </Link>
      </p>
    </AuthShell>
  )
}

export function VerifySms() {
  const draft = useLocation().state as SignUpDraft | null
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const setUser = useAuth((s) => s.setUser)
  const navigate = useNavigate()
  if (!draft) return <Navigate to="/signup" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const user = await verifySmsCode(draft, code)
      setUser(user)
      toast(t.auth.welcome(user.displayName))
      navigate('/patient', { replace: true })
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-soft text-teal">
        <MessageSquareText className="size-7" />
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">{t.auth.smsTitle}</h1>
      <p className="mt-1 text-navy-500">{t.auth.smsIntro(draft.phone)}</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Input
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, ''))
            setError('')
          }}
          placeholder="••••••"
          className="text-center text-3xl font-bold tracking-[0.6em]"
        />
        {error && <p className="text-sm text-high">{error}</p>}
        <p className="text-center text-xs text-navy-500">{t.auth.smsHint}</p>
        <Button type="submit" block size="lg" loading={busy} disabled={code.length !== 6}>
          {t.auth.verify}
        </Button>
      </form>
    </AuthShell>
  )
}
