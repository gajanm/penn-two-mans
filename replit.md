# Penn Double Date - University Dating Application

## Overview

Penn Double Date is a web application designed exclusively for University of Pennsylvania students to find compatible double-date matches. The platform combines partner selection, compatibility matching, group chat functionality, and curated Philadelphia date recommendations to create a complete double-dating experience.

The application restricts access to verified @upenn.edu email addresses and uses a sophisticated matching algorithm based on shared values, personality compatibility, and preferences to connect pairs of friends with compatible couples each week.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite for development and production builds
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** TanStack Query (React Query) for server state
- **Styling:** Tailwind CSS with custom theme configuration
- **UI Components:** shadcn/ui component library with Radix UI primitives
- **Animations:** Framer Motion for page transitions and interactive elements
- **Forms:** React Hook Form with Zod validation

**Design Decisions:**
- Uses a custom warm color palette (blush pinks, terracotta, sage green) for inviting aesthetic
- Custom fonts: Poppins for headings, DM Sans for body text, Great Vibes for decorative script
- Mobile-first responsive design with dedicated mobile navigation
- Component-based architecture with reusable UI primitives
- Path aliases (@/, @shared, @assets) for clean imports

**Key Pages:**
- Landing: Marketing page with hero section
- Auth: Split-screen login/signup with email verification
- Survey: Multi-step onboarding with progress tracking
- Dashboard: Weekly status and partner overview
- Partner Selection: Friend selection interface
- Match Reveal: Animated match announcement (Tuesdays)
- Group Chat: 4-person messaging for matched groups
- Date Ideas: Curated Philadelphia locations
- Settings: Profile management

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database ORM:** Drizzle ORM
- **Authentication:** Passport.js with local strategy
- **Session Management:** Express-session
- **Password Hashing:** bcrypt
- **Validation:** Zod with drizzle-zod integration

**Design Decisions:**
- RESTful API design with /api prefix
- Session-based authentication (not JWT)
- Email domain validation enforced at schema level
- Separation of storage layer through IStorage interface
- Build process bundles server dependencies for faster cold starts
- Development mode includes HMR via Vite middleware

**API Structure:**
- POST /api/auth/signup - User registration with email validation
- POST /api/auth/login - Authentication via Passport local strategy
- Protected routes require isAuthenticated middleware

**Data Models:**
Currently implements basic user schema with:
- id (UUID primary key)
- email (unique, validated against Penn domains)
- password (bcrypt hashed)

Note: Additional tables for profiles, partners, matches, messages, and preferences are planned but not yet implemented.

### Database Design

**ORM:** Drizzle with PostgreSQL dialect via Neon serverless driver

**Schema Location:** shared/schema.ts for type sharing between client/server

**Current Tables:**
- users: Basic authentication data

**Email Validation:**
Custom Zod refinement ensures emails end with approved Penn domains:
- @upenn.edu
- @seas.upenn.edu
- @sas.upenn.edu
- @wharton.upenn.edu

**Migration Strategy:**
- Migrations stored in /migrations directory
- Schema changes via drizzle-kit push command
- Connection pooling via @neondatabase/serverless

### Authentication & Authorization

**Strategy:** Passport.js Local Strategy with session persistence

**Flow:**
1. User submits email/password
2. Email validated against Penn domain whitelist
3. Password hashed with bcrypt (10 rounds)
4. User created and automatically logged in
5. Session stored server-side
6. Subsequent requests authenticated via deserializeUser

**Session Configuration:**
- Secret from environment variable (SESSION_SECRET)
- Not saved until login (saveUninitialized: false)
- Cookie-based session tracking

**Protected Routes:**
- isAuthenticated middleware checks req.isAuthenticated()
- Returns 401 for unauthorized access
- Query client configured to handle 401 responses

### Build & Deployment

**Development:**
- Concurrent client (Vite) and server (tsx) processes
- Vite dev server runs on port 5000
- HMR integrated for both client and server
- Development-only Replit plugins (cartographer, dev banner)

**Production Build:**
1. Client: Vite builds to dist/public
2. Server: esbuild bundles to dist/index.cjs
3. Selected dependencies bundled to reduce syscalls
4. Static files served from dist/public
5. Fallback to index.html for client-side routing

**Environment Requirements:**
- DATABASE_URL for PostgreSQL connection
- SESSION_SECRET for session encryption
- NODE_ENV for environment detection

## External Dependencies

### Database
- **Neon Serverless PostgreSQL:** Cloud-hosted PostgreSQL with WebSocket support
- **Connection:** Via @neondatabase/serverless package
- **ORM:** Drizzle for type-safe queries

### UI Component Libraries
- **Radix UI:** Headless accessible components (dialogs, dropdowns, tooltips, etc.)
- **shadcn/ui:** Pre-styled component collection built on Radix
- **Lucide React:** Icon library
- **canvas-confetti:** Celebration animations for match reveals

### Development Tools
- **Replit Plugins:** Runtime error modal, cartographer, dev banner (dev only)
- **Vite Plugins:** Custom meta images plugin for OpenGraph tags
- **TypeScript:** Full type safety across client and server

### Styling
- **Tailwind CSS:** Utility-first CSS framework
- **@tailwindcss/vite:** Vite plugin for Tailwind v4
- **tw-animate-css:** CSS animation utilities
- **Google Fonts:** Poppins, DM Sans, Great Vibes

### State & Data Fetching
- **TanStack Query:** Server state management with caching
- **React Hook Form:** Form state and validation
- **Zod:** Schema validation shared between client/server

### Authentication & Security
- **Passport.js:** Authentication middleware
- **bcrypt:** Password hashing
- **express-session:** Session management
- **connect-pg-simple:** PostgreSQL session store (imported but not configured)

### Asset Management
- Generated images stored in attached_assets/generated_images/
- Philadelphia and campus imagery for landing and auth pages
- OpenGraph/Twitter card meta tags with dynamic image URLs