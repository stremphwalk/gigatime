# Reliable Development Server

This document describes the reliable development server that completely bypasses Auth0 authentication for seamless local testing.

## Overview

The reliable development server (`dev-server-reliable.ts`) is designed specifically for developers who need to test the Gigatime application without configuring Auth0. It provides:

- ✅ **Complete Auth0 bypass** - No login required
- ✅ **Automatic user creation** - Creates a test user automatically  
- ✅ **Full API functionality** - All endpoints work normally
- ✅ **Database integration** - Real database operations
- ✅ **Session management** - Consistent user sessions
- ✅ **Security middleware** - Development-safe security headers
- ✅ **AI integration** - OpenAI and Deepgram support (if configured)
- ✅ **Enhanced logging** - Detailed request/response logging
- ✅ **Auto port detection** - Finds available port automatically

## Quick Start

### Option 1: Using npm script (recommended)

```bash
# Start the reliable development server
npm run dev:reliable
```

### Option 2: Using environment file

```bash
# Copy the example environment
cp .env.reliable-dev .env

# Edit database URL and other settings as needed
# DATABASE_URL=postgresql://username:password@localhost:5432/gigatime_dev

# Start the server
npm run dev:reliable
```

### Option 3: Direct command

```bash
NODE_ENV=development NO_AUTH=1 tsx server/dev-server-reliable.ts
```

## Features

### 🔐 Authentication Bypass

The server completely bypasses Auth0:
- No login page shown
- Automatic authentication for all requests
- Session-based user management
- Consistent user ID across requests

### 👤 Development User

Automatically creates a test user with customizable details:

```bash
# Environment variables (optional)
DEV_USER_EMAIL=test-doctor@gigatime-dev.local
DEV_USER_FIRST_NAME=Dr. Test
DEV_USER_LAST_NAME=Developer  
DEV_USER_SPECIALTY=Internal Medicine
```

### 🔍 Enhanced Logging

Provides detailed logging for debugging:
- API request/response times
- Error details in development mode
- User creation notifications
- Database connection status
- Slow request warnings (>1000ms)

### 🛡️ Security Features

Includes development-safe security:
- CORS protection with configurable origins
- Rate limiting (lenient for development)
- Security headers via Helmet
- Session management
- Input validation

### 🤖 AI Integration

Supports AI features when configured:
- OpenAI integration for medical dictation parsing
- Deepgram integration for speech-to-text
- Graceful fallbacks when AI services unavailable

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `NO_AUTH` | `1` | Bypass authentication |
| `PORT` | `5002` | Server port |
| `DEV_USER_EMAIL` | `dev-doctor@gigatime-test.local` | Test user email |
| `DEV_USER_FIRST_NAME` | `Dr. Test` | Test user first name |
| `DEV_USER_LAST_NAME` | `Developer` | Test user last name |
| `DEV_USER_SPECIALTY` | `Internal Medicine` | Test user specialty |
| `DATABASE_URL` | *required* | PostgreSQL connection string |
| `SESSION_SECRET` | *auto-generated* | Session encryption key |
| `OPENAI_API_KEY` | *optional* | OpenAI API key for AI features |
| `DEEPGRAM_API_KEY` | *optional* | Deepgram API key for speech |
| `CORS_ORIGIN` | *auto-configured* | Allowed CORS origins |
| `RATE_LIMIT_MAX_REQUESTS` | `500` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |

### Database Setup

The server requires a PostgreSQL database. Configure it in your `.env` file:

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/gigatime_dev
```

The server will automatically:
- Test the database connection on startup
- Create the development user in the database
- Initialize default note templates
- Set up the core schema

## API Endpoints

### Development Endpoints

Special endpoints for development testing:

- `GET /api/dev/info` - Server and user information
- `GET /api/health` - Health check with uptime
- `GET /api/auth/user` - Current development user
- `POST /api/auth/login` - Mock login (always succeeds)
- `POST /api/auth/logout` - Mock logout
- `GET /api/auth/callback` - Auth callback (redirects to home)

### Standard API Endpoints

All standard Gigatime API endpoints work normally:

- `/api/notes/*` - Note management
- `/api/note-templates/*` - Template management  
- `/api/smart-phrases/*` - Smart phrase management
- `/api/teams/*` - Team collaboration features
- `/api/ai/*` - AI processing endpoints
- `/api/deepgram-key` - Deepgram API key (if configured)

## Usage Examples

### Testing API Endpoints

```bash
# Check server health
curl http://localhost:5002/api/health

# Get development user info
curl http://localhost:5002/api/auth/user

# Get development info
curl http://localhost:5002/api/dev/info

# Test notes API
curl http://localhost:5002/api/notes

# Test templates API  
curl http://localhost:5002/api/note-templates
```

### Browser Testing

Open your browser to:
- `http://localhost:5002` - Main application (bypasses login)
- `http://localhost:5002/api/health` - Health check
- `http://localhost:5002/api/dev/info` - Development info

## Troubleshooting

### Common Issues

**Port already in use:**
- The server automatically finds an available port starting from 5002
- Check the console output for the actual port used

**Database connection error:**
- Ensure PostgreSQL is running
- Check your `DATABASE_URL` environment variable
- Verify database credentials and database exists

**TypeScript compilation errors:**
- Run `npm run check` to see TypeScript errors
- Ensure all dependencies are installed: `npm install`

**AI features not working:**
- Check if `OPENAI_API_KEY` is set for AI parsing
- Check if `DEEPGRAM_API_KEY` is set for speech recognition
- These are optional - server works without them

### Logs and Debugging

The server provides detailed logging:

```
🚀 RELIABLE DEV SERVER running on http://0.0.0.0:5002
📝 Authentication completely bypassed - no Auth0 required!
👤 User: Dr. Test Developer
📧 Email: test-doctor@gigatime-dev.local
🔐 User ID: dev-user-1699123456789-abc123def
🏥 Specialty: Internal Medicine
```

API request logging:
```
POST /api/notes 201 in 45ms
GET /api/note-templates 200 in 12ms
PUT /api/notes/123 200 in 67ms ⚠️ SLOW
```

### Environment Debugging

Use the development info endpoint to check configuration:

```bash
curl http://localhost:5002/api/dev/info | json_pp
```

Returns:
```json
{
  "message": "Development server running",
  "user": {
    "id": "dev-user-1699123456789-abc123def",
    "email": "test-doctor@gigatime-dev.local",
    "firstName": "Dr. Test",
    "lastName": "Developer",
    "specialty": "Internal Medicine"
  },
  "config": {
    "port": 5002,
    "sessionId": "dev-session-1699123456789-xyz789abc",
    "environment": "development"
  },
  "features": {
    "auth": "bypassed",
    "database": "enabled",
    "ai": {
      "openai": false,
      "deepgram": false
    }
  }
}
```

## Comparison with Other Dev Servers

| Feature | `dev:reliable` | `dev:no-auth` | `dev` |
|---------|---------------|---------------|-------|
| Auth0 bypass | ✅ Complete | ✅ Complete | ❌ Requires Auth0 |
| User management | ✅ Session-based | ⚠️ Hardcoded | ✅ Full Auth0 |
| Security middleware | ✅ Yes | ❌ No | ✅ Yes |
| Enhanced logging | ✅ Yes | ⚠️ Basic | ⚠️ Basic |
| Auto initialization | ✅ Yes | ⚠️ Manual | ✅ Yes |
| AI integration | ✅ Yes | ✅ Yes | ✅ Yes |
| Production ready | ❌ Dev only | ❌ Dev only | ✅ Yes |

## Best Practices

### For Development

1. **Use unique user details** - Customize DEV_USER_* environment variables
2. **Check logs regularly** - Monitor console output for issues
3. **Test all features** - Verify notes, templates, and AI functionality
4. **Use separate database** - Don't use production database for testing
5. **Clear browser cache** - If switching between auth modes

### For Testing

1. **Use the `/api/dev/info` endpoint** - Verify configuration
2. **Check `/api/health` regularly** - Monitor server status  
3. **Test error scenarios** - Try invalid requests to test error handling
4. **Verify user persistence** - Check that user data persists across restarts
5. **Test with/without AI keys** - Verify graceful degradation

### Security Notes

⚠️ **Important Security Considerations:**

- This server is for **development only** - never use in production
- Authentication is completely bypassed - no real security
- All data is accessible without authentication
- Use only with test/development databases
- Don't expose this server to the internet

## Getting Help

If you encounter issues:

1. Check the server logs for error messages
2. Verify your environment configuration
3. Test database connectivity
4. Check the `/api/health` and `/api/dev/info` endpoints
5. Refer to the main project documentation

## Server Startup Output

When successful, you'll see:

```
============================================================
🚀 RELIABLE DEV SERVER running on http://0.0.0.0:5002
📝 Authentication completely bypassed - no Auth0 required!
👤 User: Dr. Test Developer
📧 Email: test-doctor@gigatime-dev.local  
🔐 User ID: dev-user-1699123456789-abc123def
🏥 Specialty: Internal Medicine
============================================================
🌐 Frontend: http://localhost:5002
🔍 API Health: http://localhost:5002/api/health
ℹ️  Dev Info: http://localhost:5002/api/dev/info
📊 User API: http://localhost:5002/api/auth/user
============================================================
💡 Features:
   - No login required - direct access to app
   - All API endpoints functional
   - Database operations enabled
   - AI features: ❌ OpenAI, ❌ Deepgram
   - Session-based development user
   - Security middleware active
============================================================
🚀 Ready for testing! Use CTRL+C to stop

✅ Database connection established
✅ Created development user: Dr. Test Developer
✅ Initialized 3 default note templates
```

This indicates the server is running properly and ready for testing!
