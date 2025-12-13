#!/bin/bash
set -euo pipefail

PROD_URL="${PROD_URL:-https://chorizo-eight.vercel.app}"

echo "Health Check: $PROD_URL"
echo "=========================================="

PASSED=0
FAILED=0

check() {
  local name="$1"
  local url="$2"
  local expected_status="${3:-200}"
  local follow_redirects="${4:-}"

  printf "%-30s " "$name..."

  local curl_opts=(-s -o /dev/null -w "%{http_code}" --max-time 10)
  if [ -n "$follow_redirects" ]; then
    curl_opts=(-sL -o /dev/null -w "%{http_code}" --max-time 10)
  fi

  status=$(curl "${curl_opts[@]}" "$url" 2>/dev/null || echo "000")

  if [ "$status" = "$expected_status" ]; then
    echo "✓ OK ($status)"
    PASSED=$((PASSED + 1))
  else
    echo "✗ FAILED (got $status, expected $expected_status)"
    FAILED=$((FAILED + 1))
  fi
}

check "Login page" "$PROD_URL/login"
check "Dashboard API (auth redirect)" "$PROD_URL/api/dashboard" 307
check "Kids API (auth redirect)" "$PROD_URL/api/kids/Alex" 307
check "Chores API (auth redirect)" "$PROD_URL/api/chores" 307

echo "=========================================="
echo "Results: $PASSED passed, $FAILED failed"

if [ "$FAILED" -gt 0 ]; then
  echo ""
  echo "Some checks failed. Check Vercel dashboard:"
  echo "https://vercel.com/dashboard"
  exit 1
else
  echo ""
  echo "All checks passed!"
  exit 0
fi
