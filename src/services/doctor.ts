import { addMinutes, subMinutes } from 'date-fns'
import { newId } from '../lib/clinical'
import { db, mutate } from '../store/db'
import { getObservationSeries, type ObservationSeries } from './patient'
import type {
  AuditAction,
  Composition,
  ConsentScope,
  Diagnosis,
  FollowUpRequest,
  FollowUpTimeframe,
  LabOrder,
  Observation,
  OpeningHours,
  Organization,
  Patient,
  Practitioner,
  VisitType,
} from '../types'
import {
  activeConsent,
  appointmentView,
  byDateDesc,
  consentState,
  consentView,
  delay,
  findOrg,
  findPatient,
  findPractitioner,
  reportView,
  summaryView,
  type AppointmentView,
  type ConsentView,
  type ReportView,
  type SummaryView,
} from './shared'

export async function getDoctorMe(practitionerId: string): Promise<{ practitioner: Practitioner; organization: Organization }> {
  await delay(0)
  const d = db()
  const practitioner = findPractitioner(d, practitionerId)
  return { practitioner, organization: findOrg(d, practitioner.organizationId) }
}

// --------------------------------------------------------------- schedule

export async function getDoctorSchedule(practitionerId: string, from: Date, to: Date): Promise<AppointmentView[]> {
  await delay()
  const d = db()
  return d.appointments
    .filter(
      (a) =>
        a.practitionerId === practitionerId &&
        ['booked', 'pending', 'proposed', 'fulfilled'].includes(a.status) &&
        new Date(a.start) >= from &&
        new Date(a.start) < to,
    )
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((a) => appointmentView(d, a))
}

export async function getUnreadCounts(practitionerId: string): Promise<{ requests: number; inbox: number }> {
  await delay(0)
  const d = db()
  const myOrders = new Set(d.serviceRequests.filter((s) => s.requesterId === practitionerId).map((s) => s.id))
  return {
    requests: d.appointments.filter((a) => a.practitionerId === practitionerId && a.status === 'pending').length,
    inbox: d.reports.filter((r) => r.orderId && myOrders.has(r.orderId) && r.unreadByRequester).length,
  }
}

// --------------------------------------------------------------- requests

export async function getDoctorRequests(practitionerId: string): Promise<{
  appointmentRequests: AppointmentView[]
  proposed: AppointmentView[]
  accessRequests: ConsentView[]
}> {
  await delay()
  const d = db()
  const mine = d.appointments.filter((a) => a.practitionerId === practitionerId)
  return {
    appointmentRequests: mine
      .filter((a) => a.status === 'pending')
      .sort((a, b) => a.start.localeCompare(b.start))
      .map((a) => appointmentView(d, a)),
    proposed: mine.filter((a) => a.status === 'proposed').map((a) => appointmentView(d, a)),
    accessRequests: d.consents
      .filter((c) => c.granteeId === practitionerId && c.status === 'pending')
      .map((c) => consentView(d, c)),
  }
}

export async function approveAppointment(appointmentId: string): Promise<void> {
  await delay(200)
  mutate((d) => ({ appointments: d.appointments.map((a) => (a.id === appointmentId ? { ...a, status: 'booked' as const } : a)) }))
}

export async function declineAppointment(appointmentId: string): Promise<void> {
  await delay(200)
  mutate((d) => ({
    appointments: d.appointments.map((a) => (a.id === appointmentId ? { ...a, status: 'declined' as const } : a)),
    serviceRequests: d.serviceRequests.map((s) =>
      s.appointmentId === appointmentId ? { ...s, status: 'active' as const, appointmentId: undefined } : s,
    ),
  }))
}

export async function proposeNewTime(appointmentId: string, start: string): Promise<void> {
  await delay(200)
  mutate((d) => ({
    appointments: d.appointments.map((a) => (a.id === appointmentId ? { ...a, status: 'proposed' as const, proposedStart: start } : a)),
  }))
}

// --------------------------------------------------------------- patients

export interface DoctorPatientRow {
  patient: Patient
  access: ConsentView | null
  pendingRequest: boolean
  lastVisit?: string
  nextVisit?: string
}

export async function getDoctorPatients(practitionerId: string, query: string): Promise<DoctorPatientRow[]> {
  await delay()
  const d = db()
  const now = new Date()
  const ids = new Set<string>([
    ...d.appointments.filter((a) => a.practitionerId === practitionerId).map((a) => a.patientId),
    ...d.consents.filter((c) => c.granteeId === practitionerId).map((c) => c.patientId),
    ...d.serviceRequests.filter((s) => s.requesterId === practitionerId).map((s) => s.patientId),
  ])
  const q = query.trim().toLowerCase()
  return [...ids]
    .map((id) => findPatient(d, id))
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.identifier.toLowerCase().includes(q))
    .map((patient) => {
      const visits = d.appointments.filter(
        (a) => a.practitionerId === practitionerId && a.patientId === patient.id && ['booked', 'fulfilled'].includes(a.status),
      )
      const consent = activeConsent(d, patient.id, practitionerId)
      return {
        patient,
        access: consent ? consentView(d, consent) : null,
        pendingRequest: d.consents.some((c) => c.patientId === patient.id && c.granteeId === practitionerId && c.status === 'pending'),
        lastVisit: visits.filter((a) => new Date(a.start) < now).sort(byDateDesc((a) => a.start))[0]?.start,
        nextVisit: visits.filter((a) => new Date(a.start) >= now).sort((a, b) => a.start.localeCompare(b.start))[0]?.start,
      }
    })
    .sort((a, b) => a.patient.name.localeCompare(b.patient.name))
}

export interface PatientRecord {
  patient: Patient
  access: ConsentView | null
  pendingRequest: boolean
  canSeeLabs: boolean
  canSeeSummaries: boolean
  reports: ReportView[]
  latest: Observation[]
  measured: string[]
  summaries: SummaryView[]
  appointmentsWithMe: AppointmentView[]
}

/** Everything a doctor may see on the patient page, filtered by the patient's consent. */
export async function getPatientRecord(practitionerId: string, patientId: string): Promise<PatientRecord> {
  await delay()
  const d = db()
  const consent = activeConsent(d, patientId, practitionerId)
  const scope: ConsentScope | null = consent?.scope ?? null
  const canSeeLabs = scope === 'all' || scope === 'labs'
  const canSeeSummaries = scope === 'all' || scope === 'summaries'
  const obs = canSeeLabs ? d.observations.filter((o) => o.patientId === patientId) : []
  const latestByCode = new Map<string, Observation>()
  for (const o of obs) {
    const cur = latestByCode.get(o.loinc)
    if (!cur || cur.effective < o.effective) latestByCode.set(o.loinc, o)
  }
  return {
    patient: findPatient(d, patientId),
    access: consent ? consentView(d, consent) : null,
    pendingRequest: d.consents.some((c) => c.patientId === patientId && c.granteeId === practitionerId && consentState(c) === 'pending'),
    canSeeLabs,
    canSeeSummaries,
    reports: canSeeLabs
      ? d.reports
          .filter((r) => r.patientId === patientId)
          .sort(byDateDesc((r) => r.issued))
          .map((r) => reportView(d, r))
      : [],
    latest: [...latestByCode.values()].sort(byDateDesc((o) => o.effective)),
    measured: [...latestByCode.keys()],
    summaries: canSeeSummaries
      ? d.compositions
          .filter((c) => c.patientId === patientId)
          .sort(byDateDesc((c) => c.date))
          .map((c) => summaryView(d, c))
      : [],
    appointmentsWithMe: d.appointments
      .filter((a) => a.practitionerId === practitionerId && a.patientId === patientId)
      .sort(byDateDesc((a) => a.start))
      .map((a) => appointmentView(d, a)),
  }
}

/** Timeline data for the patient page; only with lab-result access. */
export async function getDoctorRecordSeries(practitionerId: string, patientId: string, loinc: string): Promise<ObservationSeries> {
  const consent = activeConsent(db(), patientId, practitionerId)
  if (!consent || consent.scope === 'summaries') throw new Error('No access to lab results')
  return getObservationSeries(patientId, loinc)
}

/** Writes an AuditEvent when a doctor opens a record (de-duplicated within 15 minutes). */
export async function logRecordAccess(practitionerId: string, patientId: string, action: AuditAction): Promise<void> {
  await delay(0)
  const d = db()
  const since = subMinutes(new Date(), 15).toISOString()
  const recent = d.auditEvents.some(
    (e) => e.actorId === practitionerId && e.patientId === patientId && e.action === action && e.recorded > since,
  )
  if (recent) return
  const practitioner = findPractitioner(d, practitionerId)
  mutate((cur) => ({
    auditEvents: [
      ...cur.auditEvents,
      {
        id: newId('audit'),
        patientId,
        actorId: practitionerId,
        organizationId: practitioner.organizationId,
        action,
        recorded: new Date().toISOString(),
      },
    ],
  }))
}

export async function requestAccess(practitionerId: string, patientId: string): Promise<void> {
  await delay(250)
  const now = new Date()
  mutate((d) => ({
    consents: [
      ...d.consents,
      {
        id: newId('consent'),
        patientId,
        granteeId: practitionerId,
        scope: 'all',
        start: now.toISOString(),
        end: addMinutes(now, 60 * 24 * 30).toISOString(),
        status: 'pending',
        source: 'request',
        createdAt: now.toISOString(),
      },
    ],
  }))
}

export async function cancelAccessRequest(consentId: string): Promise<void> {
  await delay(200)
  mutate((d) => ({ consents: d.consents.filter((c) => c.id !== consentId) }))
}

// ----------------------------------------------------------- write/order

export interface SummaryInput {
  practitionerId: string
  patientId: string
  appointmentId?: string
  reason: string
  findings: string
  diagnoses: Diagnosis[]
  treatment: string
  recommendations: string
  followUp: string
}

export async function writeSummary(input: SummaryInput): Promise<Composition> {
  await delay(300)
  const { practitionerId, ...rest } = input
  const composition: Composition = { id: newId('comp'), authorId: practitionerId, date: new Date().toISOString(), ...rest }
  mutate((d) => ({
    compositions: [...d.compositions, composition],
    // Writing the summary completes the visit.
    appointments: input.appointmentId
      ? d.appointments.map((a) => (a.id === input.appointmentId ? { ...a, status: 'fulfilled' as const } : a))
      : d.appointments,
  }))
  return composition
}

export async function createLabOrder(input: {
  practitionerId: string
  patientId: string
  testIds: string[]
  labId: string | null
  note: string
}): Promise<LabOrder> {
  await delay(300)
  const order: LabOrder = {
    id: newId('sr'),
    category: 'lab',
    patientId: input.patientId,
    requesterId: input.practitionerId,
    labId: input.labId,
    testIds: input.testIds,
    note: input.note.trim(),
    status: 'active',
    authoredOn: new Date().toISOString(),
  }
  mutate((d) => ({ serviceRequests: [...d.serviceRequests, order] }))
  return order
}

export async function sendFollowUpRequest(input: {
  practitionerId: string
  patientId: string
  visitTypeId: string
  timeframe: FollowUpTimeframe
  note: string
}): Promise<FollowUpRequest> {
  await delay(300)
  const request: FollowUpRequest = {
    id: newId('sr'),
    category: 'follow-up',
    patientId: input.patientId,
    requesterId: input.practitionerId,
    visitTypeId: input.visitTypeId,
    timeframe: input.timeframe,
    note: input.note.trim(),
    status: 'active',
    authoredOn: new Date().toISOString(),
  }
  mutate((d) => ({ serviceRequests: [...d.serviceRequests, request] }))
  return request
}

// ------------------------------------------------------------ inbox

export async function getResultsInbox(practitionerId: string): Promise<ReportView[]> {
  await delay()
  const d = db()
  const myOrders = new Set(d.serviceRequests.filter((s) => s.category === 'lab' && s.requesterId === practitionerId).map((s) => s.id))
  return d.reports
    .filter((r) => r.orderId && myOrders.has(r.orderId))
    .sort(byDateDesc((r) => r.issued))
    .map((r) => reportView(d, r))
}

export async function markReportRead(reportId: string): Promise<void> {
  await delay(0)
  mutate((d) => ({ reports: d.reports.map((r) => (r.id === reportId ? { ...r, unreadByRequester: false } : r)) }))
}

// ---------------------------------------------------------- feedback

export interface FeedbackItem {
  id: string
  rating: number
  comment: string
  createdAt: string
  patientInitials: string
  visitType?: string
}

export async function getDoctorFeedback(practitionerId: string): Promise<{
  average: number
  count: number
  distribution: Record<number, number>
  items: FeedbackItem[]
}> {
  await delay()
  const d = db()
  const mine = d.feedback.filter((f) => f.practitionerId === practitionerId).sort(byDateDesc((f) => f.createdAt))
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  mine.forEach((f) => distribution[f.rating]++)
  return {
    average: mine.length ? mine.reduce((s, f) => s + f.rating, 0) / mine.length : 0,
    count: mine.length,
    distribution,
    items: mine.map((f) => {
      const patient = findPatient(d, f.patientId)
      const apt = d.appointments.find((a) => a.id === f.appointmentId)
      return {
        id: f.id,
        rating: f.rating,
        comment: f.comment,
        createdAt: f.createdAt,
        patientInitials: patient.name
          .split(' ')
          .map((p) => p[0])
          .join('. ') + '.',
        visitType: apt?.visitTypeId ? d.visitTypes.find((v) => v.id === apt.visitTypeId)?.name : undefined,
      }
    }),
  }
}

// ---------------------------------------------------------- settings

export async function getAvailability(practitionerId: string): Promise<{ weeklyHours: OpeningHours; visitTypes: VisitType[] }> {
  await delay()
  const d = db()
  return {
    weeklyHours: d.schedules.find((s) => s.practitionerId === practitionerId)?.weeklyHours ?? {},
    visitTypes: d.visitTypes.filter((v) => v.practitionerId === practitionerId),
  }
}

export async function getVisitTypes(practitionerId: string): Promise<VisitType[]> {
  await delay(0)
  return db().visitTypes.filter((v) => v.practitionerId === practitionerId && v.active)
}

export async function saveWeeklyHours(practitionerId: string, weeklyHours: OpeningHours): Promise<void> {
  await delay(250)
  mutate((d) => ({
    schedules: d.schedules.some((s) => s.practitionerId === practitionerId)
      ? d.schedules.map((s) => (s.practitionerId === practitionerId ? { ...s, weeklyHours } : s))
      : [...d.schedules, { practitionerId, weeklyHours }],
  }))
}

export async function saveVisitType(visitType: VisitType): Promise<void> {
  await delay(200)
  mutate((d) => ({
    visitTypes: d.visitTypes.some((v) => v.id === visitType.id)
      ? d.visitTypes.map((v) => (v.id === visitType.id ? visitType : v))
      : [...d.visitTypes, visitType],
  }))
}
