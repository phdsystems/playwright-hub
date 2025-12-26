/**
 * MockAccelerometer - Mock Generic Sensor API Accelerometer for testing
 *
 * Allows testing motion-based features without actual device sensors
 */

export interface AccelerometerReading {
  x: number
  y: number
  z: number
  timestamp: number
}

export interface AccelerometerSensorOptions {
  frequency?: number
  referenceFrame?: 'device' | 'screen'
}

export interface MockAccelerometerReturn {
  mockStart: ReturnType<typeof vi.fn>
  mockStop: ReturnType<typeof vi.fn>
  setAcceleration: (x: number, y: number, z: number) => void
  triggerReading: () => void
  triggerActivate: () => void
  triggerError: (name: string, message: string) => void
  getAcceleration: () => { x: number; y: number; z: number }
  isActivated: () => boolean
  cleanup: () => void
}

/**
 * Sets up mock for Accelerometer API (Generic Sensor API)
 *
 * @example
 * ```typescript
 * import { setupMockAccelerometer, AccelerometerPresets } from '@ux.qa/frontmock'
 *
 * const { setAcceleration, triggerReading, cleanup } = setupMockAccelerometer()
 *
 * render(<MotionComponent />)
 *
 * // Set device flat on table (z = 9.8 for gravity)
 * setAcceleration(0, 0, 9.8)
 * triggerReading()
 *
 * // Verify component responds to flat orientation
 * expect(screen.getByText(/Device is flat/i)).toBeInTheDocument()
 *
 * // Simulate shaking
 * setAcceleration(15, -10, 5)
 * triggerReading()
 *
 * // Verify shake detection
 * expect(screen.getByText(/Shake detected/i)).toBeInTheDocument()
 *
 * cleanup()
 * ```
 */
export function setupMockAccelerometer(): MockAccelerometerReturn {
  let currentReading: AccelerometerReading = {
    x: 0,
    y: 0,
    z: 9.8, // Default: device flat, gravity pulling down
    timestamp: Date.now(),
  }

  let activated = false
  let hasReading = false

  const eventListeners = new Map<string, Set<EventListener>>()

  // Mock methods
  const mockStart = vi.fn(() => {
    activated = true
    hasReading = true
    // Trigger activate event
    setTimeout(() => {
      dispatchEvent('activate')
    }, 0)
  })

  const mockStop = vi.fn(() => {
    activated = false
  })

  const dispatchEvent = (eventType: string, eventInit?: EventInit) => {
    const listeners = eventListeners.get(eventType)
    if (listeners) {
      const event = new Event(eventType, eventInit)
      listeners.forEach((listener) => {
        listener(event)
      })
    }
  }

  const dispatchErrorEvent = (name: string, message: string) => {
    const listeners = eventListeners.get('error')
    if (listeners) {
      const errorEvent = new ErrorEvent('error', {
        error: new DOMException(message, name),
        message,
      })
      listeners.forEach((listener) => {
        listener(errorEvent)
      })
    }
  }

  // Create mock Accelerometer class
  class MockAccelerometerClass {
    readonly x: number | null = null
    readonly y: number | null = null
    readonly z: number | null = null
    readonly activated: boolean = false
    readonly hasReading: boolean = false
    readonly timestamp: number | null = null

    private _options: AccelerometerSensorOptions

    constructor(options?: AccelerometerSensorOptions) {
      this._options = options ?? {}

      // Make properties dynamic getters
      Object.defineProperties(this, {
        x: {
          get: () => (hasReading ? currentReading.x : null),
          enumerable: true,
        },
        y: {
          get: () => (hasReading ? currentReading.y : null),
          enumerable: true,
        },
        z: {
          get: () => (hasReading ? currentReading.z : null),
          enumerable: true,
        },
        activated: {
          get: () => activated,
          enumerable: true,
        },
        hasReading: {
          get: () => hasReading,
          enumerable: true,
        },
        timestamp: {
          get: () => (hasReading ? currentReading.timestamp : null),
          enumerable: true,
        },
      })
    }

    start() {
      mockStart()
    }

    stop() {
      mockStop()
    }

    addEventListener(type: string, listener: EventListener) {
      if (!eventListeners.has(type)) {
        eventListeners.set(type, new Set())
      }
      eventListeners.get(type)!.add(listener)
    }

    removeEventListener(type: string, listener: EventListener) {
      const listeners = eventListeners.get(type)
      if (listeners) {
        listeners.delete(listener)
      }
    }

    // Event handler properties
    onreading: ((event: Event) => void) | null = null
    onactivate: ((event: Event) => void) | null = null
    onerror: ((event: Event) => void) | null = null
  }

  // Store original Accelerometer if it exists
  const originalAccelerometer = (globalThis as any).Accelerometer

  // Install mock
  ;(globalThis as any).Accelerometer = MockAccelerometerClass

  const setAcceleration = (x: number, y: number, z: number) => {
    currentReading = {
      x,
      y,
      z,
      timestamp: Date.now(),
    }
    hasReading = true
  }

  const triggerReading = () => {
    currentReading.timestamp = Date.now()
    dispatchEvent('reading')

    // Also call onreading handler if set on instances
    // This is handled through the event listener system
  }

  const triggerActivate = () => {
    activated = true
    hasReading = true
    dispatchEvent('activate')
  }

  const triggerError = (name: string, message: string) => {
    dispatchErrorEvent(name, message)
  }

  const getAcceleration = () => ({
    x: currentReading.x,
    y: currentReading.y,
    z: currentReading.z,
  })

  const isActivated = () => activated

  const cleanup = () => {
    // Restore original
    if (originalAccelerometer) {
      ;(globalThis as any).Accelerometer = originalAccelerometer
    } else {
      delete (globalThis as any).Accelerometer
    }

    // Clear state
    eventListeners.clear()
    activated = false
    hasReading = false
    currentReading = {
      x: 0,
      y: 0,
      z: 9.8,
      timestamp: Date.now(),
    }

    mockStart.mockClear()
    mockStop.mockClear()
  }

  return {
    mockStart,
    mockStop,
    setAcceleration,
    triggerReading,
    triggerActivate,
    triggerError,
    getAcceleration,
    isActivated,
    cleanup,
  }
}

/**
 * Common accelerometer presets for testing
 *
 * Values are in m/s² (meters per second squared)
 * Earth gravity ≈ 9.8 m/s²
 */
export const AccelerometerPresets = {
  /** Device flat on table, screen facing up */
  flat: { x: 0, y: 0, z: 9.8 },

  /** Device flat on table, screen facing down */
  faceDown: { x: 0, y: 0, z: -9.8 },

  /** Device tilted 45° forward (portrait, tilted toward user) */
  tiltedForward: { x: 0, y: 6.93, z: 6.93 },

  /** Device tilted 45° backward (portrait, tilted away from user) */
  tiltedBackward: { x: 0, y: -6.93, z: 6.93 },

  /** Device tilted 45° left (portrait) */
  tiltedLeft: { x: 6.93, y: 0, z: 6.93 },

  /** Device tilted 45° right (portrait) */
  tiltedRight: { x: -6.93, y: 0, z: 6.93 },

  /** Device held upright (portrait, standing) */
  portrait: { x: 0, y: 9.8, z: 0 },

  /** Device held sideways (landscape) */
  landscape: { x: 9.8, y: 0, z: 0 },

  /** Simulated shake - high acceleration values */
  shaking: { x: 15, y: -12, z: 20 },

  /** Gentle shake */
  gentleShake: { x: 5, y: -4, z: 12 },

  /** Device in freefall (no gravity) */
  freefall: { x: 0, y: 0, z: 0 },

  /** Device at rest with no sensor reading */
  noReading: { x: 0, y: 0, z: 0 },
} as const

/**
 * Accelerometer error types
 */
export const AccelerometerError = {
  /** Sensor not available on device */
  NOT_SUPPORTED: { name: 'NotSupportedError', message: 'Accelerometer is not supported' },

  /** Permission to access sensor denied */
  NOT_ALLOWED: { name: 'NotAllowedError', message: 'Permission to access accelerometer denied' },

  /** Sensor reading failed */
  NOT_READABLE: { name: 'NotReadableError', message: 'Could not read accelerometer data' },

  /** Security context error (requires HTTPS) */
  SECURITY: { name: 'SecurityError', message: 'Accelerometer requires secure context (HTTPS)' },
} as const

/**
 * Helper to simulate shake gesture over time
 *
 * @example
 * ```typescript
 * const { setAcceleration, triggerReading } = setupMockAccelerometer()
 * await simulateShake(setAcceleration, triggerReading, { intensity: 'strong', duration: 500 })
 * ```
 */
export async function simulateShake(
  setAcceleration: (x: number, y: number, z: number) => void,
  triggerReading: () => void,
  options: {
    intensity?: 'gentle' | 'medium' | 'strong'
    duration?: number
    frequency?: number
  } = {}
): Promise<void> {
  const { intensity = 'medium', duration = 300, frequency = 60 } = options

  const intensityMultiplier = {
    gentle: 1,
    medium: 2,
    strong: 3,
  }[intensity]

  const baseAcceleration = 5 * intensityMultiplier
  const intervalMs = 1000 / frequency
  const iterations = Math.floor(duration / intervalMs)

  for (let i = 0; i < iterations; i++) {
    // Oscillate acceleration values to simulate shaking
    const phase = (i / iterations) * Math.PI * 4 // 2 full shake cycles
    const x = Math.sin(phase) * baseAcceleration
    const y = Math.cos(phase * 1.3) * baseAcceleration // Slightly different frequency
    const z = 9.8 + Math.sin(phase * 0.7) * (baseAcceleration * 0.5)

    setAcceleration(x, y, z)
    triggerReading()

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  // Return to rest
  setAcceleration(0, 0, 9.8)
  triggerReading()
}
