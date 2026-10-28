import { addDays, endOfDay } from 'date-fns'
import { catalogTest } from '../lib/clinical'
import type { Database } from '../mock/seed'
import type {
  Appointment,
  AuditEvent,
  CatalogTest,
  Composition,
  Consent,
  ConsentScope,
  DiagnosticReport,
  ExpiryOption,
  FollowUpRequest,
  LabOrder,
  Observation,
  Organization,
  Patient,
  Practitioner,
  VisitType,
} from '../types'

// Shared lookups and view models. A real backend would return these shapes
// from its endpoints; here they are assembled from the in-memory store.

/** Simulated network latency. */
export const delay = (ms = 120) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export class NotFoundError extends Error {}

const must = <T>(value: T | undefined, what: string): T => {
  if (value === undefined) throw new NotFoundError(`${what} not found`)
  return value
}

export const findPatient = (d: Database, id: string): Patient => must(d.patients.find((p) => p.id === id), 'Patient')
export const findPractitioner = (d: Database, id: string): Practitioner =>
  must(d.practitioners.find((p) => p.id === id), 'Practitioner')
export const findOrg = (d: Database, id: string): Organization => must(d.organizations.find((o) => o.id === id), 'Organization')
export const findVisitType = (d: Database, id: string): VisitType => must(d.visitTypes.find((v) => v.id === id), 'Visit type')

// ---------------------------------------------------------------- views

export interface AppointmentView extends Appointment {
  patient: Patient
  organization: Organization
  practitioner?: Practitioner
  visitType?: VisitType
  tests: CatalogTest[]
  order?: LabOrder
  orderedBy?: Practitioner
  hasFeedback: boolean
}

export function appointmentView(d: Database, a: Appointment): AppointmentView {
  const order = a.serviceRequestId
    ? (d.serviceRequests.find((s) => s.id === a.serviceRequestId && s.category === 'lab') as LabOrder | undefined)
    : undefined
  return {
    ...a,
    patient: findPatient(d, a.patientId),
    organization: findOrg(d, a.organizationId),
    practitioner: a.practitionerId ? findPractitioner(d, a.practitionerId) : undefined,
    visitType: a.visitTypeId ? findVisitType(d, a.visitTypeId) : undefined,
    tests: (a.testIds ?? order?.testIds ?? []).map(catalogTest),
    order,
    orderedBy: order ? findPractitioner(d, order.requesterId) : undefined,
    hasFeedback: d.feedback.some((f) => f.appointmentId === a.id),
  }
}

export interface ReportView extends DiagnosticReport {
  patient: Patient
  lab: Organization
  observations: Observation[]
  orderedBy?: Practitioner
}

export function reportView(d: Database, r: DiagnosticReport): ReportView {
  const order = r.orderId ? (d.serviceRequests.find((s) => s.id === r.orderId) as LabOrder | undefined) : undefined
  return {
    ...r,
    patient: findPatient(d, r.patientId),
    lab: findOrg(d, r.labId),
    observations: r.observationIds.map((id) => must(d.observations.find((o) => o.id === id), 'Observation')),
    orderedBy: order ? findPractitioner(d, order.requesterId) : undefined,
  }
}

export type LabOrderStatusLabel = 'to-book' | 'booked' | 'result-ready' | 'cancelled'

export interface LabOrderView extends LabOrder {
  patient: Patient
  requester: Practitioner
  requesterOrg: Organization
  lab: Organization | null
  tests: CatalogTest[]
  appointment?: AppointmentView
  report?: DiagnosticReport
  display: LabOrderStatusLabel
}

export function labOrderView(d: Database, o: LabOrder): LabOrderView {
  const requester = findPractitioner(d, o.requesterId)
  const appointment = o.appointmentId ? d.appointments.find((a) => a.id === o.appointmentId) : undefined
  const report = d.reports.find((r) => r.orderId === o.id)
  const display: LabOrderStatusLabel =
    o.status === 'completed' ? 'result-ready' : o.status === 'booked' ? 'booked' : o.status === 'cancelled' ? 'cancelled' : 'to-book'
  return {
    ...o,
    patient: findPatient(d, o.patientId),
    requester,
    requesterOrg: findOrg(d, requester.organizationId),
    lab: o.labId ? findOrg(d, o.labId) : null,
    tests: o.testIds.map(catalogTest),
    appointment: appointment ? appointmentView(d, appointment) : undefined,
    report,
    display,
  }
}

export interface FollowUpView extends FollowUpRequest {
  requester: Practitioner
  organization: Organization
  visitType: VisitType
}

export function followUpView(d: Database, f: FollowUpRequest): FollowUpView {
  const requester = findPractitioner(d, f.requesterId)
  return { ...f, requester, organization: findOrg(d, requester.organizationId), visitType: findVisitType(d, f.visitTypeId) }
}

export interface SummaryView extends Composition {
  author: Practitioner
  organization: Organization
}

export function summaryView(d: Database, c: Composition): SummaryView {
  const author = findPractitioner(d, c.authorId)
  return { ...c, author, organization: findOrg(d, author.organizationId) }
}

export type ConsentState = 'active' | 'expired' | 'revoked' | 'pending' | 'declined'

export interface ConsentView extends Consent {
  grantee: Practitioner
  organization: Organization
  patient: Patient
  state: ConsentState
}

export function consentState(c: Consent, now = new Date()): ConsentState {
  if (c.status === 'active') return c.end && new Date(c.end) < now ? 'expired' : 'active'
  return c.status
}

export function consentView(d: Database, c: Consent): ConsentView {
  const grantee = findPractitioner(d, c.granteeId)
  return {
    ...c,
    grantee,
    organization: findOrg(d, grantee.organizationId),
    patient: findPatient(d, c.patientId),
    state: consentState(c),
  }
}

export interface AuditView extends AuditEvent {
  actor: Practitioner
  organization: Organization
}

export function auditView(d: Database, e: AuditEvent): AuditView {
  return { ...e, actor: findPractitioner(d, e.actorId), organization: findOrg(d, e.organizationId) }
}

// -------------------------------------------------------------- consent

const scopeRank: Record<ConsentScope, number> = { all: 3, labs: 2, summaries: 1 }

/** The broadest currently active consent from a patient to a practitioner. */
export function activeConsent(d: Database, patientId: string, practitionerId: string): Consent | undefined {
  return d.consents
    .filter((c) => c.patientId === patientId && c.granteeId === practitionerId && consentState(c) === 'active')
    .sort((a, b) => scopeRank[b.scope] - scopeRank[a.scope])[0]
}

export function expiryToEnd(expiry: ExpiryOption, now = new Date()): string | null {
  if (expiry === 'visit') return endOfDay(now).toISOString()
  if (expiry === '30d') return endOfDay(addDays(now, 30)).toISOString()
  return null
}

export const byDateDesc =
  <T>(get: (item: T) => string) =>
  (a: T, b: T) =>
    get(b).localeCompare(get(a))
