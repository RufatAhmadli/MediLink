import clsx from 'clsx'
import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { useToasts } from '../store/toast'

export function Toaster() {
  const toasts = useToasts((s) => s.toasts)
  const dismiss = useToasts((s) => s.dismiss)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => {
        const Icon = toast.tone === 'error' ? XCircle : toast.tone === 'info' ? Info : CheckCircle2
        return (
          <button
            key={toast.id}
            onClick={() => dismiss(toast.id)}
            className={clsx(
              'pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-medium shadow-lg',
              toast.tone === 'error' ? 'bg-high text-white' : 'bg-navy text-white',
            )}
          >
            <Icon className={clsx('size-5 shrink-0', toast.tone === 'error' ? 'text-white' : 'text-teal-glow')} />
            {toast.message}
          </button>
        )
      })}
    </div>
  )
}
