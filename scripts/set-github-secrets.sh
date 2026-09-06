#!/usr/bin/env bash
#
# Copies the VITE_* values from a local env file into GitHub repository secrets.
#
# Values are read straight from disk and handed to `gh`; they are never printed,
# so the secrets do not end up in a terminal scrollback or a shell history file.
#
# Usage:
#   ./scripts/set-github-secrets.sh [env-file]   # defaults to .env.local
#
# Requires the GitHub CLI, authenticated with a token that has `repo` scope, run
# from inside a clone whose `origin` points at the target repository.

set -euo pipefail

ENV_FILE="${1:-.env.local}"

if [ ! -f "$ENV_FILE" ]; then
  echo "error: $ENV_FILE not found. Copy .env.example and fill it in first." >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "error: the GitHub CLI (gh) is not installed." >&2
  exit 1
fi

if ! gh repo view >/dev/null 2>&1; then
  echo "error: no GitHub repository detected. Run this from a clone with an 'origin' remote." >&2
  exit 1
fi

REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
echo "Setting secrets on $REPO"

count=0

while IFS= read -r line || [ -n "$line" ]; do
  # Skip blank lines and comments.
  case "$line" in ''|\#*) continue ;; esac
  case "$line" in VITE_*) ;; *) continue ;; esac

  name="${line%%=*}"
  value="${line#*=}"

  # Tolerate quoted values in the env file.
  value="${value%\"}"; value="${value#\"}"
  value="${value%\'}"; value="${value#\'}"

  if [ -z "$value" ]; then
    echo "  skipped $name (empty)"
    continue
  fi

  printf '%s' "$value" | gh secret set "$name" --body -
  echo "  set $name"
  count=$((count + 1))
done < "$ENV_FILE"

echo "Done: $count secrets set."
echo
echo "Still to add by hand, because they are not in the env file:"
echo "  FIREBASE_PROJECT_ID       gh secret set FIREBASE_PROJECT_ID"
echo "  FIREBASE_SERVICE_ACCOUNT  gh secret set FIREBASE_SERVICE_ACCOUNT < service-account.json"
