/**
 * renderWithProviders - Helper to render with common providers
 *
 * Simplifies rendering components with providers in tests
 */

import React from 'react'
import type { RenderOptions, RenderResult } from '@testing-library/react'

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: 'light' | 'dark'
  initialRoute?: string
  wrappers?: React.ComponentType<{ children: React.ReactNode }>[]
}

/**
 * Render component with all providers
 *
 * @example
 * ```typescript
 * import { renderWithProviders } from '@ux.qa/frontmock'
 *
 * const { rerender } = renderWithProviders(
 *   <MyComponent />,
 *   {
 *     theme: 'dark',
 *     initialRoute: '/dashboard'
 *   }
 * )
 * ```
 */
export function createRenderWithProviders(renderFn: any) {
  return function renderWithProviders(
    ui: React.ReactElement,
    options: RenderWithProvidersOptions = {}
  ): RenderResult {
    const { theme = 'light', initialRoute = '/', wrappers = [], ...renderOptions } = options

    // Combine all wrappers
    const AllWrappers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      let content = children

      // Apply custom wrappers
      for (const Wrapper of wrappers.reverse()) {
        content = <Wrapper>{content}</Wrapper>
      }

      // Wrap with test providers
      return (
        <div data-testid="test-wrapper" data-theme={theme} data-route={initialRoute}>
          {content}
        </div>
      )
    }

    return renderFn(ui, { wrapper: AllWrappers, ...renderOptions })
  }
}

/**
 * Create custom render with specific providers
 *
 * @example
 * ```typescript
 * import { createCustomRender } from '@ux.qa/frontmock'
 * import { ThemeProvider } from './ThemeProvider'
 *
 * const customRender = createCustomRender({ defaultTheme: 'dark' })
 *
 * customRender(<MyComponent />)
 * ```
 */
export function createCustomRender(defaultOptions: RenderWithProvidersOptions = {}) {
  return (ui: React.ReactElement, options: RenderWithProvidersOptions = {}) => {
    const mergedOptions = { ...defaultOptions, ...options }
    // Return render setup
    return { ui, options: mergedOptions }
  }
}
