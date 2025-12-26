/**
 * MockGyroscope - Mock Gyroscope API (Generic Sensor API) for testing
 *
 * Allows testing gyroscope-based features without actual hardware sensors
 */

export interface GyroscopeReading {
  x: number
  y: number
  z: number
  timestamp: number
}

export interface MockGyroscopeReturn {
  mockStart: ReturnType<typeof vi.fn>
  mockStop: ReturnType<typeof vi.fn>
  mockAddEventListener: ReturnType<typeof vi.fn>
  mockRemoveEventListener: ReturnType<typeof vi.fn>
  setAngularVelocity: (x: number, y: number, z: number) => void
  triggerReading: (reading?: Partial<GyroscopeReading>) => void
  triggerError: (errorType: string, message: string) => void
  triggerActivate: () => void
  getActivated: () => boolean
  getHasReading: () => boolean
  cleanup: () => void
}

export interface GyroscopeOptions {
  frequency?: number
  referenceFrame?: 'device' | 'screen'
}

/**
 * Sets up mock for Gyroscope API (Generic Sensor API)
 *
 * @example
 * ```typescript
 * import { setupMockGyroscope, GyroscopePresets } from '@ux.qa/frontmock'
 *
 * const { setAngularVelocity, triggerReading, cleanup } = setupMockGyroscope()
 *
 * render(<MotionSensorComponent />)
 *
 * // Simulate device rotation
 * setAngularVelocity(0.5, 1.2, -0.3)
 * triggerReading()
 *
 * // Verify component responds to rotation
 * expect(screen.getByText(/Rotating/i)).toBeInTheDocument()
 *
 * // Use preset for spinning motion
 * setAngularVelocity(...GyroscopePresets.spinning.velocity)
 * triggerReading()
 *
 * cleanup()
 * ```
 */
export function setupMockGyroscope(options?: GyroscopeOptions): MockGyroscopeReturn {
  let currentReading: GyroscopeReading = {
    x: 0,
    y: 0,
    z: 0,
    timestamp: Date.now(),
  }

  let activated = false
  let hasReading = false

  const eventListeners = new Map<string, Set<EventListenerOrEventListenerObject>>()

  const getEventListenerSet = (type: string): Set<EventListenerOrEventListenerObject> => {
    if (!eventListeners.has(type)) {
      eventListeners.set(type, new Set())
    }
    return eventListeners.get(type)!
  }

  const dispatchEvent = (type: string, event: Event) => {
    const listeners = eventListeners.get(type)
    if (listeners) {
      listeners.forEach((listener) => {
        if (typeof listener === 'function') {
          listener(event)
        } else {
          listener.handleEvent(event)
        }
      })
    }
  }

  const mockAddEventListener = vi.fn(
    (type: string, listener: EventListenerOrEventListenerObject) => {
      getEventListenerSet(type).add(listener)
    }
  )

  const mockRemoveEventListener = vi.fn(
    (type: string, listener: EventListenerOrEventListenerObject) => {
      const listeners = eventListeners.get(type)
      if (listeners) {
        listeners.delete(listener)
      }
    }
  )

  const mockStart = vi.fn(() => {
    activated = true
    // Dispatch activate event
    const activateEvent = new Event('activate')
    dispatchEvent('activate', activateEvent)
  })

  const mockStop = vi.fn(() => {
    activated = false
  })

  // Create mock Gyroscope class
  class MockGyroscopeClass {
    x: number = 0
    y: number = 0
    z: number = 0
    timestamp: number | null = null
    activated: boolean = false
    hasReading: boolean = false

    readonly frequency: number
    readonly referenceFrame: string

    constructor(opts?: GyroscopeOptions) {
      this.frequency = opts?.frequency ?? 60
      this.referenceFrame = opts?.referenceFrame ?? 'device'

      // Bind instance to global state
      Object.defineProperty(this, 'x', {
        get: () => currentReading.x,
      })
      Object.defineProperty(this, 'y', {
        get: () => currentReading.y,
      })
      Object.defineProperty(this, 'z', {
        get: () => currentReading.z,
      })
      Object.defineProperty(this, 'timestamp', {
        get: () => hasReading ? currentReading.timestamp : null,
      })
      Object.defineProperty(this, 'activated', {
        get: () => activated,
      })
      Object.defineProperty(this, 'hasReading', {
        get: () => hasReading,
      })
    }

    start() {
      mockStart()
    }

    stop() {
      mockStop()
    }

    addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
      mockAddEventListener(type, listener)
    }

    removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
      mockRemoveEventListener(type, listener)
    }
  }

  // Save original Gyroscope if it exists
  const originalGyroscope = (globalThis as any).Gyroscope

  // Install mock
  ;(globalThis as any).Gyroscope = MockGyroscopeClass

  const setAngularVelocity = (x: number, y: number, z: number) => {
    currentReading = {
      x,
      y,
      z,
      timestamp: Date.now(),
    }
  }

  const triggerReading = (reading?: Partial<GyroscopeReading>) => {
    if (reading) {
      currentReading = {
        ...currentReading,
        ...reading,
        timestamp: reading.timestamp ?? Date.now(),
      }
    } else {
      currentReading.timestamp = Date.now()
    }

    hasReading = true

    // Create reading event with sensor data
    const readingEvent = new Event('reading')
    ;(readingEvent as any).x = currentReading.x
    ;(readingEvent as any).y = currentReading.y
    ;(readingEvent as any).z = currentReading.z
    ;(readingEvent as any).timestamp = currentReading.timestamp

    dispatchEvent('reading', readingEvent)
  }

  const triggerError = (errorType: string, message: string) => {
    const errorEvent = new Event('error')
    ;(errorEvent as any).error = {
      name: errorType,
      message,
    }

    dispatchEvent('error', errorEvent)
  }

  const triggerActivate = () => {
    activated = true
    const activateEvent = new Event('activate')
    dispatchEvent('activate', activateEvent)
  }

  const getActivated = () => activated

  const getHasReading = () => hasReading

  const cleanup = () => {
    // Restore original
    if (originalGyroscope !== undefined) {
      ;(globalThis as any).Gyroscope = originalGyroscope
    } else {
      delete (globalThis as any).Gyroscope
    }

    // Clear all state
    eventListeners.clear()
    activated = false
    hasReading = false
    currentReading = { x: 0, y: 0, z: 0, timestamp: Date.now() }

    // Clear mocks
    mockStart.mockClear()
    mockStop.mockClear()
    mockAddEventListener.mockClear()
    mockRemoveEventListener.mockClear()
  }

  return {
    mockStart,
    mockStop,
    mockAddEventListener,
    mockRemoveEventListener,
    setAngularVelocity,
    triggerReading,
    triggerError,
    triggerActivate,
    getActivated,
    getHasReading,
    cleanup,
  }
}

/**
 * Common gyroscope presets for testing
 * Angular velocity values in radians per second
 */
export const GyroscopePresets = {
  /** Device is stationary - no rotation */
  still: {
    velocity: [0, 0, 0] as const,
    description: 'Device is completely still',
  },
  /** Slow rotation around Y axis (yaw) - like turning left */
  rotating: {
    velocity: [0, 0.5, 0] as const,
    description: 'Slow rotation around vertical axis',
  },
  /** Fast spin around Z axis */
  spinning: {
    velocity: [0, 0, 3.14] as const,
    description: 'Fast spinning motion',
  },
  /** Tilting forward (pitch) */
  tiltingForward: {
    velocity: [0.3, 0, 0] as const,
    description: 'Tilting forward/backward',
  },
  /** Tilting sideways (roll) */
  tiltingSideways: {
    velocity: [0, 0, 0.3] as const,
    description: 'Tilting left/right',
  },
  /** Complex rotation - multiple axes */
  wobbling: {
    velocity: [0.2, 0.3, 0.1] as const,
    description: 'Unsteady rotation around multiple axes',
  },
  /** Shaking motion - rapid changes */
  shaking: {
    velocity: [2.0, 2.0, 2.0] as const,
    description: 'Vigorous shaking motion',
  },
} as const

/**
 * Gyroscope error types (from Generic Sensor API)
 */
export const GyroscopeErrorType = {
  /** Sensor not allowed by permissions policy */
  NOT_ALLOWED: 'NotAllowedError',
  /** Sensor not readable (hardware issue) */
  NOT_READABLE: 'NotReadableError',
  /** Browser does not support the sensor */
  NOT_SUPPORTED: 'NotSupportedError',
  /** Security restriction prevents access */
  SECURITY: 'SecurityError',
} as const
