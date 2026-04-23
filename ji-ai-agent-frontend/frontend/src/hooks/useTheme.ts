import { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import type { ThemeMode } from '@/types'

/**
 * Manages the app theme (dark / light / system) and syncs the `dark` class to <html>.
 */
export function useTheme() {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)

  useEffect(() => {
    const root = document.documentElement

    const applyDark = (dark: boolean) => {
      root.classList.toggle('dark', dark)
    }

    if (theme === 'dark') {
      applyDark(true)
      return
    }
    if (theme === 'light') {
      applyDark(false)
      return
    }

    // system mode — follow prefers-color-scheme
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    applyDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => applyDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const toggle = () => {
    const next: ThemeMode =
      theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    setTheme(next)
  }

  return { theme, setTheme, toggle } as const
}
