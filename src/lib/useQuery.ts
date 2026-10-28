import { useEffect, useState } from 'react'
import { useDb } from '../store/db'

interface QueryResult<T> {
  data: T | undefined
  error: Error | undefined
  loading: boolean
}

/**
 * Runs an async service call and re-runs it whenever the data store changes,
 * so demo actions on one screen show up everywhere. Keeps the previous result
 * while refetching to avoid flicker.
 */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[]): QueryResult<T> {
  const version = useDb((s) => s.version)
  const [state, setState] = useState<{ data?: T; error?: Error; key?: string }>({})
  const key = JSON.stringify(deps)

  useEffect(() => {
    let alive = true
    fn().then(
      (data) => alive && setState({ data, key }),
      (error: Error) => alive && setState({ error, key }),
    )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, key])

  // Drop data that belongs to different arguments (e.g. another patient id).
  const current = state.key === key
  return {
    data: current ? state.data : undefined,
    error: current ? state.error : undefined,
    loading: !current || (state.data === undefined && state.error === undefined),
  }
}
