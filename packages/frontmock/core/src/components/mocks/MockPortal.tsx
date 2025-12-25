/**
 * MockPortal - Mock portal component for testing
 *
 * Renders portal content inline instead of using document.body
 */

import React from 'react'

export interface MockPortalProps {
  children: React.ReactNode
  containerId?: string
}

/**
 * Mock portal that renders inline (no actual portal creation)
 *
 * @example
 * ```typescript
 * import { MockPortal } from '@ux.qa/frontmock'
 *
 * render(
 *   <MockPortal>
 *     <Modal>Content</Modal>
 *   </MockPortal>
 * )
 *
 * // Modal content is rendered inline, easy to test
 * expect(screen.getByText('Content')).toBeInTheDocument()
 * ```
 */
export function MockPortal({ children, containerId = 'portal-root' }: MockPortalProps) {
  return (
    <div data-testid="mock-portal" data-container-id={containerId}>
      {children}
    </div>
  )
}
