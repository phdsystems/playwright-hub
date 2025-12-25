# FrontMock Test Components Guide

## Overview

**FrontMock** includes **20+ reusable test components** that simplify common testing scenarios. These components eliminate boilerplate and provide consistent test setup across your test suite.

```
@ux.qa/frontmock/components/
├── providers/       # Test providers (Theme, Router, etc.)
├── mocks/           # Mock components (Image, Portal, etc.)
└── helpers/         # Test helpers (Boundary, Harness, etc.)
```

---

## Provider Components

### AllProviders

Combines all common test providers in one component.

```typescript
import { AllProviders } from '@ux.qa/frontmock'

render(
  <AllProviders theme="dark" initialRoute="/dashboard">
    <MyComponent />
  </AllProviders>
)
```

**Props:**
- `theme?: 'light' | 'dark'` - Theme for components
- `initialRoute?: string` - Initial route path
- `mockAuth?: { isAuthenticated: boolean; user?: any }` - Mock auth state

---

### ThemeProvider

Provides theme context for testing themed components.

```typescript
import { ThemeProvider, useTheme } from '@ux.qa/frontmock'

const handleThemeChange = vi.fn()

render(
  <ThemeProvider theme="dark" onThemeChange={handleThemeChange}>
    <ThemedComponent />
  </ThemeProvider>
)

// Component can use useTheme() hook
function ThemedComponent() {
  const { theme, setTheme } = useTheme()
  return <div data-theme={theme}>Content</div>
}
```

**Props:**
- `theme?: 'light' | 'dark' | 'system'` - Current theme
- `onThemeChange?: (theme: Theme) => void` - Theme change callback

**Exports:**
- `ThemeProvider` - Provider component
- `useTheme()` - Hook to access theme context

---

### RouterProvider

Provides router context for testing navigation.

```typescript
import { RouterProvider, useRouter, Link } from '@ux.qa/frontmock'

const handleNavigate = vi.fn()

render(
  <RouterProvider
    initialRoute="/users/123"
    initialParams={{ id: '123' }}
    onNavigate={handleNavigate}
  >
    <UserProfile />
  </RouterProvider>
)

// Click a link
await user.click(screen.getByText('Edit'))

// Verify navigation
expect(handleNavigate).toHaveBeenCalledWith('/users/123/edit')

// Component can use useRouter() hook
function UserProfile() {
  const { pathname, navigate, params } = useRouter()

  return (
    <div>
      <p>User ID: {params.id}</p>
      <Link to="/users">Back to list</Link>
    </div>
  )
}
```

**Props:**
- `initialRoute?: string` - Starting route
- `initialParams?: Record<string, string>` - Route parameters
- `onNavigate?: (path: string) => void` - Navigation callback

**Exports:**
- `RouterProvider` - Provider component
- `useRouter()` - Hook to access router context
- `Link` - Mock link component

---

## Mock Components

### MockImage

Mock image component that prevents actual HTTP requests.

```typescript
import { MockImage } from '@ux.qa/frontmock'

const handleLoad = vi.fn()
const handleError = vi.fn()

render(
  <MockImage
    src="/avatar.jpg"
    alt="User avatar"
    width={100}
    height={100}
    onLoad={handleLoad}
    onError={handleError}
  />
)

// Image "loads" immediately
expect(handleLoad).toHaveBeenCalled()

// Verify image attributes
const img = screen.getByRole('img', { name: 'User avatar' })
expect(img).toHaveAttribute('data-src', '/avatar.jpg')
```

**Props:**
- `src: string` - Image source
- `alt: string` - Alt text
- `width?: number | string` - Width
- `height?: number | string` - Height
- `onLoad?: () => void` - Load callback
- `onError?: (error: Error) => void` - Error callback

---

### MockPortal

Mock portal that renders inline (no actual portal).

```typescript
import { MockPortal } from '@ux.qa/frontmock'

render(
  <MockPortal containerId="modal-root">
    <Modal>
      <h1>Modal Content</h1>
    </Modal>
  </MockPortal>
)

// Content is rendered inline, easy to query
expect(screen.getByText('Modal Content')).toBeInTheDocument()
```

**Props:**
- `containerId?: string` - Portal container ID

**Use case:** Testing modals, tooltips, dropdowns without actual portal rendering.

---

### MockVideo

Mock video component that prevents actual video loading.

```typescript
import { MockVideo } from '@ux.qa/frontmock'

const handlePlay = vi.fn()
const handlePause = vi.fn()

render(
  <MockVideo
    src="/video.mp4"
    poster="/poster.jpg"
    controls
    onPlay={handlePlay}
    onPause={handlePause}
  />
)

// Simulate play
await user.click(screen.getByLabelText('Play'))
expect(handlePlay).toHaveBeenCalled()

// Verify video is playing
const video = screen.getByTestId('mock-video')
expect(video).toHaveAttribute('data-playing', 'true')
```

**Props:**
- `src: string` - Video source
- `poster?: string` - Poster image
- `width?: number | string` - Width
- `height?: number | string` - Height
- `controls?: boolean` - Show controls
- `autoPlay?: boolean` - Auto play
- `loop?: boolean` - Loop playback
- `muted?: boolean` - Muted
- `onLoadedMetadata?: () => void` - Metadata loaded callback
- `onPlay?: () => void` - Play callback
- `onPause?: () => void` - Pause callback
- `onEnded?: () => void` - Ended callback
- `onTimeUpdate?: (currentTime: number) => void` - Time update callback

---

### MockAudio

Mock audio component that prevents actual audio loading.

```typescript
import { MockAudio } from '@ux.qa/frontmock'

const handlePlay = vi.fn()
const handleVolumeChange = vi.fn()

render(
  <MockAudio
    src="/audio.mp3"
    controls
    onPlay={handlePlay}
    onVolumeChange={handleVolumeChange}
  />
)

// Simulate play
await user.click(screen.getByLabelText('Play'))
expect(handlePlay).toHaveBeenCalled()

// Adjust volume
const volumeSlider = screen.getByLabelText('Volume')
await user.type(volumeSlider, '0.5')
expect(handleVolumeChange).toHaveBeenCalledWith(0.5)
```

**Props:**
- `src: string` - Audio source
- `controls?: boolean` - Show controls
- `autoPlay?: boolean` - Auto play
- `loop?: boolean` - Loop playback
- `muted?: boolean` - Muted
- `volume?: number` - Volume (0-1)
- `onLoadedMetadata?: () => void` - Metadata loaded callback
- `onPlay?: () => void` - Play callback
- `onPause?: () => void` - Pause callback
- `onEnded?: () => void` - Ended callback
- `onTimeUpdate?: (currentTime: number) => void` - Time update callback
- `onVolumeChange?: (volume: number) => void` - Volume change callback

---

### MockCanvas

Mock canvas element and 2D context that tracks drawing operations.

```typescript
import { setupMockCanvas } from '@ux.qa/frontmock'

const { canvas, context, getOperations, cleanup } = setupMockCanvas(800, 600)

render(<ChartComponent canvas={canvas} />)

// Verify canvas operations
const fillRectCalls = getOperations('fillRect')
expect(fillRectCalls).toHaveLength(3)
expect(fillRectCalls[0].args).toEqual([0, 0, 100, 100])

// Verify drawing occurred
expect(getOperations('stroke').length).toBeGreaterThan(0)

cleanup()
```

**Returns:**
- `canvas` - Mock HTMLCanvasElement
- `context` - Mock CanvasRenderingContext2D
- `operations` - Array of all operations
- `getOperations(method?)` - Get operations, optionally filtered by method
- `clearOperations()` - Clear operation history
- `cleanup()` - Clean up mocks

**React Component:**
```typescript
import { MockCanvas } from '@ux.qa/frontmock'

const canvasRef = React.createRef<HTMLCanvasElement>()
render(<MockCanvas ref={canvasRef} width={800} height={600} />)
```

---

### setupMockIntersectionObserver

Mock IntersectionObserver API for lazy loading tests.

```typescript
import { setupMockIntersectionObserver } from '@ux.qa/frontmock'

const { mockObserve, triggerIntersection, cleanup } = setupMockIntersectionObserver()

render(<LazyImage src="/image.jpg" />)

// Verify observer was set up
expect(mockObserve).toHaveBeenCalled()

// Trigger intersection
const img = screen.getByRole('img')
triggerIntersection(img, true)  // isIntersecting = true

// Image should start loading
expect(img).toHaveAttribute('src', '/image.jpg')

// Cleanup
cleanup()
```

**Returns:**
- `mockObserve` - Mock observe function
- `mockUnobserve` - Mock unobserve function
- `mockDisconnect` - Mock disconnect function
- `triggerIntersection(target, isIntersecting, ratio)` - Trigger intersection
- `cleanup()` - Clean up mocks

---

### setupMockResizeObserver

Mock ResizeObserver API for testing size-responsive components.

```typescript
import { setupMockResizeObserver, viewportSizes } from '@ux.qa/frontmock'

const { mockObserve, triggerResize, cleanup } = setupMockResizeObserver()

render(<ResponsiveChart />)

// Verify observer was set up
expect(mockObserve).toHaveBeenCalled()

// Trigger resize
const chart = screen.getByTestId('chart')
triggerResize(chart, viewportSizes.mobile)

// Chart should adapt to mobile size
expect(chart).toHaveStyle({ width: '375px' })

cleanup()
```

**Returns:**
- `mockObserve` - Mock observe function
- `mockUnobserve` - Mock unobserve function
- `mockDisconnect` - Mock disconnect function
- `triggerResize(target, contentRect)` - Trigger resize event
- `cleanup()` - Clean up mocks

**Helpers:**
- `viewportSizes` - Common viewport sizes (mobile, tablet, desktop, etc.)

---

### setupMockMatchMedia

Mock window.matchMedia for testing responsive behavior.

```typescript
import { setupMockMatchMedia, mediaQueries } from '@ux.qa/frontmock'

const { setMatches, cleanup } = setupMockMatchMedia()

// Default desktop
render(<ResponsiveNav />)
expect(screen.getByText('Desktop Menu')).toBeInTheDocument()

// Switch to mobile
setMatches(mediaQueries.mobile, true)
expect(screen.getByText('Mobile Menu')).toBeInTheDocument()

// Test dark mode
setMatches(mediaQueries.darkMode, true)
expect(document.body).toHaveClass('dark')

cleanup()
```

**Returns:**
- `mockMatchMedia` - Mock matchMedia function
- `setMatches(query, matches)` - Set media query match state
- `cleanup()` - Clean up mocks

**Helpers:**
- `mediaQueries` - Common media query presets (mobile, tablet, desktop, darkMode, reducedMotion, etc.)

---

### setupMockLocalStorage / setupMockSessionStorage

Mock browser storage APIs for testing.

```typescript
import { setupMockLocalStorage, mockStorageData } from '@ux.qa/frontmock'

const { setItem, getItem, storage, cleanup } = setupMockLocalStorage()

// Pre-populate storage
mockStorageData(storage, { theme: 'dark', locale: 'en' })

render(<UserSettings />)

// Component reads initial values
expect(screen.getByText('Theme: dark')).toBeInTheDocument()

// Component updates storage
await user.click(screen.getByText('Toggle Theme'))

// Verify storage updated
expect(storage.theme).toBe('light')
expect(getItem('theme')).toBe('light')

cleanup()
```

**Returns:**
- `getItem(key)` - Get item from storage
- `setItem(key, value)` - Set item in storage
- `removeItem(key)` - Remove item from storage
- `clear()` - Clear all storage
- `key(index)` - Get key at index
- `length` - Number of items
- `storage` - Direct access to storage object
- `cleanup()` - Clean up mocks

**Helpers:**
- `mockStorageData(storage, data)` - Pre-populate storage with data

---

### setupMockFileReader

Mock FileReader API for testing file uploads.

```typescript
import { setupMockFileReader, createMockFile, mockFileTypes } from '@ux.qa/frontmock'

const { triggerLoad, triggerError, cleanup } = setupMockFileReader()

const handleUpload = vi.fn()
render(<FileUpload onUpload={handleUpload} />)

// Create test file
const file = createMockFile('avatar.png', mockFileTypes.image.png, 2048)

// Upload file
const input = screen.getByLabelText('Upload file')
await user.upload(input, file)

// Trigger successful load
triggerLoad(file, 'data:image/png;base64,iVBORw0KGgo...')

// Verify upload
expect(handleUpload).toHaveBeenCalledWith(expect.objectContaining({
  name: 'avatar.png',
  size: 2048,
}))

cleanup()
```

**Returns:**
- `mockReadAsDataURL` - Mock readAsDataURL function
- `mockReadAsText` - Mock readAsText function
- `mockReadAsArrayBuffer` - Mock readAsArrayBuffer function
- `triggerLoad(file, result)` - Trigger successful load
- `triggerError(error)` - Trigger error event
- `triggerProgress(loaded, total)` - Trigger progress event
- `cleanup()` - Clean up mocks

**Helpers:**
- `createMockFile(name, type, size, content)` - Create mock File object
- `mockFileTypes` - Common file type constants (image, document, video, audio)

---

### setupMockClipboard

Mock Clipboard API for testing copy/paste functionality.

```typescript
import { setupMockClipboard } from '@ux.qa/frontmock'

const { getClipboard, setClipboard, cleanup } = setupMockClipboard()

render(<TextEditor />)

// User clicks copy button
await user.click(screen.getByRole('button', { name: /copy/i }))

// Verify text was copied
expect(getClipboard()).toBe('Expected text')

// Pre-set clipboard for paste test
setClipboard('Text to paste')
await user.click(screen.getByRole('button', { name: /paste/i }))

cleanup()
```

**Returns:**
- `writeText(text)` - Mock writeText function
- `readText()` - Mock readText function
- `write(data)` - Mock write function
- `read()` - Mock read function
- `clipboard` - Current clipboard text
- `getClipboard()` - Get clipboard text
- `setClipboard(text)` - Set clipboard text
- `clearClipboard()` - Clear clipboard
- `cleanup()` - Clean up mocks

**Additional utilities:**
- `setupMockExecCommand()` - Mock legacy execCommand
- `triggerClipboardEvent(element, type, data)` - Simulate clipboard events

---

### setupMockWebSocket

Mock WebSocket API for testing real-time communication.

```typescript
import { setupMockWebSocket, WebSocketState } from '@ux.qa/frontmock'

const { getLastInstance, triggerOpen, triggerMessage, getSentMessages, cleanup } = setupMockWebSocket()

render(<ChatComponent />)

// Component creates WebSocket connection
const ws = getLastInstance()
expect(ws?.url).toBe('ws://localhost:3000/chat')

// Simulate connection opened
triggerOpen()
expect(ws?.readyState).toBe(WebSocketState.OPEN)

// Simulate incoming message
triggerMessage({ type: 'chat', text: 'Hello!' })
expect(screen.getByText('Hello!')).toBeInTheDocument()

// Verify outgoing messages
await user.type(screen.getByRole('textbox'), 'Hi there!')
await user.click(screen.getByRole('button', { name: /send/i }))

const sent = getSentMessages()
expect(sent).toContainEqual({ type: 'chat', text: 'Hi there!' })

cleanup()
```

**Returns:**
- `instances` - All WebSocket instances
- `getLastInstance()` - Get most recent instance
- `triggerOpen(instance?)` - Trigger open event
- `triggerMessage(data, instance?)` - Trigger message event
- `triggerError(error?, instance?)` - Trigger error event
- `triggerClose(code?, reason?, instance?)` - Trigger close event
- `getSentMessages(instance?)` - Get sent messages
- `cleanup()` - Clean up mocks

**Helpers:**
- `WebSocketState` - Ready state constants (CONNECTING, OPEN, CLOSING, CLOSED)
- `WebSocketCloseCode` - Common close codes (NORMAL, GOING_AWAY, etc.)

---

### setupMockAnimationFrame

Mock requestAnimationFrame for controlling animation timing.

```typescript
import { setupMockAnimationFrame, FrameRate } from '@ux.qa/frontmock'

const { triggerNextFrame, triggerFrames, cleanup } = setupMockAnimationFrame()

render(<AnimatedComponent />)

// Component starts animation
await user.click(screen.getByRole('button', { name: /start/i }))

// Trigger single frame
triggerNextFrame()
expect(screen.getByTestId('progress')).toHaveTextContent('1')

// Trigger multiple frames at 60fps
triggerFrames(10, FrameRate.FPS_60)
expect(screen.getByTestId('progress')).toHaveTextContent('11')

cleanup()
```

**Returns:**
- `mockRequestAnimationFrame` - Mock requestAnimationFrame
- `mockCancelAnimationFrame` - Mock cancelAnimationFrame
- `triggerNextFrame(timestamp?)` - Trigger next animation frame
- `triggerFrames(count, timestampIncrement?)` - Trigger multiple frames
- `getScheduledCallbacks()` - Get pending callbacks
- `clearScheduledCallbacks()` - Clear pending callbacks
- `cleanup()` - Clean up mocks

**Additional utilities:**
- `waitForAnimationFrames(count)` - Async helper to wait for frames
- `setupMockPerformanceNow()` - Mock performance.now() for timing
- `FrameRate` - Common frame rate constants (FPS_60, FPS_30, etc.)

---

## Helper Components

### TestBoundary

Error boundary for catching errors in tests.

```typescript
import { TestBoundary } from '@ux.qa/frontmock'

const handleError = vi.fn()

render(
  <TestBoundary
    onError={handleError}
    fallback={<div>Something went wrong</div>}
  >
    <ComponentThatThrows />
  </TestBoundary>
)

// Error is caught and handled
expect(handleError).toHaveBeenCalledWith(
  expect.any(Error),
  expect.any(Object)  // errorInfo
)

// Fallback is rendered
expect(screen.getByText('Something went wrong')).toBeInTheDocument()
```

**Props:**
- `onError?: (error: Error, errorInfo: React.ErrorInfo) => void` - Error callback
- `fallback?: React.ReactNode` - Fallback UI

---

### TestHarness

Complete test wrapper with Suspense + Error Boundary.

```typescript
import { TestHarness } from '@ux.qa/frontmock'

const handleError = vi.fn()

render(
  <TestHarness
    loading={<div>Loading...</div>}
    onError={handleError}
    suspense={true}
    errorBoundary={true}
  >
    <AsyncComponent />
  </TestHarness>
)

// Shows loading state
expect(screen.getByText('Loading...')).toBeInTheDocument()

// Wait for async component to load
await waitFor(() => {
  expect(screen.getByText('Content loaded')).toBeInTheDocument()
})
```

**Props:**
- `loading?: React.ReactNode` - Loading fallback
- `fallback?: React.ReactNode` - Error fallback
- `onError?: (error: Error) => void` - Error callback
- `suspense?: boolean` - Enable Suspense (default: true)
- `errorBoundary?: boolean` - Enable error boundary (default: true)

**Hooks:**
- `useTestUpdate()` - Force component update
- `useRenderCount()` - Track render count

```typescript
import { useTestUpdate, useRenderCount } from '@ux.qa/frontmock'

function TestComponent() {
  const forceUpdate = useTestUpdate()
  const renderCount = useRenderCount()

  return (
    <div>
      <p>Renders: {renderCount}</p>
      <button onClick={forceUpdate}>Force Update</button>
    </div>
  )
}

render(<TestComponent />)

expect(screen.getByText('Renders: 1')).toBeInTheDocument()

await user.click(screen.getByText('Force Update'))

expect(screen.getByText('Renders: 2')).toBeInTheDocument()
```

---

### renderWithProviders

Helper to render with all providers.

```typescript
import { createRenderWithProviders } from '@ux.qa/frontmock'
import { render } from '@testing-library/react'

const renderWithProviders = createRenderWithProviders(render)

const { rerender } = renderWithProviders(
  <MyComponent />,
  {
    theme: 'dark',
    initialRoute: '/dashboard',
    wrappers: [CustomProvider]  // Add custom wrappers
  }
)

// Rerender with new props
rerender(<MyComponent updated={true} />)
```

**Options:**
- `theme?: 'light' | 'dark'` - Theme
- `initialRoute?: string` - Route
- `wrappers?: React.ComponentType[]` - Custom wrappers

---

## Complete Usage Example

```typescript
import { t } from '@ux.qa/frontmock'
import {
  // Providers
  AllProviders,
  ThemeProvider,
  RouterProvider,

  // Component Mocks
  MockImage,
  MockVideo,
  MockAudio,
  MockPortal,
  MockCanvas,

  // Browser API Mocks
  setupMockIntersectionObserver,
  setupMockResizeObserver,
  setupMockMatchMedia,
  setupMockLocalStorage,
  setupMockFileReader,
  setupMockClipboard,
  setupMockWebSocket,
  setupMockAnimationFrame,

  // Helpers
  TestBoundary,
  TestHarness,
  useTestUpdate,
  useRenderCount
} from '@ux.qa/frontmock'

import { UserDashboard } from './UserDashboard'

const { describe, it, expect, render, screen, userEvent, vi } = t

describe('UserDashboard with test components', () => {
  it('renders with all providers', () => {
    render(
      <AllProviders theme="dark" initialRoute="/dashboard">
        <UserDashboard />
      </AllProviders>
    )

    expect(screen.getByTestId('test-providers')).toBeInTheDocument()
  })

  it('handles theme changes', async () => {
    const handleThemeChange = vi.fn()
    const user = userEvent.setup()

    render(
      <ThemeProvider theme="light" onThemeChange={handleThemeChange}>
        <UserDashboard />
      </ThemeProvider>
    )

    await user.click(screen.getByRole('button', { name: /toggle theme/i }))

    expect(handleThemeChange).toHaveBeenCalledWith('dark')
  })

  it('handles navigation', async () => {
    const handleNavigate = vi.fn()
    const user = userEvent.setup()

    render(
      <RouterProvider initialRoute="/dashboard" onNavigate={handleNavigate}>
        <UserDashboard />
      </RouterProvider>
    )

    await user.click(screen.getByText('Settings'))

    expect(handleNavigate).toHaveBeenCalledWith('/settings')
  })

  it('loads images lazily', () => {
    const { triggerIntersection } = setupMockIntersectionObserver()

    render(<UserDashboard />)

    const avatar = screen.getByRole('img', { name: /avatar/i })

    // Not loaded yet
    expect(avatar).not.toHaveAttribute('src')

    // Trigger intersection
    triggerIntersection(avatar, true)

    // Now loaded
    expect(avatar).toHaveAttribute('src')
  })

  it('catches errors gracefully', () => {
    const handleError = vi.fn()

    render(
      <TestBoundary onError={handleError}>
        <BuggyComponent />
      </TestBoundary>
    )

    expect(handleError).toHaveBeenCalled()
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
  })

  it('handles async loading', async () => {
    render(
      <TestHarness loading={<div>Loading...</div>}>
        <AsyncDashboard />
      </TestHarness>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Dashboard loaded')).toBeInTheDocument()
    })
  })
})
```

---

## Summary

**Built-in test components:**

| Category | Components | Use Case |
|----------|------------|----------|
| **Providers** | `AllProviders`, `ThemeProvider`, `RouterProvider` | Provide context for tests |
| **Component Mocks** | `MockImage`, `MockVideo`, `MockAudio`, `MockPortal`, `MockCanvas` | Mock media and graphics |
| **Browser API Mocks** | `MockIntersectionObserver`, `MockResizeObserver`, `MockMatchMedia`, `MockLocalStorage`, `MockSessionStorage`, `MockFileReader`, `MockClipboard`, `MockWebSocket`, `MockAnimationFrame` | Mock browser APIs |
| **Helpers** | `TestBoundary`, `TestHarness`, `renderWithProviders`, `useTestUpdate`, `useRenderCount` | Test setup utilities |

**Total: 20+ reusable test components** ✅

All available via:
```typescript
import { ComponentName } from '@ux.qa/frontmock'
```

These components eliminate boilerplate and provide consistent, reusable patterns for testing!
