import { CATALOG, TEST_DEFINITIONS } from '../mock/catalog'
import type { CatalogTest, Interpretation, Organization, TestDefinition } from '../types'

export function testDef(loinc: string): TestDefinition {
  const def = TEST_DEFINITIONS.find((d) => d.loinc === loinc)
  if (!def) throw new Error(`Unknown LOINC code ${loinc}`)
  return def
}

export function catalogTest(id: string): CatalogTest {
  const test = CATALOG.find((t) => t.id === id)
  if (!test) throw new Error(`Unknown catalog test ${id}`)
  return test
}

export function testNames(testIds: string[]): string {
  return testIds.map((id) => catalogTest(id).name).join(', ')
}

export function interpret(value: number, low: number | null, high: number | null): Interpretation {
  if (high !== null && value > high) return 'H'
  if (low !== null && value < low) return 'L'
  return 'N'
}

export function formatValue(value: number, loinc: string): string {
  return value.toFixed(testDef(loinc).decimals)
}

export function formatRange(low: number | null, high: number | null, loinc: string): string {
  const d = testDef(loinc).decimals
  if (low !== null && high !== null) return `${low.toFixed(d)}–${high.toFixed(d)}`
  if (high !== null) return `< ${high.toFixed(d)}`
  if (low !== null) return `> ${low.toFixed(d)}`
  return '—'
}

/** The lab's own name for a standard test, falling back to the standard short name. */
export function localNameFor(lab: Organization | undefined, loinc: string): string {
  return lab?.lab?.localNames.find((n) => n.loinc === loinc)?.localName ?? testDef(loinc).shortName
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function ageFrom(birthDate: string, now = new Date()): number {
  const b = new Date(birthDate)
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age
}
