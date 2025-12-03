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
- **Authentication:** Supabase Auth with AuthContext provider

**Design Decisions:**
- Uses a custom warm color palette (blush pinks, terracotta, sage green) for inviting aesthetic
- Custom fonts: Poppins for headings, DM Sans for body text, Great Vibes for decorative script
- Mobile-first responsive design with dedicated mobile navigation
- Component-based architecture with reusable UI primitives
- Path aliases (@/, @shared, @assets) for clean imports
- ProtectedRoute component wraps all authenticated pages

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
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth with server-side validation
- **Validation:** Zod for request body validation

**Design Decisions:**
- RESTful API design with /api prefix
- Server-side Penn email domain validation before user creation
- Service Role Key used for secure user creation (bypasses client restrictions)
- Token-based authentication via Supabase JWT
- All protected endpoints verify tokens via authenticateToken middleware

**API Structure:**
- POST /api/auth/signup - User registration with Penn email validation (uses service role)
- POST /api/auth/login - Authentication via Supabase
- GET /api/profile - Get user profile (requires auth)
- PUT /api/profile - Update user profile (requires auth)
- POST /api/survey - Save survey responses (requires auth)
- GET /api/survey - Get survey responses (requires auth)

**Data Models:**
Supabase tables:
- profiles: User profile data (id, email, full_name, gender, interested_in, graduation_year, major, height, survey_completed)
- survey_responses: Survey answers (id, user_id, answers JSONB, created_at, updated_at)

### Database Design

**Platform:** Supabase (PostgreSQL)

**Tables:**
- profiles: User profile data linked to Supabase Auth users
- survey_responses: JSONB storage for survey answers

**Email Validation:**
Server-side Zod refinement ensures emails end with approved Penn domains:
- @upenn.edu
- @seas.upenn.edu
- @sas.upenn.edu
- @wharton.upenn.edu

**Row Level Security:**
Both tables have RLS policies to ensure users can only access their own data.

### Authentication & Authorization

**Strategy:** Supabase Auth with server-side domain validation

**Flow:**
1. User submits email/password to /api/auth/signup
2. Server validates email against Penn domain whitelist using Zod
3. Server creates user via Supabase Admin API (service role key)
4. Email auto-confirmed for verified Penn domains
5. Session returned to client and stored via Supabase client
6. Protected routes check auth state via AuthContext
7. API requests include JWT token in Authorization header

**Security Configuration:**
- SUPABASE_SERVICE_ROLE_KEY: Server-only key for creating users
- SUPABASE_ANON_KEY: Client-side key for authenticated operations
- Penn email validation enforced server-side before user creation

**IMPORTANT Security Requirement:**
To fully prevent bypassing Penn email restrictions, you must disable email signup in Supabase:
1. Go to Supabase Dashboard → Authentication → Providers → Email
2. Turn OFF "Enable Email Signup"
This forces all signups through the server endpoint which validates Penn emails.

**Protected Routes:**
- ProtectedRoute component redirects unauthenticated users to /auth
- authenticateToken middleware verifies JWT on API endpoints
- Returns 401 for unauthorized access

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
- SUPABASE_URL: Supabase project URL
- SUPABASE_ANON_KEY: Public anonymous key
- SUPABASE_SERVICE_ROLE_KEY: Service role key (server-side only)
- VITE_SUPABASE_URL: Client-side Supabase URL
- VITE_SUPABASE_ANON_KEY: Client-side anonymous key
- NODE_ENV for environment detection

## External Dependencies

### Database & Auth
- **Supabase:** PostgreSQL database with built-in authentication
- **@supabase/supabase-js:** JavaScript client SDK

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

### Asset Management
- Generated images stored in attached_assets/generated_images/
- Philadelphia and campus imagery for landing and auth pages
- OpenGraph/Twitter card meta tags with dynamic image URLs

## Recent Changes

### December 3, 2025 - UI/UX Improvements
- Removed all profile pictures: Replaced with initials-based avatars using colored circles
- Added logout functionality: Integrated with AuthContext in Layout header dropdown and mobile nav
- Rebuilt Settings page: Full vertical survey layout on single scrollable page for easy preference editing
- Updated Partner selection: Now fetches real users from Supabase profiles table (survey_completed = true)
- Partner persistence: Saves selected partner to profiles.partner_id (requires column in Supabase)
- Helper functions: getInitials() and getAvatarColor() in mockData.ts for consistent avatar styling

### December 3, 2025 - Supabase Migration
- Migrated from Replit PostgreSQL + Passport.js to Supabase
- Implemented Supabase Auth with server-side Penn email validation
- Added AuthContext for managing authentication state
- Created ProtectedRoute component for route protection
- Added service role key support for secure user creation
- Updated all API endpoints with token authentication and Zod validation

### Database Schema Updates Needed
To enable partner persistence, add the following column to the profiles table in Supabase:
```sql
ALTER TABLE profiles ADD COLUMN partner_id UUID REFERENCES profiles(id);
```
