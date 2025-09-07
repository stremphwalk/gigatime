# Development Server Troubleshooting Guide

If you're experiencing issues with blank pages, CSP errors, or Vite problems, this guide will help you get up and running.

## 🚀 Quick Fixes

### 1. Try the Ultra-Simple Server First

```bash
npm run dev:simple-test
```

This server has:
- ✅ No CSP restrictions 
- ✅ No security middleware
- ✅ Maximum Vite compatibility
- ✅ Automatic fallbacks

**Expected Output:**
```
🚀 SIMPLE DEV SERVER running on http://localhost:5001
📝 No authentication required
👤 Test User: Test User
📧 Email: test@gigatime.dev
⚡ Maximum Vite compatibility
```

### 2. If Simple Server Works, Try Reliable Server

```bash
npm run dev:reliable
```

This has more features but minimal security restrictions.

### 3. Build Assets (If Needed)

If you see "No static files available":

```bash
npm run build
npm run dev:simple-test
```

## 🔍 Common Issues & Solutions

### Issue: Blank Page with CSP Errors

**Symptoms:**
- Blank white page
- Console errors about Content Security Policy
- Stylesheet loading failures
- Font loading failures

**Solution 1 - Use Simple Server:**
```bash
npm run dev:simple-test
```

**Solution 2 - Environment Variable:**
```bash
NODE_ENV=development npm run dev:reliable
```

### Issue: Vite Development Server Fails

**Symptoms:**
- 500 errors on `/@vite/client`
- `main.tsx` fails to load
- HMR not working

**Solution:**
```bash
# Option 1: Use the simple server
npm run dev:simple-test

# Option 2: Build and serve static
npm run build
npm run dev:simple-test
```

### Issue: CORS Errors

**Symptoms:**
- API calls blocked
- Cross-origin request errors

**Solution - All dev servers have CORS disabled:**
```bash
npm run dev:simple-test  # Most permissive
npm run dev:reliable     # Moderate
npm run dev:no-auth      # Basic
```

### Issue: Database Connection Errors

**Symptoms:**
- User creation fails
- API endpoints return 500 errors

**Solution:**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql
# or
sudo service postgresql status

# Set database URL
export DATABASE_URL="postgresql://username:password@localhost:5432/gigatime_dev"

# Test connection
npm run dev:simple-test
```

### Issue: TypeScript Compilation Errors

**Solution:**
```bash
npm run check  # See errors
npm install    # Reinstall dependencies
npm run check  # Verify fixed
```

## 🛠 Server Comparison

| Server | Security | CSP | CORS | Best For |
|--------|----------|-----|------|----------|
| `dev:simple-test` | ❌ None | ❌ Disabled | ✅ Permissive | **Troubleshooting** |
| `dev:reliable` | 🟡 Minimal | ❌ Disabled | ✅ Configured | **Development** |
| `dev:no-auth` | 🟡 Basic | ❌ None | 🟡 Basic | **Testing** |
| `dev` | ✅ Full | ✅ Enabled | ✅ Restricted | **Production-like** |

## 🎯 Recommended Approach

1. **Start with simple:** `npm run dev:simple-test`
2. **If working, upgrade:** `npm run dev:reliable`
3. **Build if needed:** `npm run build` then retry
4. **Check logs:** Look for specific error messages

## 📊 Testing Your Setup

### 1. Test Server Health
```bash
curl http://localhost:5001/api/health
```

### 2. Test Authentication
```bash
curl http://localhost:5001/api/auth/user
```

### 3. Test API Access
```bash
curl http://localhost:5001/api/notes
```

### 4. Check Development Info
```bash
curl http://localhost:5001/api/dev/info
```

## 🔧 Environment Setup

Create a `.env` file if you don't have one:

```bash
# Minimal .env for development
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/gigatime_dev

# Optional customization
DEV_USER_EMAIL=test@yourname.dev
DEV_USER_FIRST_NAME=Your
DEV_USER_LAST_NAME=Name
```

## 🆘 If Nothing Works

### Nuclear Option - Complete Reset:

```bash
# 1. Stop all servers
pkill -f "tsx server"

# 2. Clean node_modules
rm -rf node_modules package-lock.json
npm install

# 3. Check TypeScript
npm run check

# 4. Try simplest server
npm run dev:simple-test

# 5. Check in browser
open http://localhost:5001
```

### Check Port Conflicts:

```bash
# See what's using port 5001/5002
lsof -i :5001
lsof -i :5002

# Kill processes if needed
kill -9 <PID>
```

## 🐛 Debug Mode

For maximum debugging information:

```bash
DEBUG=* npm run dev:simple-test
```

## 📞 Still Having Issues?

1. **Check server logs** - Look for specific error messages
2. **Check browser console** - Note any JavaScript errors  
3. **Verify database** - Ensure PostgreSQL is running
4. **Test API directly** - Use curl commands above
5. **Try different ports** - Servers auto-detect available ports

## ✅ Success Indicators

When everything is working, you should see:

**Server Console:**
```
✅ Database initialized
✅ Vite development server setup complete
✅ Created dev user: Test User
🚀 SIMPLE DEV SERVER running on http://localhost:5001
```

**Browser:**
- No console errors
- Gigatime app loads
- API calls work
- No login page (automatic auth)

## 🎉 You're Ready!

Once any server works, you have:
- ✅ Development server running
- ✅ Database connected  
- ✅ Authentication bypassed
- ✅ All API endpoints functional
- ✅ Frontend loading properly

Happy testing! 🚀
