#!/bin/bash

# Fix Replit Git Issues Script
# This script resolves divergent branches and lock file issues

echo "🔧 Fixing Replit Git Issues..."
echo "================================"

# Step 1: Configure git to allow the operation
echo "Step 1: Configuring git safe directory..."
git config --global --add safe.directory /home/runner/gigatime

# Step 2: Backup current changes (just in case)
echo "Step 2: Backing up any local changes..."
git stash save "Backup before fixing git issues $(date +%Y%m%d_%H%M%S)"

# Step 3: Fetch latest from origin
echo "Step 3: Fetching latest from origin..."
git fetch origin main

# Step 4: Reset to origin/main (this will discard local commits)
echo "Step 4: Resetting to origin/main..."
git reset --hard origin/main

# Step 5: Clean untracked files
echo "Step 5: Cleaning untracked files..."
git clean -fd

# Step 6: Remove package-lock.json if it exists (Replit uses npm)
echo "Step 6: Removing lock files..."
rm -f package-lock.json
rm -f yarn.lock
rm -f pnpm-lock.yaml

# Step 7: Clear npm cache
echo "Step 7: Clearing npm cache..."
npm cache clean --force

# Step 8: Reinstall dependencies
echo "Step 8: Reinstalling dependencies..."
npm install

# Step 9: Set upstream branch
echo "Step 9: Setting upstream branch..."
git branch --set-upstream-to=origin/main main

# Step 10: Verify status
echo "Step 10: Verifying status..."
git status

echo ""
echo "✅ Git issues fixed!"
echo "================================"
echo "Your Replit is now synced with the main branch."
echo ""
echo "Note: Any local commits that were only on Replit have been removed."
echo "If you had important changes, they were stashed and can be recovered with:"
echo "  git stash list  (to see stashes)"
echo "  git stash pop   (to restore the most recent stash)"