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
                {/* Date badge (completed entries only) */}
                {entry.status === 'completed' && (
                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-surface-500 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-lg ring-1 ring-surface-200 dark:ring-surface-700">
                    <CalendarDays size={11} />
                    {entry.date}
                  </div>
                )}
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

            {/* ── Expand / Collapse (completed entries only) ── */}
            {entry.status === 'completed' && (
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
            )}

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
  // ─── Phase 2: Self-Reflection Mechanism ────────────────────────────────────
  {
    id: 'self-reflection-20260429',
    date: '2026/05/06',
    title: 'Self-Reflection: Closing the ReAct Loop with a Reflection Step',
    category: 'architecture',
    difficulty: 'advanced',
    tags: ['reflection', 'react', 'self-critique', 'error-recovery', 'llm', 'retry'],
    summary: 'Extending the ReAct agent loop from a 2-phase Think→Act cycle to a 3-phase ReAct loop by inserting a Reflection step after every tool execution — enabling automatic error detection and retry.',
    technicalDetail: `## Background: The Missing Piece in ReAct

The classic ReAct (Reasoning + Acting) pattern has a gap: it never questions whether the action it just took was correct. If a tool returns an unexpected result or fails silently, the agent blindly proceeds.

## Solution: Reflect After Every Act

By inserting a dedicated Reflection step between tool execution and the next reasoning cycle, the agent can:
1. Evaluate whether the tool result makes sense in context
2. Detect error conditions (empty results, API errors, malformed data)
3. Decide whether to retry, replan, or continue

### Architecture

\`ReflectionAdvisor\` evaluates tool outputs using a structured critique prompt:
- Was the tool call appropriate for the task?
- Did the result solve or advance the sub-goal?
- Should we retry with different arguments, or pivot?

\`SelfCritic\` is a lightweight LLM call (using a smaller/faster model) that provides a confidence score and optional correction. This keeps the reflection step cheap — not every step triggers a full LLM retry.

### Retry Strategy

Reflection can trigger three outcomes:
- **PROCEED**: Tool result is satisfactory, continue to next step
- **RETRY**: Tool result is bad, re-invoke with corrected arguments
- **REPLAN**: Tool choice was wrong entirely, invoke PlannerAgent for remaining steps

### Integration Points

The reflection hook lives inside the ToolCallAgent step loop:
\`\`\`
while (step < MAX_STEPS) {
    String thought = think(messageList);        // Reason
    Optional<ToolCall> toolCall = parseTools(thought);
    if (toolCall.isPresent()) {
        ToolResponse result = act(toolCall.get());  // Act
        String reflection = reflect(thought, toolCall.get(), result); // Reflect
        if (reflection.retry()) {
            result = act(toolCall.get().withCorrectedArgs(reflection.corrections()));
        }
    }
    messageList.add(new UserMessage(result.toString()));
}
\`\`\`

### File Plan

- \`agent/ReflectionAdvisor.java\` — evaluates tool results, returns ReflectionResult (proceed/retry/replan)
- \`agent/SelfCritic.java\` — lightweight LLM critic for generating corrections`,
    learningInsight: `## What This Enables

**1. The ReAct becomes a true feedback loop**

Traditional ReAct is open-loop — once you act, you commit. Adding reflection closes the loop with self-monitoring, which is how humans actually solve complex problems.

**2. Retry budgets prevent infinite loops**

With a configurable retry count (e.g., max 2 retries per step), the agent won't spiral into retry storms. This is a practical safety mechanism.

**3. Reflection is a major interview differentiator**

Most candidates know "ReAct = Reason + Act." Adding a Reflect phase demonstrates deep understanding of how production agents actually handle failure — exactly what senior engineers and researchers want to hear.

**4. SelfCritic can use a cheaper model**

Using gemini-2.5-flash-lite for the reflection step (vs. the main agent model) keeps costs low. This is a real production optimization.`,
    codeSnippet: `// ReflectionResult — outcome of the reflection step
@Data @Builder
public class ReflectionResult {
    private ReflectionAction action; // PROCEED, RETRY, REPLAN
    private int confidence;          // 0–100 score
    private String reasoning;        // Why this decision was made
    private Map<String, Object> corrections; // For RETRY: corrected tool args
    private String replanReason;     // For REPLAN: why we gave up
}

public enum ReflectionAction { PROCEED, RETRY, REPLAN }

// SelfCritic — lightweight critique using fast model
@Component
public class SelfCritic {
    private final ChatModel critiqueModel; // gemini-2.5-flash-lite

    public ReflectionResult critique(String thought, ToolCall call, ToolResponse result) {
        String prompt = """
            Task: %s
            Tool called: %s
            Tool result: %s
            Should we continue, retry, or replan?
            """.formatted(thought, call.name(), result.message());

        // Use fast/cheap model for critique
        String critique = critiqueModel.call(prompt);
        return parseCritique(critique);
    }
}`,
    architectureDiagram: `┌────────────────────────────────────────────────────────────┐
│                  ReAct + Reflect Loop                      │
│                                                        │
│  ┌─────────┐    ┌─────────┐    ┌─────────────┐         │
│  │ Reason  │───▶│   Act   │───▶│   Reflect   │         │
│  │ (think) │    │  (act)  │    │ (SelfCritic)│         │
│  └─────────┘    └─────────┘    └──────┬──────┘         │
│       ▲         ┌─────────┐            │                 │
│       │         ▼         ▼            ▼                 │
│       │    ┌─────────┐ ┌─────────────────┐               │
│       │    │ PROCEED │ │      RETRY      │               │
│       │    │  ✅ go  │ │  🔄 re-act with │               │
│       │    │  next   │ │  corrections    │               │
│       │    └─────────┘ └─────────────────┘               │
│       │              │                                   │
│       └──────────────┘  (loop back)                     │
│                                                        │
│       ┌─────────────────────────────────────────────┐   │
│       │                 REPLAN                      │   │
│       │  🔄 Invoke PlannerAgent with partial results │   │
│       └─────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘`,
    relatedConcepts: [
      'ReAct Pattern',
      'Self-Reflection',
      'Error Recovery',
      'Retry Strategy',
      'LLM as Judge',
      'Feedback Loop',
      'Prompt Engineering',
      'Cost Optimization',
    ],
    interviewValue: `**Why this matters in interviews:**

This extends the classic ReAct pattern to its logical completion. Every senior ML/AI engineer knows Think→Act, but the Reflect phase is what separates production agents from toy demos:

- **Debugging skill**: Explaining how reflection catches tool failures early prevents cascading errors down the execution pipeline.
- **Resilience design**: A system that self-corrects is more robust than one that blindly follows a plan.
- **Cost awareness**: Using a cheaper model for SelfCritic shows production mindset — not every LLM call needs to use the flagship model.
- **Systematic thinking**: The three-outcome model (proceed/retry/replan) is clean and extensible — interviewers appreciate well-designed state machines.
- **Comparable to real systems**: This mirrors how AutoGPT, Reflexion, and Self-Refine papers handle error recovery.`,
    status: 'completed',
    effortHours: 8,
  },
  // ─── Phase 2: Three-Tier Memory System ────────────────────────────────────
  {
    id: 'three-tier-memory-20260429',
    date: '2026/04/29',
    title: 'Three-Tier Memory: Working → Episodic → Semantic Persistence',
    category: 'architecture',
    difficulty: 'advanced',
    tags: ['memory', 'vector-store', 'pgvector', 'postgresql', 'context-window', 'rag', 'working-memory', 'episodic', 'semantic'],
    summary: 'Building a three-tier memory hierarchy that mirrors human cognition: Working Memory (sliding window) for in-session context, Episodic Memory (PostgreSQL) for session history, and Semantic Memory (pgvector) for long-term knowledge.',
    technicalDetail: `## Motivation: Context Windows Are Finite

JiManus currently uses a fixed sliding window of ~20 messages. This works for short conversations but fails for:
- Long-running multi-session tasks
- Tasks that reference past sessions
- Building a persistent "knowledge base" of agent experiences

## Three-Tier Memory Architecture

### Tier 1: Working Memory (Sliding Window)

The existing \`MessageWindowChatMemory\` from Spring AI serves as Working Memory:
- Fixed-size sliding window (configurable, default 20 messages)
- Resides in JVM heap — fastest access, zero persistence
- Used for immediate context during a single session
- Eviction: oldest messages dropped when window is full

### Tier 2: Episodic Memory (PostgreSQL Session History)

Session-level memory stored in PostgreSQL:
- Each conversation session is an "episode" with a session ID
- All messages (user + assistant) stored with timestamps
- Searchable by session ID, date range, or keyword
- Used for: "What did we do in the previous session about X?"

\`EpisodicMemoryRepository\` provides CRUD + search:
\`\`\`sql
CREATE TABLE episodic_memory (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL,  -- 'user' or 'assistant'
    content TEXT NOT NULL,
    message_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_episodic_session ON episodic_memory(session_id);
CREATE INDEX idx_episodic_created ON episodic_memory(created_at);
\`\`\`

### Tier 3: Semantic Memory (pgvector Long-Term Knowledge)

Long-term knowledge stored as vector embeddings:
- Summaries of completed sessions embedded and stored in pgvector
- Queries use cosine similarity to retrieve relevant past episodes
- Enables cross-session context inheritance
- Used for: "Find all past sessions related to travel planning"

\`SemanticMemoryService\` handles embedding + retrieval:
\`\`\`sql
CREATE TABLE semantic_memory (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    summary TEXT NOT NULL,        -- Human-readable summary
    embedding vector(768) NOT NULL,
    tags TEXT[],                   -- ['travel', 'planning']
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX ON semantic_memory USING hnsw (embedding vector_cosine_ops);
\`\`\`

### Memory Inheritance Flow

When a new session starts:
1. Query Semantic Memory for relevant past sessions (vector similarity)
2. Retrieve top-K relevant episodic summaries
3. Load the full episodic messages from those sessions
4. Prepend relevant context to Working Memory (with a token budget)

### File Plan

- \`chatmemory/ThreeTierMemory.java\` — facade coordinating all three tiers
- \`chatmemory/EpisodicMemoryRepository.java\` — JPA repository for session history
- \`chatmemory/SemanticMemoryService.java\` — pgvector embedding + retrieval`,
    learningInsight: `## What This Teaches

**1. Memory hierarchy is a fundamental CS concept applied to AI**

Just like CPU cache → RAM → SSD → HDD, AI agents benefit from a similar gradient: fast/expensive/volatile → slow/cheap/durable. This parallel makes the design intuitive for interviewers.

**2. pgvector integration实战 (hands-on experience)**

This requires understanding:
- HNSW vs IVFFlat indexing trade-offs
- COSINE vs L2 vs DOT_PRODUCT distance metrics
- Embedding dimension alignment (768-dim Gemini embeddings)
- Batch upsert strategies for performance

**3. Context inheritance is non-trivial**

Simply prepending old messages to the prompt causes confusion. The system needs to:
- Summarize old sessions (not raw transcript)
- Respect token budgets
- Clearly mark borrowed context vs. current session

**4. Interview gold: "How do you handle long conversations?"**

This question comes up constantly. A three-tier memory system is a sophisticated, production-grade answer that goes far beyond "I use a sliding window."`,
    codeSnippet: `// ThreeTierMemory — unified memory facade
@Component
public class ThreeTierMemory {
    private final WorkingMemory workingMemory;    // Spring AI MessageWindowChatMemory
    private final EpisodicMemoryRepository episodic; // JPA repository
    private final SemanticMemoryService semantic;   // pgvector service

    // Called when a new session starts
    public ChatMemory loadContextForSession(UUID sessionId, String query) {
        // 1. Query semantic memory for relevant past sessions
        List<SemanticMemory> relevant = semantic.search(query, topK: 3);

        // 2. Load episodic details for those sessions
        List<EpisodicEpisode> episodes = relevant.stream()
            .map(s -> episodic.findBySessionId(s.getSessionId()))
            .toList();

        // 3. Build context summary
        String inheritedContext = episodes.stream()
            .map(e -> "[Past session: " + e.getSummary() + "]")
            .collect(Collectors.joining("\\n"));

        // 4. Prepend to working memory
        workingMemory.add(new UserMessage(inheritedContext));
        return workingMemory;
    }

    // Called when a session ends
    public void archiveSession(UUID sessionId, List<Message> messages) {
        // 1. Persist all messages to episodic memory
        episodic.saveAll(sessionId, messages);

        // 2. Generate and embed a summary for semantic memory
        String summary = summarize(messages);
        semantic.embedAndStore(sessionId, summary, extractTags(messages));
    }
}`,
    architectureDiagram: `┌──────────────────────────────────────────────────────────┐
│               Three-Tier Memory Architecture              │
│                                                          │
│  ┌──────────────┐   SPEED ▲   DURABILITY ▼              │
│  │  Working     │  Sliding window (20 msgs)             │
│  │  Memory      │  JVM heap · Zero persistence            │
│  │  (Tier 1)    │  Active session context                 │
│  └──────┬───────┘                                        │
│         │ context inheritance on session start            │
│         ▼                                                │
│  ┌──────────────┐  PostgreSQL · Full session history     │
│  │  Episodic    │  Searchable by session/date/keyword     │
│  │  Memory      │  All messages persisted                 │
│  │  (Tier 2)    │                                        │
│  └──────┬───────┘                                        │
│         │ summarize + embed on session end                │
│         ▼                                                │
│  ┌──────────────┐  pgvector (HNSW) · 768-dim embeddings │
│  │  Semantic    │  Cosine similarity search              │
│  │  Memory      │  Cross-session knowledge               │
│  │  (Tier 3)    │  Long-term agent experience            │
│  └──────────────┘                                        │
└──────────────────────────────────────────────────────────┘`,
    relatedConcepts: [
      'Memory Hierarchy',
      'Vector Store',
      'pgvector',
      'HNSW Index',
      'Embedding Models',
      'Cosine Similarity',
      'Context Window Management',
      'Session Management',
      'RAG (Retrieval-Augmented Generation)',
    ],
    interviewValue: `**Why this matters in interviews:**

Memory systems are a hot topic in AI engineering interviews. This demonstrates:

- **Systems design**: The three-tier architecture mirrors human cognition and classic CS memory hierarchies — a pattern interviewers love.
- **Database mastery**: Writing raw SQL for pgvector, tuning HNSW parameters, understanding index trade-offs — all show deep PostgreSQL knowledge.
- **Embedding pipeline**: Explaining how sessions get summarized, embedded, and retrieved proves end-to-end RAG understanding.
- **Scalability thinking**: Each tier has different performance characteristics. Knowing when to hit semantic vs. episodic vs. working memory shows cost/benefit analysis.
- **Real production challenge**: "How do you handle long conversations?" is a common interview question. This is a production-grade answer, not a textbook one.`,
    status: 'planned',
    effortHours: 12,
  },
  // ─── Phase 2: Agent Communication Protocol ─────────────────────────────────
  {
    id: 'agent-comm-protocol-20260429',
    date: '2026/04/29',
    title: 'Inter-Agent Communication Protocol: JSON Messages over Async Message Queues',
    category: 'architecture',
    difficulty: 'advanced',
    tags: ['multi-agent', 'async', 'message-queue', 'linkedblockingqueue', 'agent-protocol', 'json', 'inter-process-communication'],
    summary: 'Defining a typed JSON message protocol (REQUEST/RESPONSE/NOTIFICATION/BROADCAST) for agent-to-agent communication, backed by LinkedBlockingQueue for thread-safe async delivery.',
    technicalDetail: `## Motivation: Agents Need to Talk

When we introduce multiple specialized agents (Supervisor, Planner, Researcher, Coder), they need a standardized way to exchange messages. ad-hoc method calls create tight coupling and make the system hard to extend.

## Message Protocol Design

Every inter-agent message is a typed JSON envelope:

### Message Types

\`\`\`json
// REQUEST — ask another agent to perform work
{
  "type": "REQUEST",
  "messageId": "uuid",
  "from": "supervisor-agent",
  "to": "researcher-agent",
  "payload": {
    "taskId": "task-uuid",
    "action": "web_search",
    "args": { "query": "Beijing travel" }
  },
  "timestamp": "2026-04-29T10:00:00Z",
  "correlationId": "parent-uuid"
}

// RESPONSE — result of a REQUEST
{
  "type": "RESPONSE",
  "messageId": "uuid",
  "requestId": "original-request-uuid",
  "from": "researcher-agent",
  "to": "supervisor-agent",
  "payload": { "status": "success", "result": "..." },
  "timestamp": "2026-04-29T10:00:05Z"
}

// NOTIFICATION — one-way informational message
{
  "type": "NOTIFICATION",
  "messageId": "uuid",
  "from": "researcher-agent",
  "to": "supervisor-agent",
  "payload": { "event": "CRAWL_COMPLETE", "taskId": "task-uuid" },
  "timestamp": "2026-04-29T10:00:05Z"
}

// BROADCAST — message sent to all registered agents
{
  "type": "BROADCAST",
  "messageId": "uuid",
  "from": "supervisor-agent",
  "payload": { "event": "SYSTEM_SHUTDOWN", "reason": "idle_timeout" },
  "timestamp": "2026-04-29T10:00:00Z"
}
\`\`\`

## Async Queue Infrastructure

Each agent has a private \`LinkedBlockingQueue<AgentMessage>\`:
- Thread-safe enqueue/dequeue
- Bounded capacity (configurable, default 100 messages)
- Supports \`take()\` blocking for efficient waiting
- Outbound routing via \`AgentRegistry\`: message → target agent's queue

\`MessageQueue\` wraps the queue operations with:
- Send confirmation (blocks until acknowledged or timeout)
- Dead-letter queue for failed messages
- Message serialization/deserialization (Jackson)

### File Plan

- \`agent/multiagent/AgentMessage.java\` — typed message envelope
- \`agent/multiagent/AgentRegistry.java\` — agent registration + routing
- \`agent/multiagent/MessageQueue.java\` — async queue operations`,
    learningInsight: `## What This Demonstrates

**1. Protocol design is an undervalued skill**

Most engineers write RPC calls. Designing a typed message protocol with clear semantics (request/response/notif/broadcast) and thinking through failure modes shows systems design maturity.

**2. Async messaging patterns are everywhere in production**

LinkedBlockingQueue is the Java standard library's answer to async messaging. Understanding bounded queues, blocking vs. polling, and backpressure is directly applicable to Kafka, RabbitMQ, etc.

**3. JSON over typed objects gives flexibility without losing type safety**

Jackson serialization of typed \`AgentMessage\` subclasses gives us both:
- Structured, typed Java objects in code (compile-time safety)
- JSON on the wire (interoperability, debugging, logging)

**4. The correlation ID enables request-response matching**

In an async system, a REQUEST and its RESPONSE may arrive at different times. The \`requestId\` field links them — this is the same pattern used in HTTP correlation headers and message queue systems.`,
    codeSnippet: `// AgentMessage — base envelope for all agent messages
@Data
@JsonSubTypes({
    @JsonSubTypes.Type(value = RequestMessage.class, name = "REQUEST"),
    @JsonSubTypes.Type(value = ResponseMessage.class, name = "RESPONSE"),
    @JsonSubTypes.Type(value = NotificationMessage.class, name = "NOTIFICATION"),
    @JsonSubTypes.Type(value = BroadcastMessage.class, name = "BROADCAST"),
})
public abstract class AgentMessage {
    private String messageId;
    private String type;           // REQUEST, RESPONSE, NOTIFICATION, BROADCAST
    private String from;          // Sender agent name
    private String to;            // Target agent name (null for broadcast)
    private Object payload;       // Typed payload
    private Instant timestamp;
    private String correlationId;  // Links request to response
}

// MessageQueue — thread-safe async delivery
@Component
public class MessageQueue {
    private final Map<String, LinkedBlockingQueue<AgentMessage>> queues = new ConcurrentHashMap<>();
    private final AgentRegistry registry;

    public void send(AgentMessage message) throws InterruptedException {
        String targetQueue = registry.getQueueName(message.getTo());
        LinkedBlockingQueue<AgentMessage> queue = queues.computeIfAbsent(
            targetQueue, k -> new LinkedBlockingQueue<>(100));

        boolean enqueued = queue.offer(message, 5, TimeUnit.SECONDS);
        if (!enqueued) {
            throw new AgentCommunicationException("Queue full: " + targetQueue);
        }
    }

    public AgentMessage receive(String agentName, long timeout, TimeUnit unit)
            throws InterruptedException {
        LinkedBlockingQueue<AgentMessage> queue = queues.get(agentName);
        return queue == null ? null : queue.poll(timeout, unit);
    }
}`,
    architectureDiagram: `┌─────────────────────────────────────────────────────────────┐
│          Inter-Agent Communication Protocol                    │
│                                                         │
│  ┌──────────────┐     REQUEST      ┌──────────────┐    │
│  │  Supervisor  │ ─────────────────▶ │  Researcher │    │
│  │   Agent     │ ◀───────────────── │    Agent    │    │
│  └──────────────┘     RESPONSE       └──────────────┘    │
│         │                                       │         │
│         │         BROADCAST                     │         │
│         └───────────────────────────────────────┤         │
│         │                                       │         │
│         ▼                                       ▼         │
│  ┌──────────────┐                    ┌──────────────┐    │
│  │  Coder Agent │                    │ Planner Agent│    │
│  └──────────────┘                    └──────────────┘    │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              AgentRegistry                       │   │
│  │  "supervisor" → queue_1                          │   │
│  │  "researcher" → queue_2                          │   │
│  │  "coder"       → queue_3                         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘`,
    relatedConcepts: [
      'Async Messaging',
      'LinkedBlockingQueue',
      'Message Protocol',
      'JSON Serialization',
      'Request-Response Pattern',
      'Correlation ID',
      'Dead Letter Queue',
      'Actor Model',
      'Spring Component',
    ],
    interviewValue: `**Why this matters in interviews:**

This is a mini distributed systems design exercise. It demonstrates:

- **Protocol design thinking**: Interviewers often ask "how would you design a messaging protocol between services?" This shows you can define message types, semantics, and failure handling.
- **Concurrency mastery**: LinkedBlockingQueue internals (lock-based, condition variables) are fair-game interview topics.
- **Async vs. sync trade-offs**: Explaining why we use async queues (decoupling, backpressure, non-blocking) shows systems thinking.
- **Real-world analogy**: This mirrors how microservices communicate via message queues (Kafka, SQS) — a production-relevant pattern.
- **Error handling**: Dead-letter queues, timeout handling, and queue-full backpressure show defensive programming.`,
    status: 'planned',
    effortHours: 6,
  },
  // ─── Phase 2: Supervisor-Agent Architecture ─────────────────────────────────
  {
    id: 'supervisor-agent-20260429',
    date: '2026/04/29',
    title: 'Supervisor-Agent: Orchestrating Sub-Agents with CompletableFuture',
    category: 'architecture',
    difficulty: 'advanced',
    tags: ['supervisor', 'orchestration', 'completablefuture', 'parallel-execution', 'aggregator', 'multi-agent', 'java-concurrency'],
    summary: 'Implementing a Supervisor-Agent that routes tasks to specialized sub-agents (Planner/Researcher/Coder), executes parallelizable steps via CompletableFuture, and aggregates results into a unified response.',
    technicalDetail: `## Motivation: Specialization Beats Generalization

A single general-purpose agent struggles with diverse tasks. Splitting responsibilities:
- **Supervisor**: Task routing and result aggregation (orchestrator)
- **Planner**: Task decomposition (already implemented)
- **Researcher**: Web search, data gathering, fact-checking
- **Coder**: Code generation, file operations, command execution

## Supervisor-Agent Design

The Supervisor is the entry point — it receives user requests and decides:

### Routing Logic

\`\`\`
if (task involves "search", "find", "look up") → route to ResearcherAgent
if (task involves "write code", "create file", "run command") → route to CoderAgent
if (task involves "plan", "schedule", "organize") → route to PlannerAgent
if (task is complex/multi-step) → decompose with Planner, then fan-out to sub-agents
\`\`\`

### Parallel Execution with CompletableFuture

When multiple sub-tasks are independent, the Supervisor fans them out:

\`\`\`java
List<CompletableFuture<SubAgentResult>> futures = subTasks.stream()
    .filter(SubTask::isParallelizable)
    .map(task -> CompletableFuture
        .supplyAsync(() -> routeToSubAgent(task), executorService))
    .toList();

List<SubAgentResult> results = futures.stream()
    .map(CompletableFuture::join)  // Wait for all
    .toList();
\`\`\`

### Result Aggregation

\`AgentCoordinator\` collects results from all sub-agents and synthesizes a final response. The aggregator uses a synthesis prompt:
\`\`\`
Synthesize the following sub-agent results into a coherent response:

[Researcher]: Found 5 Beijing attractions with ratings and descriptions
[Coder]: Generated a 3-day itinerary markdown file
[Planner]: Created a schedule with timing recommendations

User's original request: "Plan a Beijing trip for me"
\`\`\`

### Supervisor State Machine

\`\`\`
IDLE → ROUTING → EXECUTING → AGGREGATING → RESPONDING → IDLE
          │           │
          │           └─ Parallel sub-agent execution
          └─ Decide which sub-agents to invoke
\`\`\`

### File Plan

- \`agent/multiagent/SupervisorAgent.java\` — task routing and orchestration
- \`agent/multiagent/ResearcherAgent.java\` — web search + data gathering specialization
- \`agent/multiagent/CoderAgent.java\` — code/file operations specialization
- \`agent/multiagent/AgentCoordinator.java\` — CompletableFuture orchestration + result aggregation`,
    learningInsight: `## What This Teaches

**1. CompletableFuture is the Java standard for async composition**

Chaining \`thenApply\`, \`thenCompose\`, \`allOf\`, and \`join\` is a fundamental Java skill. This project gives real-world practice with:
- Fan-out/fan-in patterns
- Exception handling in async chains (\`exceptionally\`, \`handle\`)
- Thread pool management with \`Executors.newFixedThreadPool\`

**2. Orchestration vs. Choreography**

The Supervisor pattern is orchestration: one central controller directs the dance. An alternative (choreography) would have agents publish/subscribe events autonomously. Both have trade-offs — the Supervisor pattern is easier to debug and reason about.

**3. The aggregator is its own LLM call**

Synthesis is non-trivial. The aggregator must:
- Understand each sub-agent's output format
- Detect conflicts between results
- Produce a coherent narrative

This is itself a prompting engineering challenge.

**4. Timeout and cancellation**

With multiple agents running in parallel, the Supervisor must handle:
- Partial timeout (one agent slow → wait or skip?)
- Cancellation (user cancels → stop all sub-agents)
- Resource cleanup (\`CompletableFuture.cancel(true)\` + thread interrupt)

These are advanced concurrency topics that interviewers love to probe.`,
    codeSnippet: `// SupervisorAgent — task routing and orchestration
@Component
public class SupervisorAgent {
    private final AgentRegistry registry;
    private final AgentCoordinator coordinator;

    public SseEmitter execute(String task, SseEmitter emitter) {
        // 1. Classify task type
        TaskType type = classifyTask(task);

        // 2. Route to appropriate sub-agents
        List<SubTask> subTasks = switch (type) {
            case RESEARCH -> List.of(new SubTask("research", task, researcherAgent));
            case CODE -> List.of(new SubTask("code", task, coderAgent));
            case COMPLEX -> plannerAgent.decompose(task).getSteps().stream()
                .map(step -> new SubTask(step.getToolName(), step.getDescription(),
                    registry.getAgent(step.getToolName())))
                .toList();
        };

        // 3. Execute parallelizable tasks
        ExecutorService executor = Executors.newFixedThreadPool(4);
        List<CompletableFuture<SubAgentResult>> futures = subTasks.stream()
            .map(st -> CompletableFuture.supplyAsync(
                () -> coordinator.execute(st), executor))
            .toList();

        // 4. Wait for all and aggregate
        List<SubAgentResult> results = futures.stream()
            .map(CompletableFuture::join)
            .toList();

        // 5. Synthesize final response
        String response = synthesizer.synthesize(task, results);
        emitter.send(response);
        emitter.complete();

        executor.shutdown();
        return emitter;
    }
}`,
    architectureDiagram: `┌──────────────────────────────────────────────────────────────┐
│              Supervisor-Agent Architecture                     │
│                                                              │
│                    ┌──────────────────┐                        │
│                    │  User Request   │                        │
│                    └────────┬─────────┘                        │
│                             ▼                                  │
│                    ┌──────────────────┐                        │
│                    │ SupervisorAgent │                        │
│                    │  (Orchestrator)  │                        │
│                    └────────┬─────────┘                        │
│          ┌──────────┬───────┴───────┬──────────┐              │
│          ▼          ▼               ▼          ▼              │
│    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│    │ Research │ │  Coder   │ │  Planner │ │ Research │      │
│    │  Agent   │ │  Agent   │ │  Agent   │ │  Agent   │      │
│    │  (web)   │ │  (code)  │ │  (plan)  │ │  (img)  │      │
│    └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘      │
│         │           │            │            │              │
│         └───────────┴────────────┴────────────┘              │
│                          │                                    │
│                          ▼                                    │
│               ┌──────────────────┐                           │
│               │ AgentCoordinator │                           │
│               │ (CompletableFuture│                           │
│               │  aggregation)    │                           │
│               └────────┬─────────┘                           │
│                        ▼                                      │
│               ┌──────────────────┐                           │
│               │   Synthesizer    │                           │
│               │ (LLM synthesis)   │                           │
│               └────────┬─────────┘                           │
│                        ▼                                      │
│               ┌──────────────────┐                           │
│               │   Final SSE     │                           │
│               └──────────────────┘                           │
└──────────────────────────────────────────────────────────────┘`,
    relatedConcepts: [
      'CompletableFuture',
      'ExecutorService',
      'Fan-out/Fan-in',
      'Orchestration Pattern',
      'Task Routing',
      'Result Aggregation',
      'Async Programming',
      'Thread Pool',
      'SSE Streaming',
    ],
    interviewValue: `**Why this matters in interviews:**

This is a distributed systems + concurrency showcase:

- **CompletableFuture mastery**: \`join()\`, \`allOf()\`, \`exceptionally()\` — these are Java concurrency interview staples. Real usage beats textbook examples.
- **Orchestration design**: Explaining why the Supervisor pattern makes sense (vs. choreography) shows architectural reasoning.
- **Parallelism and performance**: Showing that independent sub-tasks run concurrently, cutting total latency, demonstrates performance awareness.
- **Senior engineering judgment**: Deciding when to fan out vs. keep things sequential, handling partial failures, managing timeouts — these are the kind of nuanced decisions that separate senior from mid-level engineers.
- **Real production systems**: Tools like Temporal, Airflow, and AWS Step Functions all use similar orchestration patterns. This project demonstrates understanding of those concepts.`,
    status: 'planned',
    effortHours: 10,
  },
  // ─── Phase 2: Agent Profile Configuration ──────────────────────────────────
  {
    id: 'agent-profile-config-20260429',
    date: '2026/04/29',
    title: 'Agent Profile: Role-Based Configuration for Multi-Agent Systems',
    category: 'architecture',
    difficulty: 'intermediate',
    tags: ['agent-profile', 'configuration', 'rbac', 'role-based', 'tool-whitelist', 'spring', 'yaml', 'capability-boundary'],
    summary: 'Defining explicit Agent Profiles that specify each agent role, capability boundaries, tool whitelists, and timeout configurations — bringing RBAC thinking to the agent framework.',
    technicalDetail: `## Motivation: Agents Need Well-Defined Boundaries

In a multi-agent system, without clear boundaries:
- An agent might call tools it shouldn't (security risk)
- No visibility into what each agent is allowed to do
- Hard to reason about agent capabilities during debugging
- Adding a new agent requires hunting through code

## AgentProfile Design

Each agent has a declarative profile loaded from YAML:

\`\`\`yaml
agent:
  profiles:
    supervisor:
      role: ORCHESTRATOR
      description: "Coordinates sub-agents, routes tasks, aggregates results"
      capabilities:
        - TASK_ROUTING
        - RESULT_AGGREGATION
        - PARALLEL_EXECUTION
      toolWhitelist:
        - sendMessage
        - broadcastMessage
        - aggregateResults
      toolBlacklist: []
      timeout:
        defaultMs: 300000    # 5 min total
        perSubAgentMs: 60000 # 1 min per sub-agent
      maxRetries: 2
      model: gemini-2.5-flash-lite

    researcher:
      role: SPECIALIST
      description: "Web search and data gathering specialist"
      capabilities:
        - WEB_SEARCH
        - PAGE_SCRAPE
        - IMAGE_SEARCH
        - FACT_CHECK
      toolWhitelist:
        - searchWeb
        - scrapeWebPage
        - searchImage
        - downloadResource
      toolBlacklist:
        - executeTerminalCommand
        - writeFile
      timeout:
        defaultMs: 60000
      maxRetries: 3
      model: gemini-2.5-flash

    coder:
      role: SPECIALIST
      description: "Code generation and file operations specialist"
      capabilities:
        - CODE_GENERATION
        - FILE_OPERATIONS
        - COMMAND_EXECUTION
      toolWhitelist:
        - writeFile
        - readFile
        - executeTerminalCommand
        - generatePDF
      toolBlacklist:
        - searchWeb
        - scrapeWebPage
      timeout:
        defaultMs: 120000
      maxRetries: 1
      model: gemini-2.5-flash
\`\`\`

## Tool Enforcement

Before any tool call, the framework checks:

\`\`\`java
public ToolResponse executeTool(ToolCall call, AgentProfile profile) {
    if (!profile.getToolWhitelist().contains(call.getName())) {
        throw new SecurityException(
            "Agent " + profile.getName() + " attempted unauthorized tool: " + call.getName());
    }
    if (profile.getToolBlacklist().contains(call.getName())) {
        throw new SecurityException(
            "Tool " + call.getName() + " is blacklisted for agent " + profile.getName());
    }
    return toolRegistry.execute(call);
}
\`\`\`

This is a soft security boundary (enforced at runtime) that prevents accidental tool misuse.

## Capability-Based Tool Discovery

Instead of hardcoding tool lists, agents discover their available tools through the profile:

\`\`\`java
public List<Tool> getAvailableTools(AgentProfile profile) {
    return toolRegistry.getAll().stream()
        .filter(tool -> profile.getToolWhitelist().contains(tool.getName()))
        .toList();
}
\`\`\`

When a new tool is registered, agents automatically gain/lose access based on their profile — no code changes needed.

## File Plan

- \`agent/multiagent/AgentProfile.java\` — profile model with role, capabilities, tool lists
- \`agent/multiagent/AgentProfileRegistry.java\` — loads profiles from YAML, provides lookup`,
    learningInsight: `## What This Teaches

**1. Configuration-driven design (12-Factor, again)**

Externalizing agent behavior into YAML is an extension of the 12-factor principle already used for prompts. Adding agents no longer requires code changes — just a new YAML block.

**2. RBAC (Role-Based Access Control) in software design**

The tool whitelist/blacklist pattern mirrors enterprise RBAC systems. Understanding how to design permission boundaries is a transferable skill applicable far beyond AI agents.

**3. Spring's externalized configuration**

Using \`@ConfigurationProperties\` to bind YAML to typed Java objects is idiomatic Spring Boot. This pattern is used in production Spring applications everywhere.

**4. Defense in depth**

The tool enforcement is a runtime guard, not a compile-time check. In a multi-agent system where agents are LLM-driven (thus unpredictable), runtime enforcement is essential. Compile-time checks alone are insufficient.

**5. Interview angle: "How do you prevent an agent from doing something dangerous?"**

This is a common safety/security question. Tool whitelisting + runtime enforcement is a concrete, thoughtful answer that goes beyond "I'll add a warning message."`,
    codeSnippet: `// AgentProfile — declarative agent configuration
@Data @Builder @ConfigurationProperties(prefix = "agent.profiles")
public class AgentProfile {
    private String name;
    private AgentRole role;           // ORCHESTRATOR, SPECIALIST, GENERALIST
    private String description;
    private Set<AgentCapability> capabilities;
    private Set<String> toolWhitelist;
    private Set<String> toolBlacklist;
    private TimeoutConfig timeout;
    private int maxRetries;
    private String model;              // Which Gemini model this agent uses
}

// Tool enforcement — runtime guard before tool execution
@Component
@RequiredArgsConstructor
public class ToolEnforcer {
    private final ToolRegistry toolRegistry;
    private final AgentProfileRegistry profileRegistry;

    public ToolResponse executeForAgent(String agentName, ToolCall call) {
        AgentProfile profile = profileRegistry.getProfile(agentName);

        String toolName = call.getName();
        if (!profile.getToolWhitelist().contains(toolName)) {
            throw new UnauthorizedToolException(
                agentName + " is not authorized to call: " + toolName);
        }
        if (profile.getToolBlacklist().contains(toolName)) {
            throw new BlacklistedToolException(
                toolName + " is blacklisted for " + agentName);
        }

        return toolRegistry.execute(call);
    }
}`,
    architectureDiagram: `┌─────────────────────────────────────────────────────────────┐
│              Agent Profile Configuration                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              application.yml                          │   │
│  │  agent:                                               │   │
│  │    profiles:                                          │   │
│  │      supervisor: { role, tools, timeout }            │   │
│  │      researcher: { role, tools, timeout }           │   │
│  │      coder: { role, tools, timeout }                 │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       ▼                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           AgentProfileRegistry (@Component)           │   │
│  │  • Loads YAML via @ConfigurationProperties            │   │
│  │  • Provides typed AgentProfile by agent name         │   │
│  │  • Caches profiles (loaded once at startup)          │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                       │
│       ┌───────────────┼───────────────┐                     │
│       ▼               ▼               ▼                     │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                 │
│  │Supervisor│    │Researcher│   │  Coder  │                 │
│  │ Profile │    │ Profile │    │ Profile │                 │
│  │tools:   │    │tools:   │    │tools:   │                 │
│  │ - send  │    │ - search│    │ - write │                 │
│  │ - broad │    │ - scrape│    │ - exec  │                 │
│  └─────────┘    └─────────┘    └─────────┘                 │
│                                                             │
│  ToolEnforcer checks whitelist/blacklist at RUNTIME          │
└─────────────────────────────────────────────────────────────┘`,
    relatedConcepts: [
      'Configuration-Driven Design',
      'RBAC (Role-Based Access Control)',
      'Spring @ConfigurationProperties',
      'YAML Configuration',
      'Security Boundaries',
      'Capability-Based Access',
      'Tool Whitelist',
      'Defense in Depth',
      '12-Factor App',
    ],
    interviewValue: `**Why this matters in interviews:**

This brings enterprise-grade design patterns to the agent framework:

- **Security mindset**: Explaining tool whitelisting and runtime enforcement shows you think about agent safety — a key concern in production AI systems.
- **RBAC analogy**: Most engineers have encountered role-based access in enterprise software. Drawing the parallel to agent tool permissions demonstrates pattern recognition.
- **Spring Boot depth**: \`@ConfigurationProperties\` binding, YAML externalization, and type-safe configuration are intermediate-to-advanced Spring topics.
- **Extensibility**: "Adding a new agent requires no code changes" is a strong architectural statement. It shows you've thought about the developer experience and system maintainability.
- **Operational awareness**: Timeout configs, retry limits, and per-agent model selection show you think about operational concerns (latency, cost, reliability) — not just functionality.`,
    status: 'planned',
    effortHours: 5,
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
