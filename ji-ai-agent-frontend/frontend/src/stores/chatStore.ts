import { create } from 'zustand'
import { generateId } from '@/utils/uuid'
import { useSessionStore } from './sessionStore'
import type { ChatMessage, ToolCallInfo, MessageRole } from '@/types'

interface ChatStore {
  /** 当前会话正在流式中的消息 ID */
  streamingMessageId: string | null
  /** 是否正在等待 AI 响应 */
  isLoading: boolean
  /** 错误信息 */
  error: string | null

  /** 读取指定会话的消息列表 */
  getMessages: (sessionId: string) => ChatMessage[]

  /** 添加用户消息 */
  addUserMessage: (sessionId: string, content: string) => ChatMessage

  /** 添加 AI 占位消息（流式开始时） */
  addAssistantPlaceholder: (sessionId: string) => ChatMessage

  /** 追加流式内容到消息 */
  appendStreamChunk: (messageId: string, sessionId: string, chunk: string) => void

  /** 完成流式传输 */
  finalizeStream: (messageId: string, sessionId: string, markdown?: boolean) => void

  /** 更新工具调用信息 */
  upsertToolCall: (messageId: string, sessionId: string, toolCall: ToolCallInfo) => void

  /** 直接添加完整消息（非流式） */
  addMessage: (sessionId: string, role: MessageRole, content: string) => ChatMessage

  /** 删除会话的所有消息 */
  clearMessages: (sessionId: string) => void

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useChatStore = create<ChatStore>()((set) => ({
  streamingMessageId: null,
  isLoading: false,
  error: null,

  getMessages: (sessionId) => {
    const session = useSessionStore.getState().sessions.find((s) => s.sessionId === sessionId)
    return session?.messages ?? []
  },

  addUserMessage: (sessionId, content) => {
    const msg: ChatMessage = {
      id: generateId(),
      sessionId,
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    useSessionStore.setState((s) => ({
      sessions: s.sessions.map((se) =>
        se.sessionId === sessionId
          ? { ...se, messages: [...se.messages, msg], updatedAt: Date.now() }
          : se,
      ),
    }))
    return msg
  },

  addAssistantPlaceholder: (sessionId) => {
    const msg: ChatMessage = {
      id: generateId(),
      sessionId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    }
    useSessionStore.setState((s) => ({
      sessions: s.sessions.map((se) =>
        se.sessionId === sessionId
          ? { ...se, messages: [...se.messages, msg], updatedAt: Date.now() }
          : se,
      ),
    }))
    set({ streamingMessageId: msg.id })
    return msg
  },

  appendStreamChunk: (messageId, sessionId, chunk) => {
    useSessionStore.setState((s) => ({
      sessions: s.sessions.map((se) =>
        se.sessionId === sessionId
          ? {
              ...se,
              messages: se.messages.map((m) =>
                m.id === messageId ? { ...m, content: m.content + chunk } : m,
              ),
            }
          : se,
      ),
    }))
  },

  finalizeStream: (messageId, sessionId, markdown = false) => {
    useSessionStore.setState((s) => ({
      sessions: s.sessions.map((se) =>
        se.sessionId === sessionId
          ? {
              ...se,
              messages: se.messages.map((m) =>
                m.id === messageId ? { ...m, isStreaming: false, markdown } : m,
              ),
            }
          : se,
      ),
    }))
    set({ streamingMessageId: null })
  },

  upsertToolCall: (messageId, sessionId, toolCall) => {
    useSessionStore.setState((s) => ({
      sessions: s.sessions.map((se) =>
        se.sessionId === sessionId
          ? {
              ...se,
              messages: se.messages.map((m) => {
                if (m.id !== messageId) return m
                const existing = m.toolCalls ?? []
                const idx = existing.findIndex((tc) => tc.id === toolCall.id)
                const updated =
                  idx >= 0
                    ? existing.map((tc, i) => (i === idx ? { ...tc, ...toolCall } : tc))
                    : [...existing, toolCall]
                return { ...m, toolCalls: updated }
              }),
            }
          : se,
      ),
    }))
  },

  addMessage: (sessionId, role, content) => {
    const msg: ChatMessage = {
      id: generateId(),
      sessionId,
      role,
      content,
      timestamp: Date.now(),
    }
    useSessionStore.setState((s) => ({
      sessions: s.sessions.map((se) =>
        se.sessionId === sessionId
          ? { ...se, messages: [...se.messages, msg], updatedAt: Date.now() }
          : se,
      ),
    }))
    return msg
  },

  clearMessages: (sessionId) => {
    useSessionStore.setState((s) => ({
      sessions: s.sessions.map((se) =>
        se.sessionId === sessionId ? { ...se, messages: [], updatedAt: Date.now() } : se,
      ),
    }))
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
