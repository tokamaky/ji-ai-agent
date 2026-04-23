import { v4 as uuidv4 } from 'uuid'

/** Generate a v4 UUID */
export function generateId(): string {
  return uuidv4()
}

/** Return the first 8 characters of an ID for display */
export function shortId(id: string): string {
  return id.slice(0, 8)
}
