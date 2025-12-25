# Integration Architecture

## Complete Integration Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                         UX.QA Ecosystem                             │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Dashboard (Next.js App)                    │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │  │
│  │  │ Components │  │   Pages    │  │    API     │             │  │
│  │  │  (React)   │  │  (Routes)  │  │  (Routes)  │             │  │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘             │  │
│  │        │               │               │                     │  │
│  │        └───────────────┴───────────────┘                     │  │
│  │                        │                                     │  │
│  │                        │ Tested with                         │  │
│  │                        ▼                                     │  │
│  │        ┌─────────────────────────────────────┐               │  │
│  │        │  @ux.qa/frontmock         │               │  │
│  │        │  (Previously lib/test)              │               │  │
│  │        │  - Vitest Provider                  │               │  │
│  │        │  - Jest Provider                    │               │  │
│  │        │  - Bun Provider                     │               │  │
│  │        │  - Playwright Provider              │               │  │
│  │        │  - Test Utilities                   │               │  │
│  │        └──────────────┬──────────────────────┘               │  │
│  └───────────────────────┼──────────────────────────────────────┘  │
│                          │                                         │
│                          │ Powers                                  │
│                          ▼                                         │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │               @ux.qa/test-cli                                │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │  │
│  │  │   scan   │ │ generate │ │   run    │ │  report  │        │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘        │  │
│  └───────┼────────────┼────────────┼────────────┼──────────────┘  │
│          │            │            │            │                  │
│          │            │            │            │                  │
│  ┌───────▼────┐  ┌────▼─────┐  ┌──▼──────┐  ┌──▼──────────┐      │
│  │  @ux.qa/   │  │  @ux.qa/ │  │  Test   │  │   @ux.qa/   │      │
│  │  scanner   │  │  scanner │  │ Provider│  │  reporter   │      │
│  │            │  │          │  │         │  │             │      │
│  │  - AST     │  │  - Test  │  │ - Vitest│  │  - Results  │      │
│  │    Parse   │  │    Gen   │  │ - Jest  │  │  - Publish  │      │
│  │  - Analyze │  │  - Scaff │  │ - Play  │  │  - Metrics  │      │
│  └────────────┘  └──────────┘  └─────────┘  └─────────────┘      │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Component Testing Flow

```
Developer writes component
         │
         ▼
Component uses @ux.qa/frontmock for tests
         │
         ▼
Tests run with Vitest/Jest/Bun
         │
         ▼
Results published via @ux.qa/reporter
         │
         ▼
Dashboard displays results
```

### 2. Test Generation Flow

```
Developer runs: uxqa scan ./src
         │
         ▼
@ux.qa/scanner analyzes components
         │
         ▼
Scanner outputs ComponentInfo[]
         │
         ▼
Developer runs: uxqa generate
         │
         ▼
Generator creates test scaffolds
         │
         ▼
Test files written to disk
         │
         ▼
Developer customizes and runs tests
```

### 3. CLI Command Flow

```
$ uxqa <command>
         │
         ▼
@ux.qa/test-cli routes command
         │
         ├─ scan ────────→ @ux.qa/scanner
         ├─ generate ────→ @ux.qa/scanner + generator
         ├─ run ─────────→ @ux.qa/frontmock
         └─ report ──────→ @ux.qa/reporter
```

## Package Dependencies

```
@ux.qa/frontmock
  ├── vitest (peer)
  ├── jest (peer)
  ├── @testing-library/react (peer)
  └── @testing-library/user-event (peer)

@ux.qa/test-cli
  ├── @ux.qa/frontmock (workspace)
  ├── @ux.qa/scanner (workspace)
  ├── @ux.qa/reporter (workspace)
  ├── chalk
  ├── commander
  └── ora

@ux.qa/scanner (existing)
  ├── @babel/parser
  ├── @babel/traverse
  └── glob

@ux.qa/reporter (existing)
  └── @playwright/test (peer)

ux-qa (root)
  ├── @ux.qa/frontmock (workspace)
  ├── @ux.qa/test-cli (workspace)
  ├── vitest
  ├── playwright
  └── @testing-library/react
```

## Import Paths

### Before Integration
```typescript
// Old imports
import { t } from '@/lib/test'
import { scanDirectory } from '../packages/scanner/src/scanner'
import { UXQAReporter } from '../packages/reporter/src/reporter'
```

### After Integration
```typescript
// New unified imports
import { t } from '@ux.qa/frontmock'
import { scanDirectory } from '@ux.qa/scanner'
import { UXQAReporter } from '@ux.qa/reporter'
```

## Workspace Structure

```
ux-qa/
├── package.json (workspace root)
│   └── workspaces: [
│         "packages/*",
│         "packages/frontmock/core",
│         "packages/frontmock/cli"
│       ]
│
├── packages/
│   ├── scanner/
│   │   └── package.json (name: "@ux.qa/scanner")
│   │
│   ├── reporter/
│   │   └── package.json (name: "@ux.qa/reporter")
│   │
│   └── frontmock/
│       ├── core/
│       │   └── package.json (name: "@ux.qa/frontmock")
│       └── cli/
│           └── package.json (name: "@ux.qa/test-cli")
│
├── lib/
│   └── test/
│       └── index.ts (compatibility layer → @ux.qa/frontmock)
│
├── components/
│   └── __tests__/ (use @ux.qa/frontmock)
│
└── uxqa.config.ts (configuration)
```

## Integration Benefits

### For Developers
- ✅ Single import path for all tests
- ✅ Switch test providers without code changes
- ✅ Rich utilities and helpers
- ✅ Unified CLI for all operations

### For the Codebase
- ✅ Consistent test patterns
- ✅ Reduced duplication
- ✅ Better organized packages
- ✅ Easier maintenance

### For CI/CD
- ✅ One command to run all tests
- ✅ Automated scanning and reporting
- ✅ Metrics collection built-in
- ✅ Easy to extend

## Migration Paths

### Gradual Migration (Recommended)
```
Week 1: Add frontmock alongside existing lib/test
Week 2: Migrate new tests to framework
Week 3: Migrate existing tests in batches
Week 4: Remove old lib/test, full cutover
```

### Immediate Migration
```
Day 1: Run scripts/integrate-framework.sh
Day 1: Run scripts/migrate-imports.sh
Day 1: Test and deploy
```

### Hybrid Approach
```
Keep lib/test as compatibility layer indefinitely
New code uses @ux.qa/frontmock
Old code continues using @/lib/test
Both work simultaneously
```

## Testing the Integration

### Verify Framework Build
```bash
cd packages/frontmock/core && bun run build
cd ../cli && bun run build
```

### Verify CLI Works
```bash
npx uxqa --help
npx uxqa scan --help
```

### Verify Tests Pass
```bash
bun test
```

### Verify Import Resolution
```bash
# Should show framework package
npx tsc --traceResolution | grep frontmock-core
```

## Rollback Plan

If integration issues occur:

```bash
# 1. Restore from backup
cp -r .migration-backup-*/* .

# 2. Remove framework packages from dependencies
# Edit package.json

# 3. Rebuild
bun install

# 4. Run tests
bun test
```

## Support & Troubleshooting

### Import Resolution Issues
```bash
# Clear cache
rm -rf node_modules .next
bun install

# Rebuild framework
cd packages/frontmock/core && bun run build
```

### TypeScript Errors
```typescript
// Add to tsconfig.json paths
"@ux.qa/frontmock": ["./packages/frontmock/core/src"]
```

### Test Failures
```bash
# Check provider
npx uxqa run --provider vitest

# Verify framework
npm ls @ux.qa/frontmock
```
