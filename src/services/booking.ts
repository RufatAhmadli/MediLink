import { addDays, addMinutes, endOfDay, format, isBefore, parseISO, set, startOfDay } from 'date-fns'
import { catalogTest, newId } from '../lib/clinical'
import { CATALOG } from '../mock/catalog'
import type { Database } from '../mock/seed'
import { db, mutate } from '../store/db'
import type { Appointment, BookingMode, CatalogTest, ConsentScope, OpeningHours, Organization, Practitioner, Slot, VisitType } from '../types'
import { delay, findOrg, findPractitioner, findVisitType } from './shared'

// ---------------------------------------------------------------- search

export interface DoctorSearchResult {
  practitioner: Practitioner
  organization: Organization
  visitTypes: VisitType[]
  fromPrice: number
  hasInstant: boolean
}

export interface CareFilters {
  query: string
  area: string // '' = any
  partnerOnly: boolean
  /** yyyy-MM-dd; '' = any date */
  date: string
}

const matches = (text: string, query: string) => text.toLowerCase().includes(query.trim().toLowerCase())

export async function searchDoctors(f: CareFilters): Promise<DoctorSearchResult[]> {
  await delay()
  const d = db()
  return d.practitioners
    .map((p) => {
      const organization = findOrg(d, p.organizationId)
      const visitTypes = d.visitTypes.filter((v) => v.practitionerId === p.id && v.active)
      return {
        practitioner: p,
        organization,
        visitTypes,
        fromPrice: Math.min(...visitTypes.map((v) => v.priceAzn)),
        hasInstant: visitTypes.some((v) => v.bookingMode === 'instant'),
      }
    })
    .filter(({ practitioner, organization, visitTypes }) => {
      if (f.partnerOnly && !organization.partner) return false
      if (f.area && organization.area !== f.area) return false
      if (f.date && !worksOn(d, practitioner.id, parseISO(f.date))) return false
      if (!f.query.trim()) return true
      return [practitioner.name, practitioner.specialty, organization.name, ...visitTypes.map((v) => v.name)].some((t) =>
        matches(t, f.query),
      )
    })
}

export interface LabSearchResult {
  lab: Organization
  tests: CatalogTest[]
  withoutOrder: CatalogTest[]
}

export async function searchLabs(f: CareFilters): Promise<LabSearchResult[]> {
  await delay()
  return db()
    .organizations.filter((o) => o.type === 'lab')
    .map((lab) => ({
      lab,
      tests: lab.lab!.offeredTests.map(catalogTest),
      withoutOrder: lab.lab!.availableWithoutOrder.map(catalogTest),
    }))
    .filter(({ lab, tests }) => {
      if (f.partnerOnly && !lab.partner) return false
      if (f.area && lab.area !== f.area) return false
      if (f.date && !hoursOn(lab.lab!.openingHours, parseISO(f.date))) return false
      if (!f.query.trim()) return true
      return [lab.name, ...tests.map((t) => t.name), ...lab.lab!.localNames.map((n) => n.localName)].some((t) => matches(t, f.query))
    })
}

export async function getDoctorProfile(practitionerId: string) {
  await delay()
  const d = db()
  const practitioner = findPractitioner(d, practitionerId)
  return {
    practitioner,
    organization: findOrg(d, practitioner.organizationId),
    visitTypes: d.visitTypes.filter((v) => v.practitionerId === practitionerId && v.active),
  }
}

export async function getLabProfile(labId: string) {
  await delay()
  const lab = findOrg(db(), labId)
  return {
    lab,
    tests: lab.lab!.offeredTests.map(catalogTest),
    withoutOrder: new Set(lab.lab!.availableWithoutOrder),
  }
}

export async function getPartnerLabs(testIds: string[] = []): Promise<Organization[]> {
  await delay()
  return db().organizations.filter(
    (o) => o.type === 'lab' && o.partner && testIds.every((t) => o.lab!.offeredTests.includes(t)),
  )
}

export const ALL_TESTS: CatalogTest[] = CATALOG

// ----------------------------------------------------------------- slots

const hoursOn = (hours: OpeningHours, day: Date) => hours[day.getDay()] ?? null

function worksOn(d: Database, practitionerId: string, day: Date) {
  const schedule = d.schedules.find((s) => s.practitionerId === practitionerId)
  return !!schedule && !!hoursOn(schedule.weeklyHours, day)
}

const at = (day: Date, hhmm: string) => {
  const [hours, minutes] = hhmm.split(':').map(Number)
  return set(startOfDay(day), { hours, minutes })
}

/** Deterministic pseudo-random "already taken by other patients" so calendars look realistic. */
function takenElsewhere(key: string, ratio: number): boolean {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  return ((h >>> 0) % 100) / 100 < ratio
}

const ACTIVE_STATUSES: Appointment['status'][] = ['booked', 'pending', 'proposed']

function busyRanges(d: Database, filter: (a: Appointment) => boolean) {
  return d.appointments
    .filter((a) => ACTIVE_STATUSES.includes(a.status) && filter(a))
    .flatMap((a) => {
      const ranges = [{ start: new Date(a.start), end: new Date(a.end) }]
      if (a.proposedStart) {
        const length = new Date(a.end).getTime() - new Date(a.start).getTime()
        ranges.push({ start: new Date(a.proposedStart), end: new Date(new Date(a.proposedStart).getTime() + length) })
      }
      return ranges
    })
}

function doctorSlots(d: Database, practitionerId: string, visitType: VisitType, day: Date, now = new Date()): Slot[] {
  const schedule = d.schedules.find((s) => s.practitionerId === practitionerId)
  const hours = schedule && hoursOn(schedule.weeklyHours, day)
  if (!hours) return []
  const busy = busyRanges(d, (a) => a.practitionerId === practitionerId)
  const close = at(day, hours.end)
  const slots: Slot[] = []
  for (let t = at(day, hours.start); !isBefore(close, addMinutes(t, visitType.durationMin)); t = addMinutes(t, 30)) {
    const end = addMinutes(t, visitType.durationMin)
    if (isBefore(t, addMinutes(now, 60))) continue
    if (busy.some((b) => t < b.end && end > b.start)) continue
    if (takenElsewhere(`${practitionerId}${t.toISOString()}`, 0.35)) continue
    slots.push({ start: t.toISOString(), end: end.toISOString(), bookingMode: visitType.bookingMode })
  }
  return slots
}

function labSlots(lab: Organization, day: Date, now = new Date()): Slot[] {
  const hours = hoursOn(lab.lab!.openingHours, day)
  if (!hours) return []
  const close = at(day, hours.end)
  const slots: Slot[] = []
  for (let t = at(day, hours.start); isBefore(addMinutes(t, 15), close); t = addMinutes(t, 20)) {
    if (isBefore(t, addMinutes(now, 30))) continue
    if (takenElsewhere(`${lab.id}${t.toISOString()}`, 0.4)) continue
    slots.push({ start: t.toISOString(), end: addMinutes(t, 15).toISOString(), bookingMode: 'instant' })
  }
  return slots
}

export interface DayAvailability {
  date: string // yyyy-MM-dd
  slots: Slot[]
}

const DAYS_AHEAD = 21

export async function getDoctorAvailability(practitionerId: string, visitTypeId: string): Promise<DayAvailability[]> {
  await delay()
  const d = db()
  const vt = findVisitType(d, visitTypeId)
  const today = startOfDay(new Date())
  return Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const day = addDays(today, i)
    return { date: format(day, 'yyyy-MM-dd'), slots: doctorSlots(d, practitionerId, vt, day) }
  })
}

export async function getLabAvailability(labId: string): Promise<DayAvailability[]> {
  await delay()
  const lab = findOrg(db(), labId)
  const today = startOfDay(new Date())
  return Array.from({ length: 14 }, (_, i) => {
    const day = addDays(today, i)
    return { date: format(day, 'yyyy-MM-dd'), slots: labSlots(lab, day) }
  })
}

// --------------------------------------------------------------- booking

export interface BookDoctorInput {
  patientId: string
  practitionerId: string
  visitTypeId: string
  start: string
  /** null = patient skipped the consent step. */
  shareScope: Exclude<ConsentScope, 'summaries'> | null
  followUpRequestId?: string
  rescheduleOf?: string
}

export async function bookDoctorVisit(input: BookDoctorInput): Promise<{ appointment: Appointment; mode: BookingMode }> {
  await delay(350)
  const d = db()
  const vt = findVisitType(d, input.visitTypeId)
  const practitioner = findPractitioner(d, input.practitionerId)
  const old = input.rescheduleOf ? d.appointments.find((a) => a.id === input.rescheduleOf) : undefined
  const followUpRequestId = input.followUpRequestId ?? old?.followUpRequestId
  const appointment: Appointment = {
    id: newId('apt'),
    kind: 'doctor',
    patientId: input.patientId,
    practitionerId: practitioner.id,
    organizationId: practitioner.organizationId,
    visitTypeId: vt.id,
    followUpRequestId,
    start: input.start,
    end: addMinutes(new Date(input.start), vt.durationMin).toISOString(),
    status: vt.bookingMode === 'instant' ? 'booked' : 'pending',
    createdAt: new Date().toISOString(),
  }
  const now = new Date().toISOString()
  mutate((cur) => ({
    appointments: [
      ...cur.appointments.map((a) => (a.id === old?.id ? { ...a, status: 'cancelled' as const } : a)),
      appointment,
    ],
    serviceRequests: followUpRequestId
      ? cur.serviceRequests.map((s) => (s.id === followUpRequestId ? { ...s, status: 'booked' as const, appointmentId: appointment.id } : s))
      : cur.serviceRequests,
    consents: input.shareScope
      ? [
          ...cur.consents,
          {
            id: newId('consent'),
            patientId: input.patientId,
            granteeId: practitioner.id,
            scope: input.shareScope,
            start: now,
            end: endOfDay(addDays(new Date(appointment.start), 7)).toISOString(),
            status: 'active',
            source: 'booking',
            appointmentId: appointment.id,
            createdAt: now,
          },
        ]
      : cur.consents,
  }))
  return { appointment, mode: vt.bookingMode }
}

export interface BookLabInput {
  patientId: string
  labId: string
  testIds: string[]
  start: string
  orderId?: string
  rescheduleOf?: string
}

export async function bookLabVisit(input: BookLabInput): Promise<Appointment> {
  await delay(350)
  const d = db()
  const lab = findOrg(d, input.labId)
  const old = input.rescheduleOf ? d.appointments.find((a) => a.id === input.rescheduleOf) : undefined
  const orderId = input.orderId ?? old?.serviceRequestId
  const notAllowed = input.testIds.filter((t) => !orderId && !lab.lab!.availableWithoutOrder.includes(t))
  if (notAllowed.length) throw new Error('This test requires a doctor’s order.')
  const appointment: Appointment = {
    id: newId('apt'),
    kind: 'lab',
    patientId: input.patientId,
    organizationId: lab.id,
    testIds: input.testIds,
    serviceRequestId: orderId,
    start: input.start,
    end: addMinutes(new Date(input.start), 15).toISOString(),
    status: 'booked',
    createdAt: new Date().toISOString(),
  }
  mutate((cur) => ({
    appointments: [
      ...cur.appointments.map((a) => (a.id === old?.id ? { ...a, status: 'cancelled' as const } : a)),
      appointment,
    ],
    serviceRequests: orderId
      ? cur.serviceRequests.map((s) => (s.id === orderId ? { ...s, status: 'booked' as const, appointmentId: appointment.id } : s))
      : cur.serviceRequests,
  }))
  return appointment
}
