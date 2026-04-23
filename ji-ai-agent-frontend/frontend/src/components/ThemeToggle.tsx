import React from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export const ThemeToggle = React.memo(function ThemeToggle() {
  const { theme, toggle } = useTheme()

  const icon =
    theme === 'dark' ? (
      <Moon size={18} />
    ) : theme === 'light' ? (
      <Sun size={18} />
    ) : (
      <Monitor size={18} />
    )

  const label =
    theme === 'dark' ? 'Dark mode' : theme === 'light' ? 'Light mode' : 'System theme'

  return (
    <button
      onClick={toggle}
      title={label}
      aria-label={`Toggle theme — current: ${label}`}
      className="flex items-center justify-center w-9 h-9 rounded-lg
        text-surface-500 dark:text-surface-400
        hover:bg-surface-200 dark:hover:bg-surface-800
        transition-colors duration-200"
    >
      {icon}
    </button>
  )
})
