/**
 * MockIntersectionObserver - Setup helper for IntersectionObserver
 *
 * Mocks IntersectionObserver API for testing
 */

export interface MockIntersectionObserverEntry {
  isIntersecting: boolean
  target: Element
  intersectionRatio?: number
}

/**
 * Setup IntersectionObserver mock
 *
 * @example
 * ```typescript
 * import { setupMockIntersectionObserver } from '@ux.qa/frontmock'
 *
 * const { mockObserve, triggerIntersection } = setupMockIntersectionObserver()
 *
 * render(<LazyComponent />)
 *
 * // Trigger intersection
 * triggerIntersection(screen.getByTestId('lazy-content'), true)
 *
 * expect(mockObserve).toHaveBeenCalled()
 * ```
 */
export function setupMockIntersectionObserver() {
  const observers = new Map<Element, IntersectionObserverCallback>()
  const mockObserve = jest.fn((target: Element) => {
    // Track observed elements
  })
  const mockUnobserve = jest.fn()
  const mockDisconnect = jest.fn()

  class MockIntersectionObserver {
    callback: IntersectionObserverCallback
    options: IntersectionObserverInit

    constructor(
      callback: IntersectionObserverCallback,
      options: IntersectionObserverInit = {}
    ) {
      this.callback = callback
      this.options = options
    }

    observe(target: Element) {
      observers.set(target, this.callback)
      mockObserve(target)
    }

    unobserve(target: Element) {
      observers.delete(target)
      mockUnobserve(target)
    }

    disconnect() {
      observers.clear()
      mockDisconnect()
    }

    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }

  // @ts-ignore
  global.IntersectionObserver = MockIntersectionObserver

  const triggerIntersection = (
    target: Element,
    isIntersecting: boolean,
    intersectionRatio: number = isIntersecting ? 1 : 0
  ) => {
    const callback = observers.get(target)
    if (callback) {
      const entries: MockIntersectionObserverEntry[] = [
        {
          isIntersecting,
          target,
          intersectionRatio,
        } as any,
      ]
      callback(entries as IntersectionObserverEntry[], {} as IntersectionObserver)
    }
  }

  return {
    mockObserve,
    mockUnobserve,
    mockDisconnect,
    triggerIntersection,
    cleanup: () => {
      observers.clear()
    },
  }
}
