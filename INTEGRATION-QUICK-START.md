# Integration Quick Start

## 🚀 5-Minute Integration

### Step 1: Run Integration Script
```bash
chmod +x scripts/integrate-framework.sh
./scripts/integrate-framework.sh
```

This will:
- ✅ Build test-framework packages
- ✅ Install dependencies
- ✅ Create uxqa.config.ts
- ✅ Create compatibility layer

### Step 2: Test It Works
```bash
# Test existing tests still pass
bun test

# Test CLI commands
npx uxqa scan ./components
npx uxqa --help
```

### Step 3: Optional - Migrate Imports
```bash
chmod +x scripts/migrate-imports.sh
./scripts/migrate-imports.sh
```

This updates all test files from:
```typescript
import { t } from '@/lib/test'
```

To:
```typescript
import { t } from '@ux.qa/frontmock'
```

---

## 📦 What You Get

### Before Integration
```
Your code uses: lib/test (local)
CLI: Multiple tools (vitest, playwright, custom scripts)
Scanner: packages/scanner (isolated)
Reporter: packages/reporter (isolated)
```

### After Integration
```
Your code uses: @ux.qa/frontmock (unified)
CLI: uxqa (one command for everything)
Scanner: uxqa scan (integrated)
Reporter: uxqa report (integrated)
Generator: uxqa generate (NEW!)
```

---

## 🔄 Integration Points

```
┌─────────────────────────────────────────┐
│      Your Existing Codebase             │
├─────────────────────────────────────────┤
│                                         │
│  components/__tests__/*.test.tsx        │
│    │                                    │
│    │ Import from:                       │
│    ├─ OLD: '@/lib/test' ──────────┐     │
│    └─ NEW: '@ux.qa/frontmock' │
│                        │                │
└────────────────────────┼────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────┐
│        Test Framework                   │
├─────────────────────────────────────────┤
│  @ux.qa/frontmock             │
│    ├─ Vitest Provider                   │
│    ├─ Jest Provider                     │
│    ├─ Bun Provider                      │
│    └─ Utilities                         │
└─────────────────────────────────────────┘
```

---

## 📝 New Commands Available

```bash
# Analyze codebase
uxqa scan ./src

# Generate test scaffolds
uxqa generate ./src --template vitest

# Run tests (auto-detects provider)
uxqa run

# Run with specific provider
uxqa run --provider vitest
uxqa run --provider playwright

# Generate reports
uxqa report --format html --open

# Initialize in new project
uxqa init
```

---

## 🧪 Testing Strategy

### Phase 1: Verify (Now)
```bash
# Existing tests should still pass
bun test

# CLI should work
npx uxqa scan ./components
```

### Phase 2: Adopt (This Week)
```typescript
// New tests use framework directly
import { t } from '@ux.qa/frontmock'

const { describe, it, expect, render, screen } = t
```

### Phase 3: Migrate (When Ready)
```bash
# Bulk migrate all imports
./scripts/migrate-imports.sh
```

---

## 🔍 Verification Checklist

After integration, verify:

- [ ] `bun test` passes
- [ ] `npx uxqa --help` shows commands
- [ ] `npx uxqa scan ./components` works
- [ ] Existing tests unchanged
- [ ] New tests can use framework
- [ ] TypeScript compilation works
- [ ] CI/CD still passes

---

## 🆘 Troubleshooting

### Issue: "Module not found: @ux.qa/frontmock"

**Solution:**
```bash
cd packages/test-framework/core
bun install
bun run build
cd ../../..
bun install
```

### Issue: "Cannot find module '@/lib/test'"

**Solution:**
Check `lib/test/index.ts` exists with:
```typescript
export * from '@ux.qa/frontmock'
```

### Issue: TypeScript errors

**Solution:**
Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@ux.qa/frontmock": ["./packages/test-framework/core/src"]
    }
  }
}
```

### Issue: CLI command not found

**Solution:**
```bash
cd packages/test-framework/cli
bun run build
chmod +x dist/cli.js
cd ../../..
npx uxqa --help
```

---

## 📚 Documentation

- **Full Guide**: [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md)
- **Architecture**: [packages/test-framework/INTEGRATION.md](./packages/test-framework/INTEGRATION.md)
- **Framework README**: [packages/test-framework/README.md](./packages/test-framework/README.md)
- **Getting Started**: [packages/test-framework/docs/getting-started.md](./packages/test-framework/docs/getting-started.md)

---

## 🎯 Next Steps

1. **Immediate**: Run integration script
2. **Today**: Verify tests pass
3. **This Week**: Try CLI commands
4. **This Month**: Migrate imports
5. **Ongoing**: Use for new tests

---

## 💡 Key Benefits

| Before | After |
|--------|-------|
| Multiple test setups | Unified test framework |
| Manual scaffolding | Auto-generate tests |
| Scattered commands | One CLI (`uxqa`) |
| Provider lock-in | Switch providers easily |
| Copy-paste utils | Built-in utilities |
| Manual analysis | Automated scanning |

---

## 🚦 Status Indicators

After integration, you should see:

```bash
✅ Framework built
✅ Dependencies installed
✅ Config created
✅ Tests passing
✅ CLI working
```

If any ❌, see troubleshooting section above.
