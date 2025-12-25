# Test Framework Integration Guide

This guide shows how to integrate the new `@ux.qa/test-framework` with the existing ux-qa codebase.

---

## Step 1: Update Workspace Configuration

### Update `package.json`

```json
{
  "name": "ux.qa",
  "version": "0.1.0",
  "private": true,
  "packageManager": "bun@1.3.4",
  "workspaces": [
    "packages/*",
    "packages/test-framework/core",
    "packages/test-framework/cli"
  ],
  "scripts": {
    "postinstall": "playwright install",
    "dev": "next dev",
    "build": "next build && npm run build:framework",
    "build:framework": "npm run build -w @ux.qa/frontmock && npm run build -w @ux.qa/test-cli",
    "start": "next start",
    "lint": "next lint",

    // Updated test commands
    "test": "uxqa run",
    "test:watch": "uxqa run --watch",
    "test:coverage": "uxqa run --coverage",
    "test:e2e": "uxqa run --provider playwright",
    "test:e2e:ui": "playwright test --ui",

    // New framework commands
    "test:scan": "uxqa scan ./src",
    "test:generate": "uxqa generate ./src",
    "test:report": "uxqa report"
  }
}
```

---

## Step 2: Migrate `lib/test` to Framework

### Option A: Alias Import (Recommended)

Create `lib/test/index.ts` as an alias:

```typescript
// lib/test/index.ts
/**
 * @deprecated Use @ux.qa/frontmock directly
 * This is a compatibility layer for existing code
 */

// Re-export everything from the framework
export * from '@ux.qa/frontmock'
export { t as default, t } from '@ux.qa/frontmock'
```

### Option B: Full Migration

1. Delete `lib/test/*`
2. Update all imports:

```bash
# Find and replace across codebase
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/@\/lib\/test/@ux.qa\/test-framework-core/g"
```

---

## Step 3: Update Existing Tests

### Before (Old Import)

```typescript
// components/__tests__/ArtifactViewer.test.tsx
import { t } from '@/lib/test'

const { describe, it, expect, vi, render, screen, userEvent } = t
```

### After (New Import)

```typescript
// components/__tests__/ArtifactViewer.test.tsx
import { t } from '@ux.qa/frontmock'

const { describe, it, expect, vi, render, screen, userEvent } = t
```

### Batch Update Script

Create `scripts/migrate-imports.sh`:

```bash
#!/bin/bash

# Update all test files
find . -type f \( -name "*.test.ts" -o -name "*.test.tsx" \) \
  -exec sed -i "s/from '@\/lib\/test'/from '@ux.qa\/test-framework-core'/g" {} \;

echo "✓ Migrated test imports"
```

---

## Step 4: Integrate CLI with Scanner

### Update CLI to Use Existing Scanner

```typescript
// packages/test-framework/cli/src/commands/scan.ts
import { scanDirectory, formatOutput } from '@ux.qa/scanner'

export async function scanCommand(path: string, options: ScanOptions) {
  const spinner = ora('Scanning codebase...').start()

  // Use existing scanner package
  const results = await scanDirectory(path, {
    include: options.include || ['**/*.{ts,tsx,js,jsx}'],
    exclude: options.exclude || ['**/*.{test,spec}.{ts,tsx}', '**/node_modules/**'],
    framework: options.framework || 'auto',
  })

  spinner.succeed('Scan complete!')

  const output = formatOutput(results, options.format || 'console')

  if (options.output) {
    await fs.writeFile(options.output, output)
  } else {
    console.log(output)
  }
}
```

### Update CLI to Use Existing Reporter

```typescript
// packages/test-framework/cli/src/commands/report.ts
import { createReporter } from '@ux.qa/reporter'

export async function reportCommand(options: ReportOptions) {
  const reporter = createReporter({
    hubUrl: process.env.UXQA_HUB_URL,
    appId: process.env.UXQA_APP_ID,
  })

  // Generate report using existing reporter
  await reporter.generateReport({
    format: options.format,
    output: options.output,
  })
}
```

---

## Step 5: Update TypeScript Paths

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "paths": {
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/types": ["./lib/types"],

      // Add framework paths
      "@ux.qa/frontmock": ["./packages/test-framework/core/src"],
      "@ux.qa/frontmock/*": ["./packages/test-framework/core/src/*"],
      "@ux.qa/test-cli": ["./packages/test-framework/cli/src"],
      "@ux.qa/scanner": ["./packages/scanner/src"],
      "@ux.qa/reporter": ["./packages/reporter/src"]
    }
  }
}
```

---

## Step 6: Update Vitest Configuration

### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'test/**/*',
      'packages/**/*',
    ],
  },
  resolve: {
    alias: {
      '@/components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/types': path.resolve(__dirname, './lib/types'),

      // Framework aliases
      '@ux.qa/frontmock': path.resolve(__dirname, './packages/test-framework/core/src'),
    },
  },
})
```

---

## Step 7: Update Existing Tests

### Example Migration

#### Before
```typescript
// components/apps/__tests__/ArtifactViewer.test.tsx
import { t } from '@/lib/test'
import { ArtifactViewer } from '../ArtifactViewer'

const { describe, it, expect, vi, render, screen, userEvent } = t

describe('ArtifactViewer', () => {
  it('renders empty state', () => {
    render(<ArtifactViewer runs={[]} />)
    expect(screen.getByText('No artifacts available')).toBeInTheDocument()
  })
})
```

#### After
```typescript
// components/apps/__tests__/ArtifactViewer.test.tsx
import { t } from '@ux.qa/frontmock'
import { ArtifactViewer } from '../ArtifactViewer'

const { describe, it, expect, vi, render, screen, userEvent } = t

describe('ArtifactViewer', () => {
  it('renders empty state', () => {
    render(<ArtifactViewer runs={[]} />)
    expect(screen.getByText('No artifacts available')).toBeInTheDocument()
  })
})
```

**Only the import changes!** All test code stays the same.

---

## Step 8: Create Integration Config

### `uxqa.config.ts` (New file at root)

```typescript
import { defineConfig } from '@ux.qa/frontmock'

export default defineConfig({
  // Test runner
  testRunner: 'vitest',
  framework: 'react',

  // Scanner configuration (uses existing @ux.qa/scanner)
  scanner: {
    include: ['**/*.{ts,tsx}'],
    exclude: [
      '**/*.{test,spec}.{ts,tsx}',
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
    ],
    framework: 'react',
    suggestTestIds: true,
    testDir: './components/__tests__',
  },

  // Generator configuration
  generator: {
    outputDir: './components/__tests__',
    template: 'vitest',
    addTodos: true,
    includeVisibility: true,
    includeInteractions: true,
    includeNavigation: true,
    includeForms: true,
  },

  // Reporter configuration (uses existing @ux.qa/reporter)
  reporter: {
    hubUrl: process.env.UXQA_HUB_URL || 'http://localhost:3200',
    appId: 'ux-qa-dashboard',
    suite: 'component-tests',
  },
})
```

---

## Step 9: Add CLI to Package Dependencies

### Update `package.json` devDependencies

```json
{
  "devDependencies": {
    // Existing...
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.1",
    "@testing-library/user-event": "^14.6.1",

    // Add framework packages
    "@ux.qa/frontmock": "workspace:*",
    "@ux.qa/test-cli": "workspace:*",

    // Existing test tools remain
    "@vitejs/plugin-react": "^5.1.2",
    "vitest": "^4.0.16",
    "playwright": "1.57.0"
  }
}
```

---

## Step 10: Integration Testing

### Test the Integration

```bash
# 1. Install dependencies
bun install

# 2. Build framework packages
cd packages/test-framework/core && bun run build
cd ../cli && bun run build

# 3. Link packages locally
cd ../../.. && bun link

# 4. Run existing tests with new framework
bun test

# 5. Test CLI commands
npx uxqa scan ./components
npx uxqa generate ./components --dry-run
npx uxqa run
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    UX.QA Monorepo                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │          Dashboard Application                       │    │
│  │  (Next.js, React, Components)                        │    │
│  └──────────────────┬───────────────────────────────────┘    │
│                     │                                         │
│                     │ Uses for testing ↓                      │
│                     ▼                                         │
│  ┌──────────────────────────────────────────────────────┐    │
│  │      @ux.qa/frontmock                       │    │
│  │  - Vitest/Jest/Bun/Playwright providers              │    │
│  │  - Test utilities & helpers                          │    │
│  │  - React Testing Library integration                 │    │
│  └──────────────────┬───────────────────────────────────┘    │
│                     │                                         │
│                     │ Powers ↓                                │
│                     ▼                                         │
│  ┌──────────────────────────────────────────────────────┐    │
│  │           @ux.qa/test-cli                             │    │
│  │  - scan, generate, run, report commands              │    │
│  └──────┬─────────────────────────┬─────────────────────┘    │
│         │                         │                           │
│         │ Uses ↓                  │ Uses ↓                   │
│         ▼                         ▼                           │
│  ┌─────────────────┐      ┌──────────────────┐               │
│  │  @ux.qa/scanner │      │ @ux.qa/reporter  │               │
│  │  - AST analysis │      │ - Playwright     │               │
│  │  - Test gen     │      │ - Result publish │               │
│  └─────────────────┘      └──────────────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Benefits of Integration

### 1. **Unified Testing Interface**
```typescript
// All tests use the same API
import { t } from '@ux.qa/frontmock'
```

### 2. **Seamless CLI**
```bash
# One CLI for everything
uxqa scan       # Uses @ux.qa/scanner
uxqa generate   # Uses scanner + generator
uxqa run        # Uses vitest/playwright
uxqa report     # Uses @ux.qa/reporter
```

### 3. **Existing Packages Enhanced**
- Scanner: Now accessible via CLI
- Reporter: Integrated with framework
- Tests: Can switch providers easily

### 4. **Backward Compatible**
```typescript
// Old code still works
import { t } from '@/lib/test'  // ← Aliased to framework

// New code uses framework directly
import { t } from '@ux.qa/frontmock'
```

---

## Migration Checklist

- [ ] Update workspace config in root `package.json`
- [ ] Add framework packages to dependencies
- [ ] Build test-framework packages
- [ ] Create `uxqa.config.ts`
- [ ] Update TypeScript paths in `tsconfig.json`
- [ ] Migrate imports in test files (or create alias)
- [ ] Update CI/CD scripts to use new commands
- [ ] Test existing tests still pass
- [ ] Test CLI commands work
- [ ] Update documentation

---

## Gradual Migration Strategy

You don't have to migrate everything at once:

### Phase 1: Add Framework (Parallel)
```typescript
// Keep existing
import { t } from '@/lib/test'

// Add framework alongside
import { t } from '@ux.qa/frontmock'
```

### Phase 2: Migrate New Tests
```typescript
// New tests use framework
import { t } from '@ux.qa/frontmock'
```

### Phase 3: Migrate Existing Tests
```bash
# Bulk update imports
./scripts/migrate-imports.sh
```

### Phase 4: Remove Old `lib/test`
```bash
rm -rf lib/test
```

---

## Next Steps

1. **Try it now**: Run the migration script below
2. **Test integration**: Verify existing tests pass
3. **Use new features**: Try CLI commands
4. **Feedback**: Refine based on usage

## Quick Start Migration Script

```bash
#!/bin/bash

echo "🚀 Starting Test Framework Integration..."

# 1. Build framework
echo "📦 Building framework packages..."
cd packages/test-framework/core && bun run build
cd ../cli && bun run build && chmod +x dist/cli.js
cd ../../..

# 2. Install dependencies
echo "📥 Installing dependencies..."
bun install

# 3. Create config
echo "⚙️  Creating config..."
cat > uxqa.config.ts << 'EOF'
export default {
  testRunner: 'vitest',
  framework: 'react',
  scanner: {
    include: ['**/*.{ts,tsx}'],
    exclude: ['**/*.test.{ts,tsx}', '**/node_modules/**'],
  },
}
EOF

# 4. Test CLI
echo "🧪 Testing CLI..."
npx uxqa scan ./components

echo "✅ Integration complete!"
echo ""
echo "Next steps:"
echo "  1. Run tests: bun test"
echo "  2. Scan code: npx uxqa scan"
echo "  3. Generate tests: npx uxqa generate"
```

Save as `scripts/integrate-framework.sh` and run:

```bash
chmod +x scripts/integrate-framework.sh
./scripts/integrate-framework.sh
```
