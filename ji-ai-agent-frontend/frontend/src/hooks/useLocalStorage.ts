import { useState, useCallback } from 'react'
import { getItem, setItem } from '@/utils/storage'

/**
 * Type-safe state hook synchronised with localStorage.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => getItem<T>(key, initialValue))

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value
        setItem(key, next)
        return next
      })
    },
    [key],
  )

  return [storedValue, setValue] as const
}
