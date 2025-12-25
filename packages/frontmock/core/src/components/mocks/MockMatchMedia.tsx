/**
 * MockMatchMedia - Mock window.matchMedia for testing responsive designs
 *
 * Allows testing different viewport sizes and media queries
 */

export interface MediaQueryListMock {
  matches: boolean
  media: string
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null
  addListener: (listener: (e: MediaQueryListEvent) => void) => void
  removeListener: (listener: (e: MediaQueryListEvent) => void) => void
  addEventListener: (type: string, listener: (e: MediaQueryListEvent) => void) => void
  removeEventListener: (type: string, listener: (e: MediaQueryListEvent) => void) => void
  dispatchEvent: (event: Event) => boolean
}

export interface MockMatchMediaReturn {
  mockMatchMedia: (query: string) => MediaQueryListMock
  setMatches: (query: string, matches: boolean) => void
  cleanup: () => void
}

/**
 * Sets up mock for window.matchMedia to test responsive behavior
 *
 * @example
 * ```typescript
 * import { setupMockMatchMedia } from '@ux.qa/frontmock'
 *
 * const { setMatches, cleanup } = setupMockMatchMedia()
 *
 * // Default desktop
 * render(<ResponsiveComponent />)
 * expect(screen.getByText('Desktop View')).toBeInTheDocument()
 *
 * // Switch to mobile
 * setMatches('(max-width: 768px)', true)
 * expect(screen.getByText('Mobile View')).toBeInTheDocument()
 *
 * // Cleanup
 * cleanup()
 * ```
 */
export function setupMockMatchMedia(): MockMatchMediaReturn {
  const listeners = new Map<string, Set<(e: MediaQueryListEvent) => void>>()
  const queries = new Map<string, boolean>()

  const createMediaQueryList = (query: string): MediaQueryListMock => {
    const matches = queries.get(query) ?? false

    const list: MediaQueryListMock = {
      matches,
      media: query,
      onchange: null,
      addListener: (listener) => {
        if (!listeners.has(query)) {
          listeners.set(query, new Set())
        }
        listeners.get(query)!.add(listener)
      },
      removeListener: (listener) => {
        listeners.get(query)?.delete(listener)
      },
      addEventListener: (type, listener) => {
        if (type === 'change') {
          if (!listeners.has(query)) {
            listeners.set(query, new Set())
          }
          listeners.get(query)!.add(listener)
        }
      },
      removeEventListener: (type, listener) => {
        if (type === 'change') {
          listeners.get(query)?.delete(listener)
        }
      },
      dispatchEvent: () => true,
    }

    return list
  }

  const mockMatchMedia = (query: string): MediaQueryListMock => {
    return createMediaQueryList(query)
  }

  const setMatches = (query: string, matches: boolean) => {
    queries.set(query, matches)

    // Trigger listeners
    const queryListeners = listeners.get(query)
    if (queryListeners) {
      const event = {
        matches,
        media: query,
      } as MediaQueryListEvent

      queryListeners.forEach((listener) => {
        listener(event)
      })
    }
  }

  const originalMatchMedia = window.matchMedia

  // Install mock
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
  })

  const cleanup = () => {
    // Restore original
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    })
    listeners.clear()
    queries.clear()
  }

  return {
    mockMatchMedia,
    setMatches,
    cleanup,
  }
}

/**
 * Common media query presets for convenience
 */
export const mediaQueries = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  touch: '(hover: none) and (pointer: coarse)',
  mouse: '(hover: hover) and (pointer: fine)',
  darkMode: '(prefers-color-scheme: dark)',
  lightMode: '(prefers-color-scheme: light)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  highContrast: '(prefers-contrast: high)',
} as const
