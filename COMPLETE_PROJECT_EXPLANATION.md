# Complete Project Explanation: How Everything Works Together

## 🎯 Project Overview

**Penn Two Mans** is a full-stack double-dating application for University of Pennsylvania students. It matches pairs of friends (duos) with compatible couples for double dates using a sophisticated matching algorithm based on survey responses.

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │   Contexts   │      │
│  │  - Landing   │  │  - Layout    │  │  - Auth       │      │
│  │  - Auth     │  │  - Protected │  │               │      │
│  │  - Survey   │  │  - UI        │  │               │      │
│  │  - Dashboard│  │              │  │               │      │
│  │  - Partner  │  │              │  │               │      │
│  │  - Match    │  │              │  │               │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘               │
│                           │                                  │
│                    ┌──────▼──────┐                           │
│                    │ React Query │                           │
│                    │  (API Calls)│                           │
│                    └──────┬──────┘                           │
└───────────────────────────┼────────────────────────────────┘
                            │ HTTP Requests (Bearer Token)
                            │
┌───────────────────────────▼────────────────────────────────┐
│              SERVER LAYER (Express.js)                     │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Middleware Stack:                                 │   │
│  │  1. express.json() - Parse JSON                    │   │
│  │  2. Request Logger - Log API calls                 │   │
│  │  3. authenticateToken - Verify JWT tokens          │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Route Handlers (server/routes.ts)                │   │
│  │  - /api/auth/* - Authentication                   │   │
│  │  - /api/profile - User profiles                  │   │
│  │  - /api/survey - Survey responses                │   │
│  │  - /api/partners - Find partners                │   │
│  │  - /api/partner-invites - Partner invitations    │   │
│  │  - /api/match/* - Matching system                 │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Matching Algorithm (server/matching.ts)          │   │
│  │  - Filters duos by preferences                    │   │
│  │  - Calculates compatibility scores                 │   │
│  │  - Creates matches                                 │   │
│  └────────────────────────────────────────────────────┘   │
└───────────────────────────┬────────────────────────────────┘
                            │ Supabase Client SDK
                            │
┌───────────────────────────▼────────────────────────────────┐
│                    DATABASE LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Supabase   │  │   PostgreSQL  │  │   Row Level  │   │
│  │    Auth      │  │   Database    │  │   Security   │   │
│  │              │  │               │  │   (RLS)      │   │
│  │  - Users     │  │  - profiles   │  │              │   │
│  │  - Sessions  │  │  - surveys    │  │              │   │
│  │  - JWT       │  │  - invites    │  │              │   │
│  │              │  │  - matches    │  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 File-by-File Breakdown

### **Root Configuration Files**

#### `package.json`
- **Purpose**: Defines project dependencies and scripts
- **Key Scripts**:
  - `npm run dev` - Starts development server (Express + Vite)
  - `npm run build` - Builds for production
  - `npm start` - Runs production server
- **Dependencies**: React, Express, Supabase, React Query, Zod, Tailwind CSS, shadcn/ui components

#### `vite.config.ts`
- **Purpose**: Configures Vite build tool
- **Key Features**:
  - Sets up React plugin
  - Configures path aliases (`@/` → `client/src/`)
  - Sets root directory to `client/`
  - Builds output to `dist/public/`
- **How it works**: Vite transforms TypeScript/React during development and bundles for production

#### `tsconfig.json`
- **Purpose**: TypeScript compiler configuration
- **How it works**: Ensures type safety across client and server code

---

### **Server Files** (`server/`)

#### `server/index.ts` - **Server Entry Point**
- **Purpose**: Creates and starts the Express server
- **What it does**:
  1. Loads environment variables (`dotenv/config`)
  2. Creates Express app and HTTP server
  3. Sets up middleware:
     - `express.json()` - Parses JSON request bodies
     - Request logger - Logs all API calls with timing
  4. Registers all API routes (`registerRoutes`)
  5. Sets up error handling middleware
  6. In development: Integrates Vite dev server
  7. In production: Serves static files from `dist/public/`
  8. Listens on port 5001
- **Key Flow**:
  ```
  Start → Load Env → Create Express → Register Routes → Setup Vite/Static → Listen
  ```

#### `server/supabase.ts` - **Database Clients**
- **Purpose**: Creates two Supabase clients
- **Two Clients**:
  1. **`supabase`** (Regular Client)
     - Uses `SUPABASE_ANON_KEY`
     - Respects Row Level Security (RLS)
     - Used for token verification in `authenticateToken`
  
  2. **`supabaseAdmin`** (Admin Client)
     - Uses `SUPABASE_SERVICE_ROLE_KEY`
     - Bypasses RLS (full database access)
     - Used for all database operations (creating users, reading profiles, matching)
- **Why Two?**: RLS policies restrict access, but server needs admin privileges for operations like creating profiles and running matching algorithm

#### `server/routes.ts` - **Main API Routes**
- **Purpose**: Defines all API endpoints and handlers
- **Key Components**:

  **1. `authenticateToken` Middleware**
  - Extracts JWT token from `Authorization: Bearer <token>` header
  - Verifies token with `supabase.auth.getUser(token)`
  - Attaches user to `req.user` if valid
  - Returns 401 if invalid/expired
  - **Used by**: All protected routes

  **2. Authentication Routes**:
  - `POST /api/auth/signup`
    - Validates Penn email domain (Zod schema)
    - Checks if email exists
    - Creates Supabase Auth user (`supabaseAdmin.auth.admin.createUser`)
    - Creates profile record
    - Signs user in and returns session token
  
  - `POST /api/auth/login`
    - Validates credentials
    - Signs in with Supabase (`supabase.auth.signInWithPassword`)
    - Returns user and session token

  **3. Profile Routes**:
  - `GET /api/profile` (Protected)
    - Gets current user's profile
    - Creates profile if doesn't exist (lazy creation)
  
  - `PUT /api/profile` (Protected)
    - Updates user profile
    - Validates with Zod schema
  
  - `GET /api/profile/:id` (Protected)
    - Gets another user's profile (for partner info)
    - Returns limited fields

  **4. Survey Routes**:
  - `POST /api/survey` (Protected)
    - Saves survey responses
    - Updates profile with `survey_completed: true`
    - Upserts `survey_responses` table (JSONB storage)
  
  - `GET /api/survey` (Protected)
    - Retrieves user's survey responses

  **5. Partner Routes**:
  - `GET /api/partners` (Protected)
    - Lists available partners (same gender, survey completed)
    - Filters out current user
  
  - `POST /api/partner-invites` (Protected)
    - Creates partner invitation
    - Validates: no existing partner, no pending invite
  
  - `GET /api/partner-invites` (Protected)
    - Gets sent and received invites with profile info
  
  - `POST /api/partner-invites/:id/accept` (Protected)
    - Accepts invitation
    - Sets `partner_id` for both users (creates duo)
    - Cancels other pending invites
  
  - `POST /api/partner/unpair` (Protected)
    - Removes partner pairing
    - Clears `partner_id` for both users

  **6. Matching Routes**:
  - Imports and registers routes from `matching-routes.ts`

#### `server/matching.ts` - **Matching Algorithm**
- **Purpose**: Core matching logic for pairing duos
- **Key Functions**:

  **1. `getActiveDuos()`**
  - Fetches all users with `partner_id` set (duos)
  - Groups users into duos (mutual partnerships)
  - Loads survey data for each user
  - Returns array of `Duo` objects

  **2. `separateDuosByGender()`**
  - Splits duos into men's duos and women's duos
  - Ensures both users in duo have same gender

  **3. `filterValidDuoPairs()`**
  - Filters duo pairs for feasibility (before scoring)
  - Checks:
    - **Graduation Year**: Respects most restrictive preference
    - **Religion**: Checks preferences and commonalities
    - **Race/Ethnicity**: Checks preferences and commonalities
  - Ensures each person has ≥1 feasible match in other duo

  **4. `calculateCompatibility()`**
  - Scores duo pairs 0-100 based on:
    - **Goals (25%)**: Relationship intentions
    - **Personality (30%)**: Humor, conflict style, social battery
    - **Lifestyle (25%)**: Hobbies, going out, alcohol
    - **Communication (20%)**: Texting, friend groups
  - Returns `MatchResult` with score and reasons

  **5. `runMatchingAlgorithm()`**
  - Main orchestrator function
  - Steps:
    1. Get active duos
    2. Separate by gender
    3. Filter valid pairs
    4. Calculate compatibility scores
    5. Sort by score (highest first)
    6. Greedy matching: Match highest-scoring pairs first
    7. Prevent re-matching (checks previous matches)
    8. Returns array of matches

  **6. `saveMatchesForWeek()`**
  - Saves matches to `weekly_matches` table
  - Stores: user IDs, compatibility score, match reasons, week start date

#### `server/matching-routes.ts` - **Matching API Endpoints**
- **Purpose**: API routes for matching system
- **Routes**:

  **1. `GET /api/match/current`** (Protected)
  - Gets current week's match for user
  - Auto-generates matches if none exist
  - Determines which duo user belongs to
  - Returns match with compatibility info

  **2. `GET /api/match/history`** (Protected)
  - Gets user's match history (last 10 matches)

  **3. `POST /api/match/run`** (⚠️ Currently Unprotected)
  - Manually triggers matching algorithm
  - Can force regeneration with `?force=true`
  - Should be admin-protected in production

#### `server/vite.ts` - **Vite Dev Server Integration**
- **Purpose**: Integrates Vite dev server with Express
- **How it works**:
  - Runs Vite in middleware mode
  - Express handles `/api/*` routes
  - Vite handles all other routes (serves React app)
  - Provides Hot Module Replacement (HMR)

#### `server/static.ts` - **Static File Serving**
- **Purpose**: Serves built React app in production
- **How it works**:
  - Serves files from `dist/public/`
  - Fallback to `index.html` for client-side routing

---

### **Client Files** (`client/src/`)

#### `client/src/main.tsx` - **React Entry Point**
- **Purpose**: Renders React app to DOM
- **What it does**:
  - Imports `App.tsx`
  - Imports global CSS
  - Creates root and renders app

#### `client/src/App.tsx` - **Root Component**
- **Purpose**: Sets up app providers and routing
- **Component Hierarchy**:
  ```
  QueryClientProvider (React Query)
    └─ AuthProvider (Auth Context)
        └─ AppContent
            └─ TooltipProvider
                └─ Toaster (Toast notifications)
                    └─ Router (Wouter routing)
                        └─ Routes (Pages)
  ```
- **Key Features**:
  - Sets up global auth error handlers for React Query and API utilities
  - Wraps app in providers (Query, Auth, UI)
  - Defines all routes

#### `client/src/contexts/AuthContext.tsx` - **Authentication State**
- **Purpose**: Manages global authentication state
- **What it does**:
  - Stores current user (`{ id, email }`)
  - Persists user to `localStorage`
  - Restores user on mount
  - Provides `setUser()`, `signOut()`, `handleAuthError()`
- **How it works**:
  - On mount: Checks `localStorage` for user and token
  - If found: Restores user state
  - If not found: Clears auth data
  - `handleAuthError()`: Clears auth data (called on 401 errors)

#### `client/src/components/ProtectedRoute.tsx` - **Route Guard**
- **Purpose**: Protects routes requiring authentication
- **What it does**:
  1. Checks if user exists in AuthContext
  2. Checks if token exists in storage
  3. If not authenticated: Redirects to `/auth`
  4. If authenticated: Renders children
- **Usage**: Wraps protected routes in `App.tsx`

#### `client/src/lib/queryClient.ts` - **React Query Setup**
- **Purpose**: Configures React Query for API calls
- **Key Features**:
  - `getQueryFn()`: Automatically includes `Authorization` header
  - Handles 401 errors globally (calls `authErrorHandler`)
  - Configures default query options (no refetch, no retry)
- **How it works**:
  - All `useQuery` calls automatically include token
  - 401 errors trigger logout/redirect

#### `client/src/lib/api.ts` - **API Utilities**
- **Purpose**: Helper functions for API calls
- **Functions**:
  - `getAuthToken()`: Gets token from storage
  - `authenticatedFetch()`: Wrapper around `fetch` with auto token injection
  - `setAuthErrorHandler()`: Sets global 401 handler
- **How it works**:
  - Automatically adds `Authorization` header
  - Handles 401 errors

#### `client/src/pages/` - **Page Components**
- **Landing.tsx**: Public landing page
- **Auth.tsx**: Login/signup forms
  - Validates Penn email domain
  - Stores auth state on success
  - Redirects based on survey completion
- **Survey.tsx**: Multi-step survey form
  - Collects profile info + survey answers
  - Saves to both `profiles` and `survey_responses`
- **Dashboard.tsx**: User dashboard
  - Shows profile, partner, invites
  - Navigation hub
- **PartnerSelect.tsx**: Find and invite partners
  - Lists available partners
  - Send/accept/reject invites
- **MatchReveal.tsx**: Shows current week's match
  - Fetches match from API
  - Displays compatibility score and reasons
- **Settings.tsx**: Edit profile and survey
- **Chat.tsx**: Group chat (future feature)
- **DateIdeas.tsx**: Browse date ideas (future feature)

#### `client/src/components/ui/` - **UI Components**
- **Purpose**: shadcn/ui component library
- **Components**: Buttons, forms, dialogs, cards, etc.
- **How it works**: Pre-built, accessible components using Radix UI

---

## 🔄 How Everything Connects: Complete Data Flow

### **Example 1: User Signs Up**

```
1. USER VISITS /auth
   └─> Auth.tsx renders signup form

2. USER FILLS FORM & SUBMITS
   └─> React Hook Form validates
   └─> POST /api/auth/signup
       ├─> Server validates Penn email (Zod)
       ├─> Checks email doesn't exist
       ├─> Creates Supabase Auth user (supabaseAdmin.auth.admin.createUser)
       ├─> Creates profile record
       └─> Returns { user, session }

3. CLIENT RECEIVES RESPONSE
   └─> Auth.tsx:
       ├─> Stores user in AuthContext (setUser)
       ├─> Stores token in localStorage
       └─> Redirects to /survey

4. USER NAVIGATES TO /survey
   └─> ProtectedRoute checks:
       ├─> AuthContext.user exists? ✅
       ├─> Token exists? ✅
       └─> Renders Survey page
```

### **Example 2: User Completes Survey**

```
1. USER FILLS SURVEY FORM
   └─> Survey.tsx collects answers in state

2. USER CLICKS SUBMIT
   └─> POST /api/survey
       ├─> authenticateToken verifies token
       ├─> Extracts user from token (req.user)
       ├─> Validates request body (Zod)
       ├─> Updates profiles table:
       │   └─> SET survey_completed = true, ...profileData
       └─> Upserts survey_responses:
           └─> INSERT or UPDATE answers (JSONB)

3. CLIENT RECEIVES SUCCESS
   └─> Survey.tsx shows toast
   └─> Redirects to /dashboard
```

### **Example 3: User Finds Partner**

```
1. USER VISITS /partner
   └─> PartnerSelect.tsx loads

2. FETCHES AVAILABLE PARTNERS
   └─> GET /api/partners
       ├─> authenticateToken verifies token
       ├─> Gets current user's gender
       └─> Queries profiles:
           ├─> WHERE survey_completed = true
           ├─> WHERE gender = current_user.gender
           └─> WHERE id != current_user.id
       └─> Returns list of partners

3. USER SELECTS PARTNER & CLICKS INVITE
   └─> POST /api/partner-invites
       ├─> authenticateToken verifies token
       ├─> Validates: no existing partner, no pending invite
       └─> Creates invite record:
           └─> INSERT INTO partner_invites (sender_id, receiver_id, status: 'pending')

4. PARTNER ACCEPTS INVITE
   └─> POST /api/partner-invites/:id/accept
       ├─> Validates invite exists and is pending
       ├─> Updates invite: status = 'accepted'
       ├─> Updates profiles:
       │   ├─> SET partner_id = receiver_id WHERE id = sender_id
       │   └─> SET partner_id = sender_id WHERE id = receiver_id
       └─> Cancels other pending invites

5. DUO CREATED
   └─> Both users now have partner_id set (mutual partnership)
```

### **Example 4: Matching Algorithm Runs**

```
1. USER VISITS /match (or admin triggers)
   └─> GET /api/match/current

2. SERVER CHECKS FOR EXISTING MATCHES
   └─> Query weekly_matches WHERE match_week = current_week
   └─> If no matches → Auto-run algorithm

3. MATCHING ALGORITHM RUNS (server/matching.ts)
   
   Step 1: Get Active Duos
   └─> Query profiles WHERE partner_id IS NOT NULL
   └─> Group into duos (mutual partnerships)
   └─> Load survey data for each user
   
   Step 2: Separate by Gender
   └─> mensDuos: duos where both users are Male
   └─> womensDuos: duos where both users are Female
   
   Step 3: Filter Valid Pairs
   └─> For each (menDuo, womenDuo) pair:
       ├─> Check graduation year compatibility
       ├─> Check religion compatibility
       ├─> Check race/ethnicity compatibility
       └─> Ensure each person has ≥1 feasible match
   
   Step 4: Calculate Compatibility Scores
   └─> For each valid pair:
       ├─> Goals (25%): Relationship intentions
       ├─> Personality (30%): Humor, conflict, social battery
       ├─> Lifestyle (25%): Hobbies, going out, alcohol
       ├─> Communication (20%): Texting, friend groups
       └─> Returns score 0-100
   
   Step 5: Greedy Matching
   └─> Sort pairs by compatibility score (highest first)
   └─> For each pair (if score >= 60%):
       ├─> If neither duo already matched → create match
       └─> Mark both duos as matched
   
   Step 6: Save Matches
   └─> INSERT INTO weekly_matches
       ├─> Stores all 4 user IDs
       ├─> Stores compatibility score
       ├─> Stores match reasons
       └─> Stores week start date

4. RETURN MATCH TO USER
   └─> Query weekly_matches WHERE user_id IN (user1, user2, user3, user4)
   └─> Determine which duo user belongs to
   └─> Return matched duo and compatibility info
```

---

## 🔐 Authentication Flow Deep Dive

### **Token Storage Strategy**

**Client-side:**
- Token stored in `localStorage` (persists across sessions)
- Also in `sessionStorage` (cleared on tab close)
- User object stored in `localStorage`
- Token sent in `Authorization: Bearer <token>` header for all API calls

**Server-side:**
- Token verified on every protected endpoint
- No token storage (stateless)
- User identity extracted from token on each request

### **Authentication Middleware Flow**

```
1. CLIENT MAKES REQUEST
   └─> fetch('/api/profile', {
         headers: { 'Authorization': `Bearer ${token}` }
       })

2. SERVER RECEIVES REQUEST
   └─> Express middleware stack:
       ├─> express.json() - Parses JSON body
       ├─> Request logger - Logs API call
       └─> authenticateToken middleware

3. authenticateToken EXECUTES
   └─> Extracts token from header
   └─> Calls supabase.auth.getUser(token)
   └─> If valid:
       ├─> Attaches user to req.user
       └─> Calls next() → continues to route handler
   └─> If invalid:
       └─> Returns 401 Unauthorized

4. ROUTE HANDLER EXECUTES
   └─> Uses req.user.id to query database
   └─> Returns user-specific data
```

### **401 Error Handling**

**Global Handlers:**
- React Query (`lib/queryClient.ts`) catches 401 errors
- API utilities (`lib/api.ts`) also catch 401 errors
- Both call `handleAuthError()` from AuthContext

**handleAuthError() Flow:**
1. Clears user from AuthContext
2. Clears tokens from storage
3. ProtectedRoute detects no user → redirects to `/auth`

---

## 🗄️ Database Structure

### **Tables**

**1. `auth.users` (Supabase Auth)**
- Managed by Supabase
- Stores: email, password hash, id, created_at
- Created via `supabaseAdmin.auth.admin.createUser()`

**2. `profiles`**
```sql
- id (UUID, references auth.users)
- email
- full_name
- gender (Male/Female/Nonbinary)
- graduation_year
- major
- height
- partner_height_min/max
- partner_id (UUID, references profiles.id)
- survey_completed (boolean)
- created_at, updated_at
```

**3. `survey_responses`**
```sql
- user_id (UUID, references profiles.id)
- answers (JSONB) - Stores all survey questions as JSON
  {
    "q1_looking_for": "...",
    "q2_who_to_meet": "...",
    "q_race_ethnicity": [...],
    "q_preferred_race_ethnicity": [...],
    "q_religious_affiliation": [...],
    "q_preferred_religious_affiliation": [...],
    "q3_friday_night": "...",
    ... (all 13 questions)
  }
```

**4. `partner_invites`**
```sql
- id (UUID)
- sender_id (references profiles.id)
- receiver_id (references profiles.id)
- status (pending/accepted/rejected/cancelled)
- created_at, responded_at
```

**5. `weekly_matches`**
```sql
- id (UUID)
- user1_id, user2_id (first duo)
- user3_id, user4_id (second duo)
- compatibility_score (0-100)
- match_reasons (TEXT[])
- match_week (TIMESTAMPTZ)
- created_at, updated_at
```

---

## 🎨 Frontend Architecture Patterns

### **State Management**

**Three Layers:**

1. **Global State (AuthContext)**
   - Current user
   - Auth functions
   - Persisted to localStorage

2. **Server State (React Query)**
   - API response cache
   - Automatic refetching
   - Optimistic updates

3. **Component State (useState)**
   - Form data
   - UI state (loading, errors)
   - Local component data

### **Routing**

**Wouter** (lightweight React Router alternative):
- Client-side routing
- Protected routes wrapped in `<ProtectedRoute>`
- Layout wrapper for authenticated pages

### **API Calls**

**Two Patterns:**

1. **React Query** (Recommended):
   ```typescript
   const { data } = useQuery({
     queryKey: ['/api/profile'],
   });
   ```

2. **Direct Fetch**:
   ```typescript
   const response = await authenticatedFetch('/api/profile');
   ```

Both automatically include `Authorization` header and handle 401 errors.

---

## 🚀 Development vs Production

### **Development Mode (`npm run dev`)**

**Server:**
- Express server on port 5001
- Vite dev server integrated as middleware
- Hot Module Replacement (HMR) enabled
- TypeScript transformed on-the-fly

**Client:**
- Served by Vite dev server
- Fast refresh on code changes
- Source maps for debugging

**Request Flow:**
```
Browser → Express (port 5001)
  ├─> /api/* → Express routes
  └─> /* → Vite middleware → React app
```

### **Production Mode (`npm run build` → `npm start`)**

**Build Process:**
1. Vite builds React app → `dist/public/`
2. esbuild bundles server → `dist/index.cjs`
3. Static assets copied

**Server:**
- Express serves static files from `dist/public/`
- No Vite in production
- Single port (5001)

**Request Flow:**
```
Browser → Express (port 5001)
  ├─> /api/* → Express routes
  └─> /* → Static files from dist/public/
```

---

## 🔑 Key Design Decisions

### **1. Why Two Supabase Clients?**

- **Regular client** respects RLS (for user-specific queries)
- **Admin client** bypasses RLS (for server operations like matching)
- Server needs admin privileges to:
  - Create profiles for new users
  - Read any profile (for partner info)
  - Update profiles (set partner_id)
  - Run matching algorithm

### **2. Why JSONB for Survey Answers?**

- Flexible schema (can add questions without migrations)
- Easy to query nested data
- PostgreSQL JSONB is fast and indexed
- Allows survey structure to evolve

### **3. Why Greedy Matching?**

- Simple and fast algorithm
- Ensures best matches get paired first
- Prevents suboptimal pairings
- Easy to understand and debug

### **4. Why Auto-Generate Matches?**

- User experience: matches appear automatically
- No need to wait for admin to run algorithm
- Can still manually trigger via API
- Reduces operational overhead

### **5. Why Filter Before Scoring?**

- Performance: don't score impossible matches
- User preferences: respect hard filters (year, religion, race)
- Scoring focuses on compatibility, not feasibility
- Reduces computation time

---

## 📊 Request Lifecycle Summary

```
1. USER ACTION (e.g., clicks "Find Partners")
   └─> React component calls useQuery or fetch()

2. CLIENT PREPARES REQUEST
   └─> Gets token from localStorage
   └─> Adds Authorization header
   └─> Sends HTTP request to /api/partners

3. EXPRESS SERVER RECEIVES REQUEST
   └─> express.json() parses body
   └─> Request logger logs the call
   └─> Routes to /api/partners handler

4. AUTHENTICATION MIDDLEWARE
   └─> authenticateToken extracts token
   └─> supabase.auth.getUser(token) verifies
   └─> Attaches user to req.user
   └─> Calls next()

5. ROUTE HANDLER EXECUTES
   └─> Uses req.user.id to get current user
   └─> Queries database with supabaseAdmin
   └─> Filters results (e.g., same gender)
   └─> Returns JSON response

6. CLIENT RECEIVES RESPONSE
   └─> React Query updates cache
   └─> Component re-renders with new data
   └─> User sees updated UI
```

---

## 🎯 Summary

This project uses a **modern full-stack architecture** with:

1. **React frontend** with client-side routing and state management
2. **Express backend** with RESTful API design
3. **Supabase** for database and authentication
4. **TypeScript** for type safety across the stack
5. **Zod** for validation shared between client and server
6. **Vite** for fast development and optimized production builds

The architecture is designed for:
- **Scalability**: Stateless server, efficient database queries
- **Security**: Token-based auth, server-side validation, RLS
- **Developer Experience**: Hot reload, type safety, clear separation
- **Maintainability**: Clear structure, reusable components, consistent patterns

Each layer has a specific responsibility, and they communicate through well-defined APIs, making the system modular and easy to understand and extend.

