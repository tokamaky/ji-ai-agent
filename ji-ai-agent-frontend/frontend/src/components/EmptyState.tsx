import React from 'react'
import { Bot, Sparkles, Globe, FileSearch, FileText, Wrench, Heart, MessageCircleHeart, Flower2, Sparkle } from 'lucide-react'
import type { AppType } from '@/types'

interface EmptyStateProps {
    appType: AppType
    onStartChat: () => void
    title?: string
    subtitle?: string
}

const manusCapabilities = [
    { icon: <Globe size={16} />, label: 'Web Search', desc: 'Google real-time search' },
    { icon: <FileSearch size={16} />, label: 'Page Scraping', desc: 'Read & summarize any URL' },
    { icon: <FileText size={16} />, label: 'PDF Reports', desc: 'Generate PDFs with CJK fonts' },
    { icon: <Wrench size={16} />, label: 'Tool Orchestration', desc: 'Multi-step ReAct reasoning' },
]

function ManusEmptyState({ onStartChat }: { onStartChat: () => void }) {
    return (
        <div className="relative flex flex-col items-center justify-center h-full w-full overflow-hidden px-4 py-12">
            {/* ── Ambient background layer (both modes use absolute — no layout shift) ── */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Glow orbs — themed per mode */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full
                    bg-violet-200/40 dark:bg-violet-600/10
                    blur-3xl animate-pulse" />
                <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full
                    bg-purple-200/30 dark:bg-purple-600/10
                    blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />

                {/* Stars — only visible in dark mode (white on dark bg) */}
                <div className="absolute inset-0 dark:bg-gradient-to-b dark:from-violet-950/40 dark:via-surface-950 dark:to-surface-950" />
                {Array.from({ length: 40 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-white dark:block hidden"
                        style={{
                            width: `${Math.random() * 2 + 1}px`,
                            height: `${Math.random() * 2 + 1}px`,
                            top: `${Math.random() * 60}%`,
                            left: `${Math.random() * 100}%`,
                            opacity: Math.random() * 0.5 + 0.2,
                            animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 2}s`,
                        }}
                    />
                ))}
            </div>

            {/* ── Content ── */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-lg">

                {/* Avatar */}
                <div className="relative mb-8">
                    {/* Orbiting rings — border color adapts to background */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div
                            className="w-28 h-28 rounded-full
                                border border-violet-400/30 dark:border-violet-500/20
                                animate-spin"
                            style={{ animationDuration: '8s' }}
                        />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div
                            className="w-36 h-36 rounded-full
                                border border-purple-400/20 dark:border-purple-500/10
                                animate-spin"
                            style={{ animationDuration: '12s', animationDirection: 'reverse' }}
                        />
                    </div>

                    {/* Avatar circle */}
                    <div className="relative w-24 h-24 rounded-3xl
                        bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700
                        flex items-center justify-center
                        shadow-2xl shadow-violet-500/30 animate-float">
                        <Bot size={44} className="text-white" />
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-400/20 to-purple-400/20 animate-pulse" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full
                            bg-emerald-500
                            border-2 border-white dark:border-surface-950
                            flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div className="mb-2">
                    <h2 className="text-2xl font-bold
                        text-surface-900 dark:text-surface-100
                        mb-1 tracking-tight">
                        AI Super Agent
                    </h2>
                    <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">
                        Tool-Calling Agent · ReAct Pattern
                    </p>
                </div>

                {/* Description */}
                <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed mb-8 max-w-sm">
                    I can search the web, scrape pages, and generate PDF reports —
                    orchestrating multiple tools to complete your research tasks end-to-end.
                </p>

                {/* Capability cards */}
                <div className="grid grid-cols-2 gap-3 w-full mb-8">
                    {manusCapabilities.map((cap, i) => (
                        <div
                            key={i}
                            className="group flex items-start gap-3 p-3 rounded-2xl
                                bg-surface-100/80 dark:bg-white/5
                                border border-surface-200 dark:border-white/5
                                hover:bg-surface-200 dark:hover:bg-white/10
                                hover:border-violet-400/40 dark:hover:border-violet-500/30
                                transition-all duration-200"
                        >
                            <div className="flex-shrink-0 w-8 h-8 rounded-xl
                                bg-violet-100 dark:bg-violet-600/20
                                flex items-center justify-center
                                text-violet-600 dark:text-violet-400
                                group-hover:bg-violet-200 dark:group-hover:bg-violet-600/30
                                transition-colors">
                                {cap.icon}
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-semibold
                                    text-surface-800 dark:text-surface-200">
                                    {cap.label}
                                </p>
                                <p className="text-[11px] text-surface-500 mt-0.5">{cap.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <button
                    onClick={onStartChat}
                    className="group relative flex items-center gap-3 px-7 py-3.5 rounded-2xl
                        bg-gradient-to-r from-violet-600 to-purple-600
                        hover:from-violet-500 hover:to-purple-500
                        text-white text-sm font-semibold
                        shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40
                        transform hover:-translate-y-0.5 active:translate-y-0
                        transition-all duration-200"
                >
                    <Sparkles size={16} className="text-violet-200" />
                    <span>Start a Mission</span>
                    <Sparkles size={14} className="text-violet-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Hint */}
                <p className="mt-4 text-xs text-surface-500 dark:text-surface-600">
                    Try: "Research the latest Spring AI features and generate a PDF summary"
                </p>
            </div>
        </div>
    )
}

/* ── Love Advisor ── */
const loveTopics = [
    { icon: <Heart size={14} />, text: 'Dating & Relationships' },
    { icon: <MessageCircleHeart size={14} />, text: 'Communication Tips' },
    { icon: <Flower2 size={14} />, text: 'Emotional Well-being' },
    { icon: <Sparkle size={14} />, text: 'Self-Growth & Love' },
]

function LoveEmptyState({ onStartChat }: { onStartChat: () => void }) {
    return (
        <div className="relative flex flex-col items-center justify-center h-full w-full overflow-hidden px-4 py-12">
            {/* ── Ambient background layer (both modes use absolute — no layout shift) ── */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Glow orbs — themed per mode */}
                <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full
                    bg-pink-200/30 dark:bg-pink-600/10
                    blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full
                    bg-rose-200/20 dark:bg-rose-600/10
                    blur-3xl animate-pulse" style={{ animationDelay: '0.7s' }} />

                {/* Floating hearts — only visible in dark mode */}
                <div className="absolute inset-0 dark:bg-gradient-to-b dark:from-pink-950/30 dark:via-rose-950/20 dark:to-surface-950" />
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute text-pink-300 dark:text-pink-500/10 dark:block hidden animate-float"
                        style={{
                            top: `${15 + i * 10}%`,
                            left: `${5 + (i % 3) * 30}%`,
                            animationDuration: `${3 + i * 0.5}s`,
                            animationDelay: `${i * 0.3}s`,
                            fontSize: `${12 + (i % 3) * 8}px`,
                        }}
                    >
                        <Heart />
                    </div>
                ))}
            </div>

            <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
                <div className="relative mb-8">
                    {/* Dark mode orbiting ring */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div
                            className="w-28 h-28 rounded-full
                                border border-pink-400/30 dark:border-pink-500/20
                                animate-spin"
                            style={{ animationDuration: '10s' }}
                        />
                    </div>

                    <div className="relative w-24 h-24 rounded-3xl
                        bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600
                        flex items-center justify-center
                        shadow-2xl shadow-pink-500/30 animate-float">
                        <Heart size={44} className="text-white fill-white/30" />
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-400/20 to-rose-400/20 animate-pulse" />
                        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full
                            bg-amber-400 flex items-center justify-center shadow-lg">
                            <Sparkle size={14} className="text-amber-800" />
                        </div>
                    </div>
                </div>

                <div className="mb-2">
                    <h2 className="text-2xl font-bold
                        text-surface-900 dark:text-surface-100
                        mb-1 tracking-tight">
                        AI Love Advisor
                    </h2>
                    <p className="text-sm text-pink-600 dark:text-pink-400 font-medium">
                        Warm guidance for your heart
                    </p>
                </div>

                <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed mb-6 max-w-sm">
                    Whether it's dating questions, relationship confusion, or emotional challenges —
                    I'm here to listen, understand, and help you find clarity.
                </p>

                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {loveTopics.map((topic, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                                bg-pink-100 dark:bg-pink-500/10
                                border border-pink-200 dark:border-pink-500/20
                                text-pink-700 dark:text-pink-400
                                text-xs font-medium"
                        >
                            <span className="text-pink-500 dark:text-pink-300">{topic.icon}</span>
                            <span>{topic.text}</span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={onStartChat}
                    className="group relative flex items-center gap-3 px-7 py-3.5 rounded-2xl
                        bg-gradient-to-r from-pink-500 to-rose-500
                        hover:from-pink-400 hover:to-rose-400
                        text-white text-sm font-semibold
                        shadow-xl shadow-pink-500/25 hover:shadow-pink-500/40
                        transform hover:-translate-y-0.5 active:translate-y-0
                        transition-all duration-200"
                >
                    <Heart size={16} className="text-pink-200 fill-pink-200" />
                    <span>Begin Your Journey</span>
                    <Heart size={14} className="text-pink-200 fill-pink-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <p className="mt-4 text-xs text-surface-500 dark:text-surface-600">
                    Try: "I'm confused about my relationship..."
                </p>
            </div>
        </div>
    )
}

export const EmptyState = React.memo(function EmptyState({ appType, onStartChat, title: _title, subtitle: _subtitle }: EmptyStateProps) {
    if (appType === 'love_app') {
        return <LoveEmptyState onStartChat={onStartChat} />
    }
    return <ManusEmptyState onStartChat={onStartChat} />
})
