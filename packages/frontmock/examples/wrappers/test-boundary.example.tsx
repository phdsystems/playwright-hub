/**
 * TestBoundary Example
 *
 * Demonstrates testing error handling in components
 * Follows SEA Pattern: Setup → Exercise → Assert
 * Run with: npx vitest run examples/helpers/test-boundary.example.tsx
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestBoundary } from '../../core/components/helpers/TestBoundary'

// Component that throws an error
function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Component error!')
  }
  return <div data-testid="success">Component rendered successfully</div>
}

describe('TestBoundary Examples', () => {
  // Suppress console errors for these tests
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('1. Catch component errors', () => {
    it('catches and displays errors', () => {
      render(
        <TestBoundary>
          <ThrowingComponent />
        </TestBoundary>
      )

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
      expect(screen.getByText(/Error: Component error!/)).toBeInTheDocument()
    })
  })

  describe('2. Error callback', () => {
    it('calls onError when error occurs', () => {
      const handleError = vi.fn()

      render(
        <TestBoundary onError={handleError}>
          <ThrowingComponent />
        </TestBoundary>
      )

      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      )
    })
  })

  describe('3. Custom fallback', () => {
    it('renders custom fallback on error', () => {
      render(
        <TestBoundary fallback={<div data-testid="custom-fallback">Something went wrong</div>}>
          <ThrowingComponent />
        </TestBoundary>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  describe('4. No error case', () => {
    it('renders children when no error', () => {
      render(
        <TestBoundary>
          <ThrowingComponent shouldThrow={false} />
        </TestBoundary>
      )

      expect(screen.getByTestId('success')).toBeInTheDocument()
      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument()
    })
  })

  describe('5. Error message in data attribute', () => {
    it('includes error message in data-error attribute', () => {
      render(
        <TestBoundary>
          <ThrowingComponent />
        </TestBoundary>
      )

      expect(screen.getByTestId('error-boundary')).toHaveAttribute(
        'data-error',
        'Component error!'
      )
    })
  })

  describe('6. Nested error boundaries', () => {
    it('only catches errors in its subtree', () => {
      render(
        <TestBoundary fallback={<div>Outer error</div>}>
          <div data-testid="outer">
            <TestBoundary fallback={<div>Inner error</div>}>
              <ThrowingComponent />
            </TestBoundary>
          </div>
        </TestBoundary>
      )

      // Inner boundary catches the error
      expect(screen.getByText('Inner error')).toBeInTheDocument()
      expect(screen.getByTestId('outer')).toBeInTheDocument()
      expect(screen.queryByText('Outer error')).not.toBeInTheDocument()
    })
  })

  describe('7. Multiple children', () => {
    it('catches error from any child', () => {
      render(
        <TestBoundary>
          <div>Safe component 1</div>
          <ThrowingComponent />
          <div>Safe component 2</div>
        </TestBoundary>
      )

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
    })
  })
})
