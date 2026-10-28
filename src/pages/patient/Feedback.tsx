import { Heart, Lock } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, ButtonLink, Card, EmptyState, Field, Loading, PageHeader, StarInput, Textarea } from '../../components/ui'
import { t } from '../../i18n/strings'
import { fmtDate } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { getAppointment, submitFeedback } from '../../services/patient'
import { toast } from '../../store/toast'

export function Feedback() {
  const { id = '' } = useParams()
  const { data: a, error } = useQuery(() => getAppointment(id), [id])
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  if (error) return <EmptyState>{error.message}</EmptyState>
  if (!a) return <Loading />

  if (a.hasFeedback) {
    return (
      <div className="pt-8 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-teal-soft text-teal">
          <Heart className="size-8" />
        </div>
        <p className="mx-auto mt-5 max-w-xs font-semibold">{t.patient.feedbackThanks}</p>
        <ButtonLink to="/patient/appointments" className="mt-6">
          {t.patient.toAppointments}
        </ButtonLink>
      </div>
    )
  }

  const send = async () => {
    setBusy(true)
    await submitFeedback(a.id, rating, comment)
    toast(t.patient.feedbackSent)
    setBusy(false)
  }

  return (
    <div>
      <PageHeader title={t.patient.feedbackTitle} back />
      <Card className="p-4">
        <div className="font-semibold">{a.practitioner?.name}</div>
        <div className="text-sm text-navy-500">
          {a.visitType?.name} · {a.organization.name} · {fmtDate(a.start)}
        </div>
      </Card>

      <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-navy px-4 py-3 text-sm text-white">
        <Lock className="mt-0.5 size-4 shrink-0 text-teal-glow" />
        {t.patient.feedbackPrivacy}
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <div className="mb-2 text-sm font-medium text-navy-700">{t.patient.rating}</div>
          <StarInput value={rating} onChange={setRating} />
        </div>
        <Field label={t.patient.comment}>
          <Textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t.patient.commentPlaceholder} />
        </Field>
        <Button block size="lg" disabled={!rating} loading={busy} onClick={send}>
          {t.patient.sendFeedback}
        </Button>
      </div>
    </div>
  )
}
