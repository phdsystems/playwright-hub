# UX.QA

Test automation dashboard ecosystem for Playwright and E2E testing frameworks.

## Quick Install

```bash
# Dashboard
git clone https://github.com/phdsystems/ux-qa.git
cd ux-qa && bun install && bun run dev

# Reporter (in your Playwright project)
npm install @ux.qa/reporter

# Scanner CLI
npm install -g @ux.qa/scanner
```

## Minimal Usage

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['html'],
    ['@ux.qa/reporter', {
      hubUrl: 'http://localhost:3200',
      appId: 'my-app',
      suite: 'e2e'
    }]
  ]
});
```

## What's Inside

- **Dashboard** - Real-time test visualization, trend charts, alerting
- **@ux.qa/reporter** - Playwright reporter with auto CI detection
- **@ux.qa/scanner** - React component analysis CLI

## Documentation

- [Architecture](3-design/architecture.md) - System design and data flow
- [Component Model](3-design/component-architecture.md) - Module structure
- [API Reference](3-design/api-reference.md) - REST API endpoints
- [Configuration](3-design/configuration.md) - All environment variables
- [Developer Guide](4-development/developer-guide.md) - Integration tutorials

## Requirements

- Node.js 18+ or Bun 1.0+
- Playwright 1.40+ (for reporter)
