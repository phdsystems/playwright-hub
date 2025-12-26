/**
 * MockPerformanceObserver - Mock PerformanceObserver API for testing
 *
 * Allows testing performance monitoring features without actual browser metrics
 */

export type PerformanceEntryType =
  | 'mark'
  | 'measure'
  | 'navigation'
  | 'resource'
  | 'paint'
  | 'largest-contentful-paint'
  | 'first-input'
  | 'layout-shift'
  | 'longtask'
  | 'element'

export interface MockPerformanceEntry {
  name: string
  entryType: PerformanceEntryType
  startTime: number
  duration: number
  // Additional properties for specific entry types
  processingStart?: number // first-input
  processingEnd?: number // first-input
  value?: number // layout-shift (CLS)
  hadRecentInput?: boolean // layout-shift
  size?: number // largest-contentful-paint
  element?: Element | null // largest-contentful-paint, element
  renderTime?: number // largest-contentful-paint
  loadTime?: number // largest-contentful-paint
  id?: string // largest-contentful-paint
  url?: string // largest-contentful-paint, resource
  initiatorType?: string // resource
  transferSize?: number // resource, navigation
  encodedBodySize?: number // resource, navigation
  decodedBodySize?: number // resource, navigation
  domComplete?: number // navigation
  domContentLoadedEventEnd?: number // navigation
  domContentLoadedEventStart?: number // navigation
  domInteractive?: number // navigation
  loadEventEnd?: number // navigation
  loadEventStart?: number // navigation
  redirectCount?: number // navigation
  type?: string // navigation
}

export interface MockPerformanceObserverReturn {
  mockObserve: ReturnType<typeof vi.fn>
  mockDisconnect: ReturnType<typeof vi.fn>
  mockTakeRecords: ReturnType<typeof vi.fn>
  triggerEntries: (entries: MockPerformanceEntry[]) => void
  getObservedTypes: () => Set<PerformanceEntryType>
  getObservers: () => MockObserverInstance[]
  cleanup: () => void
}

export interface MockObserverInstance {
  callback: PerformanceObserverCallback
  options: PerformanceObserverInit | null
  entries: MockPerformanceEntry[]
}

interface PerformanceObserverCallback {
  (entries: PerformanceObserverEntryList, observer: PerformanceObserver): void
}

/**
 * Sets up mock for PerformanceObserver API
 *
 * @example
 * ```typescript
 * import { setupMockPerformanceObserver, PerformanceEntryPresets } from '@ux.qa/frontmock'
 *
 * const { triggerEntries, cleanup } = setupMockPerformanceObserver()
 *
 * render(<PerformanceMonitor />)
 *
 * // Trigger LCP entry
 * triggerEntries([PerformanceEntryPresets.lcp(2500)])
 *
 * // Verify component displays LCP value
 * expect(screen.getByText(/LCP: 2500ms/i)).toBeInTheDocument()
 *
 * // Trigger CLS entry
 * triggerEntries([PerformanceEntryPresets.cls(0.1)])
 *
 * // Verify CLS displayed
 * expect(screen.getByText(/CLS: 0.1/i)).toBeInTheDocument()
 *
 * cleanup()
 * ```
 *
 * @example
 * ```typescript
 * // Testing with specific entry types
 * const { triggerEntries, getObservedTypes, cleanup } = setupMockPerformanceObserver()
 *
 * // Component registers observer for paint entries
 * render(<PaintTimingDisplay />)
 *
 * // Verify observer is watching paint entries
 * expect(getObservedTypes().has('paint')).toBe(true)
 *
 * // Trigger first-paint and first-contentful-paint
 * triggerEntries([
 *   { name: 'first-paint', entryType: 'paint', startTime: 100, duration: 0 },
 *   { name: 'first-contentful-paint', entryType: 'paint', startTime: 150, duration: 0 }
 * ])
 *
 * expect(screen.getByText(/FP: 100ms/i)).toBeInTheDocument()
 * expect(screen.getByText(/FCP: 150ms/i)).toBeInTheDocument()
 *
 * cleanup()
 * ```
 */
export function setupMockPerformanceObserver(): MockPerformanceObserverReturn {
  const observers: MockObserverInstance[] = []
  const observedTypes = new Set<PerformanceEntryType>()

  const mockObserve = vi.fn((options: PerformanceObserverInit) => {
    const observer = observers[observers.length - 1]
    if (observer) {
      observer.options = options
      if (options.entryTypes) {
        options.entryTypes.forEach((type) => observedTypes.add(type as PerformanceEntryType))
      }
      if (options.type) {
        observedTypes.add(options.type as PerformanceEntryType)
      }
    }
  })

  const mockDisconnect = vi.fn(() => {
    const observer = observers[observers.length - 1]
    if (observer) {
      observer.options = null
    }
  })

  const mockTakeRecords = vi.fn((): PerformanceEntryList => {
    const observer = observers[observers.length - 1]
    if (observer) {
      const entries = [...observer.entries]
      observer.entries = []
      return entries as unknown as PerformanceEntryList
    }
    return [] as unknown as PerformanceEntryList
  })

  // Create mock PerformanceObserverEntryList
  const createEntryList = (entries: MockPerformanceEntry[]): PerformanceObserverEntryList => {
    return {
      getEntries: () => entries as unknown as PerformanceEntryList,
      getEntriesByName: (name: string, type?: string) =>
        entries.filter(
          (e) => e.name === name && (!type || e.entryType === type)
        ) as unknown as PerformanceEntryList,
      getEntriesByType: (type: string) =>
        entries.filter((e) => e.entryType === type) as unknown as PerformanceEntryList,
    }
  }

  // Save original PerformanceObserver
  const OriginalPerformanceObserver = globalThis.PerformanceObserver

  // Create mock PerformanceObserver constructor
  const MockPerformanceObserverClass = vi.fn(function (
    this: PerformanceObserver,
    callback: PerformanceObserverCallback
  ) {
    const instance: MockObserverInstance = {
      callback,
      options: null,
      entries: [],
    }
    observers.push(instance)

    return {
      observe: mockObserve,
      disconnect: mockDisconnect,
      takeRecords: mockTakeRecords,
    }
  }) as unknown as typeof PerformanceObserver

  // Add static properties
  ;(MockPerformanceObserverClass as unknown as { supportedEntryTypes: readonly string[] }).supportedEntryTypes = [
    'element',
    'event',
    'first-input',
    'largest-contentful-paint',
    'layout-shift',
    'longtask',
    'mark',
    'measure',
    'navigation',
    'paint',
    'resource',
  ]

  // Install mock
  globalThis.PerformanceObserver = MockPerformanceObserverClass

  const triggerEntries = (entries: MockPerformanceEntry[]) => {
    observers.forEach((observer) => {
      if (!observer.options) return

      // Filter entries by observed types
      const filteredEntries = entries.filter((entry) => {
        if (observer.options?.entryTypes) {
          return observer.options.entryTypes.includes(entry.entryType)
        }
        if (observer.options?.type) {
          return observer.options.type === entry.entryType
        }
        return true
      })

      if (filteredEntries.length > 0) {
        // Store entries for takeRecords
        observer.entries.push(...filteredEntries)

        // Create mock observer for callback
        const mockObserverRef = {
          observe: mockObserve,
          disconnect: mockDisconnect,
          takeRecords: mockTakeRecords,
        } as unknown as PerformanceObserver

        // Invoke callback with filtered entries
        observer.callback(createEntryList(filteredEntries), mockObserverRef)
      }
    })
  }

  const getObservedTypes = () => new Set(observedTypes)

  const getObservers = () => [...observers]

  const cleanup = () => {
    // Restore original
    globalThis.PerformanceObserver = OriginalPerformanceObserver
    observers.length = 0
    observedTypes.clear()
    mockObserve.mockClear()
    mockDisconnect.mockClear()
    mockTakeRecords.mockClear()
  }

  return {
    mockObserve,
    mockDisconnect,
    mockTakeRecords,
    triggerEntries,
    getObservedTypes,
    getObservers,
    cleanup,
  }
}

/**
 * Preset factory functions for common performance entries
 */
export const PerformanceEntryPresets = {
  /**
   * Largest Contentful Paint (LCP) entry
   * Good: < 2500ms, Needs Improvement: 2500-4000ms, Poor: > 4000ms
   */
  lcp: (startTime: number, options?: Partial<MockPerformanceEntry>): MockPerformanceEntry => ({
    name: '',
    entryType: 'largest-contentful-paint',
    startTime,
    duration: 0,
    size: 50000,
    renderTime: startTime,
    loadTime: startTime - 50,
    element: null,
    id: '',
    url: '',
    ...options,
  }),

  /**
   * First Input Delay (FID) entry
   * Good: < 100ms, Needs Improvement: 100-300ms, Poor: > 300ms
   */
  fid: (processingDelay: number, options?: Partial<MockPerformanceEntry>): MockPerformanceEntry => ({
    name: 'mousedown',
    entryType: 'first-input',
    startTime: 1000,
    duration: processingDelay,
    processingStart: 1000 + processingDelay,
    processingEnd: 1000 + processingDelay + 5,
    ...options,
  }),

  /**
   * Cumulative Layout Shift (CLS) entry
   * Good: < 0.1, Needs Improvement: 0.1-0.25, Poor: > 0.25
   */
  cls: (value: number, options?: Partial<MockPerformanceEntry>): MockPerformanceEntry => ({
    name: '',
    entryType: 'layout-shift',
    startTime: 500,
    duration: 0,
    value,
    hadRecentInput: false,
    ...options,
  }),

  /**
   * First Paint entry
   */
  firstPaint: (startTime: number): MockPerformanceEntry => ({
    name: 'first-paint',
    entryType: 'paint',
    startTime,
    duration: 0,
  }),

  /**
   * First Contentful Paint entry
   * Good: < 1800ms, Needs Improvement: 1800-3000ms, Poor: > 3000ms
   */
  fcp: (startTime: number): MockPerformanceEntry => ({
    name: 'first-contentful-paint',
    entryType: 'paint',
    startTime,
    duration: 0,
  }),

  /**
   * Navigation timing entry
   */
  navigation: (options?: Partial<MockPerformanceEntry>): MockPerformanceEntry => ({
    name: 'navigation',
    entryType: 'navigation',
    startTime: 0,
    duration: 1500,
    domComplete: 1400,
    domContentLoadedEventEnd: 800,
    domContentLoadedEventStart: 750,
    domInteractive: 600,
    loadEventEnd: 1500,
    loadEventStart: 1450,
    redirectCount: 0,
    type: 'navigate',
    transferSize: 50000,
    encodedBodySize: 45000,
    decodedBodySize: 150000,
    ...options,
  }),

  /**
   * Resource timing entry
   */
  resource: (
    name: string,
    options?: Partial<MockPerformanceEntry>
  ): MockPerformanceEntry => ({
    name,
    entryType: 'resource',
    startTime: 100,
    duration: 200,
    initiatorType: 'script',
    transferSize: 10000,
    encodedBodySize: 9500,
    decodedBodySize: 30000,
    ...options,
  }),

  /**
   * Performance mark entry
   */
  mark: (name: string, startTime: number): MockPerformanceEntry => ({
    name,
    entryType: 'mark',
    startTime,
    duration: 0,
  }),

  /**
   * Performance measure entry
   */
  measure: (
    name: string,
    startTime: number,
    duration: number
  ): MockPerformanceEntry => ({
    name,
    entryType: 'measure',
    startTime,
    duration,
  }),

  /**
   * Long task entry
   * Tasks > 50ms are considered long tasks
   */
  longtask: (startTime: number, duration: number): MockPerformanceEntry => ({
    name: 'self',
    entryType: 'longtask',
    startTime,
    duration,
  }),
} as const

/**
 * Core Web Vitals thresholds for reference
 */
export const CoreWebVitalsThresholds = {
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  FID: {
    good: 100,
    needsImprovement: 300,
  },
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
  INP: {
    good: 200,
    needsImprovement: 500,
  },
} as const

/**
 * Helper to create a good/poor performance scenario
 */
export const PerformanceScenarios = {
  /**
   * Scenario with good Core Web Vitals
   */
  goodPerformance: (): MockPerformanceEntry[] => [
    PerformanceEntryPresets.fcp(1200),
    PerformanceEntryPresets.lcp(2000),
    PerformanceEntryPresets.fid(50),
    PerformanceEntryPresets.cls(0.05),
  ],

  /**
   * Scenario with poor Core Web Vitals
   */
  poorPerformance: (): MockPerformanceEntry[] => [
    PerformanceEntryPresets.fcp(3500),
    PerformanceEntryPresets.lcp(5000),
    PerformanceEntryPresets.fid(350),
    PerformanceEntryPresets.cls(0.35),
  ],

  /**
   * Scenario simulating slow network
   */
  slowNetwork: (): MockPerformanceEntry[] => [
    PerformanceEntryPresets.resource('https://example.com/bundle.js', {
      duration: 3000,
      transferSize: 500000,
    }),
    PerformanceEntryPresets.resource('https://example.com/styles.css', {
      duration: 1500,
      transferSize: 50000,
    }),
    PerformanceEntryPresets.lcp(4500),
  ],

  /**
   * Scenario with layout shifts
   */
  layoutShifts: (): MockPerformanceEntry[] => [
    PerformanceEntryPresets.cls(0.05, { startTime: 500 }),
    PerformanceEntryPresets.cls(0.08, { startTime: 1200 }),
    PerformanceEntryPresets.cls(0.12, { startTime: 2000 }),
  ],
} as const
