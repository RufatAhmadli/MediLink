import { newId } from '../lib/clinical'
import { db, mutate } from '../store/db'
import type { Role, User } from '../types'
import { delay } from './shared'

// Simulated authentication. The future backend issues a JWT instead.

export async function getDemoAccounts(): Promise<User[]> {
  await delay(0)
  return db().users.filter((u) => u.id.startsWith('u-'))
}

/** Any password works. The email picks a matching account; otherwise the role's first demo account. */
export async function logIn(role: Role, email: string): Promise<User> {
  await delay(300)
  const users = db().users.filter((u) => u.role === role)
  const match = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  return match ?? users[0]
}

export interface SignUpDraft {
  name: string
  birthDate: string
  phone: string
  email: string
  sex: 'male' | 'female'
}

/** Pretends to send an SMS code. */
export async function requestSmsCode(phone: string): Promise<{ sentTo: string }> {
  await delay(400)
  return { sentTo: phone }
}

/** Any 6 digits are accepted. Creates the patient record and account. */
export async function verifySmsCode(draft: SignUpDraft, code: string): Promise<User> {
  await delay(400)
  if (!/^\d{6}$/.test(code)) throw new Error('Enter the 6-digit code')
  const patientId = newId('pt')
  const digits = () => Math.floor(1000 + Math.random() * 9000)
  const user: User = { id: newId('u'), role: 'patient', email: draft.email, displayName: draft.name, refId: patientId }
  mutate((d) => ({
    patients: [
      ...d.patients,
      {
        id: patientId,
        name: draft.name,
        birthDate: draft.birthDate,
        sex: draft.sex,
        phone: draft.phone,
        email: draft.email,
        identifier: `MDL-${digits()}-${digits()}`,
        area: 'Baku',
      },
    ],
    users: [...d.users, user],
  }))
  return user
}
