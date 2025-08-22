# Fixing Replit Git Issues

## Problem
- Replit branch is ahead of main by 13 commits
- Lock file conflicts
- "Unsafe operation" errors

## Quick Fix (Recommended)

### Option 1: Run the Fix Script
1. In Replit Shell, run:
```bash
curl -o fix-git.sh https://raw.githubusercontent.com/stremphwalk/gigatime/main/fix-replit-git.sh
chmod +x fix-git.sh
./fix-git.sh
```

### Option 2: Manual Steps
Run these commands in order in the Replit Shell:

```bash
# 1. Configure git safe directory
git config --global --add safe.directory /home/runner/gigatime

# 2. Backup your local changes (optional but recommended)
git stash

# 3. Fetch latest from GitHub
git fetch origin main

# 4. Force reset to match GitHub main branch
git reset --hard origin/main

# 5. Clean untracked files
git clean -fd

# 6. Remove all lock files
rm -f package-lock.json yarn.lock pnpm-lock.yaml

# 7. Clear npm cache
npm cache clean --force

# 8. Reinstall dependencies
npm install

# 9. Set upstream branch
git branch --set-upstream-to=origin/main main

# 10. Check status
git status
```

## Alternative: Keep Replit Changes

If you want to keep the Replit commits and merge them:

```bash
# 1. Configure safe directory
git config --global --add safe.directory /home/runner/gigatime

# 2. Fetch latest
git fetch origin main

# 3. Merge with strategy to prefer GitHub changes
git merge origin/main -X theirs

# 4. If there are conflicts in lock files
rm -f package-lock.json yarn.lock pnpm-lock.yaml
npm install

# 5. Commit the merge
git add .
git commit -m "Merge GitHub main into Replit"

# 6. Push to GitHub (if you have permissions)
git push origin main
```

## Prevention Tips

1. **Always pull before making changes:**
   ```bash
   git pull origin main
   ```

2. **Avoid committing lock files in Replit:**
   Add to `.gitignore`:
   ```
   package-lock.json
   yarn.lock
   pnpm-lock.yaml
   ```

3. **Use Replit's Git panel:**
   - Click the Git icon in the sidebar
   - Use "Pull" regularly to stay synced

## Troubleshooting

### "Permission denied" error:
```bash
git config --global --add safe.directory $(pwd)
```

### "Cannot lock ref" error:
```bash
rm -rf .git/refs/remotes/origin/main.lock
```

### "Index.lock exists" error:
```bash
rm -f .git/index.lock
```

### Still having issues?
1. **Nuclear option - Fresh clone:**
   ```bash
   cd ~
   rm -rf gigatime
   git clone https://github.com/stremphwalk/gigatime.git
   cd gigatime
   npm install
   ```

2. **In Replit UI:**
   - Go to the Shell
   - Click the three dots menu
   - Select "Clear Shell"
   - Run the fix script again

## After Fixing

1. Test the application:
   ```bash
   npm run dev
   ```

2. Verify git status:
   ```bash
   git status
   git log --oneline -5
   ```

3. You should see:
   - "Your branch is up to date with 'origin/main'"
   - Latest commits from GitHub

## Important Notes

- **Data Loss Warning:** The fix script will remove local commits that haven't been pushed to GitHub
- **Stashed Changes:** Your work is stashed and can be recovered with `git stash pop`
- **Lock Files:** Replit automatically generates lock files - it's normal to see them recreated