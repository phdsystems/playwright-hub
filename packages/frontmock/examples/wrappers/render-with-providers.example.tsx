/**
 * renderWithProviders Example
 *
 * Demonstrates custom render function with providers
 * Follows SEA Pattern: Setup → Exercise → Assert
 * Run with: npx vitest run examples/helpers/render-with-providers.example.tsx
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRenderWithProviders, createCustomRender } from '../../core/components/helpers/renderWithProviders'

// Create custom render with providers
const renderWithProviders = createRenderWithProviders(render)

// Example components to test
function DashboardHeader() {
  return (
    <header data-testid="dashboard-header">
      <h1>Dashboard</h1>
    </header>
  )
}

function ThemedCard({ children }: { children: React.ReactNode }) {
  return (
    <div data-testid="themed-card">
      {children}
    </div>
  )
}

describe('renderWithProviders Examples', () => {
  describe('1. Basic usage', () => {
    it('renders with default providers', () => {
      // Setup & Exercise
      renderWithProviders(<DashboardHeader />)

      // Assert
      expect(screen.getByTestId('test-wrapper')).toBeInTheDocument()
      expect(screen.getByTestId('dashboard-header')).toBeInTheDocument()
    })
  })

  describe('2. Custom theme', () => {
    it('renders with dark theme', () => {
      // Setup & Exercise
      renderWithProviders(<DashboardHeader />, { theme: 'dark' })

      // Assert
      expect(screen.getByTestId('test-wrapper')).toHaveAttribute('data-theme', 'dark')
    })
  })

  describe('3. Custom route', () => {
    it('renders with initial route', () => {
      // Setup & Exercise
      renderWithProviders(<DashboardHeader />, { initialRoute: '/dashboard' })

      // Assert
      expect(screen.getByTestId('test-wrapper')).toHaveAttribute('data-route', '/dashboard')
    })
  })

  describe('4. Combined options', () => {
    it('supports multiple options', () => {
      // Setup & Exercise
      renderWithProviders(
        <DashboardHeader />,
        {
          theme: 'dark',
          initialRoute: '/settings'
        }
      )

      // Assert
      const wrapper = screen.getByTestId('test-wrapper')
      expect(wrapper).toHaveAttribute('data-theme', 'dark')
      expect(wrapper).toHaveAttribute('data-route', '/settings')
    })
  })

  describe('5. Custom wrappers', () => {
    it('applies custom wrappers', () => {
      // Setup
      const CustomWrapper = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="custom-wrapper">{children}</div>
      )

      // Exercise
      renderWithProviders(
        <DashboardHeader />,
        { wrappers: [CustomWrapper] }
      )

      // Assert
      expect(screen.getByTestId('custom-wrapper')).toBeInTheDocument()
    })
  })

  describe('6. Multiple custom wrappers', () => {
    it('applies wrappers in order', () => {
      // Setup
      const OuterWrapper = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="outer">{children}</div>
      )
      const InnerWrapper = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="inner">{children}</div>
      )

      // Exercise
      renderWithProviders(
        <DashboardHeader />,
        { wrappers: [OuterWrapper, InnerWrapper] }
      )

      // Assert
      expect(screen.getByTestId('outer')).toBeInTheDocument()
      expect(screen.getByTestId('inner')).toBeInTheDocument()
    })
  })
})

describe('createCustomRender Examples', () => {
  describe('1. Factory with defaults', () => {
    it('creates render with default options', () => {
      const customRender = createCustomRender({ theme: 'dark' })

      const result = customRender(<DashboardHeader />)

      expect(result.options.theme).toBe('dark')
    })
  })

  describe('2. Override defaults', () => {
    it('allows overriding default options', () => {
      const customRender = createCustomRender({ theme: 'dark' })

      const result = customRender(<DashboardHeader />, { theme: 'light' })

      expect(result.options.theme).toBe('light')
    })
  })

  describe('3. Merge options', () => {
    it('merges default and provided options', () => {
      const customRender = createCustomRender({
        theme: 'dark',
        initialRoute: '/home'
      })

      const result = customRender(<DashboardHeader />, {
        initialRoute: '/dashboard'
      })

      expect(result.options.theme).toBe('dark')
      expect(result.options.initialRoute).toBe('/dashboard')
    })
  })
})

describe('Real-world usage patterns', () => {
  describe('Testing themed components', () => {
    it('tests component in dark mode', () => {
      renderWithProviders(
        <ThemedCard>
          <p>Card content</p>
        </ThemedCard>,
        { theme: 'dark' }
      )

      expect(screen.getByTestId('themed-card')).toBeInTheDocument()
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })
  })

  describe('Testing routed components', () => {
    it('tests component at specific route', () => {
      const PageComponent = () => (
        <div data-testid="page">Page content</div>
      )

      renderWithProviders(
        <PageComponent />,
        { initialRoute: '/users/123' }
      )

      expect(screen.getByTestId('page')).toBeInTheDocument()
    })
  })
})
