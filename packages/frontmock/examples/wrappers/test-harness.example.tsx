/**
 * TestHarness Example
 *
 * Demonstrates using complete test wrapper with suspense and error handling
 * Follows SEA Pattern: Setup → Exercise → Assert
 * Run with: npx vitest run examples/helpers/test-harness.example.tsx
 */

import React, { Suspense } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TestHarness, useTestUpdate, useRenderCount } from '../../core/components/helpers/TestHarness'

// Async component that suspends
let resolvePromise: () => void
const createSuspendingComponent = () => {
  let resolved = false
  const promise = new Promise<void>((resolve) => {
    resolvePromise = () => {
      resolved = true
      resolve()
    }
  })

  return function SuspendingComponent() {
    if (!resolved) {
      throw promise
    }
    return <div data-testid="async-content">Loaded!</div>
  }
}

// Component that throws
function ThrowingComponent() {
  throw new Error('Test error')
}

describe('TestHarness Examples', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('1. Basic wrapper', () => {
    it('wraps content with test harness', () => {
      render(
        <TestHarness>
          <div data-testid="content">Hello</div>
        </TestHarness>
      )

      expect(screen.getByTestId('test-harness')).toBeInTheDocument()
      expect(screen.getByTestId('content')).toHaveTextContent('Hello')
    })
  })

  describe('2. Suspense loading state', () => {
    it('shows loading while suspended', async () => {
      const SuspendingComponent = createSuspendingComponent()

      render(
        <TestHarness loading={<div data-testid="loader">Loading...</div>}>
          <SuspendingComponent />
        </TestHarness>
      )

      expect(screen.getByTestId('loader')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toBeInTheDocument()

      // Resolve the suspension
      resolvePromise()

      await waitFor(() => {
        expect(screen.getByTestId('async-content')).toBeInTheDocument()
      })
    })
  })

  describe('3. Error handling', () => {
    it('catches errors and shows fallback', () => {
      const handleError = vi.fn()

      render(
        <TestHarness onError={handleError} fallback={<div>Error occurred</div>}>
          <ThrowingComponent />
        </TestHarness>
      )

      expect(screen.getByText('Error occurred')).toBeInTheDocument()
      expect(handleError).toHaveBeenCalled()
    })
  })

  describe('4. Disable suspense', () => {
    it('renders without suspense wrapper', () => {
      render(
        <TestHarness suspense={false}>
          <div data-testid="content">No suspense</div>
        </TestHarness>
      )

      expect(screen.getByTestId('content')).toBeInTheDocument()
    })
  })

  describe('5. Disable error boundary', () => {
    it('does not catch errors when disabled', () => {
      expect(() => {
        render(
          <TestHarness errorBoundary={false}>
            <ThrowingComponent />
          </TestHarness>
        )
      }).toThrow('Test error')
    })
  })

  describe('6. Default loading state', () => {
    it('shows default loading indicator', async () => {
      const SuspendingComponent = createSuspendingComponent()

      render(
        <TestHarness>
          <SuspendingComponent />
        </TestHarness>
      )

      expect(screen.getByTestId('loading')).toBeInTheDocument()

      resolvePromise()
      await waitFor(() => {
        expect(screen.getByTestId('async-content')).toBeInTheDocument()
      })
    })
  })
})

describe('useTestUpdate Hook', () => {
  it('forces component re-render', async () => {
    let renderCount = 0

    function TestComponent() {
      const forceUpdate = useTestUpdate()
      renderCount++

      return (
        <button onClick={forceUpdate} data-testid="update-btn">
          Rendered {renderCount} times
        </button>
      )
    }

    const { rerender } = render(<TestComponent />)
    expect(renderCount).toBe(1)

    // Click to force update
    screen.getByTestId('update-btn').click()

    await waitFor(() => {
      expect(renderCount).toBe(2)
    })
  })
})

describe('useRenderCount Hook', () => {
  it('tracks render count', () => {
    function TestComponent() {
      const count = useRenderCount()
      return <div data-testid="count">Renders: {count}</div>
    }

    const { rerender } = render(<TestComponent />)
    expect(screen.getByTestId('count')).toHaveTextContent('Renders: 0')

    rerender(<TestComponent />)
    expect(screen.getByTestId('count')).toHaveTextContent('Renders: 1')

    rerender(<TestComponent />)
    expect(screen.getByTestId('count')).toHaveTextContent('Renders: 2')
  })
})
