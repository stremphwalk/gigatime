# Overview

This is a medical documentation application built for healthcare professionals to create, manage, and organize clinical notes. The system features a React-based frontend with shadcn/ui components, an Express.js backend, and PostgreSQL database with Drizzle ORM. Key features include note templates for different clinical scenarios (admission, progress, consult notes), smart phrase autocomplete for efficient documentation, and team collaboration tools for healthcare teams.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS styling
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom design tokens following a clinical/medical theme

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **API Design**: RESTful API endpoints with proper error handling and logging middleware
- **Development Setup**: Hot module replacement in development with Vite integration
- **Build Process**: ESBuild for production bundling with separate client/server builds

## Database Schema
- **Users**: Healthcare professionals with specialty information
- **Teams**: Collaborative groups with member management and role-based access
- **Note Templates**: Structured templates for different clinical note types with customizable sections
- **Notes**: Clinical documentation linked to patients with rich content support
- **Smart Phrases**: Reusable text snippets with trigger-based autocomplete
- **Team Features**: Shared todos and calendar events for team coordination

## Authentication & Authorization
- Currently implements mock authentication for development
- Designed for future integration with healthcare-grade authentication systems
- Role-based access control structure in place for team management

## Key Design Patterns
- **Separation of Concerns**: Clear separation between client, server, and shared code
- **Component Composition**: Reusable UI components with consistent design patterns
- **Hook-based Data Management**: Custom hooks for data fetching and mutations
- **Schema Validation**: Zod integration with Drizzle for type-safe database operations
- **Responsive Design**: Mobile-first approach with adaptive layouts

# External Dependencies

## Database
- **Neon Database**: Serverless PostgreSQL with WebSocket support for real-time features
- **Connection Pooling**: Configured for scalable database connections

## UI Framework
- **Radix UI**: Comprehensive set of accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Replit Integration**: Custom plugins for development environment integration
- **TypeScript**: Full type safety across the entire stack
- **ESLint/Prettier**: Code quality and formatting tools (implied by project structure)

## Backend Services
- **Express Session**: Session management with PostgreSQL store (connect-pg-simple)
- **CORS**: Cross-origin resource sharing configuration
- **Body Parsing**: JSON and URL-encoded request handling

## Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx**: Conditional CSS class management
- **class-variance-authority**: Type-safe variant-based component styling
- **nanoid**: Unique ID generation for various entities