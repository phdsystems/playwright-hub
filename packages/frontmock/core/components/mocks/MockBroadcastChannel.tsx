/**
 * MockBroadcastChannel - Mock BroadcastChannel API for testing
 *
 * Simulates cross-tab/window communication without actual browser contexts
 */

export interface MockBroadcastChannelInstance {
  name: string
  onmessage: ((event: MessageEvent) => void) | null
  onmessageerror: ((event: MessageEvent) => void) | null
  postMessage: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
}

export interface MockBroadcastChannelReturn {
  channels: Map<string, MockBroadcastChannelInstance[]>
  getAllChannels: (name: string) => MockBroadcastChannelInstance[]
  getLastChannel: (name?: string) => MockBroadcastChannelInstance | undefined
  broadcast: (name: string, data: any, excludeInstance?: MockBroadcastChannelInstance) => void
  getPostedMessages: (name: string) => any[]
  cleanup: () => void
}

/**
 * Sets up mock for BroadcastChannel API
 *
 * @example
 * ```typescript
 * import { setupMockBroadcastChannel } from '@ux.qa/frontmock'
 *
 * const { broadcast, getAllChannels, cleanup } = setupMockBroadcastChannel()
 *
 * render(<MultiTabSyncComponent />)
 *
 * // Verify component creates a channel
 * const channels = getAllChannels('app-sync')
 * expect(channels).toHaveLength(1)
 *
 * // Simulate message from another tab
 * broadcast('app-sync', { type: 'USER_LOGOUT' })
 *
 * // Verify component handles the message
 * expect(screen.getByText('Session ended')).toBeInTheDocument()
 *
 * cleanup()
 * ```
 */
export function setupMockBroadcastChannel(): MockBroadcastChannelReturn {
  const channels = new Map<string, MockBroadcastChannelInstance[]>()
  const postedMessages = new Map<string, any[]>()
  const eventListeners = new Map<MockBroadcastChannelInstance, Map<string, Set<EventListener>>>()

  class MockBroadcastChannelClass implements BroadcastChannel {
    name: string
    onmessage: ((this: BroadcastChannel, ev: MessageEvent) => any) | null = null
    onmessageerror: ((this: BroadcastChannel, ev: MessageEvent) => any) | null = null

    postMessage = vi.fn((message: any) => {
      // Store the message
      if (!postedMessages.has(this.name)) {
        postedMessages.set(this.name, [])
      }
      postedMessages.get(this.name)!.push(message)

      // Broadcast to other instances on the same channel
      const channelInstances = channels.get(this.name) || []
      channelInstances.forEach((instance) => {
        if (instance !== (this as any)) {
          const event = new MessageEvent('message', { data: message })
          instance.onmessage?.(event)

          // Also trigger addEventListener listeners
          const listenerMap = eventListeners.get(instance)
          if (listenerMap?.has('message')) {
            listenerMap.get('message')!.forEach((listener) => listener(event))
          }
        }
      })
    })

    close = vi.fn(() => {
      const channelInstances = channels.get(this.name)
      if (channelInstances) {
        const index = channelInstances.indexOf(this as any)
        if (index > -1) {
          channelInstances.splice(index, 1)
        }
        if (channelInstances.length === 0) {
          channels.delete(this.name)
        }
      }
      eventListeners.delete(this as any)
    })

    addEventListener = vi.fn(<K extends keyof BroadcastChannelEventMap>(
      type: K,
      listener: EventListenerOrEventListenerObject
    ) => {
      if (!eventListeners.has(this as any)) {
        eventListeners.set(this as any, new Map())
      }
      const listenerMap = eventListeners.get(this as any)!
      if (!listenerMap.has(type)) {
        listenerMap.set(type, new Set())
      }
      listenerMap.get(type)!.add(listener as EventListener)
    })

    removeEventListener = vi.fn(<K extends keyof BroadcastChannelEventMap>(
      type: K,
      listener: EventListenerOrEventListenerObject
    ) => {
      const listenerMap = eventListeners.get(this as any)
      if (listenerMap?.has(type)) {
        listenerMap.get(type)!.delete(listener as EventListener)
      }
    })

    dispatchEvent = vi.fn((event: Event): boolean => {
      return true
    })

    constructor(name: string) {
      this.name = name

      // Register this instance
      if (!channels.has(name)) {
        channels.set(name, [])
      }
      channels.get(name)!.push(this as any)
    }
  }

  const originalBroadcastChannel = global.BroadcastChannel

  // Install mock
  global.BroadcastChannel = MockBroadcastChannelClass as any

  const getAllChannels = (name: string): MockBroadcastChannelInstance[] => {
    return channels.get(name) || []
  }

  const getLastChannel = (name?: string): MockBroadcastChannelInstance | undefined => {
    if (name) {
      const channelInstances = channels.get(name)
      return channelInstances?.[channelInstances.length - 1]
    }

    // Get last channel across all names
    let lastChannel: MockBroadcastChannelInstance | undefined
    channels.forEach((instances) => {
      if (instances.length > 0) {
        lastChannel = instances[instances.length - 1]
      }
    })
    return lastChannel
  }

  const broadcast = (
    name: string,
    data: any,
    excludeInstance?: MockBroadcastChannelInstance
  ) => {
    const channelInstances = channels.get(name) || []
    channelInstances.forEach((instance) => {
      if (instance !== excludeInstance) {
        const event = new MessageEvent('message', { data })
        instance.onmessage?.(event)

        // Also trigger addEventListener listeners
        const listenerMap = eventListeners.get(instance)
        if (listenerMap?.has('message')) {
          listenerMap.get('message')!.forEach((listener) => listener(event))
        }
      }
    })
  }

  const getPostedMessages = (name: string): any[] => {
    return postedMessages.get(name) || []
  }

  const cleanup = () => {
    // Close all channels
    channels.forEach((instances) => {
      instances.forEach((instance) => instance.close())
    })
    channels.clear()
    postedMessages.clear()
    eventListeners.clear()

    // Restore original
    global.BroadcastChannel = originalBroadcastChannel
  }

  return {
    channels,
    getAllChannels,
    getLastChannel,
    broadcast,
    getPostedMessages,
    cleanup,
  }
}

/**
 * Common channel names for application sync patterns
 */
export const ChannelNames = {
  AUTH: 'auth-channel',
  SYNC: 'sync-channel',
  NOTIFICATIONS: 'notifications-channel',
  THEME: 'theme-channel',
  STORAGE: 'storage-channel',
  STATE: 'state-channel',
} as const

/**
 * Common message types for cross-tab communication
 */
export const BroadcastMessageType = {
  // Auth events
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  TOKEN_REFRESH: 'TOKEN_REFRESH',

  // Data sync
  DATA_UPDATE: 'DATA_UPDATE',
  CACHE_INVALIDATE: 'CACHE_INVALIDATE',
  SYNC_REQUEST: 'SYNC_REQUEST',
  SYNC_COMPLETE: 'SYNC_COMPLETE',

  // UI state
  THEME_CHANGE: 'THEME_CHANGE',
  LANGUAGE_CHANGE: 'LANGUAGE_CHANGE',
  NOTIFICATION: 'NOTIFICATION',

  // Tab coordination
  TAB_ACTIVE: 'TAB_ACTIVE',
  TAB_CLOSING: 'TAB_CLOSING',
  LEADER_ELECTION: 'LEADER_ELECTION',
} as const

/**
 * Helper to create typed broadcast messages
 */
export interface BroadcastMessage<T = any> {
  type: string
  payload: T
  timestamp: number
  sourceTabId?: string
}

export function createBroadcastMessage<T>(
  type: string,
  payload: T,
  sourceTabId?: string
): BroadcastMessage<T> {
  return {
    type,
    payload,
    timestamp: Date.now(),
    sourceTabId,
  }
}
