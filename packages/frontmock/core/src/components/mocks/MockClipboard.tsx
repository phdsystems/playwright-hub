/**
 * MockClipboard - Mock Clipboard API for testing
 *
 * Allows testing copy/paste functionality without browser clipboard access
 */

export interface MockClipboardReturn {
  writeText: (text: string) => Promise<void>
  readText: () => Promise<string>
  write: (data: ClipboardItem[]) => Promise<void>
  read: () => Promise<ClipboardItem[]>
  clipboard: string
  clipboardItems: ClipboardItem[]
  getClipboard: () => string
  setClipboard: (text: string) => void
  clearClipboard: () => void
  cleanup: () => void
}

/**
 * Sets up mock for Clipboard API
 *
 * @example
 * ```typescript
 * import { setupMockClipboard } from '@ux.qa/frontmock'
 *
 * const { getClipboard, cleanup } = setupMockClipboard()
 *
 * render(<TextEditor />)
 *
 * // User clicks copy button
 * await user.click(screen.getByRole('button', { name: /copy/i }))
 *
 * // Verify text was copied
 * expect(getClipboard()).toBe('Expected text')
 *
 * cleanup()
 * ```
 */
export function setupMockClipboard(): MockClipboardReturn {
  let clipboardText = ''
  let clipboardItemsList: ClipboardItem[] = []

  const mockWriteText = vi.fn(async (text: string) => {
    clipboardText = text
  })

  const mockReadText = vi.fn(async () => {
    return clipboardText
  })

  const mockWrite = vi.fn(async (data: ClipboardItem[]) => {
    clipboardItemsList = data
  })

  const mockRead = vi.fn(async () => {
    return clipboardItemsList
  })

  const mockClipboard = {
    writeText: mockWriteText,
    readText: mockReadText,
    write: mockWrite,
    read: mockRead,
  }

  const originalClipboard = navigator.clipboard

  // Install mock
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    value: mockClipboard,
  })

  const getClipboard = () => clipboardText

  const setClipboard = (text: string) => {
    clipboardText = text
  }

  const clearClipboard = () => {
    clipboardText = ''
    clipboardItemsList = []
  }

  const cleanup = () => {
    // Restore original
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: originalClipboard,
    })
    clearClipboard()
    mockWriteText.mockClear()
    mockReadText.mockClear()
    mockWrite.mockClear()
    mockRead.mockClear()
  }

  return {
    writeText: mockWriteText,
    readText: mockReadText,
    write: mockWrite,
    read: mockRead,
    clipboard: clipboardText,
    clipboardItems: clipboardItemsList,
    getClipboard,
    setClipboard,
    clearClipboard,
    cleanup,
  }
}

/**
 * Mock document.execCommand for legacy clipboard operations
 *
 * @example
 * ```typescript
 * import { setupMockExecCommand } from '@ux.qa/frontmock'
 *
 * const { getLastCommand, cleanup } = setupMockExecCommand()
 *
 * render(<LegacyEditor />)
 *
 * // User triggers copy
 * await user.click(screen.getByRole('button', { name: /copy/i }))
 *
 * // Verify execCommand was called
 * expect(getLastCommand()).toEqual({ command: 'copy', value: undefined })
 *
 * cleanup()
 * ```
 */
export function setupMockExecCommand() {
  const commands: Array<{ command: string; value?: string }> = []

  const mockExecCommand = vi.fn((command: string, showUI?: boolean, value?: string) => {
    commands.push({ command, value })
    return true
  })

  const originalExecCommand = document.execCommand

  // Install mock
  document.execCommand = mockExecCommand as any

  const getLastCommand = () => {
    return commands[commands.length - 1]
  }

  const getAllCommands = () => {
    return [...commands]
  }

  const clearCommands = () => {
    commands.length = 0
  }

  const cleanup = () => {
    // Restore original
    document.execCommand = originalExecCommand
    clearCommands()
    mockExecCommand.mockClear()
  }

  return {
    mockExecCommand,
    getLastCommand,
    getAllCommands,
    clearCommands,
    cleanup,
  }
}

/**
 * Helper to simulate clipboard events
 *
 * @example
 * ```typescript
 * import { triggerClipboardEvent } from '@ux.qa/frontmock'
 *
 * const input = screen.getByRole('textbox')
 * input.focus()
 *
 * // Simulate paste
 * triggerClipboardEvent(input, 'paste', 'Pasted text')
 *
 * // Verify text was pasted
 * expect(input).toHaveValue('Pasted text')
 * ```
 */
export function triggerClipboardEvent(
  element: Element,
  type: 'copy' | 'cut' | 'paste',
  data?: string
) {
  const event = new ClipboardEvent(type, {
    bubbles: true,
    cancelable: true,
    clipboardData: new DataTransfer(),
  })

  if (data && event.clipboardData) {
    event.clipboardData.setData('text/plain', data)
  }

  element.dispatchEvent(event)
  return event
}
