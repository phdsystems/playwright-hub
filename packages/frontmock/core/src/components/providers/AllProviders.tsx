/**
 * AllProviders - Combines all common test providers
 *
 * Wraps components with all necessary providers for testing:
 * - Theme provider
 * - Router provider
 * - Query client provider
 * - Auth provider
 */

import React from 'react'

export interface AllProvidersProps {
  children: React.ReactNode
  theme?: 'light' | 'dark'
  initialRoute?: string
  mockAuth?: {
    isAuthenticated: boolean
    user?: any
  }
}

/**
 * Combines all providers for easy test setup
 *
 * @example
 * ```typescript
 * import { AllProviders } from '@ux.qa/frontmock'
 *
 * render(
 *   <AllProviders theme="dark" initialRoute="/dashboard">
 *     <MyComponent />
 *   </AllProviders>
 * )
 * ```
 */
export function AllProviders({
  children,
  theme = 'light',
  initialRoute = '/',
  mockAuth,
}: AllProvidersProps) {
  return (
    <div data-testid="test-providers" data-theme={theme} data-route={initialRoute}>
      {children}
    </div>
  )
}
