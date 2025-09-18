#!/bin/bash
set -euo pipefail

# Wait for test database to be ready
# Useful in CI/CD environments

echo "⏳ Waiting for test database to be ready..."

if [ ! -f .env.test ]; then
  echo "❌ .env.test not found. Run 'npm run test:setup' first"
  exit 1
fi

# Load test database URL
export "$(grep TEST_DATABASE_URL .env.test | xargs)"

if [ -z "${TEST_DATABASE_URL:-}" ]; then
  echo "❌ TEST_DATABASE_URL not found in .env.test"
  exit 1
fi

# Extract connection details
DB_HOST=$(echo "$TEST_DATABASE_URL" | sed -n 's/.*@\([^:/]*\).*/\1/p')
DB_PORT=$(echo "$TEST_DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

# Default port if not specified
DB_PORT=${DB_PORT:-5432}

# Wait for database to be reachable (max 30 seconds)
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
    echo "✅ Test database is ready"
    exit 0
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
  echo "   Attempt $ATTEMPT/$MAX_ATTEMPTS..."
  sleep 1
done

echo "❌ Test database is not reachable after $MAX_ATTEMPTS attempts"
exit 1