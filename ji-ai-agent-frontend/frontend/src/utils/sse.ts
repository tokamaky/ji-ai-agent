import type { SSEConfig } from '@/types/api'
import type { SSEStatus } from '@/types/sse'

/**
 * SSEManager — fetch + ReadableStream based SSE client.
 *
 * IMPORTANT: We deliberately do NOT use the native EventSource API here.
 * EventSource has built-in automatic reconnection that cannot be disabled,
 * which causes the backend to receive duplicate requests when the server
 * closes the stream normally (e.g., after sending a final_response).
 *
 * fetch + ReadableStream gives us full control over the lifecycle:
 *   - No automatic reconnection
 *   - Clean cancellation via AbortController
 *   - Same SSE wire format ("data: <payload>\n\n")
 *
 * The server may send an explicit "[DONE]" sentinel as the final data payload
 * to mark stream completion. We treat it as a normal close.
 */

type ResolvedConfig = Omit<Required<SSEConfig>, 'params'> & {
  params: Record<string, string> | undefined
}

const DONE_SENTINEL = '[DONE]'

export class SSEManager {
  private abortController: AbortController | null = null
  private config: ResolvedConfig
  private _status: SSEStatus = 'idle'
  private onStatusChange?: (status: SSEStatus) => void
  private isClosing = false

  constructor(config: SSEConfig, onStatusChange?: (status: SSEStatus) => void) {
    this.config = {
      maxRetries: 0, // we never auto-retry
      retryInterval: 0,
      onError: () => {},
      onOpen: () => {},
      onClose: () => {},
      params: undefined,
      ...config,
    }
    this.onStatusChange = onStatusChange
  }

  get status(): SSEStatus {
    return this._status
  }

  private setStatus(s: SSEStatus) {
    this._status = s
    this.onStatusChange?.(s)
  }

  private buildUrl(): string {
    const { url, params } = this.config
    if (!params || Object.keys(params).length === 0) return url
    const search = new URLSearchParams(params).toString()
    return `${url}?${search}`
  }

  /**
   * Open the SSE stream. Fire-and-forget: callers don't need to await.
   * Errors and completion are surfaced via onError / onClose callbacks.
   */
  connect(): void {
    void this.run()
  }

  private async run(): Promise<void> {
    // Make sure any previous connection is fully torn down
    this.close()
    this.isClosing = false
    this.setStatus('connecting')

    const controller = new AbortController()
    this.abortController = controller

    try {
      const response = await fetch(this.buildUrl(), {
        signal: controller.signal,
        headers: { Accept: 'text/event-stream' },
      })

      if (!response.ok || !response.body) {
        this.setStatus('error')
        this.config.onError(new Event('error'))
        this.close()
        return
      }

      this.setStatus('connected')
      this.config.onOpen()

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let doneReceived = false

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // SSE messages are separated by a blank line ("\n\n")
          let sepIndex: number
          while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
            const rawEvent = buffer.slice(0, sepIndex)
            buffer = buffer.slice(sepIndex + 2)

            // An event may contain multiple "data:" lines; concatenate them
            const dataLines: string[] = []
            for (const line of rawEvent.split('\n')) {
              if (line.startsWith('data:')) {
                // strip "data:" and an optional single leading space
                dataLines.push(line.replace(/^data:\s?/, ''))
              }
            }
            if (dataLines.length === 0) continue

            const payload = dataLines.join('\n')

            // Explicit end-of-stream sentinel from the server
            if (payload === DONE_SENTINEL) {
              doneReceived = true
              break
            }

            this.config.onMessage(payload)
          }

          if (doneReceived) break
        }
      } finally {
        try {
          reader.releaseLock()
        } catch {
          /* noop */
        }
      }

      // Stream ended (either via [DONE] or server-side close) — normal completion.
      this.close()
    } catch (err) {
      // AbortError means we called close() ourselves; that's fine
      if ((err as Error).name === 'AbortError') {
        this.close()
        return
      }
      this.setStatus('error')
      this.config.onError(new Event('error'))
      this.close()
    }
  }

  close(): void {
    if (this.isClosing) return
    this.isClosing = true

    if (this.abortController) {
      try {
        this.abortController.abort()
      } catch {
        /* noop */
      }
      this.abortController = null
    }
    if (this._status !== 'closed') {
      this.setStatus('closed')
    }
    this.config.onClose()
  }
}

/** Fetch-based SSE reader for scenarios requiring POST or custom headers */
export async function fetchSSE(
    url: string,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(url, { signal })
  if (!response.body) {
    onDone()
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value, { stream: true })
      for (const line of text.split('\n')) {
        if (line.startsWith('data: ')) {
          onChunk(line.slice(6))
        }
      }
    }
  } finally {
    reader.releaseLock()
    onDone()
  }
}