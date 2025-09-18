#!/usr/bin/env bash
set -euo pipefail

# Claude Code PostToolUse Hook - Automatic Code Formatter
# =========================================================
#
# This script serves as a PostToolUse hook for Claude Code that automatically formats files
# after they've been edited. It intercepts tool events (Write/Edit/MultiEdit operations),
# extracts the affected file paths, and applies the appropriate code formatters based on
# file type.
#
# Supported formatters:
#   - prettier: TypeScript, JavaScript, JSON, CSS, and config files
#   - eslint: TypeScript and JavaScript files (auto-fix mode)
#   - shellcheck: Shell scripts (.sh and files with shell shebangs)
#
# How it works:
#   1. Reads PostToolUse event JSON from stdin
#   2. Extracts file paths from tool_input.file_path and tool_input.edits[].file_path
#   3. Categorizes files by type (including shebang detection for shell scripts)
#   4. Runs appropriate formatters in batch mode for efficiency
#   5. Returns exit code 2 if dependencies are missing or formatters fail (signals Claude Code)
#
# Exit codes:
#   - 0: Success (all formatters ran successfully or no files to format)
#   - 2: Blocking error (missing dependencies or formatter failures)
#
# Dependencies:
#   - jq: For parsing JSON input (required)
#   - npm: For running prettier and eslint (required)
#   - shellcheck: For shell script validation (required if editing shell scripts)

declare -a TEMPS=()
# shellcheck disable=SC2329  # cleanup is invoked via trap, not directly
cleanup() {
  # Disable errexit/nounset inside the cleanup routine to avoid surprises
  set +e
  for f in "${TEMPS[@]:-}"; do
    [ -n "$f" ] && rm -f -- "$f"
  done
}
trap cleanup EXIT

have_cmd() { command -v "${1%% *}" >/dev/null 2>&1; }

fail_missing() {
  # Exit code 2 => Claude treats as blocking/important error for hooks
  # For PostToolUse it surfaces stderr to Claude
  local what="$1"; shift || true
  local hint="${*:-}"
  if [ -n "$hint" ]; then
    echo "ERROR: $what not found. $hint" >&2
  else
    echo "ERROR: $what not found." >&2
  fi
  exit 2
}

# Generic formatter runner - reduces duplication across all batch functions
run_formatter_batch() {
  local formatter="$1"
  local -n files_ref=$2
  local -n failed_ref=$3
  shift 3  # remaining args are formatter-specific options

  if [ ${#files_ref[@]} -eq 0 ]; then
    return 0
  fi

  if ! $formatter "$@" "${files_ref[@]}"; then
    printf '%s: %d files\n' "$formatter" "${#files_ref[@]}"
    # shellcheck disable=SC2034  # failed_ref is a nameref, not unused
    failed_ref=true
  fi
}

is_shell_file() {
  local file="$1"
  head -n1 "$file" 2>/dev/null | grep -qE '^#!/(usr/)?bin/(env )?(bash|sh)'
}

# Check for required dependencies
have_cmd jq || fail_missing jq "Install jq (brew install jq)."
have_cmd npm || fail_missing npm "Install Node.js and npm."

# Read the PostToolUse payload from STDIN and extract file paths
event_json="$(cat)"
mapfile -t files < <(jq -r '
  [
    .tool_input.file_path?,
    (.tool_input.edits? // [] | .[]? | .file_path?)
  ]
  | map(select(type == "string"))
  | unique[]
' <<<"$event_json")

if [ ${#files[@]} -eq 0 ]; then
  echo "PostToolUse: no file paths in tool_input; nothing to do." >&2
  exit 0
fi

# Initialize file arrays and failure flags
prettier_files=()
eslint_files=()
shell_files=()
prettier_failed=false
eslint_failed=false
shellcheck_failed=false

# Categorize files by type
for fp in "${files[@]}"; do
  case "$fp" in
    *.ts|*.tsx|*.js|*.jsx|*.mjs)
      # TypeScript/JavaScript files get both prettier and eslint
      prettier_files+=("$fp")
      eslint_files+=("$fp")
      ;;
    *.json|*.css|*.scss|*.yml|*.yaml|*.md|*.mdx)
      # Other files just get prettier
      prettier_files+=("$fp")
      ;;
    *.sh)
      shell_files+=("$fp")
      ;;
    *)
      # Check for shell shebang in extensionless files
      if is_shell_file "$fp"; then
        shell_files+=("$fp")
      fi
      ;;
  esac
done

# Run prettier for formatting
if [ ${#prettier_files[@]} -gt 0 ]; then
  # Capture stderr for error reporting
  prettier_err=$(mktemp); TEMPS+=("$prettier_err")
  if ! npx prettier --write "${prettier_files[@]}" 2>"$prettier_err"; then
    echo "ERROR: prettier failed on ${#prettier_files[@]} file(s):" >&2
    cat "$prettier_err" >&2
    prettier_failed=true
  fi
fi

# Run eslint for linting and auto-fixing
if [ ${#eslint_files[@]} -gt 0 ]; then
  # Capture both stdout and stderr for error reporting
  eslint_out=$(mktemp); TEMPS+=("$eslint_out")
  eslint_err=$(mktemp); TEMPS+=("$eslint_err")
  
  # Run eslint and capture exit code
  npx eslint --fix "${eslint_files[@]}" >"$eslint_out" 2>"$eslint_err"
  eslint_exit=$?
  
  # ESLint exit codes: 0 = success, 1 = linting errors, 2 = config/other errors
  # We want to show output for both warnings (exit 0 with output) and errors (exit 1)
  if [ $eslint_exit -ne 0 ] || [ -s "$eslint_out" ]; then
    # Check if there's actual lint output (not just formatting messages)
    if grep -qE '^\s*[0-9]+:[0-9]+\s+(error|warning)' "$eslint_out"; then
      echo "ERROR: eslint failed on ${#eslint_files[@]} file(s):" >&2
      cat "$eslint_out" >&2  # ESLint outputs to stdout
      [ -s "$eslint_err" ] && cat "$eslint_err" >&2  # Also show any stderr
      eslint_failed=true
    fi
  fi
fi

# Run shellcheck for shell scripts (required if editing shell files)
if [ ${#shell_files[@]} -gt 0 ]; then
  have_cmd shellcheck || fail_missing shellcheck "Install shellcheck (brew install shellcheck)."
  run_formatter_batch shellcheck shell_files shellcheck_failed 1>&2
fi

if [ "$prettier_failed" = true ] || [ "$eslint_failed" = true ] || [ "$shellcheck_failed" = true ]; then
  exit 2
fi

printf "%s: completed for %d files.\n" "$0" "${#files[@]}"
exit 0