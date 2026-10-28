import { addDays, addMinutes, set, startOfDay } from 'date-fns'
import { catalogTest, interpret, localNameFor, testDef } from '../lib/clinical'
import type {
  Appointment,
  AppointmentStatus,
  AuditAction,
  AuditEvent,
  Composition,
  Consent,
  DiagnosticReport,
  Diagnosis,
  Feedback,
  Observation,
  Organization,
  Patient,
  Practitioner,
  Schedule,
  ServiceRequest,
  ShareToken,
  User,
  VisitType,
} from '../types'
import { ORGANIZATIONS, PATIENTS, PRACTITIONERS, SCHEDULES, USERS, VISIT_TYPES } from './directory'

export interface Database {
  users: User[]
  patients: Patient[]
  organizations: Organization[]
  practitioners: Practitioner[]
  visitTypes: VisitType[]
  schedules: Schedule[]
  appointments: Appointment[]
  serviceRequests: ServiceRequest[]
  observations: Observation[]
  reports: DiagnosticReport[]
  compositions: Composition[]
  consents: Consent[]
  auditEvents: AuditEvent[]
  feedback: Feedback[]
  shareTokens: ShareToken[]
}

const dx = (code: string, name: string): Diagnosis => ({ code, name })

/**
 * Builds the demo dataset with dates relative to `now`, so the prototype
 * always shows an upcoming appointment and recent results.
 */
export function createSeed(now = new Date()): Database {
  let counter = 0
  const sid = (prefix: string) => `${prefix}-s${++counter}`
  const at = (day: number, time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    return set(addDays(startOfDay(now), day), { hours, minutes, seconds: 0, milliseconds: 0 }).toISOString()
  }

  const organizations: Organization[] = structuredClone(ORGANIZATIONS)
  const visitTypes: VisitType[] = structuredClone(VISIT_TYPES)
  const schedules: Schedule[] = structuredClone(SCHEDULES)

  const appointments: Appointment[] = []
  const serviceRequests: ServiceRequest[] = []
  const observations: Observation[] = []
  const reports: DiagnosticReport[] = []
  const compositions: Composition[] = []
  const consents: Consent[] = []
  const auditEvents: AuditEvent[] = []
  const feedback: Feedback[] = []

  const practitioner = (id: string) => PRACTITIONERS.find((p) => p.id === id)!

  function visit(o: {
    patientId: string
    practitionerId: string
    visitTypeId: string
    day: number
    time: string
    status: AppointmentStatus
  }): string {
    const vt = visitTypes.find((v) => v.id === o.visitTypeId)!
    const start = at(o.day, o.time)
    const id = sid('apt')
    appointments.push({
      id,
      kind: 'doctor',
      patientId: o.patientId,
      practitionerId: o.practitionerId,
      organizationId: practitioner(o.practitionerId).organizationId,
      visitTypeId: o.visitTypeId,
      start,
      end: addMinutes(new Date(start), vt.durationMin).toISOString(),
      status: o.status,
      createdAt: at(o.day - 5, '12:00'),
    })
    return id
  }

  function labOrder(o: {
    patientId: string
    requesterId: string
    labId: string | null
    testIds: string[]
    note: string
    day: number
    status: ServiceRequest['status']
  }): string {
    const id = sid('sr')
    serviceRequests.push({
      id,
      category: 'lab',
      patientId: o.patientId,
      requesterId: o.requesterId,
      labId: o.labId,
      testIds: o.testIds,
      note: o.note,
      status: o.status,
      authoredOn: at(o.day, '11:30'),
    })
    return id
  }

  function labVisit(o: {
    patientId: string
    labId: string
    testIds: string[]
    day: number
    time: string
    status: AppointmentStatus
    orderId?: string
  }): string {
    const id = sid('apt')
    const start = at(o.day, o.time)
    appointments.push({
      id,
      kind: 'lab',
      patientId: o.patientId,
      organizationId: o.labId,
      testIds: o.testIds,
      serviceRequestId: o.orderId,
      start,
      end: addMinutes(new Date(start), 15).toISOString(),
      status: o.status,
      createdAt: at(o.day - 2, '18:00'),
    })
    if (o.orderId) {
      const order = serviceRequests.find((s) => s.id === o.orderId)!
      order.appointmentId = id
    }
    return id
  }

  /** A completed lab visit: appointment + DiagnosticReport + Observations. */
  function labResult(o: {
    patientId: string
    labId: string
    day: number
    testIds: string[]
    values: Record<string, number>
    orderId?: string
  }) {
    const appointmentId = labVisit({ ...o, time: '08:30', status: 'fulfilled' })
    const lab = organizations.find((l) => l.id === o.labId)
    const reportId = sid('rep')
    const effective = at(o.day, '08:30')
    const observationIds: string[] = []
    const seen = new Set<string>()
    for (const testId of o.testIds) {
      for (const loinc of catalogTest(testId).components) {
        if (seen.has(loinc)) continue
        seen.add(loinc)
        const def = testDef(loinc)
        const value = o.values[loinc]
        if (value === undefined) throw new Error(`Missing seed value for ${loinc}`)
        const id = sid('obs')
        observationIds.push(id)
        observations.push({
          id,
          patientId: o.patientId,
          loinc,
          value,
          unit: def.unit,
          refLow: def.refLow,
          refHigh: def.refHigh,
          interpretation: interpret(value, def.refLow, def.refHigh),
          effective,
          performerLabId: o.labId,
          localName: localNameFor(lab, loinc),
          basedOn: o.orderId,
          reportId,
          verified: true,
        })
      }
    }
    reports.push({
      id: reportId,
      patientId: o.patientId,
      labId: o.labId,
      orderId: o.orderId,
      appointmentId,
      testIds: o.testIds,
      observationIds,
      issued: at(o.day, '16:10'),
      status: 'final',
      unreadByRequester: false,
    })
  }

  function summary(o: Omit<Composition, 'id' | 'date'> & { day: number }) {
    const { day, ...rest } = o
    compositions.push({ id: sid('comp'), date: at(day, '12:00'), ...rest })
  }

  function audit(patientId: string, actorId: string, day: number, time: string, action: AuditAction) {
    auditEvents.push({
      id: sid('audit'),
      patientId,
      actorId,
      organizationId: practitioner(actorId).organizationId,
      action,
      recorded: at(day, time),
    })
  }

  function review(appointmentId: string, rating: number, comment: string) {
    const apt = appointments.find((a) => a.id === appointmentId)!
    feedback.push({
      id: sid('fb'),
      appointmentId,
      patientId: apt.patientId,
      practitionerId: apt.practitionerId!,
      organizationId: apt.organizationId,
      rating,
      comment,
      createdAt: addDays(new Date(apt.start), 1).toISOString(),
    })
  }

  // ---------------------------------------------------------------- Elshad
  // Type 2 diabetes + hypertension. Labs every 3–4 months from three labs.
  const elshadLabs: { day: number; lab: string; ordered: boolean; v: [number, number, number, number] }[] = [
    { day: -705, lab: 'lab-merkez', ordered: false, v: [8.6, 9.8, 6.4, 92] },
    { day: -598, lab: 'lab-caspian', ordered: true, v: [8.2, 9.1, 6.2, 95] },
    { day: -490, lab: 'lab-nur', ordered: true, v: [7.7, 8.4, 5.9, 97] },
    { day: -385, lab: 'lab-merkez', ordered: true, v: [7.4, 7.9, 5.6, 101] },
    { day: -280, lab: 'lab-caspian', ordered: true, v: [7.1, 7.4, 5.3, 104] },
    { day: -172, lab: 'lab-nur', ordered: true, v: [6.9, 7.0, 5.1, 109] },
    { day: -64, lab: 'lab-merkez', ordered: true, v: [7.2, 7.6, 5.0, 118] },
  ]
  for (const e of elshadLabs) {
    const testIds = ['hba1c', 'glucose', 'cholesterol', 'creatinine']
    const orderId = e.ordered
      ? labOrder({
          patientId: 'pt-elshad',
          requesterId: 'pr-aliyev',
          labId: e.lab,
          testIds,
          note: 'Diabetes control; kidney function on metformin.',
          day: e.day - 6,
          status: 'completed',
        })
      : undefined
    labResult({
      patientId: 'pt-elshad',
      labId: e.lab,
      day: e.day,
      testIds,
      orderId,
      values: { '4548-4': e.v[0], '2345-7': e.v[1], '2093-3': e.v[2], '2160-0': e.v[3] },
    })
  }
  // Self-booked routine glucose check.
  labResult({ patientId: 'pt-elshad', labId: 'lab-caspian', day: -19, testIds: ['glucose'], values: { '2345-7': 7.2 } })

  const e1 = visit({ patientId: 'pt-elshad', practitionerId: 'pr-aliyev', visitTypeId: 'vt-ali-first', day: -700, time: '10:00', status: 'fulfilled' })
  visit({ patientId: 'pt-elshad', practitionerId: 'pr-aliyev', visitTypeId: 'vt-ali-followup', day: -486, time: '11:00', status: 'fulfilled' })
  const e3 = visit({ patientId: 'pt-elshad', practitionerId: 'pr-aliyev', visitTypeId: 'vt-ali-followup', day: -383, time: '12:20', status: 'fulfilled' })
  const eH = visit({ patientId: 'pt-elshad', practitionerId: 'pr-hasanova', visitTypeId: 'vt-has-ecg', day: -275, time: '10:30', status: 'fulfilled' })
  visit({ patientId: 'pt-elshad', practitionerId: 'pr-aliyev', visitTypeId: 'vt-ali-followup', day: -168, time: '15:40', status: 'fulfilled' })
  const e6 = visit({ patientId: 'pt-elshad', practitionerId: 'pr-aliyev', visitTypeId: 'vt-ali-followup', day: -60, time: '11:00', status: 'fulfilled' })
  visit({ patientId: 'pt-elshad', practitionerId: 'pr-aliyev', visitTypeId: 'vt-ali-followup', day: 6, time: '11:00', status: 'booked' })

  summary({
    patientId: 'pt-elshad',
    authorId: 'pr-aliyev',
    appointmentId: e1,
    day: -700,
    reason: 'Referred for poorly controlled blood sugar. Thirst and fatigue for several months.',
    findings: 'HbA1c 8.6% (Mərkəz Lab), fasting glucose 9.8 mmol/L. BMI 31. No signs of retinopathy reported.',
    diagnoses: [dx('E11', 'Type 2 diabetes mellitus'), dx('E78', 'Hyperlipidemia')],
    treatment: 'Metformin 500 mg twice daily, titrate to 1000 mg twice daily over 4 weeks.',
    recommendations: 'Reduce refined carbohydrates, 30 minutes of walking daily. Home glucose diary.',
    followUp: 'Repeat HbA1c, glucose and creatinine in 3 months.',
  })
  summary({
    patientId: 'pt-elshad',
    authorId: 'pr-aliyev',
    appointmentId: e3,
    day: -383,
    reason: 'Routine diabetes follow-up.',
    findings: 'HbA1c improved to 7.4%. Cholesterol 5.6 mmol/L. Creatinine 101 µmol/L, within range.',
    diagnoses: [dx('E11', 'Type 2 diabetes mellitus')],
    treatment: 'Continue metformin 1000 mg twice daily.',
    recommendations: 'Keep diet changes. Blood pressure readings at home are high — see a cardiologist.',
    followUp: 'Labs in 3 months; cardiology consultation.',
  })
  summary({
    patientId: 'pt-elshad',
    authorId: 'pr-hasanova',
    appointmentId: eH,
    day: -275,
    reason: 'Elevated home blood pressure readings and occasional morning headaches.',
    findings: 'BP 152/94 mmHg, pulse 78. ECG: sinus rhythm, no ischemic changes. Recent lipid profile borderline.',
    diagnoses: [dx('I10', 'Essential (primary) hypertension')],
    treatment: 'Amlodipine 5 mg once daily.',
    recommendations: 'Low-salt diet, home blood pressure diary twice a day for 2 weeks.',
    followUp: 'Cardiology review in 6 months, sooner if BP stays above 140/90.',
  })
  summary({
    patientId: 'pt-elshad',
    authorId: 'pr-aliyev',
    appointmentId: e6,
    day: -60,
    reason: 'Diabetes follow-up; new lab results.',
    findings: 'HbA1c 7.2% (Mərkəz Lab), slightly up from 6.9%. Creatinine 118 µmol/L — just above range, rising trend over two years.',
    diagnoses: [dx('E11', 'Type 2 diabetes mellitus'), dx('I10', 'Essential (primary) hypertension')],
    treatment: 'Continue metformin; dose kept under review given creatinine trend. Continue amlodipine.',
    recommendations: 'Recheck HbA1c and glucose. Discuss kidney protection with cardiologist.',
    followUp: 'HbA1c and glucose before next visit (order sent).',
  })

  labOrder({
    patientId: 'pt-elshad',
    requesterId: 'pr-aliyev',
    labId: null,
    testIds: ['hba1c', 'glucose'],
    note: 'Quarterly diabetes control before follow-up visit.',
    day: -4,
    status: 'active',
  })

  consents.push(
    { id: sid('consent'), patientId: 'pt-elshad', granteeId: 'pr-aliyev', scope: 'all', start: at(-700, '09:50'), end: null, status: 'active', source: 'manual', createdAt: at(-700, '09:50') },
    { id: sid('consent'), patientId: 'pt-elshad', granteeId: 'pr-hasanova', scope: 'all', start: at(-282, '19:00'), end: at(-268, '23:59'), status: 'active', source: 'booking', appointmentId: eH, createdAt: at(-282, '19:00') },
    { id: sid('consent'), patientId: 'pt-elshad', granteeId: 'pr-ismayilov', scope: 'all', start: at(-1, '17:20'), end: at(29, '23:59'), status: 'pending', source: 'request', createdAt: at(-1, '17:20') },
  )
  audit('pt-elshad', 'pr-aliyev', -700, '10:12', 'viewed record')
  audit('pt-elshad', 'pr-aliyev', -486, '11:04', 'viewed lab results')
  audit('pt-elshad', 'pr-aliyev', -383, '12:25', 'viewed record')
  audit('pt-elshad', 'pr-hasanova', -275, '10:42', 'viewed record')
  audit('pt-elshad', 'pr-aliyev', -168, '15:44', 'viewed record')
  audit('pt-elshad', 'pr-aliyev', -60, '11:05', 'viewed record')
  audit('pt-elshad', 'pr-aliyev', -4, '16:20', 'viewed lab results')
  review(e3, 5, 'Dr. Aliyev already had my lab results, I did not need to bring any papers.')
  review(eH, 4, 'Clear explanation of my blood pressure medication.')
  review(e6, 5, 'Short wait, and he compared my results from different labs on one chart.')

  // ----------------------------------------------------------------- Aysel
  // Pregnancy; labs over 7 months from two labs.
  const ayselLabs: { day: number; lab: string; v: [number, number, number, number, number, number] }[] = [
    { day: -205, lab: 'lab-nur', v: [128, 7.4, 262, 4.6, 2.1, 42] },
    { day: -170, lab: 'lab-caspian', v: [124, 8.1, 248, 4.8, 1.85, 31] },
    { day: -130, lab: 'lab-nur', v: [119, 8.9, 239, 4.7, 1.62, 22] },
    { day: -95, lab: 'lab-caspian', v: [115, 9.3, 231, 5.0, 1.7, 14] },
    { day: -60, lab: 'lab-nur', v: [111, 9.8, 224, 4.9, 1.95, 11] },
    { day: -25, lab: 'lab-caspian', v: [116, 9.1, 236, 4.8, 1.8, 19] },
  ]
  for (const a of ayselLabs) {
    const testIds = ['cbc', 'glucose', 'tsh', 'ferritin']
    const orderId = labOrder({
      patientId: 'pt-aysel',
      requesterId: 'pr-huseynova',
      labId: a.lab,
      testIds,
      note: 'Routine antenatal blood work.',
      day: a.day - 3,
      status: 'completed',
    })
    labResult({
      patientId: 'pt-aysel',
      labId: a.lab,
      day: a.day,
      testIds,
      orderId,
      values: { '718-7': a.v[0], '6690-2': a.v[1], '777-3': a.v[2], '2345-7': a.v[3], '3016-3': a.v[4], '2276-4': a.v[5] },
    })
  }
  const a1 = visit({ patientId: 'pt-aysel', practitionerId: 'pr-huseynova', visitTypeId: 'vt-hus-antenatal', day: -208, time: '10:00', status: 'fulfilled' })
  visit({ patientId: 'pt-aysel', practitionerId: 'pr-huseynova', visitTypeId: 'vt-hus-antenatal', day: -168, time: '10:30', status: 'fulfilled' })
  const a3 = visit({ patientId: 'pt-aysel', practitionerId: 'pr-huseynova', visitTypeId: 'vt-hus-us', day: -128, time: '12:00', status: 'fulfilled' })
  visit({ patientId: 'pt-aysel', practitionerId: 'pr-huseynova', visitTypeId: 'vt-hus-antenatal', day: -92, time: '11:00', status: 'fulfilled' })
  const a5 = visit({ patientId: 'pt-aysel', practitionerId: 'pr-huseynova', visitTypeId: 'vt-hus-antenatal', day: -57, time: '09:30', status: 'fulfilled' })
  const a6 = visit({ patientId: 'pt-aysel', practitionerId: 'pr-huseynova', visitTypeId: 'vt-hus-antenatal', day: -22, time: '10:00', status: 'fulfilled' })

  summary({
    patientId: 'pt-aysel',
    authorId: 'pr-huseynova',
    appointmentId: a1,
    day: -208,
    reason: 'First antenatal visit, approx. 6 weeks of pregnancy.',
    findings: 'Viable intrauterine pregnancy. BP 112/70. Hemoglobin 128 g/L, TSH 2.10 mIU/L.',
    diagnoses: [dx('Z34', 'Supervision of normal pregnancy')],
    treatment: 'Folic acid 400 µg daily.',
    recommendations: 'Balanced diet, avoid alcohol and raw fish. Light exercise is fine.',
    followUp: 'Antenatal visit and blood work in 5–6 weeks.',
  })
  summary({
    patientId: 'pt-aysel',
    authorId: 'pr-huseynova',
    appointmentId: a3,
    day: -128,
    reason: 'Second-trimester ultrasound and routine check.',
    findings: 'Normal fetal growth for gestational age. Ferritin 22 ng/mL, falling.',
    diagnoses: [dx('Z34', 'Supervision of normal pregnancy')],
    treatment: 'Continue folic acid.',
    recommendations: 'Iron-rich foods (red meat, lentils, spinach).',
    followUp: 'Recheck hemoglobin and ferritin in 5 weeks.',
  })
  summary({
    patientId: 'pt-aysel',
    authorId: 'pr-huseynova',
    appointmentId: a5,
    day: -57,
    reason: 'Antenatal visit; tiredness.',
    findings: 'Hemoglobin 111 g/L (low), ferritin 11 ng/mL (low). Glucose normal.',
    diagnoses: [dx('Z34', 'Supervision of normal pregnancy'), dx('D50', 'Iron deficiency anemia')],
    treatment: 'Ferrous sulfate 100 mg elemental iron daily with vitamin C.',
    recommendations: 'Take iron away from tea and dairy. Report constipation or nausea.',
    followUp: 'CBC and ferritin in 4–5 weeks.',
  })
  summary({
    patientId: 'pt-aysel',
    authorId: 'pr-huseynova',
    appointmentId: a6,
    day: -22,
    reason: 'Antenatal visit, approx. 32 weeks.',
    findings: 'Hemoglobin recovering to 116 g/L, ferritin 19 ng/mL. BP 118/74. Fetal movements normal.',
    diagnoses: [dx('Z34', 'Supervision of normal pregnancy'), dx('D50', 'Iron deficiency anemia')],
    treatment: 'Continue iron supplement.',
    recommendations: 'Birth plan discussion at next visit.',
    followUp: 'Antenatal check with CTG at 36 weeks.',
  })
  serviceRequests.push({
    id: sid('sr'),
    category: 'follow-up',
    patientId: 'pt-aysel',
    requesterId: 'pr-huseynova',
    visitTypeId: 'vt-hus-antenatal',
    timeframe: '2w',
    note: 'Antenatal check at 36 weeks with CTG.',
    status: 'active',
    authoredOn: at(-3, '14:10'),
  })
  consents.push({ id: sid('consent'), patientId: 'pt-aysel', granteeId: 'pr-huseynova', scope: 'all', start: at(-208, '09:40'), end: null, status: 'active', source: 'manual', createdAt: at(-208, '09:40') })
  audit('pt-aysel', 'pr-huseynova', -208, '10:05', 'viewed record')
  audit('pt-aysel', 'pr-huseynova', -128, '11:58', 'viewed record')
  audit('pt-aysel', 'pr-huseynova', -57, '09:33', 'viewed lab results')
  audit('pt-aysel', 'pr-huseynova', -22, '10:02', 'viewed record')
  review(a3, 5, 'Dr. Huseynova saw my lab results before I arrived.')
  review(a5, 5, 'Explained the iron results clearly and calmly.')

  // ----------------------------------------------------- Other patients
  // Fill the doctors' schedules, lab bookings and feedback pages.
  const f1 = visit({ patientId: 'pt-farid', practitionerId: 'pr-hasanova', visitTypeId: 'vt-has-consult', day: -44, time: '14:00', status: 'fulfilled' })
  const fOrder = labOrder({ patientId: 'pt-farid', requesterId: 'pr-hasanova', labId: 'lab-caspian', testIds: ['lipid'], note: 'Chest discomfort on exertion; cardiovascular risk.', day: -44, status: 'completed' })
  labResult({ patientId: 'pt-farid', labId: 'lab-caspian', day: -38, testIds: ['lipid'], orderId: fOrder, values: { '2093-3': 6.1, '2089-1': 4.0, '2571-8': 1.6 } })
  visit({ patientId: 'pt-farid', practitionerId: 'pr-hasanova', visitTypeId: 'vt-has-consult', day: 0, time: '09:30', status: 'booked' })
  visit({ patientId: 'pt-farid', practitionerId: 'pr-hasanova', visitTypeId: 'vt-has-echo', day: 3, time: '15:00', status: 'pending' })
  const f2 = visit({ patientId: 'pt-farid', practitionerId: 'pr-aliyev', visitTypeId: 'vt-ali-consult', day: -150, time: '16:00', status: 'fulfilled' })
  labVisit({ patientId: 'pt-farid', labId: 'lab-caspian', testIds: ['cbc'], day: 0, time: '10:00', status: 'booked' })
  summary({
    patientId: 'pt-farid',
    authorId: 'pr-hasanova',
    appointmentId: f1,
    day: -44,
    reason: 'Chest discomfort when climbing stairs, 3 weeks.',
    findings: 'BP 134/86. ECG without acute changes. Smoker, 10 cigarettes/day.',
    diagnoses: [dx('R07', 'Pain in throat and chest')],
    treatment: 'No medication started. Lipid panel ordered.',
    recommendations: 'Stop smoking; stress echocardiography if symptoms persist.',
    followUp: 'Review results in 6 weeks.',
  })
  consents.push({ id: sid('consent'), patientId: 'pt-farid', granteeId: 'pr-hasanova', scope: 'labs', start: at(-46, '20:00'), end: at(10, '23:59'), status: 'active', source: 'booking', createdAt: at(-46, '20:00') })
  review(f1, 5, 'Very attentive, explained the ECG step by step.')
  review(f2, 4, 'Helpful diet advice. The appointment started on time.')

  const o1 = visit({ patientId: 'pt-orkhan', practitionerId: 'pr-hasanova', visitTypeId: 'vt-has-ecg', day: -100, time: '11:00', status: 'fulfilled' })
  visit({ patientId: 'pt-orkhan', practitionerId: 'pr-hasanova', visitTypeId: 'vt-has-ecg', day: 0, time: '11:00', status: 'booked' })
  const oOrderA = labOrder({ patientId: 'pt-orkhan', requesterId: 'pr-hasanova', labId: 'lab-merkez', testIds: ['lipid'], note: 'Baseline lipids.', day: -192, status: 'completed' })
  labResult({ patientId: 'pt-orkhan', labId: 'lab-merkez', day: -190, testIds: ['lipid'], orderId: oOrderA, values: { '2093-3': 6.8, '2089-1': 4.4, '2571-8': 2.3 } })
  const oOrderB = labOrder({ patientId: 'pt-orkhan', requesterId: 'pr-hasanova', labId: 'lab-merkez', testIds: ['lipid'], note: 'On atorvastatin 20 mg — response check.', day: -97, status: 'completed' })
  labResult({ patientId: 'pt-orkhan', labId: 'lab-merkez', day: -95, testIds: ['lipid'], orderId: oOrderB, values: { '2093-3': 5.6, '2089-1': 3.5, '2571-8': 1.9 } })
  const oOrderC = labOrder({ patientId: 'pt-orkhan', requesterId: 'pr-hasanova', labId: 'lab-nur', testIds: ['lipid'], note: 'Statin therapy monitoring — atorvastatin 20 mg.', day: -6, status: 'booked' })
  labVisit({ patientId: 'pt-orkhan', labId: 'lab-nur', testIds: ['lipid'], day: 0, time: '10:40', status: 'booked', orderId: oOrderC })
  summary({
    patientId: 'pt-orkhan',
    authorId: 'pr-hasanova',
    appointmentId: o1,
    day: -100,
    reason: 'Statin follow-up.',
    findings: 'LDL 3.5 mmol/L on atorvastatin 20 mg, improving. ECG normal.',
    diagnoses: [dx('E78', 'Hyperlipidemia')],
    treatment: 'Continue atorvastatin 20 mg.',
    recommendations: 'Mediterranean-style diet, reduce fried food.',
    followUp: 'Lipid panel in 3 months.',
  })
  consents.push({ id: sid('consent'), patientId: 'pt-orkhan', granteeId: 'pr-hasanova', scope: 'all', start: at(-192, '10:00'), end: null, status: 'active', source: 'qr', createdAt: at(-192, '10:00') })
  review(o1, 4, 'Good doctor, but I waited 20 minutes past my time.')

  const g1 = visit({ patientId: 'pt-gunay', practitionerId: 'pr-hasanova', visitTypeId: 'vt-has-consult', day: -30, time: '12:30', status: 'fulfilled' })
  const g2 = visit({ patientId: 'pt-gunay', practitionerId: 'pr-huseynova', visitTypeId: 'vt-hus-consult', day: -90, time: '13:00', status: 'fulfilled' })
  visit({ patientId: 'pt-gunay', practitionerId: 'pr-hasanova', visitTypeId: 'vt-has-consult', day: 2, time: '12:00', status: 'booked' })
  labVisit({ patientId: 'pt-gunay', labId: 'lab-nur', testIds: ['cbc', 'vitd'], day: 0, time: '09:20', status: 'booked' })
  labVisit({ patientId: 'pt-gunay', labId: 'lab-merkez', testIds: ['hba1c'], day: 1, time: '09:00', status: 'booked' })
  labResult({ patientId: 'pt-gunay', labId: 'lab-nur', day: -33, testIds: ['cbc'], values: { '718-7': 131, '6690-2': 6.2, '777-3': 281 } })
  review(g1, 5, 'Calm and thorough. Booking online was easy.')
  review(g2, 4, 'Good consultation, the clinic was a bit crowded.')

  return {
    users: structuredClone(USERS),
    patients: structuredClone(PATIENTS),
    organizations,
    practitioners: structuredClone(PRACTITIONERS),
    visitTypes,
    schedules,
    appointments,
    serviceRequests,
    observations,
    reports,
    compositions,
    consents,
    auditEvents,
    feedback,
    shareTokens: [],
  }
}
