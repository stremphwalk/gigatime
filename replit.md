# Overview

Gigatime is a comprehensive medical note-taking application designed specifically for healthcare professionals. It combines traditional electronic health record functionality with modern AI-powered features like voice dictation, smart phrase expansion, and clinical decision support tools. The application streamlines clinical documentation workflows by offering customizable note templates, intelligent autocomplete for medical conditions and medications, and collaborative team features for healthcare groups.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application uses a modern React-based frontend built with TypeScript and Vite. The UI is constructed using shadcn/ui components with Radix UI primitives, providing a consistent and accessible design system. The client-side architecture employs React Router (wouter) for navigation and TanStack Query for state management and data fetching. The application supports multiple authentication providers including Auth0 and Clerk, with fallback session-based authentication for development.

## Backend Architecture
The backend is built as an Express.js API server with TypeScript, designed to run both as a traditional Node.js application and as serverless functions on Vercel. The API follows RESTful principles and includes comprehensive CRUD operations for notes, templates, smart phrases, teams, and user management. Authentication is handled through middleware that supports multiple providers (Auth0, Clerk) with development fallbacks.

## Database Design
The application uses PostgreSQL as its primary database with Drizzle ORM for type-safe database operations. The schema includes tables for users, teams, notes, note templates, smart phrases, team management features (todos, calendar events), and lab settings. The database supports both Neon (development) and Supabase (production) providers, with automatic SSL configuration based on the environment.

## Voice Recognition Integration
Voice dictation is implemented using Deepgram's real-time speech-to-text API with WebSocket connections. The system provides global voice commands accessible throughout the application, with intelligent text insertion at cursor positions and support for medical terminology recognition. The dictation feature includes visual feedback through microphone icons and audio level indicators.

## Medical Data Processing
The application includes sophisticated medical data parsing capabilities, particularly for laboratory values and clinical calculations. Lab results can be automatically parsed from text input with support for trend analysis and customizable display preferences. Clinical calculators are integrated for common medical scoring systems (CHADS2, Wells Score, etc.) with real-time computation and result formatting.

## Team Collaboration Features
Multi-user functionality is built around team concepts where healthcare professionals can join groups using 4-character codes. Teams have shared resources including templates, smart phrases, todo lists, and calendar events. The system includes role-based permissions and automatic cleanup of expired teams after 7 days.

# External Dependencies

## Authentication Services
- **Auth0**: Primary authentication service for production deployments with OAuth2/OIDC support
- **Clerk**: Alternative authentication provider with comprehensive user management features
- **Express Session**: Fallback session management for development environments

## Database Providers
- **Supabase**: PostgreSQL hosting service for production deployments with automatic SSL and connection pooling
- **Neon**: Serverless PostgreSQL provider primarily used for development environments
- **Drizzle ORM**: Type-safe database toolkit providing schema management and query building

## Voice Recognition
- **Deepgram**: Real-time speech-to-text API service with medical terminology support and WebSocket streaming

## Deployment and Hosting
- **Vercel**: Primary deployment platform supporting both static frontend and serverless API functions
- **Node.js**: Runtime environment for local development and traditional server deployments

## Development Tools
- **Vite**: Frontend build tool and development server with hot module replacement
- **TypeScript**: Type system providing compile-time safety across the entire application
- **Tailwind CSS**: Utility-first CSS framework for responsive design implementation
- **Replit**: Development environment support with specialized plugins and runtime error handling