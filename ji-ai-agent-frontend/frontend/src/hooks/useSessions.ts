import { useCallback, useMemo } from 'react'
import { useSessionStore } from '@/stores/sessionStore'
import { useChatStore } from '@/stores/chatStore'
import { useShallow } from 'zustand/react/shallow'
import type { AppType } from '@/types'

/**
 * Session management hook — CRUD operations scoped to an AppType.
 */
export function useSessions(appType: AppType) {
  const allSessions = useSessionStore(useShallow((s) => s.sessions))
  const sessions = useMemo(
      () => allSessions.filter((se) => se.type === appType),
      [allSessions, appType],
  )
  const activeSessionId = useSessionStore((s) => s.activeSessionId)
  const createSession = useSessionStore((s) => s.createSession)
  const deleteSession = useSessionStore((s) => s.deleteSession)
  const setActiveSession = useSessionStore((s) => s.setActiveSession)
  const clearActiveSession = useSessionStore((s) => s.clearActiveSession)
  const renameSession = useSessionStore((s) => s.renameSession)
  const clearMessages = useChatStore((s) => s.clearMessages)

  const newSession = useCallback(() => {
    return createSession(appType)
  }, [createSession, appType])

  const removeSession = useCallback(
      (sessionId: string) => {
        clearMessages(sessionId)
        deleteSession(sessionId)
      },
      [clearMessages, deleteSession],
  )

  return {
    sessions,
    activeSessionId,
    setActiveSession,
    clearActiveSession,
    newSession,
    removeSession,
    renameSession,
  } as const
}
