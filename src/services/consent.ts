import { addMinutes } from 'date-fns'
import { newId } from '../lib/clinical'
import { db, mutate } from '../store/db'
import type { Consent, ConsentScope, ExpiryOption, ShareToken } from '../types'
import {
  auditView,
  byDateDesc,
  consentView,
  delay,
  expiryToEnd,
  findPractitioner,
  type AuditView,
  type ConsentView,
} from './shared'

export interface AccessOverview {
  active: ConsentView[]
  pending: ConsentView[]
  history: ConsentView[]
  log: AuditView[]
}

export async function getAccessOverview(patientId: string): Promise<AccessOverview> {
  await delay()
  const d = db()
  const mine = d.consents
    .filter((c) => c.patientId === patientId)
    .map((c) => consentView(d, c))
    .sort(byDateDesc((c) => c.createdAt))
  return {
    active: mine.filter((c) => c.state === 'active'),
    pending: mine.filter((c) => c.state === 'pending'),
    history: mine.filter((c) => c.state === 'expired' || c.state === 'revoked' || c.state === 'declined'),
    log: d.auditEvents
      .filter((e) => e.patientId === patientId)
      .sort(byDateDesc((e) => e.recorded))
      .map((e) => auditView(d, e)),
  }
}

export async function revokeConsent(consentId: string): Promise<void> {
  await delay(200)
  const now = new Date().toISOString()
  mutate((d) => ({
    consents: d.consents.map((c) => (c.id === consentId ? { ...c, status: 'revoked' as const, end: now } : c)),
  }))
}

export async function answerAccessRequest(consentId: string, approve: boolean): Promise<void> {
  await delay(200)
  mutate((d) => ({
    consents: d.consents.map((c) =>
      c.id === consentId ? { ...c, status: approve ? ('active' as const) : ('declined' as const), start: new Date().toISOString() } : c,
    ),
  }))
}

// ------------------------------------------------------------- QR share

const SHARE_VALID_MIN = 10

function shareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const pick = () => chars[Math.floor(Math.random() * chars.length)]
  return `${pick()}${pick()}${pick()}-${pick()}${pick()}${pick()}`
}

export async function createShareToken(patientId: string, scope: ConsentScope, expiry: ExpiryOption): Promise<ShareToken> {
  await delay(150)
  const now = new Date()
  const token: ShareToken = {
    code: shareCode(),
    patientId,
    scope,
    expiry,
    createdAt: now.toISOString(),
    expiresAt: addMinutes(now, SHARE_VALID_MIN).toISOString(),
  }
  mutate((d) => ({ shareTokens: [...d.shareTokens.filter((t) => t.patientId !== patientId || t.redeemedBy), token] }))
  return token
}

/** Called from the doctor's side when reception scans the QR or types the code. */
export async function redeemShareToken(code: string, practitionerId: string): Promise<Consent> {
  await delay(300)
  const d = db()
  const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  const token = d.shareTokens.find((t) => t.code.replace('-', '') === normalized)
  if (!token || token.redeemedBy) throw new Error('This code is not valid.')
  if (new Date(token.expiresAt) < new Date()) throw new Error('This code has expired. Ask the patient for a new one.')
  findPractitioner(d, practitionerId)
  const now = new Date().toISOString()
  const consent: Consent = {
    id: newId('consent'),
    patientId: token.patientId,
    granteeId: practitionerId,
    scope: token.scope,
    start: now,
    end: expiryToEnd(token.expiry),
    status: 'active',
    source: 'qr',
    createdAt: now,
  }
  mutate((cur) => ({
    consents: [...cur.consents, consent],
    shareTokens: cur.shareTokens.map((t) => (t.code === token.code ? { ...t, redeemedBy: practitionerId } : t)),
  }))
  return consent
}

export async function getShareToken(code: string): Promise<ShareToken | undefined> {
  await delay(0)
  return db().shareTokens.find((t) => t.code === code)
}
