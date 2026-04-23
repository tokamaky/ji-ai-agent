import React from 'react'
import { clsx } from 'clsx'
import { Bot, User, Heart } from 'lucide-react'
import { formatTime } from '@/utils/format'
import { LoadingDots } from './LoadingAnimation'
import { Markdown } from './Markdown'
import { ToolCallPanel } from './ToolCallPanel'
import type { ChatMessage as ChatMessageType } from '@/types'

interface ChatMessageProps {
  message: ChatMessageType
  appType?: 'love_app' | 'manus'
}

const AVATAR_GRADIENT = {
  user: 'from-primary to-primary-600 shadow-lg shadow-primary-500/25',
  manus: 'from-violet-600 to-purple-600 shadow-lg shadow-violet-500/25',
  love_app: 'from-pink-500 to-rose-500 shadow-lg shadow-pink-500/25',
}

export const ChatMessage = React.memo(function ChatMessage({ message, appType = 'manus' }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isEmpty = !message.content && message.isStreaming

  const avatarBg = isUser ? AVATAR_GRADIENT.user : appType === 'love_app' ? AVATAR_GRADIENT.love_app : AVATAR_GRADIENT.manus

  const avatarIcon = isUser
    ? <User size={16} className="text-white" />
    : appType === 'love_app'
    ? <Heart size={16} className="text-white" />
    : <Bot size={16} className="text-white" />

  return (
    <div
      className={clsx(
        'flex items-end gap-3 motion-safe:animate-slide-up',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {/* Avatar */}
      <div
        className={clsx(
          'flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center',
          avatarBg,
        )}
      >
        {avatarIcon}
      </div>

      {/* Message content */}
      <div className={clsx('flex flex-col gap-1.5 max-w-[75%]', isUser ? 'items-end' : 'items-start')}>
        {/* Tool call panel (Manus only) */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <ToolCallPanel toolCalls={message.toolCalls} />
        )}

        {/* Bubble */}
        <div
          className={clsx(
            'px-5 py-3.5 text-sm leading-relaxed break-words',
            'shadow-md',
            isUser
              ? 'bg-gradient-to-br from-primary to-primary-600 text-white rounded-[20px_20px_6px_20px]'
              : 'bg-surface-200/80 dark:bg-surface-800/80 text-surface-800 dark:text-surface-200 rounded-[20px_20px_20px_6px] border border-surface-300 dark:border-surface-700/50 backdrop-blur-sm',
          )}
        >
          {isEmpty ? (
            <LoadingDots className="text-surface-400 dark:text-surface-500 py-1" />
          ) : message.markdown && !isUser ? (
            <Markdown
              content={message.content}
              className={clsx(
                'prose prose-sm max-w-none',
                'prose-p:my-1 prose-headings:mt-3 prose-headings:mb-1',
              )}
            />
          ) : (
            <span className="whitespace-pre-wrap">{message.content}</span>
          )}

          {/* Streaming cursor */}
          {message.isStreaming && message.content && (
            <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse align-middle" />
          )}
        </div>

        {/* Timestamp */}
        <time
          dateTime={new Date(message.timestamp).toISOString()}
          className="text-[11px] text-surface-400 dark:text-surface-600"
        >
          {formatTime(message.timestamp)}
        </time>
      </div>
    </div>
  )
})
