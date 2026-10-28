// Simplified shapes modelled on HL7 FHIR resources. A Spring Boot / FHIR backend
// will later return these from real endpoints; components never touch mock data directly.

export type Role = 'patient' | 'doctor' | 'lab'

/** Custom (non-FHIR): a demo login account. */
export interface User {
  id: string
  role: Role
  email: string
  displayName: string
  /** Patient id, Practitioner id or lab Organization id depending on role. */
  refId: string
}

export type Sex = 'male' | 'female'

export interface Patient {
  id: string
  name: string
  birthDate: string // yyyy-MM-dd
  sex: Sex
  phone: string
  email: string
  /** MediLink patient identifier (invented). */
  identifier: string
  area: string
}

export type OrganizationType = 'clinic' | 'lab'

export interface OpeningHours {
  /** 0 = Sunday … 6 = Saturday. null = closed. */
  [weekday: number]: { start: string; end: string } | null
}

export interface LocalTestName {
  localName: string
  loinc: string
}

export interface Organization {
  id: string
  type: OrganizationType
  name: string
  shortName: string
  area: string
  address: string
  phone: string
  partner: boolean
  /** Labs only. */
  lab?: {
    openingHours: OpeningHours
    /** Catalog test ids the lab performs. */
    offeredTests: string[]
    /** Catalog test ids that patients can book without a doctor's order. */
    availableWithoutOrder: string[]
    /** The lab's own naming mapped to standard LOINC codes. */
    localNames: LocalTestName[]
  }
}

/** Practitioner merged with its PractitionerRole (doctor at a clinic). */
export interface Practitioner {
  id: string
  name: string
  sex: Sex
  specialty: string
  organizationId: string
  languages: string[]
  bio: string
  yearsExperience: number
}

export type BookingMode = 'instant' | 'request'

export interface VisitType {
  id: string
  practitionerId: string
  name: string
  durationMin: number
  priceAzn: number
  bookingMode: BookingMode
  active: boolean
}

/** FHIR Schedule: a practitioner's weekly working hours. */
export interface Schedule {
  practitionerId: string
  weeklyHours: OpeningHours
}

/** FHIR Slot: generated on demand from Schedule minus booked appointments. */
export interface Slot {
  start: string
  end: string
  bookingMode: BookingMode
}

export type AppointmentStatus =
  | 'proposed' // doctor proposed another time, waiting for patient
  | 'pending' // waiting for doctor approval
  | 'booked'
  | 'declined'
  | 'cancelled'
  | 'fulfilled'

export interface Appointment {
  id: string
  kind: 'doctor' | 'lab'
  patientId: string
  organizationId: string
  practitionerId?: string
  visitTypeId?: string
  /** Lab visits: catalog test ids. */
  testIds?: string[]
  /** Lab visits booked for a doctor's order. */
  serviceRequestId?: string
  /** Doctor visits booked from a follow-up request. */
  followUpRequestId?: string
  start: string
  end: string
  status: AppointmentStatus
  /** When status = proposed: the time the doctor suggested. */
  proposedStart?: string
  createdAt: string
}

export type ServiceRequestStatus = 'active' | 'booked' | 'completed' | 'cancelled'

/** FHIR ServiceRequest — a doctor's lab order. */
export interface LabOrder {
  id: string
  category: 'lab'
  patientId: string
  requesterId: string
  /** null = any partner lab. */
  labId: string | null
  testIds: string[]
  note: string
  status: ServiceRequestStatus
  authoredOn: string
  appointmentId?: string
}

/** FHIR ServiceRequest — a doctor's follow-up request. */
export interface FollowUpRequest {
  id: string
  category: 'follow-up'
  patientId: string
  requesterId: string
  visitTypeId: string
  timeframe: FollowUpTimeframe
  note: string
  status: ServiceRequestStatus
  authoredOn: string
  appointmentId?: string
}

export type FollowUpTimeframe = '2w' | '1m' | '3m' | '6m'

export type ServiceRequest = LabOrder | FollowUpRequest

export type Interpretation = 'H' | 'L' | 'N'

/** Standard observation definition (one measurable value). */
export interface TestDefinition {
  loinc: string
  name: string
  shortName: string
  unit: string
  refLow: number | null
  refHigh: number | null
  decimals: number
}

/** Orderable catalog item; panels contain several observations. */
export interface CatalogTest {
  id: string
  name: string
  loinc: string
  components: string[] // LOINC codes of TestDefinitions
  priceAzn: number
}

export interface Observation {
  id: string
  patientId: string
  loinc: string
  value: number
  unit: string
  refLow: number | null
  refHigh: number | null
  interpretation: Interpretation
  effective: string
  performerLabId: string
  /** The lab's own name for this test, before normalisation. */
  localName: string
  basedOn?: string // LabOrder id
  reportId: string
  verified: true
}

export interface DiagnosticReport {
  id: string
  patientId: string
  labId: string
  orderId?: string
  appointmentId?: string
  testIds: string[]
  observationIds: string[]
  issued: string
  status: 'final'
  /** Ordering doctor has not opened it yet. */
  unreadByRequester: boolean
}

export interface Diagnosis {
  code: string
  name: string
}

/** FHIR Composition — a doctor's visit summary. */
export interface Composition {
  id: string
  patientId: string
  authorId: string
  appointmentId?: string
  date: string
  reason: string
  findings: string
  diagnoses: Diagnosis[]
  treatment: string
  recommendations: string
  followUp: string
}

export type ConsentScope = 'all' | 'labs' | 'summaries'
export type ConsentStatus = 'active' | 'revoked' | 'pending' | 'declined'
export type ExpiryOption = 'visit' | '30d' | 'revoked'

export interface Consent {
  id: string
  patientId: string
  granteeId: string // Practitioner id
  scope: ConsentScope
  start: string
  /** null = until revoked */
  end: string | null
  status: ConsentStatus
  source: 'booking' | 'qr' | 'request' | 'manual'
  appointmentId?: string
  createdAt: string
}

export type AuditAction = 'viewed record' | 'viewed lab results' | 'viewed summaries'

export interface AuditEvent {
  id: string
  patientId: string
  actorId: string // Practitioner id
  organizationId: string
  action: AuditAction
  recorded: string
}

/** Custom (non-FHIR). Visible only to the clinic and doctor. */
export interface Feedback {
  id: string
  appointmentId: string
  patientId: string
  practitionerId: string
  organizationId: string
  rating: number
  comment: string
  createdAt: string
}

/** Short-lived token behind the "Share via QR" code. */
export interface ShareToken {
  code: string
  patientId: string
  scope: ConsentScope
  expiry: ExpiryOption
  createdAt: string
  expiresAt: string
  redeemedBy?: string
}

export interface Icd10Code {
  code: string
  name: string
}
