#!/bin/bash
set -euo pipefail

# Reset test database to clean state
# Useful between test runs

echo "🔄 Resetting test database..."

if [ ! -f .env.test ]; then
  echo "❌ .env.test not found. Run 'npm run test:setup' first"
  exit 1
fi

# Run the test database initialization
if [ -f init-test-db.mjs ]; then
  node init-test-db.mjs
else
  echo "❌ init-test-db.mjs not found"
  exit 1
fi