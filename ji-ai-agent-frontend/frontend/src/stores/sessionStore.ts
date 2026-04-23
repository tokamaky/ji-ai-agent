import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateId } from '@/utils/uuid'
import { titleFromMessage } from '@/utils/format'
import type { ChatSession, AppType } from '@/types'

interface SessionStore {
  sessions: ChatSession[]
  activeSessionId: string | null

  /** Return the currently active session */
  activeSession: () => ChatSession | undefined

  /** Create and activate a new session */
  createSession: (type: AppType) => ChatSession

  /** Switch the active session */
  setActiveSession: (sessionId: string) => void

  /** Clear the active session (show empty state) */
  clearActiveSession: () => void

  /** Delete a session */
  deleteSession: (sessionId: string) => void

  /** Rename a session */
  renameSession: (sessionId: string, title: string) => void

  /** Auto-set title from the first user message */
  autoTitleSession: (sessionId: string, firstMessage: string) => void

  /** Update the updatedAt timestamp */
  touchSession: (sessionId: string) => void

  /** Remove all sessions of a given type */
  clearSessions: (type: AppType) => void
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,

      activeSession: () => {
        const { sessions, activeSessionId } = get()
        return sessions.find((s) => s.sessionId === activeSessionId)
      },

      createSession: (type) => {
        const session: ChatSession = {
          sessionId: generateId(),
          title: 'New Chat',
          type,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((s) => ({
          sessions: [session, ...s.sessions],
          activeSessionId: session.sessionId,
        }))
        return session
      },

      setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

      clearActiveSession: () => set({ activeSessionId: null }),

      deleteSession: (sessionId) =>
        set((s) => {
          // If deleting the active session, clear activeSessionId to show empty state.
          // This prevents cross-type auto-selection (e.g. deleting love session
          // accidentally showing a manus session).
          if (s.activeSessionId === sessionId) {
            return {
              sessions: s.sessions.filter((se) => se.sessionId !== sessionId),
              activeSessionId: null,
            }
          }
          return {
            sessions: s.sessions.filter((se) => se.sessionId !== sessionId),
          }
        }),

      renameSession: (sessionId, title) =>
        set((s) => ({
          sessions: s.sessions.map((se) =>
            se.sessionId === sessionId ? { ...se, title, updatedAt: Date.now() } : se,
          ),
        })),

      autoTitleSession: (sessionId, firstMessage) =>
        set((s) => ({
          sessions: s.sessions.map((se) =>
            se.sessionId === sessionId && se.title === 'New Chat'
              ? { ...se, title: titleFromMessage(firstMessage), updatedAt: Date.now() }
              : se,
          ),
        })),

      touchSession: (sessionId) =>
        set((s) => ({
          sessions: s.sessions.map((se) =>
            se.sessionId === sessionId ? { ...se, updatedAt: Date.now() } : se,
          ),
        })),

      clearSessions: (type) =>
        set((s) => ({
          sessions: s.sessions.filter((se) => se.type !== type),
          activeSessionId: null,
        })),
    }),
    {
      name: 'ji-ai-sessions',
    },
  ),
)
