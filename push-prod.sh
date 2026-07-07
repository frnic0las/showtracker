#!/usr/bin/env bash
set -euo pipefail

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
vercel --prod

echo ""
echo "=== Done ==="