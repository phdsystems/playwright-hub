# Getting Started

Welcome to the UX.QA Test Framework! This guide will help you get up and running quickly.

## Installation

### Using the CLI (Recommended)

The easiest way to get started is using the CLI:

```bash
npm install --save-dev @ux.qa/test-cli
npx uxqa init
```

This will:
1. Detect your project type (React, Vue, Node, etc.)
2. Prompt you to choose a test provider (Vitest, Jest, Playwright)
3. Install required dependencies
4. Create a configuration file

### Manual Installation

If you prefer manual setup:

```bash
# Install core framework
npm install --save-dev @ux.qa/frontmock

# Install your preferred test provider
npm install --save-dev vitest  # or jest, @playwright/test, etc.

# For React projects
npm install --save-dev @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

## Your First Test

### React Component Test

```typescript
// Button.test.tsx
import { t } from '@ux.qa/frontmock'

const { describe, it, expect, render, screen, userEvent } = t

describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const onClick = t.vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={onClick}>Click me</Button>)

    await user.click(screen.getByRole('button', { name: 'Click me' }))

    expect(onClick).toHaveBeenCalledOnce()
  })
})
```

### Running Tests

```bash
# Using the CLI
npx uxqa run

# Or use your provider directly
npx vitest
```

## Next Steps

- Read the [SPI Guide](./spi-guide.md) to understand the abstraction layer
- Check out [Providers](./providers.md) to learn about different test runners
- See [CLI Reference](./cli-reference.md) for all available commands
- Browse [Examples](../examples/) for more use cases
