/**
 * ThemeProvider - Test provider for theme context
 *
 * Provides theme context for testing themed components
 */

import React, { createContext, useContext } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export interface ThemeProviderProps {
  children: React.ReactNode
  theme?: Theme
  onThemeChange?: (theme: Theme) => void
}

/**
 * Provides theme context for testing
 *
 * @example
 * ```typescript
 * import { ThemeProvider } from '@ux.qa/frontmock'
 *
 * render(
 *   <ThemeProvider theme="dark">
 *     <ThemedComponent />
 *   </ThemeProvider>
 * )
 * ```
 */
export function ThemeProvider({
  children,
  theme = 'light',
  onThemeChange = () => {},
}: ThemeProviderProps) {
  const value: ThemeContextValue = {
    theme,
    setTheme: onThemeChange,
  }

  return (
    <ThemeContext.Provider value={value}>
      <div data-testid="theme-provider" data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

/**
 * Hook to access theme context in tests
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
