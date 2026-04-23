import { useRef, useCallback } from 'react'
import { SSEManager } from '@/utils/sse'
import type { SSEConfig } from '@/types/api'
import type { SSEStatus } from '@/types/sse'

/**
 * useSSE — React wrapper for SSEManager.
 * Automatically closes the previous connection when a new one is opened.
 */
export function useSSE() {
  const managerRef = useRef<SSEManager | null>(null)

  const connect = useCallback(
    (config: SSEConfig, onStatusChange?: (s: SSEStatus) => void) => {
      managerRef.current?.close()
      const mgr = new SSEManager(config, onStatusChange)
      managerRef.current = mgr
      mgr.connect()
      return mgr
    },
    [],
  )

  const close = useCallback(() => {
    managerRef.current?.close()
    managerRef.current = null
  }, [])

  return { connect, close } as const
}
