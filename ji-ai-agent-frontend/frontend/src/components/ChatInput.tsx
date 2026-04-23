import React, { useRef, useEffect, useCallback, KeyboardEvent } from 'react'
import { Send, Square } from 'lucide-react'
import { clsx } from 'clsx'

interface ChatInputProps {
  onSend: (message: string) => void
  onStop?: () => void
  isLoading?: boolean
  placeholder?: string
  disabled?: boolean
  appType?: 'love_app' | 'manus'
}

const SEND_GRADIENT = {
  manus: 'from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500',
  love_app: 'from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400',
}

export const ChatInput = React.memo(function ChatInput({
  onSend,
  onStop,
  isLoading = false,
  placeholder = '输入你的问题...',
  disabled = false,
  appType = 'manus',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Track if we just sent a message to prevent double-send from Enter key
  const justSentRef = useRef(false)

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  })

  const handleSend = useCallback(() => {
    // Prevent double-send if we just sent or still loading
    if (justSentRef.current || isLoading) return

    const el = textareaRef.current
    if (!el) return
    const value = el.value.trim()
    if (!value) return

    // Mark as sent to prevent any subsequent Enter key from sending again
    justSentRef.current = true

    // Clear the textarea immediately
    el.value = ''
    adjustHeight()

    // Call onSend
    onSend(value)

    // Reset the flag after a short delay to allow new messages
    setTimeout(() => {
      justSentRef.current = false
    }, 500)
  }, [onSend, isLoading, adjustHeight])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Also prevent send if we just sent or loading
      if (justSentRef.current || isLoading) {
        e.preventDefault()
        return
      }

      if (e.key === 'Escape') {
        if (textareaRef.current) textareaRef.current.value = ''
        adjustHeight()
        return
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend, adjustHeight, isLoading],
  )

  const btnGradient = SEND_GRADIENT[appType]

  return (
    <div className="flex items-end gap-3 p-4">
      <textarea
        ref={textareaRef}
        rows={1}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        onInput={adjustHeight}
        onKeyDown={handleKeyDown}
        className={clsx(
          'flex-1 resize-none rounded-2xl px-4 py-3 text-sm leading-relaxed',
          'bg-surface-200/80 dark:bg-surface-800/80 border border-surface-300 dark:border-surface-700/50',
          'text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-600',
          'focus:outline-none focus:ring-2 focus:ring-violet-500/30',
          'focus:border-violet-500/50',
          'transition-all duration-200 min-h-[48px] max-h-[200px]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
        )}
      />

      {isLoading ? (
        <button
          onClick={onStop}
          className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-2xl bg-red-500/80 hover:bg-red-500 text-white transition-all duration-150 shadow-lg"
        >
          <Square size={15} fill="currentColor" />
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={disabled}
          className={clsx(
            'flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-2xl',
            `bg-gradient-to-br ${btnGradient}`,
            'text-white shadow-lg',
            'transform hover:-translate-y-0.5 active:translate-y-0',
            'transition-all duration-150',
            'disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none',
          )}
        >
          <Send size={15} />
        </button>
      )}
    </div>
  )
})
