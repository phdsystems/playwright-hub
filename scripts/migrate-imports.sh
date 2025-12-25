#!/bin/bash

echo "🔄 Migrating test imports to @ux.qa/test-framework-core..."
echo ""

# Count files
TOTAL=$(find . -type f \( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" | wc -l)

echo "Found $TOTAL test files"
echo ""

# Backup
echo "📋 Creating backup..."
BACKUP_DIR=".migration-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Find and backup test files
find . -type f \( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" \
  -exec cp --parents {} "$BACKUP_DIR" \;

echo "✓ Backup created at $BACKUP_DIR"
echo ""

# Migrate imports
echo "🔧 Updating imports..."

# Update: import { t } from '@/lib/test'
# To:     import { t } from '@ux.qa/test-framework-core'
find . -type f \( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" \
  -exec sed -i "s/from '@\/lib\/test'/from '@ux.qa\/test-framework-core'/g" {} \;

# Also update: import * as testing from '@/lib/test'
find . -type f \( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" \
  -exec sed -i "s/from '@\/lib\/test'/from '@ux.qa\/test-framework-core'/g" {} \;

echo "✓ Updated imports in test files"
echo ""

# Show summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Migration Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Files processed:  $TOTAL"
echo "  Backup location:  $BACKUP_DIR"
echo ""
echo "  Changed:"
echo "    FROM: import { t } from '@/lib/test'"
echo "    TO:   import { t } from '@ux.qa/test-framework-core'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Run tests:      bun test"
echo "  3. If issues:      cp -r $BACKUP_DIR/* ."
echo ""
