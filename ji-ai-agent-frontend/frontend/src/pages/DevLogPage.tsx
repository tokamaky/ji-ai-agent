import React, { useState, useMemo } from 'react'
import { clsx } from 'clsx'
import {
  CalendarDays,
  Code2,
  Lightbulb,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Hash,
  Layers,
  GitBranch,
  ArrowRight,
  Sparkles,
  RefreshCcw,
  BrainCircuit,
  Zap,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DevLogEntry {
  id: string
  date: string          // YYYY/MM/DD
  title: string
  category: 'feature' | 'refactor' | 'learning' | 'architecture' | 'deployment'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  summary: string       // Short teaser (1 line)
  technicalDetail: string  // Full technical explanation (markdown-like)
  learningInsight: string  // What I learned, why it matters
  codeSnippet?: string     // Optional code reference
  architectureDiagram?: string // Optional mermaid or ASCII art
  relatedConcepts: string[]  // For cross-referencing
  interviewValue: string   // Why this matters in interviews
  status: 'completed' | 'in-progress' | 'planned'
  effortHours?: number
}

// ── Palette ────────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<DevLogEntry['category'], { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  feature:      { label: 'Feature',       bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-300 dark:border-violet-700', icon: <Sparkles size={13} /> },
  refactor:     { label: 'Refactor',      bg: 'bg-amber-100 dark:bg-amber-900/40',  text: 'text-amber-700 dark:text-amber-300',  border: 'border-amber-300 dark:border-amber-700',  icon: <RefreshCcw size={13} /> },
  learning:     { label: 'Learning',       bg: 'bg-sky-100 dark:bg-sky-900/40',    text: 'text-sky-700 dark:text-sky-300',    border: 'border-sky-300 dark:border-sky-700',    icon: <BrainCircuit size={13} /> },
  architecture: { label: 'Architecture',   bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700', icon: <Layers size={13} /> },
  deployment:   { label: 'Deployment',     bg: 'bg-rose-100 dark:bg-rose-900/40',   text: 'text-rose-700 dark:text-rose-300',   border: 'border-rose-300 dark:border-rose-700',   icon: <Zap size={13} /> },
}

const DIFFICULTY_META: Record<DevLogEntry['difficulty'], { label: string; dot: string }> = {
  beginner:     { label: 'Beginner',     dot: 'bg-emerald-400' },
  intermediate: { label: 'Intermediate', dot: 'bg-amber-400' },
  advanced:     { label: 'Advanced',     dot: 'bg-rose-400' },
}

const STATUS_META: Record<DevLogEntry['status'], { label: string; badge: string }> = {
  completed:   { label: 'Completed',   badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-700' },
  'in-progress': { label: 'In Progress', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-700' },
  planned:     { label: 'Planned',     badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 ring-1 ring-slate-300 dark:ring-slate-700' },
}

// ── Single Entry Card ─────────────────────────────────────────────────────────

interface DevLogCardProps {
  entry: DevLogEntry
  isFirst?: boolean
  isLast?: boolean
}

function DevLogCard({ entry, isFirst, isLast }: DevLogCardProps) {
  const [expanded, setExpanded] = useState(false)
  const cat = CATEGORY_META[entry.category]
  const diff = DIFFICULTY_META[entry.difficulty]
  const stat = STATUS_META[entry.status]

  return (
    <div className="relative flex gap-5 group">
      {/* ── Timeline spine ── */}
      <div className="flex flex-col items-center flex-shrink-0 w-10">
        {/* Top connector */}
        <div className={clsx('w-px flex-1', !isFirst ? 'bg-gradient-to-b from-surface-200 to-transparent dark:from-surface-700' : 'bg-transparent')} />
        {/* Dot */}
        <div className={clsx(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10',
          'ring-4 ring-surface-50 dark:ring-surface-950',
          'bg-white dark:bg-surface-900',
          'shadow-md',
          cat.bg, cat.text,
        )}>
          {cat.icon}
        </div>
        {/* Bottom connector */}
        <div className={clsx('w-px flex-1', !isLast ? 'bg-gradient-to-b from-transparent to-surface-200 dark:from-transparent dark:to-surface-700' : 'bg-transparent')} />
      </div>

      {/* ── Card body ── */}
      <div className="flex-1 pb-8">
        <div
          className={clsx(
            'relative rounded-2xl border transition-all duration-200',
            'bg-white/90 dark:bg-surface-900/80 backdrop-blur-sm',
            'hover:shadow-elevated hover:-translate-y-0.5',
            cat.border,
          )}
        >
          {/* Accent bar */}
          <div className={clsx('absolute top-0 left-5 right-5 h-0.5 rounded-b-full opacity-60', cat.bg.replace('bg-', 'bg-').replace('/40', '/60').replace('/100', '/60'))} />

          <div className="p-6">
            {/* ── Header row ── */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Date badge */}
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-surface-500 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-lg ring-1 ring-surface-200 dark:ring-surface-700">
                  <CalendarDays size={11} />
                  {entry.date}
                </div>
                {/* Category badge */}
                <div className={clsx('flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg', cat.bg, cat.text, 'ring-1', cat.border)}>
                  {cat.icon}
                  {cat.label}
                </div>
                {/* Difficulty */}
                <div className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400">
                  <div className={clsx('w-1.5 h-1.5 rounded-full', diff.dot)} />
                  {diff.label}
                </div>
              </div>
              {/* Status */}
              <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-lg', stat.badge)}>
                {stat.label}
              </span>
            </div>

            {/* ── Title ── */}
            <h2 className="mt-4 text-xl font-bold text-surface-900 dark:text-surface-100 leading-snug">
              {entry.title}
            </h2>

            {/* ── Summary ── */}
            <p className="mt-2 text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
              {entry.summary}
            </p>

            {/* ── Tags ── */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {entry.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 ring-1 ring-surface-200 dark:ring-surface-700">
                  <Hash size={9} />
                  {tag}
                </span>
              ))}
            </div>

            {/* ── Expand / Collapse ── */}
            <button
              onClick={() => setExpanded(x => !x)}
              className={clsx(
                'mt-4 flex items-center gap-1.5 text-sm font-medium transition-colors duration-150',
                'text-primary hover:text-primary-600 dark:text-primary-400',
              )}
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              {expanded ? 'Show less' : 'Read full entry'}
            </button>

            {/* ── Expanded sections ── */}
            <div className={clsx('overflow-hidden transition-all duration-300', expanded ? 'max-h-[9999px] mt-5' : 'max-h-0')}>
              <div className="pt-5 border-t border-surface-200 dark:border-surface-700 space-y-6">

                {/* Technical Detail */}
                <section>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                      <Code2 size={13} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <h3 className="text-sm font-bold text-surface-800 dark:text-surface-200">Technical Deep Dive</h3>
                  </div>
                  <div className="ml-8 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 text-sm text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-line">
                    {entry.technicalDetail}
                  </div>
                </section>

                {/* Code Snippet */}
                {entry.codeSnippet && (
                  <section>
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
                        <BookOpen size={13} className="text-sky-600 dark:text-sky-400" />
                      </div>
                      <h3 className="text-sm font-bold text-surface-800 dark:text-surface-200">Code Reference</h3>
                    </div>
                    <pre className="ml-8 p-4 rounded-xl bg-surface-900 dark:bg-black border border-surface-700 text-xs text-emerald-300 font-mono overflow-x-auto leading-relaxed">
                      <code>{entry.codeSnippet}</code>
                    </pre>
                  </section>
                )}

                {/* Architecture Diagram */}
                {entry.architectureDiagram && (
                  <section>
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                        <Layers size={13} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-sm font-bold text-surface-800 dark:text-surface-200">Architecture</h3>
                    </div>
                    <pre className="ml-8 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 text-xs text-surface-600 dark:text-surface-400 font-mono overflow-x-auto leading-relaxed">
                      <code>{entry.architectureDiagram}</code>
                    </pre>
                  </section>
                )}

                {/* Learning Insight */}
                <section>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                      <Lightbulb size={13} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-sm font-bold text-surface-800 dark:text-surface-200">Learning Insight</h3>
                  </div>
                  <div className="ml-8 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
                    {entry.learningInsight}
                  </div>
                </section>

                {/* Related Concepts */}
                <section>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
                      <GitBranch size={13} className="text-rose-600 dark:text-rose-400" />
                    </div>
                    <h3 className="text-sm font-bold text-surface-800 dark:text-surface-200">Related Concepts</h3>
                  </div>
                  <div className="ml-8 flex flex-wrap gap-2">
                    {entry.relatedConcepts.map(concept => (
                      <span key={concept} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 ring-1 ring-surface-200 dark:ring-surface-700 hover:ring-primary/30 transition-colors">
                        <ArrowRight size={10} />
                        {concept}
                      </span>
                    ))}
                  </div>
                </section>

                {/* Interview Value */}
                <section>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                      <BrainCircuit size={13} className="text-primary" />
                    </div>
                    <h3 className="text-sm font-bold text-surface-800 dark:text-surface-200">Interview Value</h3>
                  </div>
                  <div className="ml-8 p-4 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
                    {entry.interviewValue}
                  </div>
                </section>

                {/* Effort */}
                {entry.effortHours && (
                  <div className="flex items-center gap-2 text-xs text-surface-400 dark:text-surface-500 font-mono ml-8">
                    Estimated effort: {entry.effortHours}h
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── DevLog data ────────────────────────────────────────────────────────────────

const DEV_LOG_ENTRIES: DevLogEntry[] = [
  {
    id: 'planner-agent-20260427',
    date: '2026/04/27',
    title: 'PlannerAgent: Separating Task Decomposition from Execution',
    category: 'architecture',
    difficulty: 'advanced',
    tags: ['agent', 'planner', 'react', 'llm', 'spring-ai', 'task-decomposition'],
    summary: 'Designed and implemented a standalone PlannerAgent that separates the "planning" phase from the "execution" phase in the existing ReAct agent loop — a fundamental architectural improvement for job interviews.',
    technicalDetail: `## Background: Why Separate Planning from Execution?

The existing JiManus agent follows the classic ReAct (Reasoning + Acting) pattern: on every step, the same LLM instance both decides what to do and does it. This creates two problems:

1. **Context pollution**: Planning reasoning (e.g., "I should search first, then scrape") mixes with execution context, consuming valuable context window and confusing the model.
2. **No reviewability**: Once a task starts, you cannot review or modify the plan mid-flight.

## Solution: The PlannerAgent Pattern

I introduced a dedicated PlannerAgent with a single responsibility: decompose complex user requests into structured execution plans.

### Architecture

The PlannerAgent operates as a stateless component (Spring @Component) that receives a user task and returns an ExecutionPlan containing ordered PlanStep objects. Each step carries:
- Unique ID and order number
- Human-readable description
- Tool name to invoke
- Arguments as key-value pairs
- Dependency list (which other steps must complete first)
- Parallelizability flag

### Dependency Analysis

The key insight: not all steps must run sequentially. If Step A and Step B both depend only on Step 0 (and not on each other), they can run in parallel. The PlannerAgent's dependency tracking enables future parallel execution via CompletableFuture.

Example: "帮我规划北京3日游"
1. step_1: Search Beijing weather → dependsOn: []
2. step_2: Search Beijing attractions → dependsOn: [step_1]
3. step_3: Generate itinerary PDF → dependsOn: [step_2]
4. step_4: Search attraction images (MCP) → dependsOn: [step_2], parallelizable: true

Note: step_3 and step_4 both run after step_2 but have no dependency on each other — they can be parallelized.

### JSON Parsing Robustness

The LLM returns structured JSON. I implemented robust extraction handling:
- Markdown code fences (\`\`\`json ... \`\`\`)
- Trailing commas (invalid JSON)
- Text before/after the JSON array
- Full fallback to single-step plan if parsing fails

### Integration with Existing Codebase

The PlannerAgent follows the exact same dependency injection pattern as JiManus:
- Constructor injection of ChatModel
- Spring-managed @Component lifecycle
- Uses the same Gemini model (no additional API cost)
- No changes needed to existing tool registration or SSE infrastructure

### Plan Lifecycle

Created → Approved → Executing → Completed/Failed/RePlanned

If a step fails, the PlannerAgent can replan remaining steps using the partial results, demonstrating error recovery — a key interview topic.`,
    learningInsight: `## What I Learned

**1. Plan-Execute Separation is a recognized pattern in production AI systems**

Researching this feature, I discovered that AutoGPT, LangChain's PlanAndExecute agent, and OpenAI's Mermaid all use this separation. It's not just a theoretical idea — it's the de-facto standard for reliable autonomous agents.

**2. Structured JSON output from LLMs is harder than it looks**

Even with explicit instructions, LLMs often wrap JSON in markdown fences, add explanations, or include trailing commas. Robust parsing with fallbacks is essential. This mirrors real-world LLM integration challenges.

**3. Dependency tracking enables parallelization — but adds complexity**

Identifying parallelizable steps requires analyzing the dependency graph. In a simple sequential plan it's overkill, but for complex tasks with independent sub-tasks (e.g., "search 5 products simultaneously"), it becomes a real performance win.

**4. The replan() method is the most valuable "interview feature"**

Error recovery is what separates toy agents from production systems. Being able to say "when a tool fails, the Planner regenerates a new plan using the partial results" demonstrates architectural maturity that interviewers specifically look for.`,
    codeSnippet: `// PlanStep model — the atomic unit of execution
@Data @Builder
public class PlanStep {
    private String id;           // "step_1"
    private int order;          // 1-based
    private String description;  // "Search Beijing weather"
    private String toolName;    // "searchWeb"
    private Object arguments;   // {"query": "Beijing weather today"}
    private List<String> dependsOn;     // ["step_0"]
    private boolean parallelizable;     // true/false
    private StepStatus status;          // PENDING/RUNNING/COMPLETED/FAILED
    private String executionResult;      // Populated after execution
}

// ExecutionPlan — the complete task blueprint
@Data @Builder
public class ExecutionPlan {
    private String planId;           // UUID
    private String originalTask;     // "帮我规划北京3日游"
    private String summary;          // Human-readable plan summary
    private List<PlanStep> steps;    // Ordered step list
    private PlanStatus status;       // CREATED/EXECUTING/COMPLETED/FAILED
    private List<String> tags;       // ["research", "travel"]
}`,
    architectureDiagram: `┌──────────────────────────────────────────────────────┐
│                    User Request                          │
│          "帮我规划北京3日游"                             │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│               PlannerAgent (@Component)                │
│  ┌────────────────────────────────────────────────┐  │
│  │  System Prompt: Task Decomposition Specialist  │  │
│  │  User Template: JSON output instructions       │  │
│  │  LLM: gemini-2.5-flash-lite                   │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────┘
                       │  ExecutionPlan
          ┌────────────┼────────────┐
          ▼            ▼            ▼
     ┌─────────┐  ┌─────────┐  ┌─────────┐
     │ step_1  │  │ step_2  │  │ step_3  │
     │ search  │  │ scrape  │  │ generate│
     │ weather │─▶│attractions│─▶│  PDF   │
     └─────────┘  └────┬────┘  └─────────┘
                       │
                       ▼ parallel (step_2, step_4 both ready)
                  ┌─────────┐
                  │ step_4  │
                  │  image  │
                  │ search  │
                  └─────────┘`,
    relatedConcepts: [
      'ReAct Pattern',
      'Plan-Execute Separation',
      'Dependency Graph',
      'JSON Structured Output',
      'Error Recovery',
      'Spring AI ToolCalling',
      'CompletableFuture',
    ],
    interviewValue: `**Why this matters in interviews:**

This feature demonstrates understanding of a production AI system architecture that goes beyond the typical "I built a chatbot" project:

- **Architectural decision**: Explaining WHY separating planning from execution solves real problems (context pollution, no reviewability) shows senior-level thinking.
- **Design patterns**: The PlannerAgent uses the Strategy pattern (pluggable planning logic) and Template Method (plan lifecycle).
- **Error handling**: The robust JSON parsing with fallback and the replan() method demonstrate defensive programming.
- **System thinking**: The dependency tracking enabling parallel execution shows awareness of performance optimization.
- **Spring Boot mastery**: Constructor injection, @Component lifecycle, configuration via @Value — all demonstrate production-grade Spring knowledge.

When interviewers ask "tell me about a challenging technical problem you solved", this feature provides a concrete, deep answer with real code to back it up.`,
    status: 'completed',
    effortHours: 6,
  },
]

// ── DevLog Store ───────────────────────────────────────────────────────────────

function useDevLogStore() {
  // In a full implementation this would use zustand with localStorage persistence.
  // For now we use the static entries above and allow filtering.
  const [entries] = useState<DevLogEntry[]>(DEV_LOG_ENTRIES)
  const [filter, setFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<DevLogEntry['category'] | 'all'>('all')

  const filtered = useMemo(() => {
    let result = entries
    if (categoryFilter !== 'all') {
      result = result.filter(e => e.category === categoryFilter)
    }
    if (filter !== 'all') {
      if (filter === 'completed') result = result.filter(e => e.status === 'completed')
      if (filter === 'in-progress') result = result.filter(e => e.status === 'in-progress')
      if (filter === 'planned') result = result.filter(e => e.status === 'planned')
    }
    return result
  }, [entries, filter, categoryFilter])

  return { entries: filtered, allEntries: entries, filter, setFilter, categoryFilter, setCategoryFilter }
}

// ── Main DevLog Page ───────────────────────────────────────────────────────────

export default function DevLogPage() {
  const { entries, allEntries, filter, setFilter, categoryFilter, setCategoryFilter } = useDevLogStore()

  const categories: Array<{ value: DevLogEntry['category'] | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'architecture', label: 'Architecture' },
    { value: 'feature', label: 'Feature' },
    { value: 'learning', label: 'Learning' },
    { value: 'refactor', label: 'Refactor' },
    { value: 'deployment', label: 'Deployment' },
  ]

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'planned', label: 'Planned' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-surface-50 dark:bg-surface-950 overflow-hidden">

      {/* ── Ambient bg ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[70rem] h-[40rem] opacity-30 dark:opacity-20"
          style={{
            background: 'radial-gradient(ellipse at center top, rgba(99,102,241,0.2) 0%, rgba(236,72,153,0.08) 40%, transparent 70%)',
          }}
        />
      </div>

      {/* ── Header ── */}
      <header className="relative z-10 px-6 py-8 border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <BookOpen size={18} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              Dev Log
            </h1>
          </div>
          <p className="ml-12 text-sm text-surface-500 dark:text-surface-400">
            Tracking feature development, architecture decisions, and learnings
          </p>
        </div>
      </header>

      {/* ── Filters ── */}
      <div className="relative z-10 px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50/80 dark:bg-surface-950/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-3">
          {/* Category filter */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-surface-500 dark:text-surface-400 mr-1">
            Category
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value as DevLogEntry['category'] | 'all')}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                  categoryFilter === cat.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-400 ring-1 ring-surface-200 dark:ring-surface-700 hover:ring-primary/40',
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />

          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-surface-500 dark:text-surface-400 mr-1">
            Status
          </div>
          <div className="flex flex-wrap gap-1.5">
            {statusOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                  filter === opt.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-400 ring-1 ring-surface-200 dark:ring-surface-700 hover:ring-primary/40',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Count */}
          <div className="ml-auto text-xs text-surface-400 dark:text-surface-500 font-mono">
            {entries.length} / {allEntries.length} entries
          </div>
        </div>
      </div>

      {/* ── Timeline entries ── */}
      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
                <BookOpen size={28} className="text-surface-300 dark:text-surface-600" />
              </div>
              <p className="text-surface-500 dark:text-surface-400 text-sm">No entries match your filters</p>
            </div>
          ) : (
            <div className="space-y-0">
              {entries.map((entry, idx) => (
                <DevLogCard
                  key={entry.id}
                  entry={entry}
                  isFirst={idx === 0}
                  isLast={idx === entries.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 text-center py-6 text-xs text-surface-400 dark:text-surface-600 border-t border-surface-200 dark:border-surface-800">
        Built with care — JI AI Agent
      </footer>
    </div>
  )
}
