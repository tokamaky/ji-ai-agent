import React from 'react'
import { clsx } from 'clsx'

interface LoadingDotsProps {
  className?: string
}

/** Three-dot bounce loading animation */
export const LoadingDots = React.memo(function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={clsx('flex items-center gap-1', className)} aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-current"
          style={{
            animation: 'bounceDot 1.2s infinite ease-in-out',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  )
})

interface SpinnerProps {
  size?: number
  className?: string
}

/** Spinning circle loader */
export const Spinner = React.memo(function Spinner({ size = 20, className }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={clsx('animate-spin', className)}
      aria-label="Loading"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
})
