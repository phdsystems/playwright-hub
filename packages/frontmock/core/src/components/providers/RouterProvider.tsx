/**
 * RouterProvider - Test provider for routing
 *
 * Provides routing context for testing components with navigation
 */

import React, { createContext, useContext, useState } from 'react'

export interface RouterContextValue {
  pathname: string
  navigate: (path: string) => void
  params: Record<string, string>
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined)

export interface RouterProviderProps {
  children: React.ReactNode
  initialRoute?: string
  initialParams?: Record<string, string>
  onNavigate?: (path: string) => void
}

/**
 * Provides router context for testing
 *
 * @example
 * ```typescript
 * import { RouterProvider } from '@ux.qa/frontmock'
 *
 * const handleNavigate = vi.fn()
 *
 * render(
 *   <RouterProvider initialRoute="/users/123" onNavigate={handleNavigate}>
 *     <UserProfile />
 *   </RouterProvider>
 * )
 *
 * await user.click(screen.getByText('Edit'))
 * expect(handleNavigate).toHaveBeenCalledWith('/users/123/edit')
 * ```
 */
export function RouterProvider({
  children,
  initialRoute = '/',
  initialParams = {},
  onNavigate,
}: RouterProviderProps) {
  const [pathname, setPathname] = useState(initialRoute)
  const [params] = useState(initialParams)

  const navigate = (path: string) => {
    setPathname(path)
    onNavigate?.(path)
  }

  const value: RouterContextValue = {
    pathname,
    navigate,
    params,
  }

  return (
    <RouterContext.Provider value={value}>
      <div data-testid="router-provider" data-pathname={pathname}>
        {children}
      </div>
    </RouterContext.Provider>
  )
}

/**
 * Hook to access router context in tests
 */
export function useRouter() {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error('useRouter must be used within RouterProvider')
  }
  return context
}

/**
 * Mock Link component for testing
 */
export interface LinkProps {
  to: string
  children: React.ReactNode
  [key: string]: any
}

export function Link({ to, children, ...props }: LinkProps) {
  const { navigate } = useRouter()

  return (
    <a
      {...props}
      href={to}
      onClick={(e) => {
        e.preventDefault()
        navigate(to)
      }}
    >
      {children}
    </a>
  )
}
