import React, { useState } from 'react'
import { clsx } from 'clsx'
import { Plus, Trash2, Pencil, Check, X, MessageSquare } from 'lucide-react'
import { formatRelativeDate } from '@/utils/format'
import type { ChatSession, AppType } from '@/types'

interface SidebarProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onNewSession: () => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onRenameSession: (id: string, title: string) => void
  open: boolean
  appType?: AppType
}

const APP_ACCENT: Record<AppType, { border: string; hover: string; active: string; activeText: string }> = {
  manus: {
    border: 'border-violet-500/20 dark:border-violet-500/20',
    hover: 'hover:bg-violet-500/5 dark:hover:bg-violet-500/5',
    active: 'bg-violet-500/10 dark:bg-violet-500/10 border border-violet-500/30 dark:border-violet-500/30',
    activeText: 'text-violet-600 dark:text-violet-400',
  },
  love_app: {
    border: 'border-pink-500/20 dark:border-pink-500/20',
    hover: 'hover:bg-pink-500/5 dark:hover:bg-pink-500/5',
    active: 'bg-pink-500/10 dark:bg-pink-500/10 border border-pink-500/30 dark:border-pink-500/30',
    activeText: 'text-pink-600 dark:text-pink-400',
  },
}

interface SessionItemProps {
  session: ChatSession
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onRename: (title: string) => void
  accent: { border: string; hover: string; active: string; activeText: string }
}

const SessionItem = React.memo(function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
  onRename,
  accent,
}: SessionItemProps) {
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(session.title)

  const commitRename = () => {
    const t = draftTitle.trim()
    if (t) onRename(t)
    setEditing(false)
  }

  const cancelRename = () => {
    setDraftTitle(session.title)
    setEditing(false)
  }

  return (
    <div
      className={clsx(
        'group relative flex items-center gap-2 px-3 py-2.5 cursor-pointer',
        'rounded-xl mx-1 transition-all duration-150',
        isActive ? accent.active : clsx('border border-transparent', accent.hover),
      )}
      onClick={editing ? undefined : onSelect}
    >
      <MessageSquare size={15} className={clsx('flex-shrink-0', isActive ? accent.activeText : 'text-surface-500 dark:text-surface-500')} />

      {editing ? (
        <input
          autoFocus
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') cancelRename()
          }}
          className="flex-1 text-sm bg-transparent border-b border-primary outline-none text-surface-800 dark:text-surface-200"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="flex-1 min-w-0">
          <p className={clsx('text-sm font-medium truncate', isActive ? accent.activeText : 'text-surface-800 dark:text-surface-300')}>
            {session.title}
          </p>
          <p className="text-[11px] text-surface-400 dark:text-surface-600">
            {formatRelativeDate(session.updatedAt)}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div
        className={clsx(
          'flex items-center gap-0.5 flex-shrink-0',
          editing ? 'flex' : 'hidden group-hover:flex',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {editing ? (
          <>
            <button onClick={commitRename} aria-label="Confirm" className="p-1 text-emerald-600 hover:text-emerald-500 dark:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
              <Check size={13} />
            </button>
            <button onClick={cancelRename} aria-label="Cancel" className="p-1 text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 transition-colors">
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => { setDraftTitle(session.title); setEditing(true) }}
              aria-label="Rename"
              className="p-1 text-surface-400 dark:text-surface-600 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={onDelete}
              aria-label="Delete"
              className="p-1 text-surface-400 dark:text-surface-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  )
})

export const Sidebar = React.memo(function Sidebar({
  sessions,
  activeSessionId,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  open,
  appType = 'manus',
}: SidebarProps) {
  const accent = APP_ACCENT[appType]

  const buttonGradient = appType === 'love_app'
    ? 'from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400'
    : 'from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500'

  return (
    <aside
      className={clsx(
        'flex flex-col border-r border-surface-200 dark:border-white/5',
        'bg-surface-50/80 dark:bg-surface-950/50 backdrop-blur-sm',
        'transition-all duration-300 ease-in-out',
        open ? 'w-72' : 'w-0 overflow-hidden',
      )}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={onNewSession}
          className={clsx(
            'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl',
            `bg-gradient-to-r ${buttonGradient}`,
            'text-white text-sm font-semibold',
            'shadow-lg shadow-black/10',
            'transform hover:-translate-y-0.5 active:translate-y-0',
            'transition-all duration-200',
          )}
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-surface-200 dark:border-white/5 mb-2" />

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-1 space-y-0.5">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-surface-200 dark:bg-surface-800 flex items-center justify-center mb-3">
              <MessageSquare size={20} className="text-surface-400 dark:text-surface-500" />
            </div>
            <p className="text-sm text-surface-500 dark:text-surface-500 mb-1">No conversations yet</p>
            <p className="text-xs text-surface-400 dark:text-surface-600">Start a new chat above</p>
          </div>
        ) : (
          sessions.map((s) => (
            <SessionItem
              key={s.sessionId}
              session={s}
              isActive={s.sessionId === activeSessionId}
              onSelect={() => onSelectSession(s.sessionId)}
              onDelete={() => onDeleteSession(s.sessionId)}
              onRename={(title) => onRenameSession(s.sessionId, title)}
              accent={accent}
            />
          ))
        )}
      </div>

      {/* Footer branding */}
      <div className="px-4 py-3 border-t border-surface-200 dark:border-white/5 text-center">
        <p className="text-[10px] text-surface-400 dark:text-surface-700">
          JI AI Agent
        </p>
      </div>
    </aside>
  )
})
