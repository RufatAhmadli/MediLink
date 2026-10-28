import { addMinutes, subDays } from 'date-fns'
import { newId, testDef } from '../lib/clinical'
import { db, mutate } from '../store/db'
import type { FollowUpRequest, Interpretation, LabOrder, Organization, Patient, TestDefinition } from '../types'
import {
  appointmentView,
  byDateDesc,
  delay,
  findOrg,
  findPatient,
  followUpView,
  labOrderView,
  reportView,
  summaryView,
  type AppointmentView,
  type FollowUpView,
  type LabOrderView,
  type ReportView,
  type SummaryView,
} from './shared'

export async function getPatient(patientId: string): Promise<Patient> {
  await delay(0)
  return findPatient(db(), patientId)
}

const isUpcoming = (a: AppointmentView, now: Date) =>
  ['booked', 'pending', 'proposed'].includes(a.status) && new Date(a.end) > now

export interface PatientHome {
  patient: Patient
  nextAppointment?: AppointmentView
  proposals: AppointmentView[]
  followUps: FollowUpView[]
  openOrders: LabOrderView[]
  latestReports: ReportView[]
  feedbackDue: AppointmentView[]
  pendingAccessRequests: number
}

export async function getPatientHome(patientId: string): Promise<PatientHome> {
  await delay()
  const d = db()
  const now = new Date()
  const appointments = d.appointments.filter((a) => a.patientId === patientId).map((a) => appointmentView(d, a))
  const upcoming = appointments.filter((a) => isUpcoming(a, now)).sort((a, b) => a.start.localeCompare(b.start))
  return {
    patient: findPatient(d, patientId),
    nextAppointment: upcoming.find((a) => a.status === 'booked') ?? upcoming[0],
    proposals: upcoming.filter((a) => a.status === 'proposed'),
    followUps: d.serviceRequests
      .filter((s): s is FollowUpRequest => s.category === 'follow-up' && s.patientId === patientId && s.status === 'active')
      .map((f) => followUpView(d, f)),
    openOrders: d.serviceRequests
      .filter((s): s is LabOrder => s.category === 'lab' && s.patientId === patientId && (s.status === 'active' || s.status === 'booked'))
      .map((o) => labOrderView(d, o)),
    latestReports: d.reports
      .filter((r) => r.patientId === patientId)
      .sort(byDateDesc((r) => r.issued))
      .slice(0, 3)
      .map((r) => reportView(d, r)),
    feedbackDue: appointments.filter(
      (a) => a.kind === 'doctor' && a.status === 'fulfilled' && !a.hasFeedback && new Date(a.start) > subDays(now, 30),
    ),
    pendingAccessRequests: d.consents.filter((c) => c.patientId === patientId && c.status === 'pending').length,
  }
}

export async function getMyAppointments(patientId: string): Promise<{ upcoming: AppointmentView[]; past: AppointmentView[] }> {
  await delay()
  const d = db()
  const now = new Date()
  const all = d.appointments.filter((a) => a.patientId === patientId).map((a) => appointmentView(d, a))
  return {
    upcoming: all.filter((a) => isUpcoming(a, now)).sort((a, b) => a.start.localeCompare(b.start)),
    past: all.filter((a) => !isUpcoming(a, now)).sort(byDateDesc((a) => a.start)),
  }
}

export async function getAppointment(appointmentId: string): Promise<AppointmentView> {
  await delay()
  const d = db()
  const a = d.appointments.find((x) => x.id === appointmentId)
  if (!a) throw new Error('Appointment not found')
  return appointmentView(d, a)
}

export async function cancelAppointment(appointmentId: string): Promise<void> {
  await delay(250)
  mutate((d) => {
    const apt = d.appointments.find((a) => a.id === appointmentId)
    return {
      appointments: d.appointments.map((a) => (a.id === appointmentId ? { ...a, status: 'cancelled' as const } : a)),
      // A cancelled booking puts the order or follow-up request back to "to book".
      serviceRequests: d.serviceRequests.map((s) =>
        s.appointmentId === appointmentId && s.status === 'booked' && apt
          ? { ...s, status: 'active' as const, appointmentId: undefined }
          : s,
      ),
    }
  })
}

/** Patient's answer to a time the doctor proposed. */
export async function respondToProposal(appointmentId: string, accept: boolean): Promise<void> {
  await delay(250)
  mutate((d) => ({
    appointments: d.appointments.map((a) => {
      if (a.id !== appointmentId || !a.proposedStart) return a
      if (!accept) return { ...a, status: 'cancelled' as const }
      const length = new Date(a.end).getTime() - new Date(a.start).getTime()
      return {
        ...a,
        status: 'booked' as const,
        start: a.proposedStart,
        end: addMinutes(new Date(a.proposedStart), length / 60000).toISOString(),
        proposedStart: undefined,
      }
    }),
  }))
}

export async function getMyLabOrders(patientId: string): Promise<LabOrderView[]> {
  await delay()
  const d = db()
  return d.serviceRequests
    .filter((s): s is LabOrder => s.category === 'lab' && s.patientId === patientId && s.status !== 'cancelled')
    .sort(byDateDesc((o) => o.authoredOn))
    .map((o) => labOrderView(d, o))
}

export async function getLabOrder(orderId: string): Promise<LabOrderView> {
  await delay()
  const d = db()
  const o = d.serviceRequests.find((s): s is LabOrder => s.id === orderId && s.category === 'lab')
  if (!o) throw new Error('Lab order not found')
  return labOrderView(d, o)
}

export async function getFollowUp(followUpId: string): Promise<FollowUpView> {
  await delay()
  const d = db()
  const f = d.serviceRequests.find((s): s is FollowUpRequest => s.id === followUpId && s.category === 'follow-up')
  if (!f) throw new Error('Follow-up request not found')
  return followUpView(d, f)
}

// -------------------------------------------------------------- results

export async function getMyReports(patientId: string): Promise<ReportView[]> {
  await delay()
  const d = db()
  return d.reports
    .filter((r) => r.patientId === patientId)
    .sort(byDateDesc((r) => r.issued))
    .map((r) => reportView(d, r))
}

export async function getReport(reportId: string): Promise<ReportView> {
  await delay()
  const d = db()
  const r = d.reports.find((x) => x.id === reportId)
  if (!r) throw new Error('Result not found')
  return reportView(d, r)
}

export interface SeriesPoint {
  date: string
  time: number
  value: number
  interpretation: Interpretation
  lab: Organization
  localName: string
  reportId: string
}

export interface ObservationSeries {
  definition: TestDefinition
  points: SeriesPoint[]
}

/** One standard test across all labs, oldest first. */
export async function getObservationSeries(patientId: string, loinc: string): Promise<ObservationSeries> {
  await delay()
  const d = db()
  return {
    definition: testDef(loinc),
    points: d.observations
      .filter((o) => o.patientId === patientId && o.loinc === loinc)
      .sort((a, b) => a.effective.localeCompare(b.effective))
      .map((o) => ({
        date: o.effective,
        time: new Date(o.effective).getTime(),
        value: o.value,
        interpretation: o.interpretation,
        lab: findOrg(d, o.performerLabId),
        localName: o.localName,
        reportId: o.reportId,
      })),
  }
}

/** Tests the patient has at least one result for, with result counts. */
export async function getMeasuredTests(patientId: string): Promise<{ definition: TestDefinition; count: number; labs: number }[]> {
  await delay()
  const obs = db().observations.filter((o) => o.patientId === patientId)
  const codes = [...new Set(obs.map((o) => o.loinc))]
  return codes
    .map((loinc) => {
      const mine = obs.filter((o) => o.loinc === loinc)
      return { definition: testDef(loinc), count: mine.length, labs: new Set(mine.map((o) => o.performerLabId)).size }
    })
    .sort((a, b) => b.count - a.count)
}

// ------------------------------------------------------------ summaries

export async function getMySummaries(patientId: string): Promise<SummaryView[]> {
  await delay()
  const d = db()
  return d.compositions
    .filter((c) => c.patientId === patientId)
    .sort(byDateDesc((c) => c.date))
    .map((c) => summaryView(d, c))
}

export async function getSummary(summaryId: string): Promise<SummaryView> {
  await delay()
  const d = db()
  const c = d.compositions.find((x) => x.id === summaryId)
  if (!c) throw new Error('Summary not found')
  return summaryView(d, c)
}

// ------------------------------------------------------------- feedback

export async function submitFeedback(appointmentId: string, rating: number, comment: string): Promise<void> {
  await delay(300)
  const d = db()
  const apt = d.appointments.find((a) => a.id === appointmentId)
  if (!apt?.practitionerId) throw new Error('Appointment not found')
  mutate((cur) => ({
    feedback: [
      ...cur.feedback,
      {
        id: newId('fb'),
        appointmentId,
        patientId: apt.patientId,
        practitionerId: apt.practitionerId!,
        organizationId: apt.organizationId,
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      },
    ],
  }))
}
