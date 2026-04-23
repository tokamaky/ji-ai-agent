/** Generic API response wrapper */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** SSE connection config */
export interface SSEConfig {
  url: string
  params?: Record<string, string>
  onMessage: (data: string) => void
  onError?: (error: Event) => void
  onOpen?: () => void
  onClose?: () => void
  /** Max reconnect attempts, default 3 */
  maxRetries?: number
  /** Reconnect delay in ms, default 1000 */
  retryInterval?: number
}

/** Love Advisor chat request params */
export interface LoveAppChatParams {
  message: string
  sessionId: string
}

/** Manus agent chat request params */
export interface ManusAppChatParams {
  message: string
}
