import { differenceInHours, format } from 'date-fns'
import { CalendarDays, ChevronRight, ClipboardList, FileText, LineChart, MessageSquareHeart, QrCode, ShieldAlert, Stethoscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ReportCard } from '../../components/records'
import { Button, ButtonLink, Card, Loading, SectionTitle } from '../../components/ui'
import { t } from '../../i18n/strings'
import { fmtTime, fmtWeekday } from '../../lib/format'
import { useQuery } from '../../lib/useQuery'
import { getPatientHome, respondToProposal } from '../../services/patient'
import { useCurrentUser } from '../../store/auth'
import { toast } from '../../store/toast'
import { DateBlock, OrderStatusBadge } from './shared'

export function PatientHome() {
  const user = useCurrentUser()
  const { data } = useQuery(() => getPatientHome(user.refId), [user.refId])
  if (!data) return <Loading />
  const next = data.nextAppointment

  return (
    <div className="stagger space-y-7">
      <div>
        <p className="text-sm text-navy-500">{format(new Date(), 'EEEE, d MMMM')}</p>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">{t.patient.greeting(data.patient.name)} 👋</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal-dark shadow-card ring-1 ring-line/70">
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-teal" />
              <span className="relative size-2 rounded-full bg-teal" />
            </span>
            {t.patient.recordsProtected}
          </span>
          <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-navy-700 shadow-card ring-1 ring-line/70">
            {t.patient.labsConnected(new Set(data.latestReports.map((r) => r.labId)).size)}
          </span>
        </div>
      </div>

      {data.pendingAccessRequests > 0 && (
        <Link to="/patient/access" className="flex items-center gap-3 rounded-2xl bg-low-soft px-4 py-3 text-sm font-medium text-low">
          <ShieldAlert className="size-5 shrink-0" />
          <span className="flex-1">{t.patient.pendingAccess(data.pendingAccessRequests)}</span>
          <ChevronRight className="size-4" />
        </Link>
      )}

      {data.proposals.map((a) => (
        <Card key={a.id} className="border-blue-200 bg-blue-50/60 p-4">
          <div className="text-sm font-semibold text-blue-900">{t.patient.proposalTitle}</div>
          <p className="mt-1 text-sm text-blue-900/80">
            {a.practitioner?.name} · {a.visitType?.name}
            <br />
            <b>
              {fmtWeekday(a.proposedStart!)}, {fmtTime(a.proposedStart!)}
            </b>{' '}
            <span className="line-through opacity-60">
              {fmtWeekday(a.start)}, {fmtTime(a.start)}
            </span>
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => respondToProposal(a.id, true).then(() => toast(t.status.appointment.booked))}>
              {t.patient.accept}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => respondToProposal(a.id, false)}>
              {t.patient.decline}
            </Button>
          </div>
        </Card>
      ))}

      <section>
        <SectionTitle
          action={
            <Link to="/patient/appointments" className="text-sm font-semibold text-teal">
              {t.app.viewAll}
            </Link>
          }
        >
          {t.patient.nextAppointment}
        </SectionTitle>
        {next ? (
          <Link
            to="/patient/appointments"
            className="relative isolate block overflow-hidden rounded-2xl bg-gradient-to-br from-[#0e8a7e] via-teal to-[#075a52] p-4 text-white shadow-glow transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="absolute -right-10 -top-12 -z-10 size-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-16 right-16 -z-10 size-32 rounded-full bg-teal-glow/20 blur-xl" />
            <div className="flex gap-3">
              <DateBlock iso={next.start} tone="dark" />
              <div className="min-w-0 flex-1">
                <div className="text-lg font-semibold leading-tight">{next.kind === 'lab' ? next.organization.name : next.practitioner?.name}</div>
                <div className="text-sm text-white/80">
                  {next.kind === 'lab' ? next.tests.map((x) => x.name).join(', ') : `${next.practitioner?.specialty} · ${next.visitType?.name}`}
                </div>
                <div className="mt-2 text-sm font-medium">
                  {fmtWeekday(next.start)} · {fmtTime(next.start)} · {next.organization.shortName}
                </div>
                {next.status !== 'booked' && (
                  <div className="mt-2 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">{t.status.appointment[next.status]}</div>
                )}
              </div>
            </div>
          </Link>
        ) : (
          <Card className="flex items-center justify-between gap-3 p-4">
            <span className="text-sm text-navy-500">{t.patient.noUpcoming}</span>
            <ButtonLink to="/patient/book" size="sm">
              {t.patient.bookVisit}
            </ButtonLink>
          </Card>
        )}
      </section>

      {data.feedbackDue.map((a) => (
        <Card key={a.id} className="flex items-center gap-3 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
            <MessageSquareHeart className="size-5" />
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-semibold">{t.patient.feedbackPrompt(a.practitioner!.name)}</div>
            <div className="text-xs text-navy-500">{t.patient.feedbackPrivacy}</div>
          </div>
          <ButtonLink to={`/patient/feedback/${a.id}`} size="sm" variant="subtle">
            {t.patient.giveFeedback}
          </ButtonLink>
        </Card>
      ))}

      {data.followUps.length > 0 && (
        <section>
          <SectionTitle>{t.patient.followUps}</SectionTitle>
          <div className="space-y-3">
            {data.followUps.map((f) => (
              <Card key={f.id} className="p-4">
                <div className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-soft text-teal">
                    <Stethoscope className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{t.patient.followUpText(f.requester.name, t.timeframe[f.timeframe])}</p>
                    <p className="mt-0.5 text-xs text-navy-500">
                      {f.visitType.name} · {f.organization.name}
                    </p>
                    {f.note && <p className="mt-2 text-sm text-navy-700">“{f.note}”</p>}
                    <ButtonLink
                      className="mt-3"
                      size="sm"
                      to={`/patient/book/doctor/${f.requesterId}?visitType=${f.visitTypeId}&followUp=${f.id}`}
                    >
                      {t.patient.chooseTime}
                    </ButtonLink>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {data.openOrders.length > 0 && (
        <section>
          <SectionTitle
            action={
              <Link to="/patient/lab-orders" className="text-sm font-semibold text-teal">
                {t.app.viewAll}
              </Link>
            }
          >
            {t.patient.openOrders}
          </SectionTitle>
          <div className="space-y-2">
            {data.openOrders.map((o) => (
              <Link key={o.id} to="/patient/lab-orders" className="flex items-center gap-3 rounded-2xl border border-line/80 bg-white shadow-card p-3.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-low-soft text-low">
                  <ClipboardList className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{o.tests.map((x) => x.name).join(', ')}</div>
                  <div className="truncate text-xs text-navy-500">{t.status.orderedBy(o.requester.name)}</div>
                </div>
                <OrderStatusBadge status={o.display} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3">
        {[
          { to: '/patient/appointments', label: t.patient.quick.appointments, icon: CalendarDays },
          { to: '/patient/lab-orders', label: t.patient.quick.orders, icon: ClipboardList },
          { to: '/patient/timeline', label: t.patient.quick.timeline, icon: LineChart },
          { to: '/patient/summaries', label: t.patient.quick.summaries, icon: FileText },
        ].map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex items-center gap-3 rounded-2xl border border-line/80 bg-white shadow-card p-3.5 text-sm font-semibold hover:border-teal">
            <Icon className="size-5 text-teal" /> {label}
          </Link>
        ))}
      </section>

      <section>
        <SectionTitle
          action={
            <Link to="/patient/results" className="text-sm font-semibold text-teal">
              {t.app.viewAll}
            </Link>
          }
        >
          {t.patient.latestResults}
        </SectionTitle>
        <div className="space-y-3">
          {data.latestReports.map((r) => (
            <ReportCard key={r.id} report={r} to={`/patient/results/${r.id}`} isNew={differenceInHours(new Date(), new Date(r.issued)) < 48} />
          ))}
        </div>
      </section>

      <ButtonLink to="/patient/access/share" block size="lg" variant="secondary" className="h-auto gap-3 py-3 text-left">
        <QrCode className="size-5 text-teal" />
        <span>
          {t.patient.shareRecords}
          <span className="block text-xs font-normal text-navy-500">{t.patient.shareRecordsHint}</span>
        </span>
      </ButtonLink>
    </div>
  )
}
