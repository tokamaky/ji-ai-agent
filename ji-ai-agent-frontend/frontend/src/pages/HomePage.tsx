import { TopBar } from '@/components/TopBar'
import { AppCard } from '@/components/AppCard'
import { Sparkles, Heart, Bot, ArrowRight, Star, Zap } from 'lucide-react'

const loveFeatures = [
  { icon: '💬', text: 'Multi-turn conversation with memory' },
  { icon: '⚡', text: 'Real-time SSE streaming replies' },
  { icon: '💾', text: 'Session history persisted locally' },
  { icon: '📱', text: 'Responsive mobile-friendly design' },
]

const manusFeatures = [
  { icon: '🌐', text: 'Google web search with real-time results' },
  { icon: '📄', text: 'Scrape and summarize any web page' },
  { icon: '📑', text: 'Generate PDF reports with CJK support' },
  { icon: '🔧', text: 'Live tool-call visualization via SSE' },
]

export default function HomePage() {
  return (
      <div className="relative flex flex-col min-h-screen
          bg-surface-50 dark:bg-surface-950 overflow-hidden">

        {/* ── Ambient background layer ───────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Radial glow — violet in dark, soft violet in light */}
          <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[80rem] h-[50rem]
                  opacity-40 dark:opacity-40"
              style={{
                background:
                    'radial-gradient(ellipse at center top, rgba(139, 92, 246, 0.25) 0%, rgba(236, 72, 153, 0.1) 30%, transparent 60%)',
              }}
          />
          {/* Grid pattern — white in dark, gray in light */}
          <div
              className="absolute inset-0 opacity-[0.025] dark:opacity-[0.025]"
              style={{
                backgroundImage:
                    'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
                maskImage:
                    'radial-gradient(ellipse at center, black 40%, transparent 80%)',
              }}
          />
        </div>

        <TopBar />

        <main className="relative flex-1 flex flex-col items-center justify-center px-6 py-16">

          {/* ── Hero Section ─────────────────────────────────────────── */}
          <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
            <div className="relative flex items-center justify-center mb-8">
              {/* Orbiting ring 1 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                    className="w-28 h-28 rounded-full
                        border border-violet-400/30 dark:border-violet-500/20
                        animate-spin"
                    style={{ animationDuration: '10s' }}
                />
              </div>
              {/* Orbiting ring 2 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                    className="w-40 h-40 rounded-full
                        border border-pink-400/20 dark:border-pink-500/10
                        animate-spin"
                    style={{ animationDuration: '16s', animationDirection: 'reverse' }}
                />
              </div>
              {/* Logo badge */}
              <div className="relative w-20 h-20 rounded-3xl
                  bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600
                  flex items-center justify-center
                  shadow-2xl shadow-violet-500/40 dark:shadow-violet-500/40
                  animate-float">
                <Sparkles size={32} className="text-white drop-shadow-lg" />
                <div className="absolute inset-0 rounded-3xl
                    bg-gradient-to-br from-violet-400/30 to-pink-400/30 animate-pulse" />
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500
                  dark:from-violet-400 dark:via-fuchsia-400 dark:to-pink-400
                  bg-clip-text text-transparent">
                JI AI Agent
              </span>
            </h1>

            <p className="text-lg sm:text-xl
                text-surface-600 dark:text-surface-400
                max-w-xl mx-auto mb-8 leading-relaxed">
              Not a cold tool, but a partner who understands you.
              <br />
              Whether it is relationship confusion or complex research tasks, I am here for you.
            </p>
          </div>

          {/* ── App Cards ────────────────────────────────────────────── */}
          <div
              className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-12 animate-fade-in"
              style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}
          >
            <AppCard
                title="Love Advisor"
                description="When relationships confuse you, I am willing to listen, understand, and accompany you. With professional psychological knowledge and warm conversation, I help you see your heart clearly."
                features={loveFeatures}
                to="/love"
                gradient="bg-gradient-to-br from-pink-500 via-pink-500 to-rose-500"
                icon={<Heart size={26} className="text-white" />}
                badge="Warm Company"
            />
            <AppCard
                title="AI Super Agent"
                description="A tool-calling agent that can search the web, scrape pages, and generate PDF reports — orchestrating multiple steps to complete research and content tasks end-to-end."
                features={manusFeatures}
                to="/manus"
                gradient="bg-gradient-to-br from-violet-600 via-violet-500 to-purple-600"
                icon={<Bot size={26} className="text-white" />}
                badge="Tool-Powered"
            />
          </div>

          {/* ── Features pills ───────────────────────────────────────── */}
          <div
              className="flex flex-wrap justify-center gap-3 animate-fade-in"
              style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}
          >
            {[
              { Icon: Star, iconColor: 'text-amber-500', label: 'Genuine', border: 'hover:border-amber-500/40' },
              { Icon: Zap, iconColor: 'text-violet-500', label: 'Streaming', border: 'hover:border-violet-500/40' },
              { Icon: Heart, iconColor: 'text-pink-500', label: 'Understanding', border: 'hover:border-pink-500/40' },
              { Icon: Bot, iconColor: 'text-violet-500', label: 'Tool Orchestration', border: 'hover:border-violet-500/40' },
            ].map(({ Icon, iconColor, label, border }) => (
              <div
                  key={label}
                  className={clsx(
                      'flex items-center gap-2 px-4 py-2 rounded-xl',
                      'bg-white/60 dark:bg-surface-900/70',
                      'backdrop-blur-sm',
                      'border border-surface-200 dark:border-surface-700/60',
                      'text-surface-500 dark:text-surface-400',
                      `hover:${border} dark:hover:${border}`,
                      'hover:text-surface-800 dark:hover:text-surface-200',
                      'transition-colors duration-200'
                  )}
              >
                <Icon size={16} className={iconColor} />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>

          <div
              className="mt-12 text-center animate-fade-in"
              style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}
          >
            <p className="text-sm text-surface-500 dark:text-surface-600 mb-2">
              Ready to start exploring?
            </p>
            <div className="flex items-center justify-center gap-2
                text-sm text-surface-400 dark:text-surface-500">
              <span>Choose one to begin</span>
              <ArrowRight size={14} className="animate-pulse" />
            </div>
          </div>
        </main>

        <footer className="relative text-center py-6 text-sm
            text-surface-400 dark:text-surface-700">
          JI AI Agent © {new Date().getFullYear()}
        </footer>
      </div>
  )
}

function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
