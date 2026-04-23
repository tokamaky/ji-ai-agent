import React, { useState } from 'react'
import { clsx } from 'clsx'
import { ChevronDown, ChevronRight, Wrench, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { ToolCallInfo } from '@/types'

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: (
    <Loader2 size={13} className="text-surface-400 dark:text-surface-500 motion-safe:animate-spin" />
  ),
  running: (
    <span className="relative flex items-center justify-center w-[13px] h-[13px]">
      <span className="absolute inset-0 rounded-full bg-blue-500/20 motion-safe:animate-pulse-ring" />
      <Loader2 size={13} className="text-blue-500 motion-safe:animate-spin" />
    </span>
  ),
  completed: (
    <span className="flex items-center justify-center w-[13px] h-[13px]">
      <CheckCircle size={13} className="text-green-500" />
    </span>
  ),
  failed: (
    <span className="flex items-center justify-center w-[13px] h-[13px]">
      <XCircle size={13} className="text-red-500" />
    </span>
  ),
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Queued',
  running: 'Running',
  completed: 'Done',
  failed: 'Failed',
}

interface ToolCallItemProps {
  toolCall: ToolCallInfo
}

const ToolCallItem = React.memo(function ToolCallItem({ toolCall }: ToolCallItemProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-surface-300 dark:border-surface-700/60 rounded-lg overflow-hidden text-xs motion-safe:animate-fade-in">
      <button
        onClick={() => setExpanded((v) => !v)}
        className={clsx(
          'w-full flex items-center gap-2 px-3 py-2 text-left',
          'bg-surface-100/70 dark:bg-surface-900/70 hover:bg-surface-200/80 dark:hover:bg-surface-800/60',
          'transition-colors duration-150',
        )}
      >
        <span className={clsx(
          'flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center',
          toolCall.status === 'running' && 'bg-blue-500/10 dark:bg-blue-500/10 ring-1 ring-blue-500/30 dark:ring-blue-500/30 motion-safe:animate-breathe',
          toolCall.status === 'completed' && 'bg-green-500/10 dark:bg-green-500/10',
          toolCall.status === 'failed' && 'bg-red-500/10 dark:bg-red-500/10',
          toolCall.status === 'pending' && 'bg-surface-200/50 dark:bg-surface-700/50',
        )}>
          <Wrench size={11} className="text-surface-500 dark:text-surface-400" />
        </span>
        <span className="font-mono font-medium text-surface-800 dark:text-surface-200 flex-1 truncate">
          {toolCall.toolName}
        </span>
        <span className="flex items-center gap-1 text-surface-500 dark:text-surface-400">
          {STATUS_ICON[toolCall.status]}
          <span className="hidden sm:inline">{STATUS_LABEL[toolCall.status]}</span>
        </span>
        {expanded ? (
          <ChevronDown size={13} className="flex-shrink-0 text-surface-400 dark:text-surface-500" />
        ) : (
          <ChevronRight size={13} className="flex-shrink-0 text-surface-400 dark:text-surface-500" />
        )}
      </button>

      {expanded && (
        <div className="px-3 py-2 space-y-2 bg-surface-50/80 dark:bg-surface-950/80">
          {toolCall.arguments && Object.keys(toolCall.arguments).length > 0 && (
            <div>
              <p className="text-surface-500 dark:text-surface-500 uppercase text-[10px] tracking-wide mb-1">Arguments</p>
              <pre className="text-surface-700 dark:text-surface-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(toolCall.arguments, null, 2)}
              </pre>
            </div>
          )}
          {toolCall.result && (
            <div>
              <p className="text-surface-500 dark:text-surface-500 uppercase text-[10px] tracking-wide mb-1">Result</p>
              <p className="text-surface-700 dark:text-surface-300 text-[11px] whitespace-pre-wrap line-clamp-6">
                {toolCall.result}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

interface ToolCallPanelProps {
  toolCalls: ToolCallInfo[]
}

export const ToolCallPanel = React.memo(function ToolCallPanel({ toolCalls }: ToolCallPanelProps) {
  if (toolCalls.length === 0) return null

  return (
    <div className="w-full max-w-md space-y-1.5 mb-1">
      {toolCalls.map((tc) => (
        <ToolCallItem key={tc.id} toolCall={tc} />
      ))}
    </div>
  )
})
