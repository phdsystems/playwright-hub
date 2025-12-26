/**
 * MockBeacon - Mock Navigator Beacon API for testing
 *
 * Allows testing analytics and tracking features without actual network requests
 */

export interface BeaconCall {
  url: string
  data: BodyInit | null | undefined
  timestamp: number
}

export interface MockBeaconOptions {
  /** Whether sendBeacon should return true (success) or false (failure) */
  shouldSucceed?: boolean
  /** Simulate quota exceeded after this many calls */
  quotaLimit?: number
}

export interface MockBeaconReturn {
  mockSendBeacon: ReturnType<typeof vi.fn>
  getBeaconCalls: () => BeaconCall[]
  clearBeaconHistory: () => void
  setSuccess: (shouldSucceed: boolean) => void
  setQuotaLimit: (limit: number | null) => void
  simulateQuotaExceeded: () => void
  cleanup: () => void
}

/**
 * Sets up mock for Navigator Beacon API
 *
 * @example
 * ```typescript
 * import { setupMockBeacon } from '@ux.qa/frontmock'
 *
 * const { getBeaconCalls, setSuccess, cleanup } = setupMockBeacon()
 *
 * render(<AnalyticsComponent />)
 *
 * // Trigger analytics event
 * fireEvent.click(screen.getByText('Track Event'))
 *
 * // Verify beacon was sent
 * const calls = getBeaconCalls()
 * expect(calls).toHaveLength(1)
 * expect(calls[0].url).toContain('/analytics')
 *
 * // Test failure scenario
 * setSuccess(false)
 * fireEvent.click(screen.getByText('Track Event'))
 * // Component should handle failed beacon
 *
 * cleanup()
 * ```
 *
 * @example
 * ```typescript
 * // Testing quota exceeded scenario
 * const { setQuotaLimit, getBeaconCalls, cleanup } = setupMockBeacon({
 *   quotaLimit: 3
 * })
 *
 * // First 3 calls succeed
 * navigator.sendBeacon('/analytics', 'data1') // true
 * navigator.sendBeacon('/analytics', 'data2') // true
 * navigator.sendBeacon('/analytics', 'data3') // true
 *
 * // 4th call fails due to quota
 * const result = navigator.sendBeacon('/analytics', 'data4') // false
 * expect(result).toBe(false)
 *
 * cleanup()
 * ```
 */
export function setupMockBeacon(options: MockBeaconOptions = {}): MockBeaconReturn {
  const beaconCalls: BeaconCall[] = []
  let shouldSucceed = options.shouldSucceed ?? true
  let quotaLimit: number | null = options.quotaLimit ?? null
  let quotaExceeded = false

  const mockSendBeacon = vi.fn((url: string, data?: BodyInit | null): boolean => {
    // Check quota limit
    if (quotaExceeded || (quotaLimit !== null && beaconCalls.length >= quotaLimit)) {
      quotaExceeded = true
      return false
    }

    // Record the call
    beaconCalls.push({
      url,
      data,
      timestamp: Date.now(),
    })

    return shouldSucceed
  })

  const originalSendBeacon = navigator.sendBeacon

  // Install mock
  Object.defineProperty(navigator, 'sendBeacon', {
    writable: true,
    configurable: true,
    value: mockSendBeacon,
  })

  const getBeaconCalls = (): BeaconCall[] => {
    return [...beaconCalls]
  }

  const clearBeaconHistory = (): void => {
    beaconCalls.length = 0
    quotaExceeded = false
  }

  const setSuccess = (value: boolean): void => {
    shouldSucceed = value
  }

  const setQuotaLimit = (limit: number | null): void => {
    quotaLimit = limit
    if (limit === null || beaconCalls.length < limit) {
      quotaExceeded = false
    }
  }

  const simulateQuotaExceeded = (): void => {
    quotaExceeded = true
  }

  const cleanup = (): void => {
    // Restore original
    Object.defineProperty(navigator, 'sendBeacon', {
      writable: true,
      configurable: true,
      value: originalSendBeacon,
    })
    beaconCalls.length = 0
    mockSendBeacon.mockClear()
  }

  return {
    mockSendBeacon,
    getBeaconCalls,
    clearBeaconHistory,
    setSuccess,
    setQuotaLimit,
    simulateQuotaExceeded,
    cleanup,
  }
}

/**
 * Common analytics endpoint patterns for testing
 */
export const BeaconEndpoints = {
  googleAnalytics: 'https://www.google-analytics.com/collect',
  facebookPixel: 'https://www.facebook.com/tr',
  mixpanel: 'https://api.mixpanel.com/track',
  segment: 'https://api.segment.io/v1/track',
  amplitude: 'https://api.amplitude.com/2/httpapi',
  custom: '/api/analytics',
} as const

/**
 * Beacon error scenarios for testing
 */
export const BeaconErrorScenarios = {
  /** Simulates browser quota exceeded */
  QUOTA_EXCEEDED: 'quota_exceeded',
  /** Simulates network failure */
  NETWORK_FAILURE: 'network_failure',
  /** Simulates invalid URL */
  INVALID_URL: 'invalid_url',
} as const
