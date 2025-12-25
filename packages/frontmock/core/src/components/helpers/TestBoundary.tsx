/**
 * TestBoundary - Error boundary for testing
 *
 * Catches errors in component tests
 */

import React from 'react'

export interface TestBoundaryProps {
  children: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  fallback?: React.ReactNode
}

interface TestBoundaryState {
  hasError: boolean
  error?: Error
}

/**
 * Error boundary for catching errors in tests
 *
 * @example
 * ```typescript
 * import { TestBoundary } from '@ux.qa/frontmock'
 *
 * const handleError = vi.fn()
 *
 * render(
 *   <TestBoundary onError={handleError}>
 *     <ComponentThatThrows />
 *   </TestBoundary>
 * )
 *
 * expect(handleError).toHaveBeenCalledWith(expect.any(Error))
 * ```
 */
export class TestBoundary extends React.Component<TestBoundaryProps, TestBoundaryState> {
  constructor(props: TestBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): TestBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div data-testid="error-boundary" data-error={this.state.error?.message}>
            Error: {this.state.error?.message}
          </div>
        )
      )
    }

    return this.props.children
  }
}
