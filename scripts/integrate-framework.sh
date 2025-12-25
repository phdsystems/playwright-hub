#!/bin/bash

echo "🚀 Starting Test Framework Integration..."
echo ""

# 1. Build framework
echo "📦 Building framework packages..."
cd packages/test-framework/core
bun install
bun run build
echo "✓ Built @ux.qa/test-framework-core"

cd ../cli
bun install
bun run build
chmod +x dist/cli.js
echo "✓ Built @ux.qa/test-cli"

cd ../../..

# 2. Install dependencies at root
echo ""
echo "📥 Installing dependencies..."
bun install
echo "✓ Dependencies installed"

# 3. Create config if it doesn't exist
echo ""
echo "⚙️  Creating uxqa.config.ts..."
if [ ! -f uxqa.config.ts ]; then
  cat > uxqa.config.ts << 'EOF'
/**
 * UX.QA Test Framework Configuration
 */
export default {
  // Test runner
  testRunner: 'vitest',
  framework: 'react',

  // Scanner configuration
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
  },

  // Reporter configuration
  reporter: {
    hubUrl: process.env.UXQA_HUB_URL || 'http://localhost:3200',
    appId: 'ux-qa-dashboard',
  },
}
EOF
  echo "✓ Created uxqa.config.ts"
else
  echo "⚠️  uxqa.config.ts already exists, skipping"
fi

# 4. Create lib/test compatibility layer
echo ""
echo "🔗 Creating compatibility layer..."
cat > lib/test/index.ts << 'EOF'
/**
 * Compatibility layer for @ux.qa/test-framework-core
 *
 * @deprecated Import directly from '@ux.qa/test-framework-core' instead
 * This file provides backward compatibility for existing code
 */

// Re-export everything from the framework
export * from '@ux.qa/test-framework-core'
export { t as default, t, testing } from '@ux.qa/test-framework-core'
EOF
echo "✓ Created lib/test compatibility layer"

# 5. Test CLI
echo ""
echo "🧪 Testing CLI..."
npx uxqa --help

echo ""
echo "✅ Integration complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Next steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  1. Run tests:         bun test"
echo "  2. Scan codebase:     npx uxqa scan ./components"
echo "  3. Generate tests:    npx uxqa generate ./components --dry-run"
echo "  4. Run with CLI:      npx uxqa run"
echo ""
echo "See INTEGRATION-GUIDE.md for full documentation"
echo ""
