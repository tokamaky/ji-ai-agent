/** Safely read from localStorage, returning fallback on failure */
export function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** Safely write to localStorage, silently ignoring quota errors */
export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // silent fail on quota exceeded
  }
}

/** Remove a localStorage key */
export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export const StorageKeys = {
  SESSIONS: 'ji-ai-sessions',
  THEME: 'ji-ai-theme',
  SIDEBAR_OPEN: 'ji-ai-sidebar-open',
} as const
