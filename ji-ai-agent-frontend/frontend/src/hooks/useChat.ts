import { useCallback, useRef, useEffect } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useSSE } from './useSSE'
import { isValidMessage } from '@/utils/validate'
import { needsMarkdown } from '@/utils/markdown'
import toast from 'react-hot-toast'
import type { AppType } from '@/types'
import type { ManusSSEMessage } from '@/types/sse'

const BASE_URL = '/api/ai'

interface UseChatOptions {
    appType: AppType
    sessionId: string | null
}

/**
 * Core chat Hook — handles message sending and SSE streaming.
 * Supports both love_app (plain-text stream) and manus (JSON event stream).
 */
export function useChat({ appType, sessionId }: UseChatOptions) {
    const { connect, close } = useSSE()
    const addUserMessage = useChatStore((s) => s.addUserMessage)
    const addAssistantPlaceholder = useChatStore((s) => s.addAssistantPlaceholder)
    const appendStreamChunk = useChatStore((s) => s.appendStreamChunk)
    const finalizeStream = useChatStore((s) => s.finalizeStream)
    const upsertToolCall = useChatStore((s) => s.upsertToolCall)
    const setLoading = useChatStore((s) => s.setLoading)
    const setError = useChatStore((s) => s.setError)
    const isLoading = useChatStore((s) => s.isLoading)
    const autoTitleSession = useSessionStore((s) => s.autoTitleSession)

    // Track the current streaming message to close SSE on unmount
    const streamingMsgRef = useRef<{ id: string; sessionId: string } | null>(null)
    // In-flight guard: prevents the same (sessionId, content) from being fired twice
    // in rapid succession (e.g., React StrictMode double-effect, double-click, etc.)
    const inFlightKeyRef = useRef<string | null>(null)

    useEffect(() => {
        return () => {
            close()
        }
    }, [close])

    const sendMessage = useCallback(
        (content: string) => {
            // Use getState() to get the latest value instead of closure
            const currentLoading = useChatStore.getState().isLoading
            if (!sessionId || !isValidMessage(content) || currentLoading) return

            // Deduplicate identical in-flight requests
            const key = `${sessionId}::${content}`
            if (inFlightKeyRef.current === key) {
                return
            }
            inFlightKeyRef.current = key

            setError(null)
            setLoading(true)

            const userMsg = addUserMessage(sessionId, content)
            autoTitleSession(sessionId, content)

            // AI message placeholder
            const placeholder = addAssistantPlaceholder(sessionId)
            streamingMsgRef.current = { id: placeholder.id, sessionId }

            const msgId = placeholder.id
            const sid = sessionId

            if (appType === 'love_app') {
                connect(
                    {
                        url: `${BASE_URL}/love_app/chat/sse`,
                        params: { message: userMsg.content, chatId: sid },
                        onMessage: (data) => {
                            appendStreamChunk(msgId, sid, data)
                        },
                        onOpen: () => {
                            setLoading(false)
                        },
                        onError: () => {
                            setError('Connection failed, please try again later')
                            toast.error('AI response failed, please try again')
                        },
                        onClose: () => {
                            const messages = useChatStore.getState().getMessages(sid)
                            const msg = messages.find((m) => m.id === msgId)
                            const markdown = needsMarkdown(msg?.content ?? '')
                            finalizeStream(msgId, sid, markdown)
                            setLoading(false)
                            streamingMsgRef.current = null
                            inFlightKeyRef.current = null
                        },
                    },
                )
            } else {
                // manus: JSON event stream
                let toolCallCounter = 0

                connect(
                    {
                        url: `${BASE_URL}/manus/chat`,
                        params: { message: userMsg.content },
                        onMessage: (data) => {
                            try {
                                const event = JSON.parse(data) as ManusSSEMessage
                                handleManusEvent(event)
                            } catch {
                                // ignore non-JSON data
                            }
                        },
                        onOpen: () => setLoading(false),
                        onError: () => {
                            setError('Manus agent connection failed')
                            toast.error('Agent response failed, please try again')
                        },
                        onClose: () => {
                            const messages = useChatStore.getState().getMessages(sid)
                            const msg = messages.find((m) => m.id === msgId)
                            const markdown = needsMarkdown(msg?.content ?? '')
                            finalizeStream(msgId, sid, markdown)
                            setLoading(false)
                            streamingMsgRef.current = null
                            inFlightKeyRef.current = null
                        },
                    },
                )

                function handleManusEvent(event: ManusSSEMessage) {
                    switch (event.type) {
                        case 'thinking':
                            appendStreamChunk(msgId, sid, event.content ?? '')
                            break

                        case 'tool_call':
                            toolCallCounter++
                            upsertToolCall(msgId, sid, {
                                id: `tc-${toolCallCounter}`,
                                toolName: event.toolName ?? 'unknown',
                                status: 'running',
                                arguments: event.args,
                                timestamp: Date.now(),
                            })
                            break

                        case 'tool_result':
                            upsertToolCall(msgId, sid, {
                                id: `tc-${toolCallCounter}`,
                                toolName: event.toolName ?? 'unknown',
                                status: 'completed',
                                result: event.result,
                                timestamp: Date.now(),
                            })
                            break

                        case 'final_response':
                            appendStreamChunk(msgId, sid, event.content ?? '')
                            break

                        case 'error':
                            setError(event.error ?? 'Unknown error')
                            toast.error(event.error ?? 'The AI agent encountered an error')
                            break
                    }
                }
            }
        },
        [
            sessionId,
            isLoading,
            appType,
            connect,
            addUserMessage,
            addAssistantPlaceholder,
            appendStreamChunk,
            finalizeStream,
            upsertToolCall,
            setLoading,
            setError,
            autoTitleSession,
        ],
    )

    const stopStreaming = useCallback(() => {
        close()
        if (streamingMsgRef.current) {
            const { id, sessionId: sid } = streamingMsgRef.current
            finalizeStream(id, sid, false)
            streamingMsgRef.current = null
        }
        inFlightKeyRef.current = null
        setLoading(false)
    }, [close, finalizeStream, setLoading])

    return { sendMessage, stopStreaming, isLoading } as const
}