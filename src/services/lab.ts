import { endOfDay, startOfDay } from 'date-fns'
import { catalogTest, interpret, localNameFor, newId, testDef } from '../lib/clinical'
import { db, mutate } from '../store/db'
import type { DiagnosticReport, LabOrder, Observation, OpeningHours, Organization, TestDefinition } from '../types'
import {
  appointmentView,
  byDateDesc,
  delay,
  findOrg,
  labOrderView,
  reportView,
  type AppointmentView,
  type LabOrderView,
  type ReportView,
} from './shared'

export async function getLab(labId: string): Promise<Organization> {
  await delay(0)
  return findOrg(db(), labId)
}

export async function getLabBookings(labId: string): Promise<{ today: AppointmentView[]; upcoming: AppointmentView[] }> {
  await delay()
  const d = db()
  const from = startOfDay(new Date())
  const todayEnd = endOfDay(new Date())
  const mine = d.appointments
    .filter((a) => a.kind === 'lab' && a.organizationId === labId && ['booked', 'fulfilled'].includes(a.status) && new Date(a.start) >= from)
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((a) => appointmentView(d, a))
  return {
    today: mine.filter((a) => new Date(a.start) <= todayEnd),
    upcoming: mine.filter((a) => new Date(a.start) > todayEnd && a.status === 'booked'),
  }
}

/** Orders sent to this lab, booked at this lab, or open to any partner lab. */
export async function getIncomingOrders(labId: string): Promise<LabOrderView[]> {
  await delay()
  const d = db()
  return d.serviceRequests
    .filter((s): s is LabOrder => s.category === 'lab' && s.status !== 'cancelled')
    .filter((o) => {
      const apt = o.appointmentId ? d.appointments.find((a) => a.id === o.appointmentId) : undefined
      if (apt) return apt.organizationId === labId
      return o.labId === labId || (o.labId === null && o.status === 'active')
    })
    .sort(byDateDesc((o) => o.authoredOn))
    .map((o) => labOrderView(d, o))
}

export interface PublishContext {
  appointment: AppointmentView
  components: TestDefinition[]
  localNames: Record<string, string>
}

export async function getPublishQueue(labId: string): Promise<AppointmentView[]> {
  await delay()
  const d = db()
  return d.appointments
    .filter((a) => a.kind === 'lab' && a.organizationId === labId && a.status === 'booked')
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((a) => appointmentView(d, a))
}

export async function getPublishContext(appointmentId: string): Promise<PublishContext> {
  await delay()
  const d = db()
  const apt = d.appointments.find((a) => a.id === appointmentId)
  if (!apt) throw new Error('Booking not found')
  const view = appointmentView(d, apt)
  const codes = [...new Set(view.tests.flatMap((t) => t.components))]
  return {
    appointment: view,
    components: codes.map(testDef),
    localNames: Object.fromEntries(codes.map((c) => [c, localNameFor(view.organization, c)])),
  }
}

/** Normalises the lab's values into Observations, links them to the order and delivers them. */
export async function publishResult(appointmentId: string, values: Record<string, number>): Promise<DiagnosticReport> {
  await delay(500)
  const d = db()
  const apt = d.appointments.find((a) => a.id === appointmentId)
  if (!apt || apt.kind !== 'lab') throw new Error('Booking not found')
  const lab = findOrg(d, apt.organizationId)
  const order = apt.serviceRequestId ? (d.serviceRequests.find((s) => s.id === apt.serviceRequestId) as LabOrder | undefined) : undefined
  const testIds = apt.testIds ?? order?.testIds ?? []
  const codes = [...new Set(testIds.flatMap((t) => catalogTest(t).components))]
  const reportId = newId('rep')
  const now = new Date().toISOString()
  const observations: Observation[] = codes.map((loinc) => {
    const def = testDef(loinc)
    const value = values[loinc]
    if (value === undefined || Number.isNaN(value)) throw new Error(`Enter a value for ${def.shortName}`)
    return {
      id: newId('obs'),
      patientId: apt.patientId,
      loinc,
      value,
      unit: def.unit,
      refLow: def.refLow,
      refHigh: def.refHigh,
      interpretation: interpret(value, def.refLow, def.refHigh),
      effective: apt.start,
      performerLabId: lab.id,
      localName: localNameFor(lab, loinc),
      basedOn: order?.id,
      reportId,
      verified: true,
    }
  })
  const report: DiagnosticReport = {
    id: reportId,
    patientId: apt.patientId,
    labId: lab.id,
    orderId: order?.id,
    appointmentId: apt.id,
    testIds,
    observationIds: observations.map((o) => o.id),
    issued: now,
    status: 'final',
    unreadByRequester: !!order,
  }
  mutate((cur) => ({
    observations: [...cur.observations, ...observations],
    reports: [...cur.reports, report],
    appointments: cur.appointments.map((a) => (a.id === apt.id ? { ...a, status: 'fulfilled' as const } : a)),
    serviceRequests: cur.serviceRequests.map((s) => (s.id === order?.id ? { ...s, status: 'completed' as const } : s)),
  }))
  return report
}

export interface SentResult extends ReportView {
  recipients: string[]
}

export async function getResultsSent(labId: string): Promise<SentResult[]> {
  await delay()
  const d = db()
  return d.reports
    .filter((r) => r.labId === labId)
    .sort(byDateDesc((r) => r.issued))
    .map((r) => {
      const view = reportView(d, r)
      const recipients = [view.patient.name]
      if (view.orderedBy) recipients.push(view.orderedBy.name)
      return { ...view, recipients }
    })
}

export async function saveLabSettings(
  labId: string,
  patch: { availableWithoutOrder?: string[]; openingHours?: OpeningHours },
): Promise<void> {
  await delay(250)
  mutate((d) => ({
    organizations: d.organizations.map((o) => (o.id === labId && o.lab ? { ...o, lab: { ...o.lab, ...patch } } : o)),
  }))
}
