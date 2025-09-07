# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Gigatime is a medical documentation platform that enables healthcare professionals to create, manage, and share medical notes using voice dictation, AI-powered parsing, and collaborative team features. It combines a React frontend with an Express.js backend, using Drizzle ORM with PostgreSQL for data persistence.

## Development Commands

### Primary Development Commands
```bash
# Start development server with authentication
npm run dev

# Start development server without authentication (mock user)
npm run dev:no-auth

# Start simple test server
npm run dev:simple

# Type checking
npm run check

# Build for production
npm run build

# Start production server
npm start
```

### Database Commands
```bash
# Push schema changes to database
npm run db:push

# Run database migrations
npm run db:migrate

# Open Drizzle Studio for database inspection
npm run db:studio
```

### Development Modes

**Regular Development (npm run dev):**
- Requires proper Auth0/Clerk configuration
- Full authentication flow
- Runs on port 5000 (or PORT env var)

**No-Auth Development (npm run dev:no-auth):**
- Completely bypasses authentication
- Uses mock user "Dr. Sarah Mitchell"
- Perfect for feature testing and UI development
- Runs on port 5002
- See DEV-SERVER-NO-AUTH.md for details

## Architecture Overview

### Monorepo Structure
The project uses a monorepo structure with clear separation of concerns:

- **`client/`** - React frontend with Vite build system
- **`server/`** - Express.js backend with API routes
- **`shared/`** - Shared TypeScript types and database schema
- **`migrations/`** - Database schema migrations

### Frontend Architecture (client/)
- **Framework**: React 18 with TypeScript
- **Router**: Wouter for client-side routing
- **State Management**: React Query (@tanstack/react-query) for server state
- **Styling**: Tailwind CSS with Radix UI components
- **Build Tool**: Vite with React plugin
- **Key Libraries**:
  - Framer Motion for animations
  - React Hook Form for form management
  - Zod for runtime validation
  - Lucide React for icons

### Backend Architecture (server/)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Multi-provider support (Auth0, Clerk, or bypass)
- **API Design**: RESTful endpoints with JSON responses
- **Key Features**:
  - Session management with express-session
  - File storage and management
  - AI integration endpoints
  - Real-time features via WebSockets

### Database Schema (shared/schema.ts)
The database schema includes:
- **Users & Authentication**: Users, sessions
- **Team Collaboration**: Teams, team members, team todos, calendar events
- **Medical Documentation**: Notes, note templates, smart phrases
- **Autocomplete System**: Medical conditions, medications, lab values
- **Settings & Preferences**: User lab settings, lab presets

### Path Aliases
```typescript
"@/*" -> "./client/src/*"
"@shared/*" -> "./shared/*"
"@assets/*" -> "./attached_assets/*"
```

## Key Features & Components

### Voice Dictation & AI Processing
- **Soniox Integration**: Medical-grade speech-to-text with medical context support
- **AI Parsing**: Amazon Nova Micro integration for structured data extraction
- **Endpoints**: `/api/ai/medications`, `/api/ai/labs`, `/api/ai/pmh`
- **Usage**: AI buttons appear next to section headers for Medications, Labs, and PMH sections

### Medical Documentation System
- **Note Templates**: Admission, Progress, Consult note templates
- **Smart Phrases**: Reusable text snippets with interactive elements
- **Autocomplete**: Comprehensive medical terminology autocomplete
- **Rich Text Editor**: Custom editor with medical-specific features

### Team Collaboration
- **Teams**: Time-limited teams (7-day expiration) with group codes
- **Shared Dashboard**: Team bulletin posts and announcements
- **Task Management**: Team todos with assignees and priorities
- **Calendar Integration**: Shared team calendar events

### Authentication System
The app supports multiple authentication providers:
- **Auth0**: Production-ready authentication
- **Clerk**: Alternative authentication provider
- **Development Bypass**: Mock authentication for testing

## Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://... # or POSTGRES_URL

# Authentication (choose one)
# Auth0
AUTH0_SECRET=...
AUTH0_BASE_URL=...
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
AUTH0_ISSUER_BASE_URL=...

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# AI Services
SONIOX_API_KEY=... # Required for voice dictation

# Amazon Nova Micro (AI Processing)
AWS_ACCESS_KEY_ID=... # Required for AI parsing
AWS_SECRET_ACCESS_KEY=... # Required for AI parsing
AWS_REGION=us-east-1 # Required for AI parsing

# Development
NODE_ENV=development|production
PORT=5000 # Server port
```

### Development Environment Files
- `.env` - Main environment file
- `.env.example` - Template for development
- `.env.production.example` - Template for production deployment

## API Structure

### Authentication Endpoints
- `GET /api/auth/user` - Get current user
- `POST /api/auth/login` - Login endpoint
- `POST /api/auth/logout` - Logout endpoint
- `GET /api/auth/callback` - Auth callback handler

### Core API Endpoints
- `/api/notes/*` - Note CRUD operations
- `/api/templates/*` - Note template management
- `/api/smart-phrases/*` - Smart phrase management
- `/api/teams/*` - Team collaboration features
- `/api/autocomplete/*` - Medical terminology autocomplete
- `/api/ai/*` - AI processing endpoints (server-side only)

## Development Guidelines

### Code Organization
- Use TypeScript strict mode
- Follow React best practices with hooks
- Use React Query for all server state management
- Implement proper error boundaries and loading states
- Use Zod schemas for runtime validation

### Database Operations
- All database operations use Drizzle ORM
- Schema is defined in `shared/schema.ts`
- Use migrations for schema changes: `npm run db:migrate`
- Foreign key relationships are properly enforced

### Authentication Patterns
- Check authentication state with `useAuth()` hook
- Support multiple auth providers through configuration
- Always validate user permissions on the backend
- Use development bypass only for testing

### Voice & AI Integration
- Soniox handles speech-to-text conversion with medical context
- Amazon Nova Micro processes dictated text into structured format
- All AI operations happen server-side for security
- Graceful fallbacks when AI services are unavailable

## Testing & Development

### Quick Testing Setup
1. Use `npm run dev:no-auth` for rapid feature testing
2. Mock user is automatically created: "Dr. Sarah Mitchell"
3. All features work without authentication setup
4. Database operations work normally

### Production-like Testing
1. Set up Auth0 or Clerk authentication
2. Configure database with proper connection string
3. Use `npm run dev` for full authentication flow
4. Test with real user accounts and permissions

## Deployment

The application is configured for deployment on:
- **Vercel** (primary target with vercel.json config)
- **Replit** (with specific configuration files)
- **Docker** (containerization support)

### Key Deployment Files
- `vercel.json` - Vercel deployment configuration
- `package.json` scripts include build and deploy commands
- Environment variables must be configured in deployment platform
- Database migrations should be run post-deployment

## Claude Development Permissions

The `.claude/settings.local.json` file allows specific development commands including:
- npm scripts execution (`npm run dev:*`, `npm install`, etc.)
- Git operations (`git add`, `git commit`, `git push`, etc.)
- Database tools (`npx drizzle-kit:*`, `psql:*`)
- Development tools (`curl`, `kill`, `lsof`, etc.)
- Vercel deployment (`npx vercel:*`)
