/** Validate a user message: non-empty and within the length limit */
export function isValidMessage(message: string, maxLength = 4000): boolean {
  const trimmed = message.trim()
  return trimmed.length > 0 && trimmed.length <= maxLength
}

/** Validate UUID v4 format */
export function isValidSessionId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}
