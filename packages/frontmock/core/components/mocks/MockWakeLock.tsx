/**
 * MockWakeLock - Mock Screen Wake Lock API for testing
 *
 * Allows testing wake lock features without actual screen wake lock
 */

export type WakeLockType = 'screen'

export interface MockWakeLockSentinel {
  readonly type: WakeLockType
  readonly released: boolean
  release: () => Promise<void>
  addEventListener: (type: string, listener: EventListener) => void
  removeEventListener: (type: string, listener: EventListener) => void
  onrelease: ((this: MockWakeLockSentinel, ev: Event) => void) | null
}

export interface MockWakeLockReturn {
  mockRequest: ReturnType<typeof vi.fn>
  getActiveLocks: () => MockWakeLockSentinel[]
  releaseAll: () => Promise<void>
  simulateSystemRelease: (sentinel?: MockWakeLockSentinel) => Promise<void>
  cleanup: () => void
}

/**
 * Sets up mock for Screen Wake Lock API
 *
 * @example
 * ```typescript
 * import { setupMockWakeLock } from '@ux.qa/frontmock'
 *
 * const { mockRequest, getActiveLocks, releaseAll, simulateSystemRelease, cleanup } = setupMockWakeLock()
 *
 * render(<VideoPlayerComponent />)
 *
 * // Trigger wake lock request in component
 * await userEvent.click(screen.getByRole('button', { name: /play/i }))
 *
 * // Verify wake lock was requested
 * expect(mockRequest).toHaveBeenCalledWith('screen')
 * expect(getActiveLocks()).toHaveLength(1)
 *
 * // Simulate system releasing lock (e.g., tab hidden)
 * await simulateSystemRelease()
 * expect(getActiveLocks()).toHaveLength(0)
 *
 * cleanup()
 * ```
 */
export function setupMockWakeLock(): MockWakeLockReturn {
  const activeLocks = new Set<MockWakeLockSentinel>()

  const createSentinel = (type: WakeLockType): MockWakeLockSentinel => {
    let released = false
    const eventListeners = new Map<string, Set<EventListener>>()

    const sentinel: MockWakeLockSentinel = {
      get type() {
        return type
      },
      get released() {
        return released
      },
      release: vi.fn(async () => {
        if (released) {
          return
        }
        released = true
        activeLocks.delete(sentinel)

        // Dispatch release event
        const event = new Event('release')
        const listeners = eventListeners.get('release')
        if (listeners) {
          listeners.forEach((listener) => listener(event))
        }
        if (sentinel.onrelease) {
          sentinel.onrelease.call(sentinel, event)
        }
      }),
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        if (!eventListeners.has(type)) {
          eventListeners.set(type, new Set())
        }
        eventListeners.get(type)!.add(listener)
      }),
      removeEventListener: vi.fn((type: string, listener: EventListener) => {
        const listeners = eventListeners.get(type)
        if (listeners) {
          listeners.delete(listener)
        }
      }),
      onrelease: null,
    }

    return sentinel
  }

  const mockRequest = vi.fn(async (type: WakeLockType): Promise<MockWakeLockSentinel> => {
    if (type !== 'screen') {
      throw new TypeError(`The provided value '${type}' is not a valid enum value of type WakeLockType.`)
    }

    const sentinel = createSentinel(type)
    activeLocks.add(sentinel)
    return sentinel
  })

  const mockWakeLock = {
    request: mockRequest,
  }

  // Save original
  const originalWakeLock = navigator.wakeLock

  // Install mock
  Object.defineProperty(navigator, 'wakeLock', {
    writable: true,
    configurable: true,
    value: mockWakeLock,
  })

  const getActiveLocks = (): MockWakeLockSentinel[] => {
    return Array.from(activeLocks)
  }

  const releaseAll = async (): Promise<void> => {
    const locks = Array.from(activeLocks)
    await Promise.all(locks.map((sentinel) => sentinel.release()))
  }

  const simulateSystemRelease = async (sentinel?: MockWakeLockSentinel): Promise<void> => {
    if (sentinel) {
      // Release specific sentinel
      await sentinel.release()
    } else {
      // Release all locks (simulates tab becoming hidden or system event)
      await releaseAll()
    }
  }

  const cleanup = () => {
    // Clear all active locks without triggering events
    activeLocks.clear()

    // Restore original
    Object.defineProperty(navigator, 'wakeLock', {
      writable: true,
      configurable: true,
      value: originalWakeLock,
    })

    mockRequest.mockClear()
  }

  return {
    mockRequest,
    getActiveLocks,
    releaseAll,
    simulateSystemRelease,
    cleanup,
  }
}

/**
 * Wake Lock type constants
 */
export const WakeLockTypes = {
  SCREEN: 'screen' as WakeLockType,
} as const

/**
 * Common wake lock error scenarios for testing
 */
export const WakeLockErrors = {
  NOT_ALLOWED: new DOMException('Wake Lock permission denied', 'NotAllowedError'),
  ABORT: new DOMException('Wake Lock request aborted', 'AbortError'),
} as const
