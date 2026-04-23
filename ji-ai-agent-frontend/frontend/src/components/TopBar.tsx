import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Menu, Sparkles } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { useAppStore } from '@/stores/appStore'

interface TopBarProps {
  title?: string
  showBack?: boolean
  showMenuToggle?: boolean
}

export const TopBar = React.memo(function TopBar({
  title = 'JI AI Agent',
  showBack = false,
  showMenuToggle = false,
}: TopBarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  const isHome = location.pathname === '/'

  return (
    <header className="flex items-center h-14 px-4 gap-3
      bg-surface-50/80 dark:bg-surface-950/80 backdrop-blur-md
      border-b border-surface-200 dark:border-white/5">
      {/* Left: menu / back */}
      <div className="flex items-center gap-2">
        {showMenuToggle && (
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-9 h-9 rounded-xl
              text-surface-500 dark:text-surface-400
              backdrop-blur-sm bg-surface-200/50 dark:bg-white/5
              ring-1 ring-surface-300 dark:ring-white/10
              hover:text-surface-800 dark:hover:text-surface-200
              hover:bg-surface-300/60 dark:hover:bg-white/10
              transition-all duration-150"
          >
            <Menu size={20} />
          </button>
        )}
        {showBack && !isHome && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm
              text-surface-500 dark:text-surface-400
              backdrop-blur-sm bg-surface-200/50 dark:bg-white/5
              ring-1 ring-surface-300 dark:ring-white/10
              hover:text-surface-800 dark:hover:text-surface-200
              hover:bg-surface-300/60 dark:hover:bg-white/10
              transition-all duration-150"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}
      </div>

      {/* Center: logo + title */}
      <div
        className="flex items-center gap-2 flex-1 cursor-pointer"
        onClick={() => navigate('/')}
      >
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 dark:shadow-violet-500/20">
          <Sparkles size={14} className="text-white" />
        </div>
        <span className="font-semibold text-surface-800 dark:text-surface-200">{title}</span>
      </div>

      {/* Right: theme toggle */}
      <ThemeToggle />
    </header>
  )
})
