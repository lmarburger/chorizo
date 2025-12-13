#!/usr/bin/env bash
set -euo pipefail

# Wrapper script for Claude Code hooks to run code quality checks with proper error handling.
# Captures stdout/stderr and on failure emits both to stderr with exit code 2.

declare -a TEMPS=()
# shellcheck disable=SC2329  # cleanup is invoked by trap
cleanup() {
  set +e
  for f in "${TEMPS[@]:-}"; do
    [ -n "$f" ] && rm -f -- "$f"
  done
}
trap cleanup EXIT

run_captured() {
  local out err
  out="$(mktemp)"; TEMPS+=("$out")
  err="$(mktemp)"; TEMPS+=("$err")

  local label="$1"; shift
  if ! "$@" 1>"$out" 2>"$err"; then
    local status=$?
    {
      printf '%s FAILED (exit %d)\n' "$label" "$status"
      echo '--- STDERR ---'
      cat "$err"
      echo '--- STDOUT ---'
      cat "$out"
    } >&2
    exit 2
  fi
  
  # Show progress to stdout
  printf '✓ %s passed\n' "$label"
}

# Run all checks
run_captured "TYPESCRIPT" npm run typecheck
run_captured "ESLINT" npm run lint
run_captured "PRETTIER" npm run format:check
run_captured "TESTS" npm test

printf '\nAll checks passed successfully!\n'
exit 0