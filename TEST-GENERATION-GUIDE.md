# Test Generation Guide - Three-Tier Architecture

## Overview

The UX.QA test generator now supports **three comprehensive test strategies**:

1. **Component Tests** - Unit tests for React components using `@ux.qa/frontmock`
2. **Integration Tests** - Tests for API integration, hooks, and complex state
3. **E2E Tests** - End-to-end browser tests using Playwright

---

## Architecture

```
packages/scanner/src/generator/
├── component/
│   └── component-template.ts       # Component tests (NEW!)
├── integration/
│   └── integration-template.ts     # Integration tests (NEW!)
├── e2e/
│   └── playwright-template.ts      # E2E tests (moved from test-template.ts)
└── index.ts                        # Main generator router
```

---

## Test Types Comparison

| Aspect | Component | Integration | E2E |
|--------|-----------|-------------|-----|
| **Framework** | @ux.qa/frontmock | @ux.qa/frontmock | Playwright |
| **Scope** | Single component in isolation | Component + external dependencies | Full application flow |
| **Speed** | ⚡ Very Fast | ⚡ Fast | 🐌 Slower |
| **Reliability** | ✅ High | ✅ High | ⚠️ Medium |
| **Environment** | Node.js (jsdom) | Node.js (jsdom) | Real browser |
| **File Extension** | `.test.tsx` | `.integration.test.tsx` | `.spec.ts` |
| **Test Directory** | `tests/` | `tests/integration/` | `tests/e2e/` |

---

## Usage

### Generate Component Tests (Default)

```bash
# Generate component tests using test-framework-core
uxqa generate ./src --type component

# or simply (component is default)
uxqa generate ./src
```

**Generates:**
```typescript
// tests/counter.test.tsx
import { t } from '@ux.qa/frontmock';
import { Counter } from '../Counter';

const { describe, it, expect, render, screen, userEvent } = t;

describe('Counter', () => {
  it('renders Counter', () => {
    render(<Counter />);
    expect(screen.getByTestId('count-display')).toBeInTheDocument();
  });

  it('handles increment click', async () => {
    const user = userEvent.setup();
    render(<Counter />);
    await user.click(screen.getByTestId('increment-btn'));
    // TODO: Add assertion for expected behavior after click
  });
});
```

### Generate Integration Tests

```bash
uxqa generate ./src --type integration
```

**Generates:**
```typescript
// tests/integration/login-form.integration.test.tsx
import { t } from '@ux.qa/frontmock';
import { LoginForm } from '../../LoginForm';

const { describe, it, expect, beforeEach, afterEach, vi, render, screen, waitFor, userEvent } = t;

describe('LoginForm - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('integrates with API/services correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'abc123' }),
    });
    global.fetch = mockFetch;

    render(<LoginForm />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
    // TODO: Add assertions for API integration
  });

  it('handles form submission integration', async () => {
    const mockSubmit = vi.fn().mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockSubmit} />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
    });
  });
});
```

### Generate E2E Tests

```bash
uxqa generate ./src --type e2e
```

**Generates:**
```typescript
// tests/e2e/login-form.spec.ts
import { test, expect } from '@playwright/test';

test.describe('LoginForm', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should render LoginForm elements', async ({ page }) => {
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
  });

  test('should submit form', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    // TODO: Add assertion for form submission result
  });
});
```

### Generate All Three Types

```bash
uxqa generate ./src --type all
```

Generates **all three test types** for each component:
- `tests/component.test.tsx` (Component tests)
- `tests/integration/component.integration.test.tsx` (Integration tests)
- `tests/e2e/component.spec.ts` (E2E tests)

---

## When to Use Each Type

### Component Tests (Default)

**Use when:**
- ✅ Testing component rendering
- ✅ Testing user interactions (clicks, typing)
- ✅ Testing component props
- ✅ Testing conditional rendering
- ✅ Fast feedback needed

**Example scenarios:**
- Button renders with correct text
- Input accepts user input
- Form validation works
- Conditional UI appears/disappears

### Integration Tests

**Use when:**
- ✅ Testing API integration
- ✅ Testing custom hooks
- ✅ Testing context providers
- ✅ Testing complex state management
- ✅ Testing data fetching

**Example scenarios:**
- Component fetches data from API on mount
- Form submits data to backend
- Authentication flow
- WebSocket connections
- LocalStorage/SessionStorage interaction

### E2E Tests

**Use when:**
- ✅ Testing complete user journeys
- ✅ Testing navigation between pages
- ✅ Testing full application flows
- ✅ Testing in real browser environment
- ✅ Testing cross-component interactions

**Example scenarios:**
- User registers, logs in, and completes a task
- Multi-step checkout process
- Full search and filter workflow
- Cross-page state persistence

---

## Test Pyramid Recommendation

```
        /\
       /  \       E2E Tests (10%)
      /────\      Slow, Comprehensive
     /      \
    /────────\    Integration Tests (30%)
   /          \   Medium Speed, Critical Paths
  /────────────\
 /              \ Component Tests (60%)
/________________\ Fast, Comprehensive Coverage
```

**Recommended distribution:**
- **60% Component Tests** - Fast, isolated, comprehensive
- **30% Integration Tests** - Critical user flows
- **10% E2E Tests** - Happy paths and critical journeys

---

## CLI Options

```bash
uxqa generate [path] [options]

Options:
  --type <type>           Test type: e2e, component, integration, all (default: "component")
  --framework <framework> Framework: react, vue, angular (default: "react")
  -o, --output <dir>      Output directory (default: "./tests")
  --dry-run               Show what would be generated without writing files
  --force                 Overwrite existing test files
```

---

## Integration Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. Developer runs CLI                                  │
│     $ uxqa generate ./src --type component              │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  2. Scanner analyzes components                         │
│     Returns: ComponentInfo[]                            │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  3. Generator routes to correct template                │
│     component → component-template.ts                   │
│     integration → integration-template.ts               │
│     e2e → playwright-template.ts                        │
│     all → generates all three                           │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  4. Template generates test code                        │
│     component: Uses test-framework-core ✅              │
│     integration: Uses test-framework-core ✅            │
│     e2e: Uses Playwright                                │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  5. CLI writes files to disk                            │
│     ./tests/*.test.tsx                                  │
│     ./tests/integration/*.integration.test.tsx          │
│     ./tests/e2e/*.spec.ts                               │
└─────────────────────────────────────────────────────────┘
```

---

## File Structure After Generation

```
src/
├── components/
│   ├── Button.tsx
│   ├── LoginForm.tsx
│   └── Counter.tsx
│
tests/
├── button.test.tsx                        # Component test
├── login-form.test.tsx                    # Component test
├── counter.test.tsx                       # Component test
│
├── integration/
│   ├── button.integration.test.tsx        # Integration test
│   ├── login-form.integration.test.tsx    # Integration test
│   └── counter.integration.test.tsx       # Integration test
│
└── e2e/
    ├── button.spec.ts                     # E2E test
    ├── login-form.spec.ts                 # E2E test
    └── counter.spec.ts                    # E2E test
```

---

## Key Features

### ✅ Component Tests
- Uses `@ux.qa/frontmock`
- Imports component directly
- Uses `render()`, `screen`, `userEvent`
- Tests in isolation
- No browser needed

### ✅ Integration Tests
- Uses `@ux.qa/frontmock`
- Tests with mocked APIs
- Uses `vi.mock()`, `waitFor()`, `beforeEach()`
- Tests component + dependencies
- No browser needed

### ✅ E2E Tests
- Uses Playwright
- Runs in real browser
- Tests full user flows
- Uses `page.goto()`, `page.locator()`
- Slower but comprehensive

---

## Summary

**Status**: ✅ **FULLY IMPLEMENTED**

**Components**:
- ✅ Component test generator (uses test-framework-core)
- ✅ Integration test generator (uses test-framework-core)
- ✅ E2E test generator (uses Playwright)
- ✅ CLI with --type option
- ✅ Unified generator router

**The generator now FULLY integrates with test-framework-core for component and integration tests!**

Run tests:
```bash
# Generate component tests
uxqa generate ./src --type component

# Generate all three types
uxqa generate ./src --type all

# Run the tests
uxqa run
```
