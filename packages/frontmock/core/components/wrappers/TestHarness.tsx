/**
 * TestHarness - Complete test wrapper combining error boundary and suspense
 *
 * Wraps components with error handling and async loading support.
 * Use this as the standard wrapper for testing React components.
 */

import React, { Suspense } from 'react'
import { TestBoundary } from './TestBoundary'

export interface TestHarnessProps {
  children: React.ReactNode
  loading?: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error) => void
  suspense?: boolean
  errorBoundary?: boolean
}

/**
 * Complete test harness with error boundary and suspense
 *
 * @example
 * ```typescript
 * import { TestHarness } from '@ux.qa/frontmock'
 *
 * render(
 *   <TestHarness
 *     loading={<div>Loading...</div>}
 *     onError={(error) => console.error(error)}
 *   >
 *     <AsyncComponent />
 *   </TestHarness>
 * )
 * ```
 */
export function TestHarness({
  children,
  loading = <div data-testid="loading">Loading...</div>,
  fallback,
  onError,
  suspense = true,
  errorBoundary = true,
}: TestHarnessProps) {
  let content = children

  // Wrap with Suspense if enabled
  if (suspense) {
    content = <Suspense fallback={loading}>{content}</Suspense>
  }

  // Wrap with Error Boundary if enabled
  if (errorBoundary) {
    content = (
      <TestBoundary onError={onError} fallback={fallback}>
        {content}
      </TestBoundary>
    )
  }

  return <div data-testid="test-harness">{content}</div>
}

/**
 * Hook to simulate component updates in tests
 */
export function useTestUpdate() {
  const [, setCount] = React.useState(0)
  return React.useCallback(() => setCount((c) => c + 1), [])
}

/**
 * Hook to track component renders in tests
 */
export function useRenderCount() {
  const ref = React.useRef(0)
  React.useEffect(() => {
    ref.current++
  })
  return ref.current
}
