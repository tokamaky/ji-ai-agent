import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { ArrowRight } from 'lucide-react'

interface Feature {
  icon: string
  text: string
}

interface AppCardProps {
  title: string
  description: string
  features: Feature[]
  to: string
  gradient: string
  icon?: React.ReactNode
  badge?: string
}

/**
 * Large gradient card used on the home page.
 *
 * Visual features:
 *  - Cursor-following radial spotlight (CSS custom properties --mx / --my, no re-renders)
 *  - SVG noise texture overlay to eliminate the "flat gradient" look
 *  - ring-1 ring-inset ring-white/10 inner highlight border
 *  - Frosted-glass badge with backdrop-blur + ring
 */
export const AppCard = React.memo(function AppCard({
  title,
  description,
  features,
  to,
  gradient,
  icon,
  badge,
}: AppCardProps) {
  const navigate = useNavigate()

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }, [])

  return (
    <button
      onClick={() => navigate(to)}
      onMouseMove={handleMouseMove}
      className={clsx(
        'relative w-full text-left rounded-2xl p-6',
        'shadow-lg hover:shadow-xl',
        'ring-1 ring-inset ring-black/5 dark:ring-white/10',
        'transform hover:-translate-y-1 active:translate-y-0',
        'transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'overflow-hidden group',
        gradient,
      )}
      /* TS-safe way to declare CSS custom props on an element */
      style={{ '--mx': '50%', '--my': '50%' } as React.CSSProperties}
    >
      {/* Noise texture — kills the "plastic gradient" look */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />

      {/* Cursor-following spotlight */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(280px circle at var(--mx) var(--my), rgba(255,255,255,0.14), transparent 70%)',
          mixBlendMode: 'soft-light',
        }}
        aria-hidden
      />

      {/* Frosted-glass badge */}
      {badge && (
        <span className="absolute top-4 right-4 px-3 py-1 text-xs font-semibold rounded-full
          bg-white/15 text-white backdrop-blur-sm ring-1 ring-white/20">
          {badge}
        </span>
      )}

      {/* Icon container — frosted glass */}
      <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4
        bg-white/20 backdrop-blur-sm ring-1 ring-white/20 shadow-inner">
        {icon || <span className="text-3xl">✨</span>}
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>

      {/* Description */}
      <p className="text-white/85 text-sm mb-4 leading-relaxed">{description}</p>

      {/* Features */}
      <ul className="space-y-2 mb-5">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-white/90 text-sm">
            <span>{f.icon}</span>
            <span>{f.text}</span>
          </li>
        ))}
      </ul>

      {/* CTA row */}
      <div className="flex items-center gap-2 text-white font-medium text-sm">
        <span>Get Started</span>
        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
      </div>
    </button>
  )
})
