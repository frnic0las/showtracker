#!/usr/bin/env bash
set -euo pipefail

# === ShowTracker — push prod ===
# Tokens lus depuis .env.local à la racine du repo. Ajouter dans .env.local :
#   SUPABASE_ACCESS_TOKEN=sbp_...   (https://supabase.com/dashboard/account/tokens)
#   VERCEL_TOKEN=...                (https://vercel.com/account/settings/tokens)

if [ ! -f .env.local ]; then
  echo "✗ Fichier .env.local introuvable à la racine du repo."
  exit 1
fi
set -a
source .env.local
set +a

: "${SUPABASE_ACCESS_TOKEN:?✗ SUPABASE_ACCESS_TOKEN manquant dans .env.local}"
: "${VERCEL_TOKEN:?✗ VERCEL_TOKEN manquant dans .env.local}"

echo "=== ShowTracker — Pre-deploy checks ==="

BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "✗ You are on '$BRANCH', not 'main'. Merge your PR first."
  exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  echo "✗ Working directory is dirty. Commit or stash changes first."
  exit 1
fi

echo "→ Pulling latest main..."
git pull origin main
echo "→ Lint..."
pnpm lint
echo "→ TypeScript..."
pnpm typecheck
echo "→ Build..."
pnpm build

echo ""
echo "=== Checks passed. Pushing migrations... ==="
supabase db push

echo ""
echo "=== Deploying to Vercel... ==="
vercel --prod --yes --token "$VERCEL_TOKEN"

echo ""
echo "=== Done ==="