# SPI Guide

The Service Provider Interface (SPI) is the foundation of the UX.QA Test Framework. It provides a unified API that works across multiple test runners.

## What is the SPI?

The SPI is an abstraction layer that allows you to write tests once and run them with different test providers (Vitest, Jest, Bun, Playwright) without changing your test code.

## Architecture

```
┌─────────────────────────────────────────┐
│           Your Test Code                 │
│  const { describe, it, expect } = t      │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      TestingProvider Interface           │
│  (Framework-agnostic API)                │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┼─────────┬─────────┐
    ▼         ▼         ▼         ▼
 Vitest     Jest      Bun    Playwright
Provider  Provider Provider  Provider
```

## Core Interfaces

### TestingProvider

The main interface that all providers implement:

```typescript
interface TestingProvider {
  // Metadata
  name: 'vitest' | 'bun' | 'jest'
  version: string

  // Test definition
  describe: SuiteFn & { skip, only, todo, each }
  it: TestFn & { skip, only, todo, each, concurrent }
  test: TestFn & { skip, only, todo, each, concurrent }

  // Lifecycle
  beforeAll: HookFn
  afterAll: HookFn
  beforeEach: HookFn
  afterEach: HookFn

  // Assertions
  expect: ExpectFn

  // Mocking
  vi: MockFunctions
  mock: MockFunctions

  // DOM Testing (React Testing Library)
  render: (ui: ReactElement) => RenderResult
  screen: Screen
  userEvent: UserEventInstance
  cleanup: () => void
  waitFor: <T>(callback: () => T) => Promise<T>
  act: (callback: () => void) => Promise<void>
}
```

## Using the SPI

### Basic Usage

```typescript
import { t } from '@ux.qa/frontmock'

const { describe, it, expect } = t

describe('Calculator', () => {
  it('adds two numbers', () => {
    expect(add(2, 3)).toBe(5)
  })
})
```

### With React Testing Library

```typescript
import { t } from '@ux.qa/frontmock'

const { describe, it, expect, render, screen } = t

describe('Counter', () => {
  it('increments count', async () => {
    const user = t.userEvent.setup()

    render(<Counter />)

    await user.click(screen.getByRole('button', { name: '+' }))

    expect(screen.getByText('Count: 1')).toBeInTheDocument()
  })
})
```

### With Mocks

```typescript
import { t } from '@ux.qa/frontmock'

const { describe, it, expect, vi } = t

describe('UserService', () => {
  it('fetches user data', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'John' })
    })

    vi.stubGlobal('fetch', mockFetch)

    const user = await fetchUser('123')

    expect(user.name).toBe('John')
    expect(mockFetch).toHaveBeenCalledWith('/api/users/123')

    vi.unstubAllGlobals()
  })
})
```

## Provider Detection

The framework automatically detects available providers:

```typescript
import { detectProvider } from '@ux.qa/frontmock'

const provider = await detectProvider()
console.log(provider.name) // 'vitest', 'bun', 'jest', etc.
```

## Custom Providers

You can create custom providers:

```typescript
import { registerProvider } from '@ux.qa/frontmock'

registerProvider('my-runner', async () => ({
  name: 'my-runner',
  version: '1.0.0',
  describe: myRunner.describe,
  it: myRunner.it,
  expect: myRunner.expect,
  // ... implement full interface
}))
```

## Benefits

1. **Write Once, Run Anywhere** - Tests work across different runners
2. **Easy Migration** - Switch test providers without rewriting tests
3. **Consistent API** - Same interface regardless of underlying tool
4. **Type Safety** - Full TypeScript support
5. **Best Practices** - Enforces good testing patterns

## Limitations

Some provider-specific features may not be available through the SPI. For advanced use cases, you can still import the provider directly:

```typescript
import { it } from 'vitest'

it('uses vitest-specific features', async (ctx) => {
  ctx.skip() // Vitest-only feature
})
```

## Next Steps

- Read [Providers](./providers.md) for details on each provider
- See [Examples](../examples/) for real-world usage
- Check [CLI Reference](./cli-reference.md) for tooling options
