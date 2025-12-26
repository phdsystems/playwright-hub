/**
 * MockScreenOrientation - Mock Screen Orientation API for testing
 *
 * Allows testing orientation-dependent features without device rotation
 */

export type OrientationType =
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary'

export interface MockScreenOrientationReturn {
  mockLock: ReturnType<typeof vi.fn>
  mockUnlock: ReturnType<typeof vi.fn>
  setOrientation: (type: OrientationType, angle: number) => void
  getOrientation: () => { type: OrientationType; angle: number }
  triggerChange: () => void
  cleanup: () => void
}

/**
 * Sets up mock for Screen Orientation API
 *
 * @example
 * ```typescript
 * import { setupMockScreenOrientation, OrientationPresets } from '@ux.qa/frontmock'
 *
 * const { setOrientation, triggerChange, cleanup } = setupMockScreenOrientation()
 *
 * render(<ResponsiveLayout />)
 *
 * // Set landscape orientation
 * setOrientation('landscape-primary', 90)
 * triggerChange()
 *
 * // Verify layout changed to landscape mode
 * expect(screen.getByTestId('landscape-layout')).toBeInTheDocument()
 *
 * // Use preset for portrait
 * setOrientation(OrientationPresets.portrait.type, OrientationPresets.portrait.angle)
 * triggerChange()
 *
 * cleanup()
 * ```
 */
export function setupMockScreenOrientation(): MockScreenOrientationReturn {
  let currentType: OrientationType = 'portrait-primary'
  let currentAngle = 0
  let onchangeHandler: ((event: Event) => void) | null = null

  const mockLock = vi.fn((orientation: OrientationLockType): Promise<void> => {
    // Map lock type to actual orientation
    switch (orientation) {
      case 'portrait':
      case 'portrait-primary':
        currentType = 'portrait-primary'
        currentAngle = 0
        break
      case 'portrait-secondary':
        currentType = 'portrait-secondary'
        currentAngle = 180
        break
      case 'landscape':
      case 'landscape-primary':
        currentType = 'landscape-primary'
        currentAngle = 90
        break
      case 'landscape-secondary':
        currentType = 'landscape-secondary'
        currentAngle = 270
        break
      case 'any':
      case 'natural':
        // Keep current orientation
        break
    }
    return Promise.resolve()
  })

  const mockUnlock = vi.fn(() => {
    // Unlocking doesn't change orientation, just allows rotation
  })

  // Save original screen.orientation if it exists
  const originalOrientation = screen.orientation

  // Create mock orientation object
  const mockOrientation = {
    get type(): OrientationType {
      return currentType
    },
    get angle(): number {
      return currentAngle
    },
    lock: mockLock,
    unlock: mockUnlock,
    get onchange(): ((event: Event) => void) | null {
      return onchangeHandler
    },
    set onchange(handler: ((event: Event) => void) | null) {
      onchangeHandler = handler
    },
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      if (type === 'change') {
        onchangeHandler = listener as (event: Event) => void
      }
    }),
    removeEventListener: vi.fn((type: string, listener: EventListener) => {
      if (type === 'change' && onchangeHandler === listener) {
        onchangeHandler = null
      }
    }),
    dispatchEvent: vi.fn((event: Event): boolean => {
      if (event.type === 'change' && onchangeHandler) {
        onchangeHandler(event)
      }
      return true
    }),
  }

  // Install mock
  Object.defineProperty(screen, 'orientation', {
    writable: true,
    configurable: true,
    value: mockOrientation,
  })

  const setOrientation = (type: OrientationType, angle: number) => {
    currentType = type
    currentAngle = angle
  }

  const getOrientation = () => {
    return { type: currentType, angle: currentAngle }
  }

  const triggerChange = () => {
    const event = new Event('change')
    if (onchangeHandler) {
      onchangeHandler(event)
    }
    mockOrientation.dispatchEvent(event)
  }

  const cleanup = () => {
    // Restore original
    Object.defineProperty(screen, 'orientation', {
      writable: true,
      configurable: true,
      value: originalOrientation,
    })
    onchangeHandler = null
    mockLock.mockClear()
    mockUnlock.mockClear()
    mockOrientation.addEventListener.mockClear()
    mockOrientation.removeEventListener.mockClear()
    mockOrientation.dispatchEvent.mockClear()
  }

  return {
    mockLock,
    mockUnlock,
    setOrientation,
    getOrientation,
    triggerChange,
    cleanup,
  }
}

/**
 * Common orientation presets for testing
 */
export const OrientationPresets = {
  portrait: { type: 'portrait-primary' as OrientationType, angle: 0 },
  portraitUpsideDown: { type: 'portrait-secondary' as OrientationType, angle: 180 },
  landscapeLeft: { type: 'landscape-primary' as OrientationType, angle: 90 },
  landscapeRight: { type: 'landscape-secondary' as OrientationType, angle: 270 },
  // Aliases for convenience
  default: { type: 'portrait-primary' as OrientationType, angle: 0 },
  landscape: { type: 'landscape-primary' as OrientationType, angle: 90 },
} as const

/**
 * Orientation angle constants
 */
export const OrientationAngles = {
  PORTRAIT: 0,
  LANDSCAPE_LEFT: 90,
  PORTRAIT_UPSIDE_DOWN: 180,
  LANDSCAPE_RIGHT: 270,
} as const
