import { useNavigate } from 'react-router-dom'
import { Home, Sparkles } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-surface-50 dark:bg-surface-950 px-4">
      <div className="relative">
        <div className="text-8xl select-none" style={{ filter: 'blur(1px)' }}>
          <Sparkles className="w-20 h-20 text-violet-600/30 dark:text-violet-600/30" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-8xl">🛸</span>
        </div>
      </div>
      <div className="text-center">
        <h1 className="text-7xl font-bold text-surface-300 dark:text-surface-800 mb-3 select-none">404</h1>
        <h2 className="text-2xl font-semibold text-surface-700 dark:text-surface-300 mb-2">
          Page Not Found
        </h2>
        <p className="text-surface-500 dark:text-surface-500">The page you're looking for has vanished into the cosmos…</p>
      </div>
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 px-6 py-3 rounded-2xl
          bg-gradient-to-r from-violet-600 to-purple-600
          hover:from-violet-500 hover:to-purple-500
          text-white font-medium
          shadow-lg shadow-violet-500/20 dark:shadow-violet-500/20
          transform hover:-translate-y-0.5 active:translate-y-0
          transition-all duration-200"
      >
        <Home size={16} />
        Back to Home
      </button>
    </div>
  )
}
