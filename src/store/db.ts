import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createSeed, type Database } from '../mock/seed'

// In-memory "backend" for the prototype. Only src/services/ reads or writes it.
// Persisted to localStorage so demo actions survive a page refresh.

interface DbState extends Database {
  /** Bumped on every write so open screens re-run their queries. */
  version: number
}

const fresh = (version: number): DbState => ({ ...createSeed(), version })

export const useDb = create<DbState>()(
  persist(() => fresh(0), {
    name: 'healthtrail-demo-db',
    version: 1,
    storage: createJSONStorage(() => localStorage),
  }),
)

export const db = (): Database => useDb.getState()

export function mutate(recipe: (current: Database) => Partial<Database>): void {
  useDb.setState((s) => ({ ...recipe(s), version: s.version + 1 }))
}

export function resetDemoData(): void {
  useDb.setState((s) => fresh(s.version + 1))
}
