/**
 * Manus Super Agent service layer.
 * Primary communication is SSE (EventSource), driven by the useChat hook.
 */

export const MANUS_SSE_URL = '/api/ai/manus/chat'

/** Build the Manus SSE URL with query params */
export function buildManusSSEUrl(message: string): string {
  const params = new URLSearchParams({ message })
  return `${MANUS_SSE_URL}?${params.toString()}`
}
