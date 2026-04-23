import { useEffect, useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { Sidebar } from './Sidebar'
import { EmptyState } from './EmptyState'
import { useAppStore } from '@/stores/appStore'
import { useChatStore } from '@/stores/chatStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useShallow } from 'zustand/react/shallow'
import { useSessions } from '@/hooks/useSessions'
import { useChat } from '@/hooks/useChat'
import type { AppType, ChatMessage as ChatMessageType } from '@/types'

interface ChatRoomProps {
  appType: AppType
  placeholder?: string
  emptyTitle?: string
  emptySubtitle?: string
}

/* Per-type gradient accent for the chat area */
const APP_GRADIENTS: Record<AppType, string> = {
  manus: 'bg-gradient-to-b from-violet-100 via-surface-50 to-surface-50 dark:from-violet-950/30 dark:via-surface-950 dark:to-surface-950',
  love_app: 'bg-gradient-to-b from-rose-100 via-surface-50 to-surface-50 dark:from-rose-950/20 dark:via-surface-950 dark:to-surface-950',
}

export function ChatRoom({ appType, placeholder, emptyTitle = '', emptySubtitle = '' }: ChatRoomProps) {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)

  const { sessions, activeSessionId, newSession, removeSession, setActiveSession, renameSession, clearActiveSession } =
      useSessions(appType)

  // Reset active session on mount — show empty state when entering page
  const initialized = useRef(false)
  useEffect(() => {
    if (!initialized.current) {
      clearActiveSession()
      initialized.current = true
    }
    return () => {
      initialized.current = false
    }
  }, [clearActiveSession])

  const allSessions = useSessionStore(useShallow((s) => s.sessions))
  const messages: ChatMessageType[] = useMemo(() => {
    if (!activeSessionId) return []
    const session = allSessions.find((se) => se.sessionId === activeSessionId)
    return session?.messages ?? []
  }, [allSessions, activeSessionId])
  const isLoading = useChatStore((s) => s.isLoading)

  const { sendMessage, stopStreaming } = useChat({ appType, sessionId: activeSessionId })

  // Virtual scroll
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  })

  // Auto-scroll to latest message
  useEffect(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end', behavior: 'smooth' })
    }
  }, [messages.length])

  const handleNewSession = () => {
    const s = newSession()
    setActiveSession(s.sessionId)
  }

  const hasActiveSession = !!activeSessionId

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Sidebar */}
      <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onNewSession={handleNewSession}
          onSelectSession={setActiveSession}
          onDeleteSession={removeSession}
          onRenameSession={renameSession}
          open={sidebarOpen}
          appType={appType}
      />

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Message list */}
        <div
            ref={parentRef}
            className={`flex-1 overflow-y-auto ${APP_GRADIENTS[appType]}`}
        >
          {hasActiveSession ? (
            <div
                className="max-w-4xl mx-auto px-4 py-6"
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  position: 'relative',
                }}
            >
              {virtualizer.getVirtualItems().map((item) => (
                  <div
                      key={item.key}
                      ref={virtualizer.measureElement}
                      data-index={item.index}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${item.start}px)`,
                      }}
                      className="pb-4"
                  >
                    <ChatMessage message={messages[item.index]} appType={appType} />
                  </div>
              ))}
            </div>
          ) : (
            <EmptyState appType={appType} onStartChat={handleNewSession} title={emptyTitle} subtitle={emptySubtitle} />
          )}
        </div>

        {/* Input — only show when there's an active session */}
        {hasActiveSession && (
          <div className="flex-shrink-0 border-t border-surface-200 dark:border-white/5">
            <div className="max-w-4xl mx-auto">
              <ChatInput
                onSend={sendMessage}
                onStop={stopStreaming}
                isLoading={isLoading}
                placeholder={placeholder}
                disabled={false}
                appType={appType}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
