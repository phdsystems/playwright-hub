/**
 * MockWebSocket - Mock WebSocket API for testing
 *
 * Simulates WebSocket connections without actual network communication
 */

export interface MockWebSocketInstance {
  url: string
  readyState: number
  send: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  onopen: ((event: Event) => void) | null
  onclose: ((event: CloseEvent) => void) | null
  onmessage: ((event: MessageEvent) => void) | null
  onerror: ((event: Event) => void) | null
}

export interface MockWebSocketReturn {
  instances: MockWebSocketInstance[]
  getLastInstance: () => MockWebSocketInstance | undefined
  triggerOpen: (instance?: MockWebSocketInstance) => void
  triggerMessage: (data: any, instance?: MockWebSocketInstance) => void
  triggerError: (error?: Error, instance?: MockWebSocketInstance) => void
  triggerClose: (code?: number, reason?: string, instance?: MockWebSocketInstance) => void
  getSentMessages: (instance?: MockWebSocketInstance) => any[]
  cleanup: () => void
}

/**
 * Sets up mock for WebSocket API
 *
 * @example
 * ```typescript
 * import { setupMockWebSocket } from '@ux.qa/frontmock'
 *
 * const { getLastInstance, triggerOpen, triggerMessage, cleanup } = setupMockWebSocket()
 *
 * render(<ChatComponent />)
 *
 * // Component creates WebSocket connection
 * const ws = getLastInstance()
 * expect(ws?.url).toBe('ws://localhost:3000/chat')
 *
 * // Simulate connection opened
 * triggerOpen()
 *
 * // Simulate incoming message
 * triggerMessage({ type: 'chat', text: 'Hello!' })
 *
 * // Verify message appears
 * expect(screen.getByText('Hello!')).toBeInTheDocument()
 *
 * cleanup()
 * ```
 */
export function setupMockWebSocket(): MockWebSocketReturn {
  const instances: MockWebSocketInstance[] = []
  const sentMessages = new Map<MockWebSocketInstance, any[]>()

  class MockWebSocketClass implements WebSocket {
    CONNECTING = 0 as const
    OPEN = 1 as const
    CLOSING = 2 as const
    CLOSED = 3 as const

    url: string
    readyState: number = 0
    bufferedAmount: number = 0
    extensions: string = ''
    protocol: string = ''
    binaryType: BinaryType = 'blob'

    onopen: ((this: WebSocket, ev: Event) => any) | null = null
    onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null
    onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null
    onerror: ((this: WebSocket, ev: Event) => any) | null = null

    send = vi.fn((data: any) => {
      if (this.readyState !== this.OPEN) {
        throw new Error('WebSocket is not open')
      }

      if (!sentMessages.has(this as any)) {
        sentMessages.set(this as any, [])
      }
      sentMessages.get(this as any)!.push(data)
    })

    close = vi.fn((code?: number, reason?: string) => {
      this.readyState = this.CLOSING
      setTimeout(() => {
        this.readyState = this.CLOSED
        const event = new CloseEvent('close', {
          code: code ?? 1000,
          reason: reason ?? '',
          wasClean: true,
        })
        this.onclose?.(event)
      }, 0)
    })

    addEventListener = vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
      // Mock implementation
    })

    removeEventListener = vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
      // Mock implementation
    })

    dispatchEvent = vi.fn((event: Event): boolean => {
      return true
    })

    constructor(url: string | URL, protocols?: string | string[]) {
      this.url = url.toString()
      instances.push(this as any)
      sentMessages.set(this as any, [])

      // Simulate async connection
      setTimeout(() => {
        if (this.readyState === this.CONNECTING) {
          this.readyState = this.OPEN
        }
      }, 0)
    }
  }

  const originalWebSocket = global.WebSocket

  // Install mock
  global.WebSocket = MockWebSocketClass as any

  const getLastInstance = () => {
    return instances[instances.length - 1]
  }

  const triggerOpen = (instance?: MockWebSocketInstance) => {
    const ws = instance ?? getLastInstance()
    if (!ws) {
      throw new Error('No WebSocket instance found')
    }

    ws.readyState = 1 // OPEN
    const event = new Event('open')
    ws.onopen?.(event)
  }

  const triggerMessage = (data: any, instance?: MockWebSocketInstance) => {
    const ws = instance ?? getLastInstance()
    if (!ws) {
      throw new Error('No WebSocket instance found')
    }

    const event = new MessageEvent('message', { data })
    ws.onmessage?.(event)
  }

  const triggerError = (error?: Error, instance?: MockWebSocketInstance) => {
    const ws = instance ?? getLastInstance()
    if (!ws) {
      throw new Error('No WebSocket instance found')
    }

    const event = new Event('error')
    ;(event as any).error = error
    ws.onerror?.(event)
  }

  const triggerClose = (
    code: number = 1000,
    reason: string = '',
    instance?: MockWebSocketInstance
  ) => {
    const ws = instance ?? getLastInstance()
    if (!ws) {
      throw new Error('No WebSocket instance found')
    }

    ws.readyState = 3 // CLOSED
    const event = new CloseEvent('close', {
      code,
      reason,
      wasClean: code === 1000,
    })
    ws.onclose?.(event)
  }

  const getSentMessages = (instance?: MockWebSocketInstance) => {
    const ws = instance ?? getLastInstance()
    if (!ws) {
      return []
    }
    return sentMessages.get(ws) ?? []
  }

  const cleanup = () => {
    // Restore original
    global.WebSocket = originalWebSocket
    instances.length = 0
    sentMessages.clear()
  }

  return {
    instances,
    getLastInstance,
    triggerOpen,
    triggerMessage,
    triggerError,
    triggerClose,
    getSentMessages,
    cleanup,
  }
}

/**
 * WebSocket ready states for convenience
 */
export const WebSocketState = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const

/**
 * Common WebSocket close codes
 */
export const WebSocketCloseCode = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS: 1005,
  ABNORMAL: 1006,
  INVALID_PAYLOAD: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  INTERNAL_ERROR: 1011,
} as const
