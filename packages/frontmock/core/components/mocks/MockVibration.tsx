/**
 * MockVibration - Mock Vibration API for testing
 *
 * Allows testing haptic feedback features without actual device vibration
 */

export type VibrationPattern = number | number[]

export interface VibrationCall {
  pattern: number[]
  timestamp: number
}

export interface MockVibrationReturn {
  mockVibrate: ReturnType<typeof vi.fn>
  getVibrationHistory: () => VibrationCall[]
  isVibrating: () => boolean
  clearVibrationHistory: () => void
  stopVibration: () => void
  cleanup: () => void
}

/**
 * Sets up mock for Vibration API
 *
 * @example
 * ```typescript
 * import { setupMockVibration, VibrationPresets } from '@ux.qa/frontmock'
 *
 * const { mockVibrate, getVibrationHistory, isVibrating, cleanup } = setupMockVibration()
 *
 * render(<HapticButton />)
 *
 * // Click button that triggers vibration
 * await userEvent.click(screen.getByRole('button'))
 *
 * // Verify vibration was triggered
 * expect(mockVibrate).toHaveBeenCalled()
 *
 * // Check vibration history
 * const history = getVibrationHistory()
 * expect(history).toHaveLength(1)
 * expect(history[0].pattern).toEqual([200])
 *
 * // Use preset patterns
 * navigator.vibrate(VibrationPresets.notification)
 * expect(getVibrationHistory()).toHaveLength(2)
 *
 * cleanup()
 * ```
 */
export function setupMockVibration(): MockVibrationReturn {
  const vibrationHistory: VibrationCall[] = []
  let currentlyVibrating = false
  let vibrationTimeout: ReturnType<typeof setTimeout> | null = null

  /**
   * Normalizes vibration pattern to always be an array
   */
  const normalizePattern = (pattern: VibrationPattern): number[] => {
    if (typeof pattern === 'number') {
      return [pattern]
    }
    return [...pattern]
  }

  /**
   * Calculates total vibration duration from pattern
   * Pattern alternates: vibrate, pause, vibrate, pause, ...
   */
  const calculateDuration = (pattern: number[]): number => {
    return pattern.reduce((sum, value) => sum + value, 0)
  }

  const mockVibrate = vi.fn((pattern: VibrationPattern): boolean => {
    // Cancel any ongoing vibration
    if (vibrationTimeout) {
      clearTimeout(vibrationTimeout)
      vibrationTimeout = null
    }

    const normalizedPattern = normalizePattern(pattern)

    // Vibration with 0 or empty array cancels vibration
    if (
      normalizedPattern.length === 0 ||
      (normalizedPattern.length === 1 && normalizedPattern[0] === 0)
    ) {
      currentlyVibrating = false
      return true
    }

    // Record the vibration call
    vibrationHistory.push({
      pattern: normalizedPattern,
      timestamp: Date.now(),
    })

    currentlyVibrating = true

    // Simulate vibration ending after the pattern completes
    const duration = calculateDuration(normalizedPattern)
    vibrationTimeout = setTimeout(() => {
      currentlyVibrating = false
      vibrationTimeout = null
    }, duration)

    return true
  })

  // Save original vibrate function
  const originalVibrate = navigator.vibrate?.bind(navigator)

  // Install mock
  Object.defineProperty(navigator, 'vibrate', {
    writable: true,
    configurable: true,
    value: mockVibrate,
  })

  const getVibrationHistory = (): VibrationCall[] => {
    return [...vibrationHistory]
  }

  const isVibrating = (): boolean => {
    return currentlyVibrating
  }

  const clearVibrationHistory = (): void => {
    vibrationHistory.length = 0
  }

  const stopVibration = (): void => {
    if (vibrationTimeout) {
      clearTimeout(vibrationTimeout)
      vibrationTimeout = null
    }
    currentlyVibrating = false
  }

  const cleanup = (): void => {
    // Cancel any ongoing vibration simulation
    stopVibration()

    // Restore original
    Object.defineProperty(navigator, 'vibrate', {
      writable: true,
      configurable: true,
      value: originalVibrate,
    })

    // Clear history and mock
    vibrationHistory.length = 0
    mockVibrate.mockClear()
  }

  return {
    mockVibrate,
    getVibrationHistory,
    isVibrating,
    clearVibrationHistory,
    stopVibration,
    cleanup,
  }
}

/**
 * Common vibration pattern presets for testing
 *
 * Patterns are arrays where:
 * - Odd indices (0, 2, 4...) are vibration durations in ms
 * - Even indices (1, 3, 5...) are pause durations in ms
 */
export const VibrationPresets = {
  /** Short single vibration (100ms) */
  short: [100] as number[],

  /** Long single vibration (500ms) */
  long: [500] as number[],

  /** Double tap pattern */
  doubleTap: [100, 50, 100] as number[],

  /** Triple tap pattern */
  tripleTap: [100, 50, 100, 50, 100] as number[],

  /** Notification pattern */
  notification: [200, 100, 200] as number[],

  /** Alert/warning pattern */
  alert: [300, 100, 300, 100, 300] as number[],

  /** SOS pattern (... --- ...) */
  sos: [
    100, 50, 100, 50, 100, // S: ...
    150,
    300, 50, 300, 50, 300, // O: ---
    150,
    100, 50, 100, 50, 100, // S: ...
  ] as number[],

  /** Success confirmation */
  success: [50, 50, 150] as number[],

  /** Error feedback */
  error: [100, 100, 100, 100, 300] as number[],

  /** Heartbeat pattern */
  heartbeat: [100, 100, 200, 400] as number[],
} as const

/**
 * Type for vibration preset keys
 */
export type VibrationPresetKey = keyof typeof VibrationPresets
