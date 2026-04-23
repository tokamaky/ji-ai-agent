/** Manus SSE event types */
export type SSEMessageType =
  | 'thinking'
  | 'tool_call'
  | 'tool_result'
  | 'final_response'
  | 'error'

/** Manus streaming SSE event structure */
export interface ManusSSEMessage {
  type: SSEMessageType
  content?: string
  toolName?: string
  status?: string
  result?: string
  args?: Record<string, unknown>
  error?: string
}

/** SSE connection lifecycle state */
export type SSEStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'closed'
