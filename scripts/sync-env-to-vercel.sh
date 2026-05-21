#!/usr/bin/env bash
# Reads .env.local and pushes every variable to Vercel (all 3 environments).
# Usage: bash scripts/sync-env-to-vercel.sh

set -e

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found. Run from the project root."
  exit 1
fi

echo "Reading $ENV_FILE and syncing to Vercel..."
echo ""

TARGETS=("production" "preview" "development")
COUNT=0
SKIPPED=0

while IFS= read -r line || [ -n "$line" ]; do
  # Skip blank lines and comments
  [[ -z "$line" || "$line" =~ ^# ]] && continue

  # Split on first = only
  KEY="${line%%=*}"
  VALUE="${line#*=}"

  # Skip if key is empty
  [[ -z "$KEY" ]] && continue

  echo "Setting $KEY..."

  for TARGET in "${TARGETS[@]}"; do
    # Remove existing, suppress errors if it doesn't exist
    npx vercel env rm "$KEY" "$TARGET" --yes 2>/dev/null || true
    # Add new value
    printf '%s' "$VALUE" | npx vercel env add "$KEY" "$TARGET" 2>&1 | grep -v "WARNING" | grep -v "plugin" || true
  done

  COUNT=$((COUNT + 1))
  echo "  ✓ $KEY set for all environments"
  echo ""

done < "$ENV_FILE"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Done. $COUNT variable(s) synced to Vercel."
echo ""
echo "Now redeploy:"
echo "  npx vercel --prod"
