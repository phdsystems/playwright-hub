/**
 * FrontMock - Modern frontend testing framework
 *
 * 20+ reusable test components including mock media, canvas, WebSocket,
 * clipboard, storage, and more. Unified API works with Vitest, Jest, or Bun.
 *
 * @example
 * ```typescript
 * import { t } from '@ux.qa/frontmock'
 *
 * const { describe, it, expect, render, screen } = t
 *
 * describe('MyComponent', () => {
 *   it('renders correctly', () => {
 *     render(<MyComponent />)
 *     expect(screen.getByText('Hello')).toBeInTheDocument()
 *   })
 * })
 * ```
 *
 * @example Using test components
 * ```typescript
 * import { MockVideo, setupMockWebSocket } from '@ux.qa/frontmock'
 *
 * const { triggerMessage } = setupMockWebSocket()
 *
 * render(<ChatApp />)
 * triggerMessage({ text: 'Hello!' })
 * ```
 */

// Re-export types
export * from './types'

// Re-export providers
export * from './providers/vitest'
export * from './providers/bun'

// Re-export utilities
export * from './utilities'

// Re-export test components
export * from './components'

// Re-export main provider instance
export { t, testing } from './provider'
