/**
 * MockResizeObserver - Mock ResizeObserver API for testing
 *
 * Allows testing components that respond to size changes
 */

export interface ResizeObserverEntry {
  target: Element
  contentRect: DOMRectReadOnly
  borderBoxSize?: ReadonlyArray<ResizeObserverSize>
  contentBoxSize?: ReadonlyArray<ResizeObserverSize>
  devicePixelContentBoxSize?: ReadonlyArray<ResizeObserverSize>
}

export interface MockResizeObserverReturn {
  mockObserve: ReturnType<typeof vi.fn>
  mockUnobserve: ReturnType<typeof vi.fn>
  mockDisconnect: ReturnType<typeof vi.fn>
  triggerResize: (
    target: Element,
    contentRect: Partial<DOMRectReadOnly>
  ) => void
  cleanup: () => void
}

/**
 * Sets up mock for ResizeObserver API
 *
 * @example
 * ```typescript
 * import { setupMockResizeObserver } from '@ux.qa/frontmock'
 *
 * const { mockObserve, triggerResize, cleanup } = setupMockResizeObserver()
 *
 * render(<ResponsiveChart />)
 *
 * // Verify observer was set up
 * expect(mockObserve).toHaveBeenCalled()
 *
 * // Trigger resize
 * const chart = screen.getByTestId('chart')
 * triggerResize(chart, {
 *   width: 800,
 *   height: 600,
 *   top: 0,
 *   left: 0,
 *   bottom: 600,
 *   right: 800,
 * })
 *
 * // Chart should respond to new size
 * expect(chart).toHaveStyle({ width: '800px' })
 *
 * cleanup()
 * ```
 */
export function setupMockResizeObserver(): MockResizeObserverReturn {
  const observers = new Map<Element, ResizeObserverCallback>()

  const mockObserve = vi.fn((target: Element) => {
    // Store the observer target
  })

  const mockUnobserve = vi.fn((target: Element) => {
    observers.delete(target)
  })

  const mockDisconnect = vi.fn(() => {
    observers.clear()
  })

  class MockResizeObserver implements ResizeObserver {
    private callback: ResizeObserverCallback

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
    }

    observe(target: Element) {
      mockObserve(target)
      observers.set(target, this.callback)
    }

    unobserve(target: Element) {
      mockUnobserve(target)
      observers.delete(target)
    }

    disconnect() {
      mockDisconnect()
      observers.clear()
    }
  }

  const triggerResize = (
    target: Element,
    contentRect: Partial<DOMRectReadOnly>
  ) => {
    const callback = observers.get(target)
    if (!callback) {
      console.warn('No ResizeObserver registered for target:', target)
      return
    }

    const fullRect: DOMRectReadOnly = {
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
      ...contentRect,
    }

    const entry: ResizeObserverEntry = {
      target,
      contentRect: fullRect,
      borderBoxSize: [
        {
          blockSize: fullRect.height,
          inlineSize: fullRect.width,
        },
      ],
      contentBoxSize: [
        {
          blockSize: fullRect.height,
          inlineSize: fullRect.width,
        },
      ],
      devicePixelContentBoxSize: [
        {
          blockSize: fullRect.height,
          inlineSize: fullRect.width,
        },
      ],
    }

    callback([entry], {} as ResizeObserver)
  }

  const originalResizeObserver = global.ResizeObserver

  // Install mock
  global.ResizeObserver = MockResizeObserver as any

  const cleanup = () => {
    // Restore original
    global.ResizeObserver = originalResizeObserver
    observers.clear()
    mockObserve.mockClear()
    mockUnobserve.mockClear()
    mockDisconnect.mockClear()
  }

  return {
    mockObserve,
    mockUnobserve,
    mockDisconnect,
    triggerResize,
    cleanup,
  }
}

/**
 * Common viewport sizes for testing
 */
export const viewportSizes = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  smallMobile: { width: 320, height: 568 },
  largeMobile: { width: 414, height: 896 },
  smallTablet: { width: 600, height: 960 },
  largeDesktop: { width: 2560, height: 1440 },
} as const
