/**
 * MockMagnetometer - Mock Magnetometer API (Generic Sensor API) for testing
 *
 * Allows testing compass and magnetic field features without actual hardware
 */

export interface MagnetometerReading {
  x: number // Magnetic field strength along x-axis in microtesla (μT)
  y: number // Magnetic field strength along y-axis in microtesla (μT)
  z: number // Magnetic field strength along z-axis in microtesla (μT)
  timestamp: number
}

export interface MockMagnetometerReturn {
  mockStart: ReturnType<typeof vi.fn>
  mockStop: ReturnType<typeof vi.fn>
  mockAddEventListener: ReturnType<typeof vi.fn>
  mockRemoveEventListener: ReturnType<typeof vi.fn>
  setMagneticField: (x: number, y: number, z: number) => void
  triggerReading: () => void
  triggerActivate: () => void
  triggerError: (error: Error) => void
  getActivated: () => boolean
  getHasReading: () => boolean
  cleanup: () => void
}

/**
 * Sets up mock for Magnetometer API (Generic Sensor API)
 *
 * @example
 * ```typescript
 * import { setupMockMagnetometer, MagnetometerPresets } from '@ux.qa/frontmock'
 *
 * const { setMagneticField, triggerReading, cleanup } = setupMockMagnetometer()
 *
 * render(<CompassComponent />)
 *
 * // Set magnetic field pointing north
 * setMagneticField(
 *   MagnetometerPresets.north.x,
 *   MagnetometerPresets.north.y,
 *   MagnetometerPresets.north.z
 * )
 * triggerReading()
 *
 * // Verify compass shows north
 * expect(screen.getByText(/North/i)).toBeInTheDocument()
 *
 * cleanup()
 * ```
 */
export function setupMockMagnetometer(): MockMagnetometerReturn {
  let currentReading: MagnetometerReading = {
    x: 0,
    y: 0,
    z: 0,
    timestamp: Date.now(),
  }

  let activated = false
  let hasReading = false

  const eventListeners = new Map<string, Set<EventListener>>()

  const dispatchEvent = (type: string, event?: Event) => {
    const listeners = eventListeners.get(type)
    if (listeners) {
      listeners.forEach((listener) => {
        listener(event ?? new Event(type))
      })
    }
  }

  const mockStart = vi.fn(() => {
    activated = true
    setTimeout(() => {
      dispatchEvent('activate')
    }, 0)
  })

  const mockStop = vi.fn(() => {
    activated = false
  })

  const mockAddEventListener = vi.fn(
    (type: string, listener: EventListener) => {
      if (!eventListeners.has(type)) {
        eventListeners.set(type, new Set())
      }
      eventListeners.get(type)!.add(listener)
    }
  )

  const mockRemoveEventListener = vi.fn(
    (type: string, listener: EventListener) => {
      const listeners = eventListeners.get(type)
      if (listeners) {
        listeners.delete(listener)
      }
    }
  )

  // Create mock Magnetometer class
  class MockMagnetometerClass {
    x: number = 0
    y: number = 0
    z: number = 0
    timestamp: number | null = null
    activated: boolean = false
    hasReading: boolean = false

    onreading: ((event: Event) => void) | null = null
    onactivate: ((event: Event) => void) | null = null
    onerror: ((event: Event) => void) | null = null

    constructor(options?: { frequency?: number; referenceFrame?: string }) {
      // Update instance properties when reading changes
      const updateInstance = () => {
        this.x = currentReading.x
        this.y = currentReading.y
        this.z = currentReading.z
        this.timestamp = currentReading.timestamp
        this.activated = activated
        this.hasReading = hasReading
      }

      // Proxy to keep instance in sync
      mockAddEventListener('reading', () => {
        updateInstance()
        if (this.onreading) {
          this.onreading(new Event('reading'))
        }
      })

      mockAddEventListener('activate', () => {
        updateInstance()
        if (this.onactivate) {
          this.onactivate(new Event('activate'))
        }
      })

      mockAddEventListener('error', (event: Event) => {
        if (this.onerror) {
          this.onerror(event)
        }
      })
    }

    start() {
      mockStart()
    }

    stop() {
      mockStop()
    }

    addEventListener(type: string, listener: EventListener) {
      mockAddEventListener(type, listener)
    }

    removeEventListener(type: string, listener: EventListener) {
      mockRemoveEventListener(type, listener)
    }
  }

  // Save original Magnetometer if it exists
  const originalMagnetometer = (globalThis as any).Magnetometer

  // Install mock
  ;(globalThis as any).Magnetometer = MockMagnetometerClass

  const setMagneticField = (x: number, y: number, z: number) => {
    currentReading = {
      x,
      y,
      z,
      timestamp: Date.now(),
    }
  }

  const triggerReading = () => {
    hasReading = true
    currentReading.timestamp = Date.now()
    dispatchEvent('reading')
  }

  const triggerActivate = () => {
    activated = true
    dispatchEvent('activate')
  }

  const triggerError = (error: Error) => {
    const errorEvent = new ErrorEvent('error', {
      error,
      message: error.message,
    })
    dispatchEvent('error', errorEvent)
  }

  const getActivated = () => activated
  const getHasReading = () => hasReading

  const cleanup = () => {
    // Restore original
    if (originalMagnetometer !== undefined) {
      ;(globalThis as any).Magnetometer = originalMagnetometer
    } else {
      delete (globalThis as any).Magnetometer
    }

    eventListeners.clear()
    activated = false
    hasReading = false
    currentReading = { x: 0, y: 0, z: 0, timestamp: Date.now() }

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
    setMagneticField,
    triggerReading,
    triggerActivate,
    triggerError,
    getActivated,
    getHasReading,
    cleanup,
  }
}

/**
 * Magnetometer presets for compass directions
 *
 * Values represent typical magnetic field readings in microtesla (μT)
 * when the device is held flat and facing the indicated direction.
 *
 * Earth's magnetic field typically ranges from 25-65 μT depending on location.
 * These presets use ~50 μT as a baseline for the horizontal component.
 */
export const MagnetometerPresets = {
  // Facing magnetic north - positive Y, minimal X
  north: { x: 0, y: 50, z: -30 },

  // Facing magnetic south - negative Y, minimal X
  south: { x: 0, y: -50, z: -30 },

  // Facing magnetic east - positive X, minimal Y
  east: { x: 50, y: 0, z: -30 },

  // Facing magnetic west - negative X, minimal Y
  west: { x: -50, y: 0, z: -30 },

  // Northeast
  northeast: { x: 35, y: 35, z: -30 },

  // Northwest
  northwest: { x: -35, y: 35, z: -30 },

  // Southeast
  southeast: { x: 35, y: -35, z: -30 },

  // Southwest
  southwest: { x: -35, y: -35, z: -30 },

  // Device flat on table (primarily vertical component)
  flat: { x: 0, y: 0, z: -50 },

  // No magnetic field (for testing edge cases)
  zero: { x: 0, y: 0, z: 0 },

  // Strong interference (e.g., near metal/magnets)
  interference: { x: 200, y: 150, z: -100 },
} as const

/**
 * Sensor error types for Generic Sensor API
 */
export const SensorErrorType = {
  NOT_ALLOWED: 'NotAllowedError',
  NOT_READABLE: 'NotReadableError',
  NOT_SUPPORTED: 'NotSupportedError',
} as const
