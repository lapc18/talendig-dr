#!/usr/bin/env bash
#
# Creates the Google Cloud service account the deploy workflow authenticates
# with, grants it the two roles it needs, and stores its key as the
# FIREBASE_SERVICE_ACCOUNT secret in a GitHub environment.
#
# Usage:
#   ./scripts/create-deploy-service-account.sh <firebase-project-id> [github-environment]
#
# Requires `gcloud` (authenticated, with permission to manage IAM on the
# project) and `gh` (authenticated, run from a clone of the target repository).
#
# Idempotent: re-running it skips what already exists and issues a fresh key,
# which is also how the key is rotated.
#
# The key never reaches the terminal. It is written to a file only this user can
# read, piped to `gh`, and then overwritten and deleted.

set -euo pipefail

PROJECT_ID="${1:-}"
GH_ENVIRONMENT="${2:-production}"

if [ -z "$PROJECT_ID" ]; then
  echo "usage: $0 <firebase-project-id> [github-environment]" >&2
  exit 1
fi

# The service account only ever deploys Hosting, so it gets nothing else.
readonly SA_NAME="github-deploy"
readonly ROLES=("roles/firebasehosting.admin" "roles/firebase.viewer")

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

for tool in gcloud gh; do
  command -v "$tool" >/dev/null 2>&1 || { echo "error: $tool is not installed." >&2; exit 1; }
done

if ! gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1; then
  echo "error: cannot read project '$PROJECT_ID'." >&2
  echo "       Run 'gcloud auth login' and check 'gcloud config get-value account'." >&2
  exit 1
fi

gh repo view >/dev/null 2>&1 || {
  echo "error: no GitHub repository detected. Run this from a clone with an 'origin' remote." >&2
  exit 1
}

REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
echo "Project: $PROJECT_ID"
echo "Repo:    $REPO (environment '$GH_ENVIRONMENT')"
echo

if gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "Service account already exists: $SA_EMAIL"
else
  echo "Creating service account $SA_EMAIL"
  gcloud iam service-accounts create "$SA_NAME" \
    --project="$PROJECT_ID" \
    --display-name="GitHub Actions deploy" \
    --description="Deploys Talendig Classes Record to Firebase Hosting from CI"
fi

for role in "${ROLES[@]}"; do
  echo "Granting $role"
  # --condition=None keeps gcloud from prompting about conditional bindings.
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$role" \
    --condition=None \
    --quiet >/dev/null
done

KEY_FILE="$(mktemp -t firebase-sa-XXXXXX.json)"
# Anything that leaves the key readable by others is a failure, not a warning.
chmod 600 "$KEY_FILE"

# Shred the key on any exit path, including a failure or an interrupt.
cleanup() {
  if [ -f "$KEY_FILE" ]; then
    dd if=/dev/urandom of="$KEY_FILE" bs=1024 count=8 conv=notrunc 2>/dev/null || true
    rm -f "$KEY_FILE"
  fi
}
trap cleanup EXIT INT TERM

echo "Issuing a key"
gcloud iam service-accounts keys create "$KEY_FILE" \
  --iam-account="$SA_EMAIL" \
  --project="$PROJECT_ID" \
  --quiet

echo "Storing it as FIREBASE_SERVICE_ACCOUNT"
gh secret set FIREBASE_SERVICE_ACCOUNT --env "$GH_ENVIRONMENT" < "$KEY_FILE"

echo
echo "Done. The key file has been overwritten and deleted."
echo

# Only user-managed keys are downloadable credentials worth auditing; the
# system-managed ones belong to Google and cannot be exported. Listing both
# together would bury the ones that actually matter.
#
# Key creation is eventually consistent, so the list is retried until the new
# key shows up rather than printing an inventory that omits it.
echo "Downloadable keys on this service account (revoke any you do not recognise):"
for _ in 1 2 3 4 5 6 7 8 9 10; do
  keys="$(gcloud iam service-accounts keys list \
    --iam-account="$SA_EMAIL" --project="$PROJECT_ID" \
    --managed-by=user \
    --format="table(name.basename(), validAfterTime)" 2>/dev/null || true)"
  [ "$(printf '%s\n' "$keys" | wc -l)" -gt 1 ] && break
  sleep 1
done
printf '%s\n' "$keys"

echo
echo "Revoke an old one with:"
echo "  gcloud iam service-accounts keys delete <KEY_ID> --iam-account=$SA_EMAIL --project=$PROJECT_ID"
