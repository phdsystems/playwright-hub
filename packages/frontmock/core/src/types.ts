/**
 * Test Provider SPI - Service Provider Interface for testing frameworks
 *
 * This abstraction allows swapping between Vitest, Bun, Jest, or other test runners
 * without changing test files.
 */

// ============================================================================
// Core Test Functions
// ============================================================================

export type TestFn = (name: string, fn: () => void | Promise<void>) => void
export type SuiteFn = (name: string, fn: () => void) => void
export type HookFn = (fn: () => void | Promise<void>) => void

// ============================================================================
// Assertion Types
// ============================================================================

export interface Matchers<T = unknown> {
  // Equality
  toBe(expected: T): void
  toEqual(expected: T): void
  toStrictEqual(expected: T): void

  // Truthiness
  toBeTruthy(): void
  toBeFalsy(): void
  toBeNull(): void
  toBeUndefined(): void
  toBeDefined(): void
  toBeNaN(): void

  // Numbers
  toBeGreaterThan(expected: number): void
  toBeGreaterThanOrEqual(expected: number): void
  toBeLessThan(expected: number): void
  toBeLessThanOrEqual(expected: number): void
  toBeCloseTo(expected: number, precision?: number): void

  // Strings
  toMatch(expected: string | RegExp): void
  toContain(expected: unknown): void
  toHaveLength(expected: number): void

  // Objects/Arrays
  toHaveProperty(key: string, value?: unknown): void
  toMatchObject(expected: object): void
  toContainEqual(expected: unknown): void

  // Exceptions
  toThrow(expected?: string | RegExp | Error): void
  toThrowError(expected?: string | RegExp | Error): void

  // Async
  resolves: Matchers<Awaited<T>>
  rejects: Matchers<unknown>

  // Negation
  not: Matchers<T>

  // DOM Matchers (from @testing-library/jest-dom)
  toBeInTheDocument(): void
  toBeVisible(): void
  toBeDisabled(): void
  toBeEnabled(): void
  toHaveAttribute(attr: string, value?: string): void
  toHaveClass(...classes: string[]): void
  toHaveValue(value: string | number | string[]): void
  toHaveTextContent(text: string | RegExp): void
  toBeChecked(): void
  toHaveFocus(): void
  toBeEmpty(): void
  toBeEmptyDOMElement(): void
  toBeRequired(): void
  toBeValid(): void
  toBeInvalid(): void
  toHaveStyle(css: string | Record<string, unknown>): void
}

export interface ExpectFn {
  <T>(actual: T): Matchers<T>
  extend(matchers: Record<string, unknown>): void
  any(constructor: unknown): unknown
  anything(): unknown
  arrayContaining(array: unknown[]): unknown
  objectContaining(obj: object): unknown
  stringContaining(str: string): unknown
  stringMatching(str: string | RegExp): unknown
}

// ============================================================================
// Mock Types
// ============================================================================

export interface MockInstance<T = unknown, TArgs extends unknown[] = unknown[]> {
  (...args: TArgs): T

  // Mock metadata
  mock: {
    calls: TArgs[]
    results: Array<{ type: 'return' | 'throw'; value: unknown }>
    instances: unknown[]
    lastCall?: TArgs
  }

  // Mock configuration
  mockImplementation(fn: (...args: TArgs) => T): this
  mockImplementationOnce(fn: (...args: TArgs) => T): this
  mockReturnValue(value: T): this
  mockReturnValueOnce(value: T): this
  mockResolvedValue(value: Awaited<T>): this
  mockResolvedValueOnce(value: Awaited<T>): this
  mockRejectedValue(value: unknown): this
  mockRejectedValueOnce(value: unknown): this
  mockClear(): this
  mockReset(): this
  mockRestore(): void

  // Assertions
  toHaveBeenCalled(): void
  toHaveBeenCalledTimes(times: number): void
  toHaveBeenCalledWith(...args: TArgs): void
  toHaveBeenLastCalledWith(...args: TArgs): void
  toHaveBeenNthCalledWith(n: number, ...args: TArgs): void
}

export interface MockFunctions {
  fn<T = unknown, TArgs extends unknown[] = unknown[]>(
    implementation?: (...args: TArgs) => T
  ): MockInstance<T, TArgs>

  spyOn<T extends object, K extends keyof T>(
    object: T,
    method: K
  ): MockInstance<T[K]>

  stubGlobal(name: string, value: unknown): void
  unstubAllGlobals(): void

  clearAllMocks(): void
  resetAllMocks(): void
  restoreAllMocks(): void
}

// ============================================================================
// Test Provider Interface
// ============================================================================

export interface TestProvider {
  // Provider metadata
  readonly name: 'vitest' | 'bun' | 'jest'
  readonly version: string

  // Test definition
  describe: SuiteFn & {
    skip: SuiteFn
    only: SuiteFn
    todo: (name: string) => void
    each: <T>(cases: T[]) => (name: string, fn: (arg: T) => void) => void
  }

  it: TestFn & {
    skip: TestFn
    only: TestFn
    todo: (name: string) => void
    each: <T>(cases: T[]) => (name: string, fn: (arg: T) => void) => void
    concurrent: TestFn
  }

  test: TestProvider['it']

  // Lifecycle hooks
  beforeAll: HookFn
  afterAll: HookFn
  beforeEach: HookFn
  afterEach: HookFn

  // Assertions
  expect: ExpectFn

  // Mocking
  vi: MockFunctions
  mock: MockFunctions

  // Utilities
  skip: () => void
  only: () => void
}

// ============================================================================
// DOM Testing Utilities (React Testing Library abstraction)
// ============================================================================

export interface RenderResult {
  container: HTMLElement
  baseElement: HTMLElement
  debug: (element?: HTMLElement) => void
  rerender: (ui: React.ReactElement) => void
  unmount: () => void
  asFragment: () => DocumentFragment
}

export interface Screen {
  // Queries
  getByText(text: string | RegExp): HTMLElement
  getAllByText(text: string | RegExp): HTMLElement[]
  queryByText(text: string | RegExp): HTMLElement | null
  queryAllByText(text: string | RegExp): HTMLElement[]
  findByText(text: string | RegExp): Promise<HTMLElement>
  findAllByText(text: string | RegExp): Promise<HTMLElement[]>

  getByRole(role: string, options?: { name?: string | RegExp }): HTMLElement
  getAllByRole(role: string, options?: { name?: string | RegExp }): HTMLElement[]
  queryByRole(role: string, options?: { name?: string | RegExp }): HTMLElement | null
  queryAllByRole(role: string, options?: { name?: string | RegExp }): HTMLElement[]
  findByRole(role: string, options?: { name?: string | RegExp }): Promise<HTMLElement>

  getByPlaceholderText(text: string | RegExp): HTMLElement
  queryByPlaceholderText(text: string | RegExp): HTMLElement | null

  getByTestId(testId: string): HTMLElement
  queryByTestId(testId: string): HTMLElement | null

  getByLabelText(text: string | RegExp): HTMLElement
  queryByLabelText(text: string | RegExp): HTMLElement | null

  getByDisplayValue(value: string | RegExp): HTMLElement
  queryByDisplayValue(value: string | RegExp): HTMLElement | null

  debug: (element?: HTMLElement) => void
}

export interface UserEventInstance {
  click(element: HTMLElement): Promise<void>
  dblClick(element: HTMLElement): Promise<void>
  type(element: HTMLElement, text: string): Promise<void>
  clear(element: HTMLElement): Promise<void>
  selectOptions(element: HTMLElement, values: string | string[]): Promise<void>
  hover(element: HTMLElement): Promise<void>
  unhover(element: HTMLElement): Promise<void>
  tab(options?: { shift?: boolean }): Promise<void>
  keyboard(text: string): Promise<void>
  upload(element: HTMLElement, files: File | File[]): Promise<void>
  paste(text: string): Promise<void>
}

export interface DOMTestingProvider {
  render(ui: React.ReactElement): RenderResult
  screen: Screen
  userEvent: {
    setup(): UserEventInstance
  }
  cleanup(): void
  waitFor<T>(callback: () => T | Promise<T>, options?: { timeout?: number }): Promise<T>
  act(callback: () => void | Promise<void>): Promise<void>
}

// ============================================================================
// Combined Provider
// ============================================================================

export interface TestingProvider extends TestProvider, DOMTestingProvider {}

// ============================================================================
// Provider Registry
// ============================================================================

export interface ProviderFactory {
  (): TestingProvider | Promise<TestingProvider>
}

export interface ProviderRegistry {
  register(name: string, factory: ProviderFactory): void
  get(name?: string): Promise<TestingProvider>
  getSync(name?: string): TestingProvider
  setDefault(name: string): void
}
