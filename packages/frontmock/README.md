# FrontMock

> Modern frontend testing framework with 20+ reusable test components and zero-config setup

## Features

- **🎭 20+ Mock Components** - Built-in mocks for media, canvas, WebSocket, clipboard, and more
- **🎨 Test Providers** - Theme, Router, and context providers for easy test setup
- **🔌 Pluggable Test Runners** - Use Vitest, Jest, or Bun with the same unified API
- **⚡ Auto-generate Tests** - Create component, integration, and E2E tests automatically
- **🧩 Framework Agnostic** - Works with React, Vue, and Node.js
- **📦 Zero Configuration** - Works out of the box with sensible defaults
- **🛠️ Unified CLI** - Single command-line interface for all testing operations

## Quick Start

### Installation

```bash
npm install --save-dev @ux.qa/frontmock @ux.qa/test-cli
```

### Initialize

```bash
npx uxqa init
```

This will:
- Detect your project framework
- Install appropriate test dependencies
- Create `uxqa.config.ts`
- Set up your testing environment

### Usage

```typescript
// my-component.test.ts
import { t } from '@ux.qa/frontmock'

const { describe, it, expect, render, screen } = t

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

## CLI Commands

```bash
# Scan codebase for components and coverage
uxqa scan ./src

# Generate test files
uxqa generate ./src --template playwright

# Run tests
uxqa run --watch

# Generate coverage report
uxqa report --format html --open
```

## Architecture

### Service Provider Interface (SPI)

The framework uses an SPI pattern to support multiple test runners:

```
┌─────────────────────────────────────────┐
│         TestingProvider SPI              │
├─────────────────────────────────────────┤
│  - describe, it, test                    │
│  - expect, assertions                    │
│  - mock, spy                             │
│  - render, screen, userEvent             │
└─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┬─────────────┐
        ▼           ▼           ▼             ▼
    Vitest       Bun         Jest       Playwright
   Provider    Provider    Provider     Provider
```

### Packages

| Package | Description |
|---------|-------------|
| `@ux.qa/frontmock` | Core test provider SPI and utilities |
| `@ux.qa/test-cli` | Unified CLI tool |
| `@ux.qa/scanner` | Component analysis and test generation |
| `@ux.qa/reporter` | Test result reporting for various frameworks |

## Documentation

- [Getting Started](./docs/getting-started.md)
- [SPI Guide](./docs/spi-guide.md)
- [Providers](./docs/providers.md)
- [CLI Reference](./docs/cli-reference.md)
- [Configuration](./docs/configuration.md)
- [Examples](./examples/)

## Examples

### React Application

```typescript
import { t } from '@ux.qa/frontmock'

const { describe, it, expect, render, screen, userEvent } = t

describe('LoginForm', () => {
  it('submits form with credentials', async () => {
    const onSubmit = t.vi.fn()
    const user = userEvent.setup()

    render(<LoginForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
  })
})
```

### Vue Application

```typescript
import { t } from '@ux.qa/frontmock'
import { mount } from '@vue/test-utils'

const { describe, it, expect } = t

describe('Counter.vue', () => {
  it('increments count when button is clicked', async () => {
    const wrapper = mount(Counter)

    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('Count: 1')
  })
})
```

### Node.js API

```typescript
import { t } from '@ux.qa/frontmock'

const { describe, it, expect } = t

describe('UserService', () => {
  it('creates a new user', async () => {
    const user = await UserService.create({
      name: 'John Doe',
      email: 'john@example.com'
    })

    expect(user).toMatchObject({
      name: 'John Doe',
      email: 'john@example.com'
    })
  })
})
```

## Advanced Features

### Custom Providers

Create your own test provider:

```typescript
import { registerProvider } from '@ux.qa/frontmock'

registerProvider('custom', async () => ({
  name: 'custom',
  version: '1.0.0',
  describe: /* ... */,
  it: /* ... */,
  expect: /* ... */,
  // ... implement full TestingProvider interface
}))
```

### Test Utilities

```typescript
import {
  createMock,
  mockFetch,
  mockLocalStorage,
  wait,
  retry,
  assertDefined
} from '@ux.qa/frontmock/utilities'

// Mock functions
const mockFn = createMock((x: number) => x * 2)
mockFn(5)
expect(mockFn.calls).toHaveLength(1)

// Mock fetch
global.fetch = mockFetch({
  '/api/users': { status: 200, body: [] }
})

// Wait utilities
await wait(100)
await retry(() => fetchData(), { retries: 3 })
```

## Configuration

```typescript
// uxqa.config.ts
import { defineConfig } from '@ux.qa/frontmock'

export default defineConfig({
  testRunner: 'vitest',
  framework: 'react',
  scanner: {
    include: ['**/*.{ts,tsx}'],
    exclude: ['**/*.test.{ts,tsx}']
  },
  generator: {
    outputDir: './tests',
    template: 'vitest',
    addTodos: true
  },
  reporter: {
    hubUrl: 'https://testing.example.com',
    appId: 'my-app'
  }
})
```

## License

MIT

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md)
