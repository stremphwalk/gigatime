# Development Server (No Authentication)

This document explains how to use the development server that completely bypasses authentication for testing purposes.

## Overview

The `dev-server-no-auth.ts` is a special development server that:

- **Completely bypasses authentication** - No login required
- **Uses a mock user** - Automatically logs you in as "Dr. Sarah Mitchell"
- **Includes all API endpoints** - Full functionality without auth barriers
- **Perfect for testing** - Quickly test features without auth setup

## Quick Start

### 1. Start the No-Auth Dev Server

```bash
npm run dev:no-auth
```

### 2. Access the Application

Open your browser and go to:
```
http://localhost:5002
```

**Note**: The server will automatically find an available port if 5002 is in use. Check the console output for the actual port number.

You'll be automatically logged in as:
- **Name**: Dr. Sarah Mitchell
- **Email**: doctor@hospital.com
- **Specialty**: Emergency Medicine

## Features

### Automatic Mock User
- No login screen or authentication flow
- Always authenticated as the same mock user
- All API calls work immediately

### Full Functionality
- ✅ Note templates
- ✅ Smart phrases
- ✅ Team collaboration
- ✅ Calendar events
- ✅ Lab settings
- ✅ All other features

### Development Features
- Hot reload with Vite
- Detailed API logging
- Error handling
- Database integration

## Comparison with Regular Dev Server

| Feature | Regular Dev (`npm run dev`) | No-Auth Dev (`npm run dev:no-auth`) |
|---------|------------------------------|--------------------------------------|
| Authentication | Auth0/Clerk required | Completely bypassed |
| Login Flow | Required | None |
| User Management | Real auth | Mock user only |
| Testing Speed | Slower (auth setup) | Instant |
| Production-like | Yes | No |

## Use Cases

### Perfect For:
- **Quick feature testing** - Test new functionality without auth setup
- **UI/UX development** - Focus on interface without auth distractions
- **Demo purposes** - Show features to stakeholders quickly
- **Development workflow** - Faster iteration cycles

### Not Suitable For:
- **Authentication testing** - No real auth flow
- **Production testing** - Uses mock data
- **Multi-user scenarios** - Single mock user only

## Mock User Details

The server automatically creates and uses this mock user:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "doctor@hospital.com",
  "firstName": "Dr. Sarah",
  "lastName": "Mitchell",
  "specialty": "Emergency Medicine"
}
```

## API Endpoints

All API endpoints work exactly the same as the regular server, but without authentication requirements:

- `GET /api/auth/user` - Returns mock user
- `POST /api/auth/login` - Mock login response
- `POST /api/auth/logout` - Mock logout response
- All other endpoints work normally

## Environment Variables

The no-auth dev server uses the same environment variables as the regular server:

- `PORT` - Server port (default: 5000)
- `DATABASE_URL` - Database connection
- `DEEPGRAM_API_KEY` - For speech-to-text features
- Other app-specific variables

## Switching Between Servers

### To use regular dev server with auth:
```bash
npm run dev
```

### To use no-auth dev server:
```bash
npm run dev:no-auth
```

Both servers can run simultaneously on different ports if needed.

## Troubleshooting

### Server won't start
- The server automatically finds an available port starting from 5002
- Check the console output for the actual port being used
- Ensure database connection is configured
- Verify all dependencies are installed

### Database errors
- Run `npm run db:push` to ensure database schema is up to date
- Check your `DATABASE_URL` environment variable

### Features not working
- The no-auth server includes all the same functionality as the regular server
- If something doesn't work, it's likely a general app issue, not auth-related

## Security Note

⚠️ **Important**: This server is for development and testing only. Never use it in production or expose it publicly, as it completely bypasses all authentication and authorization checks.
