/**
 * Love Advisor service layer.
 * Primary communication is SSE (EventSource), driven by the useChat hook.
 */

export const LOVE_APP_SSE_URL = '/api/ai/love_app/chat/sse'

/** Build the Love Advisor SSE URL with query params */
export function buildLoveAppSSEUrl(message: string, sessionId: string): string {
  const params = new URLSearchParams({ message, sessionId })
  return `${LOVE_APP_SSE_URL}?${params.toString()}`
}
