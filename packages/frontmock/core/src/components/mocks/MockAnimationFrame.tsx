/**
 * MockAnimationFrame - Mock requestAnimationFrame and cancelAnimationFrame
 *
 * Provides control over animation timing in tests
 */

export interface MockAnimationFrameReturn {
  mockRequestAnimationFrame: ReturnType<typeof vi.fn>
  mockCancelAnimationFrame: ReturnType<typeof vi.fn>
  triggerNextFrame: (timestamp?: number) => void
  triggerFrames: (count: number, timestampIncrement?: number) => void
  getScheduledCallbacks: () => FrameRequestCallback[]
  clearScheduledCallbacks: () => void
  cleanup: () => void
}

/**
 * Sets up mock for requestAnimationFrame and cancelAnimationFrame
 *
 * @example
 * ```typescript
 * import { setupMockAnimationFrame } from '@ux.qa/frontmock'
 *
 * const { triggerNextFrame, triggerFrames, cleanup } = setupMockAnimationFrame()
 *
 * render(<AnimatedComponent />)
 *
 * // Component starts animation
 * await user.click(screen.getByRole('button', { name: /start/i }))
 *
 * // Trigger single frame
 * triggerNextFrame()
 *
 * // Verify animation progressed
 * expect(screen.getByTestId('progress')).toHaveTextContent('1')
 *
 * // Trigger multiple frames
 * triggerFrames(10)
 *
 * expect(screen.getByTestId('progress')).toHaveTextContent('11')
 *
 * cleanup()
 * ```
 */
export function setupMockAnimationFrame(): MockAnimationFrameReturn {
  let frameId = 0
  let currentTimestamp = 0
  const callbacks = new Map<number, FrameRequestCallback>()

  const mockRequestAnimationFrame = vi.fn((callback: FrameRequestCallback): number => {
    frameId++
    callbacks.set(frameId, callback)
    return frameId
  })

  const mockCancelAnimationFrame = vi.fn((id: number) => {
    callbacks.delete(id)
  })

  const originalRequestAnimationFrame = window.requestAnimationFrame
  const originalCancelAnimationFrame = window.cancelAnimationFrame

  // Install mocks
  window.requestAnimationFrame = mockRequestAnimationFrame
  window.cancelAnimationFrame = mockCancelAnimationFrame

  const triggerNextFrame = (timestamp?: number) => {
    if (timestamp !== undefined) {
      currentTimestamp = timestamp
    } else {
      currentTimestamp += 16.67 // ~60fps
    }

    // Execute all scheduled callbacks
    const callbacksToExecute = Array.from(callbacks.entries())
    callbacks.clear()

    callbacksToExecute.forEach(([id, callback]) => {
      callback(currentTimestamp)
    })
  }

  const triggerFrames = (count: number, timestampIncrement: number = 16.67) => {
    for (let i = 0; i < count; i++) {
      currentTimestamp += timestampIncrement
      triggerNextFrame(currentTimestamp)
    }
  }

  const getScheduledCallbacks = () => {
    return Array.from(callbacks.values())
  }

  const clearScheduledCallbacks = () => {
    callbacks.clear()
  }

  const cleanup = () => {
    // Restore originals
    window.requestAnimationFrame = originalRequestAnimationFrame
    window.cancelAnimationFrame = originalCancelAnimationFrame
    clearScheduledCallbacks()
    mockRequestAnimationFrame.mockClear()
    mockCancelAnimationFrame.mockClear()
    currentTimestamp = 0
    frameId = 0
  }

  return {
    mockRequestAnimationFrame,
    mockCancelAnimationFrame,
    triggerNextFrame,
    triggerFrames,
    getScheduledCallbacks,
    clearScheduledCallbacks,
    cleanup,
  }
}

/**
 * Helper to wait for animation frames in tests
 *
 * @example
 * ```typescript
 * import { waitForAnimationFrames } from '@ux.qa/frontmock'
 *
 * render(<AnimatedComponent />)
 *
 * // Start animation
 * await user.click(screen.getByRole('button', { name: /animate/i }))
 *
 * // Wait for 3 frames
 * await waitForAnimationFrames(3)
 *
 * // Verify animation state
 * expect(screen.getByTestId('position')).toHaveTextContent('150px')
 * ```
 */
export async function waitForAnimationFrames(count: number = 1): Promise<void> {
  for (let i = 0; i < count; i++) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
  }
}

/**
 * Mock performance.now() for consistent timing
 *
 * @example
 * ```typescript
 * import { setupMockPerformanceNow } from '@ux.qa/frontmock'
 *
 * const { setTime, advanceTime, cleanup } = setupMockPerformanceNow()
 *
 * // Set initial time
 * setTime(0)
 *
 * render(<Timer />)
 *
 * // Advance time by 1 second
 * advanceTime(1000)
 *
 * expect(screen.getByText('1.00s')).toBeInTheDocument()
 *
 * cleanup()
 * ```
 */
export function setupMockPerformanceNow() {
  let currentTime = 0

  const mockPerformanceNow = vi.fn(() => currentTime)

  const originalPerformanceNow = performance.now

  // Install mock
  performance.now = mockPerformanceNow

  const setTime = (time: number) => {
    currentTime = time
  }

  const advanceTime = (delta: number) => {
    currentTime += delta
  }

  const getTime = () => currentTime

  const cleanup = () => {
    // Restore original
    performance.now = originalPerformanceNow
    mockPerformanceNow.mockClear()
    currentTime = 0
  }

  return {
    mockPerformanceNow,
    setTime,
    advanceTime,
    getTime,
    cleanup,
  }
}

/**
 * Common frame rates for testing
 */
export const FrameRate = {
  FPS_60: 16.67, // 1000ms / 60fps
  FPS_30: 33.33, // 1000ms / 30fps
  FPS_24: 41.67, // 1000ms / 24fps (cinema)
  FPS_120: 8.33, // 1000ms / 120fps
  FPS_144: 6.94, // 1000ms / 144fps (gaming)
} as const
