import clsx from 'clsx'
import { ArrowLeft, BadgeCheck, Loader2, Star, X } from 'lucide-react'
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Link, useNavigate, type LinkProps } from 'react-router-dom'
import { t } from '../i18n/strings'
import { initials } from '../lib/format'
import type { AppointmentStatus, Interpretation } from '../types'

// ----------------------------------------------------------------- buttons

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
type Size = 'sm' | 'md' | 'lg'

const buttonClass = (variant: Variant, size: Size, block?: boolean) =>
  clsx(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
    {
      primary: 'bg-gradient-to-b from-[#0e8a7e] to-teal text-white shadow-glow hover:-translate-y-px hover:from-teal hover:to-teal-dark',
      secondary: 'border border-line-strong bg-white text-navy shadow-card hover:-translate-y-px hover:border-teal/40 hover:bg-white',
      ghost: 'text-teal hover:bg-teal-soft',
      danger: 'border border-high/30 bg-white text-high hover:bg-high-soft',
      subtle: 'bg-teal-soft text-teal-dark hover:bg-teal-soft/70',
    }[variant],
    { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm', lg: 'h-12 px-5 text-base' }[size],
    block && 'w-full',
  )

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  block?: boolean
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', block, loading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button className={clsx(buttonClass(variant, size, block), className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
}

interface ButtonLinkProps extends LinkProps {
  variant?: Variant
  size?: Size
  block?: boolean
}

export function ButtonLink({ variant = 'primary', size = 'md', block, className, ...rest }: ButtonLinkProps) {
  return <Link className={clsx(buttonClass(variant, size, block), className)} {...rest} />
}

// ------------------------------------------------------------------ layout

export function Card({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-2xl border border-line/80 bg-white shadow-card',
        onClick && 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-navy">{children}</h2>
      {action}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  back,
  actions,
}: {
  title: string
  subtitle?: ReactNode
  back?: boolean | string
  actions?: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {back && (
          <button
            onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
            className="-ml-1 mb-2 inline-flex items-center gap-1 rounded-lg px-1 text-sm font-medium text-navy-500 hover:text-navy"
          >
            <ArrowLeft className="size-4" /> {t.app.back}
          </button>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-navy">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-navy-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Loading({ label = t.app.loading }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-navy-500">
      <Loader2 className="size-4 animate-spin" /> {label}
    </div>
  )
}

export function EmptyState({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line-strong px-6 py-10 text-center text-sm text-navy-500">
      {icon && <div className="text-navy-300">{icon}</div>}
      {children}
    </div>
  )
}

export function ErrorNote({ error }: { error?: Error }) {
  if (!error) return null
  return <div className="rounded-xl bg-high-soft px-4 py-3 text-sm text-high">{error.message}</div>
}

// ------------------------------------------------------------------ badges

type Tone = 'teal' | 'gray' | 'amber' | 'red' | 'blue' | 'navy' | 'green'

export function Badge({ tone = 'gray', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold',
        {
          teal: 'bg-teal-soft text-teal-dark',
          gray: 'bg-canvas text-navy-500 ring-1 ring-line',
          amber: 'bg-low-soft text-low',
          red: 'bg-high-soft text-high',
          blue: 'bg-blue-50 text-blue-700',
          navy: 'bg-navy text-white',
          green: 'bg-emerald-50 text-emerald-700',
        }[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function VerifiedBadge({ lab }: { lab: string }) {
  return (
    <Badge tone="teal">
      <BadgeCheck className="size-3.5" /> {t.status.verified(lab)}
    </Badge>
  )
}

const appointmentTone: Record<AppointmentStatus, Tone> = {
  booked: 'teal',
  pending: 'amber',
  proposed: 'blue',
  declined: 'red',
  cancelled: 'gray',
  fulfilled: 'navy',
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge tone={appointmentTone[status]}>{t.status.appointment[status]}</Badge>
}

export function InterpretationTag({ value }: { value: Interpretation }) {
  if (value === 'N') return <Badge tone="gray">{t.status.interpretation.N}</Badge>
  return (
    <Badge tone={value === 'H' ? 'red' : 'amber'}>
      {value === 'H' ? '▲' : '▼'} {t.status.interpretation[value]}
    </Badge>
  )
}

export function BookingModeBadge({ mode }: { mode: 'instant' | 'request' }) {
  return mode === 'instant' ? <Badge tone="teal">⚡ {t.status.instant}</Badge> : <Badge tone="blue">{t.status.request}</Badge>
}

export function Avatar({ name, size = 'md', tone = 'teal' }: { name: string; size?: 'sm' | 'md' | 'lg'; tone?: 'teal' | 'navy' }) {
  return (
    <div
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-full font-semibold',
        tone === 'teal' ? 'bg-teal-soft text-teal-dark' : 'bg-navy text-white',
        { sm: 'size-8 text-xs', md: 'size-11 text-sm', lg: 'size-16 text-lg' }[size],
      )}
    >
      {initials(name)}
    </div>
  )
}

// ------------------------------------------------------------------ forms

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-navy-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-navy-500">{hint}</span>}
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-sm text-navy placeholder:text-navy-300 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(inputClass, props.className)} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(inputClass, 'appearance-auto pr-8', props.className)} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={clsx(inputClass, 'resize-y', props.className)} />
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div className={clsx('inline-flex rounded-xl bg-canvas p-1 ring-1 ring-line', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={clsx(
            'flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
            value === o.value ? 'bg-white text-navy shadow-sm' : 'text-navy-500 hover:text-navy',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}) {
  return (
    <label className={clsx('flex items-start gap-3', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}>
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 accent-teal"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-navy">{label}</span>
        {description && <span className="block text-xs text-navy-500">{description}</span>}
      </span>
    </label>
  )
}

export function RadioCard({
  checked,
  onSelect,
  title,
  description,
}: {
  checked: boolean
  onSelect: () => void
  title: ReactNode
  description?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        'flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors',
        checked ? 'border-teal bg-teal-soft/60 ring-1 ring-teal' : 'border-line bg-white hover:border-line-strong',
      )}
    >
      <span className={clsx('mt-0.5 size-4 shrink-0 rounded-full border-2', checked ? 'border-teal bg-teal ring-2 ring-inset ring-white' : 'border-line-strong')} />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-navy">{title}</span>
        {description && <span className="mt-0.5 block text-xs text-navy-500">{description}</span>}
      </span>
    </button>
  )
}

// ------------------------------------------------------------------ rating

export function Stars({ value, size = 'sm' }: { value: number; size?: 'sm' | 'lg' }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value.toFixed(1)} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={clsx(size === 'sm' ? 'size-4' : 'size-6', i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'fill-line text-line')}
        />
      ))}
    </span>
  )
}

export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2" role="radiogroup">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
          onClick={() => onChange(i)}
          className="rounded-lg p-1 transition-transform hover:scale-110"
        >
          <Star className={clsx('size-9', i <= value ? 'fill-amber-400 text-amber-400' : 'fill-white text-line-strong')} />
        </button>
      ))}
    </div>
  )
}

// ------------------------------------------------------------------- modal

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-navy-500 hover:bg-canvas" aria-label={t.app.close}>
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-navy-300">{label}</dt>
      <dd className="mt-0.5 text-sm text-navy">{children}</dd>
    </div>
  )
}
