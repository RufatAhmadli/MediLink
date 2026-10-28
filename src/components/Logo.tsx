import clsx from 'clsx'
import { t } from '../i18n/strings'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={clsx('shrink-0', className)} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#0B7A6F" />
      <path d="M13 8h6v5h5v6h-5v5h-6v-5H8v-6h5z" fill="#fff" />
    </svg>
  )
}

export function Logo({ dark, className }: { dark?: boolean; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-2', className)}>
      <LogoMark className="size-8" />
      <span className={clsx('text-lg font-bold tracking-tight', dark ? 'text-white' : 'text-navy')}>{t.app.name}</span>
    </span>
  )
}
