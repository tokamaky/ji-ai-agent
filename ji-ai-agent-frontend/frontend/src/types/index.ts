export type AppType = 'love_app' | 'manus'

export type MessageRole = 'user' | 'assistant'

export interface ToolCallInfo {
  id: string
  toolName: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  arguments?: Record<string, unknown>
  result?: string
  timestamp: number
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: MessageRole
  content: string
  timestamp: number
  isStreaming?: boolean
  toolCalls?: ToolCallInfo[]
  markdown?: boolean
}

export interface ChatSession {
  sessionId: string
  title: string
  type: AppType
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

export type ThemeMode = 'light' | 'dark' | 'system'
