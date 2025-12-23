# Complete Project Overview: How Everything Works Together

## 🏗️ Architecture Overview

This is a **full-stack dating app** for matching duos (pairs of users) for double dates. The architecture follows a **client-server pattern** with a **React frontend** and **Express.js backend**, using **Supabase** for authentication and database.

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (React + TypeScript)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Pages      │  │  Components  │  │   Contexts   │    │
│  │  - Auth      │  │  - Layout    │  │  - Auth      │    │
│  │  - Survey    │  │  - Protected │  │              │    │
│  │  - Dashboard │  │  - UI        │  │              │    │
│  │  - Partner   │  │              │  │              │    │
│  │  - Match     │  │              │  │              │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                  │             │
│         └─────────────────┼──────────────────┘             │
│                           │                                │
│                    ┌──────▼──────┐                         │
│                    │ React Query │                         │
│                    │  (API Calls)│                         │
│                    └──────┬──────┘                         │
└───────────────────────────┼────────────────────────────────┘
                            │ HTTP Requests (with JWT tokens)
                            │
┌───────────────────────────▼────────────────────────────────┐
│              SERVER (Express.js + TypeScript)              │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Middleware Stack:                                 │   │
│  │  1. express.json() - Parse JSON                    │   │
│  │  2. Request Logger - Log API calls                 │   │
│  │  3. authenticateToken - Verify JWT tokens          │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Route Handlers (server/routes.ts)                 │   │
│  │  - /api/auth/* - Authentication                    │   │
│  │  - /api/profile - User profiles                   │   │
│  │  - /api/survey - Survey responses                 │   │
│  │  - /api/partners - Find partners                  │   │
│  │  - /api/partner-invites - Partner invitations     │   │
│  │  - /api/match/* - Matching system                  │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Matching Algorithm (server/matching.ts)          │   │
│  │  - Filters duos by gender, graduation year, etc.  │   │
│  │  - Calculates compatibility scores                 │   │
│  │  - Creates matches                                 │   │
│  └────────────────────────────────────────────────────┘   │
└───────────────────────────┬────────────────────────────────┘
                            │
                            │ Supabase Client
                            │
┌───────────────────────────▼────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Auth       │  │   Database   │  │   Storage    │    │
│  │  - Users     │  │  - profiles  │  │  (not used)  │    │
│  │  - Sessions  │  │  - surveys   │  │              │    │
│  │  - JWT       │  │  - invites   │  │              │    │
│  │              │  │  - matches   │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication System

### Two Supabase Clients

**1. Regular Client (`supabase`)** - Used for token verification
```typescript
// server/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```
- Uses anonymous key (public)
- Used by `authenticateToken` middleware to verify JWT tokens
- Respects Row Level Security (RLS)

**2. Admin Client (`supabaseAdmin`)** - Used for database operations
```typescript
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
```
- Uses service role key (secret, server-only)
- Bypasses RLS policies
- Used for:
  - Creating users during signup
  - Reading any profile (for partner info)
  - Running matching algorithm
  - Admin operations

### Authentication Flow

```
1. USER SIGNS UP/LOGS IN
   └─> POST /api/auth/signup or /api/auth/login
       └─> Server validates email (must be @upenn.edu)
       └─> Supabase creates/authenticates user
       └─> Server creates profile record
       └─> Returns { user, session } with JWT token

2. CLIENT STORES TOKEN
   └─> Auth.tsx stores:
       - user object in AuthContext + localStorage
       - token in localStorage + sessionStorage
       - Redirects to /survey or /dashboard

3. PROTECTED ROUTE ACCESS
   └─> User navigates to /dashboard
       └─> ProtectedRoute checks:
           - AuthContext.user exists?
           - Token in storage?
           - If no → redirect to /auth

4. API REQUEST WITH TOKEN
   └─> Client makes request:
       fetch('/api/profile', {
         headers: { 'Authorization': `Bearer ${token}` }
       })
       
5. SERVER VERIFIES TOKEN
   └─> authenticateToken middleware:
       - Extracts token from header
       - Calls supabase.auth.getUser(token)
       - If valid → attaches user to req.user
       - If invalid → returns 401

6. ROUTE HANDLER EXECUTES
   └─> Uses req.user.id to query database
       └─> Returns user-specific data
```

### Token Expiration Handling

**Global 401 Handler:**
- React Query (`lib/queryClient.ts`) catches 401 errors
- Custom API wrapper (`lib/api.ts`) also catches 401 errors
- Both call `handleAuthError()` from AuthContext
- This function:
  1. Clears user from AuthContext
  2. Clears tokens from storage
  3. Redirects to `/auth`

---

## 📊 Database Structure

### Tables

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
- status (pending/accepted/rejected)
- created_at
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

## 🔄 Data Flow Examples

### Example 1: User Completes Survey

```
1. USER FILLS SURVEY FORM
   └─> Survey.tsx collects answers in state

2. USER CLICKS SUBMIT
   └─> saveSurveyToSupabase() function:
       - Separates profile data (name, gender, etc.)
       - Separates survey answers (q1, q2, etc.)
       
3. TWO API CALLS MADE:
   
   a) PUT /api/profile
      └─> Updates profile table:
          - full_name, gender, graduation_year, major, height
          - Sets survey_completed = true
      
   b) PUT /api/survey
      └─> Updates survey_responses table:
          - Stores answers as JSONB in 'answers' column

4. REDIRECT TO DASHBOARD
   └─> User can now see their profile and find partners
```

### Example 2: Finding a Partner

```
1. USER VISITS /partner PAGE
   └─> PartnerSelect.tsx loads

2. FETCHES AVAILABLE PARTNERS
   └─> GET /api/partners
       └─> authenticateToken verifies user
       └─> Server:
           - Gets current user's gender
           - Queries profiles WHERE:
             * survey_completed = true
             * gender = current_user.gender (same gender)
             * id != current_user.id
           - Returns list of potential partners

3. USER SELECTS PARTNER
   └─> POST /api/partner-invites
       └─> Creates invite record
       └─> Other user sees invite in their dashboard

4. PARTNER ACCEPTS
   └─> PUT /api/partner-invites/:id/accept
       └─> Updates both profiles:
           - user1.partner_id = user2.id
           - user2.partner_id = user1.id
       └─> Creates a "duo" (mutual partnership)
```

### Example 3: Matching Algorithm

```
1. USER VISITS /match PAGE (or admin runs matching)
   └─> GET /api/match/current
       └─> Checks if matches exist for this week
       └─> If not, auto-runs matching algorithm

2. MATCHING ALGORITHM RUNS (server/matching.ts)
   
   Step 1: Get Active Duos
   └─> Query profiles WHERE partner_id IS NOT NULL
   └─> Group into duos (mutual partnerships)
   └─> Load survey data for each user
   
   Step 2: Separate by Gender
   └─> mensDuos: duos where both users are Male
   └─> womensDuos: duos where both users are Female
   
   Step 3: Filter Valid Pairs
   └─> For each (menDuo, womenDuo) pair:
       - Check graduation year compatibility
       - Check religion compatibility
       - Check race/ethnicity compatibility
       - Ensure each person has at least one feasible match
   
   Step 4: Calculate Compatibility Scores
   └─> For each valid pair:
       - Goals (25%): Similar relationship intentions
       - Personality (30%): Humor, conflict style, social battery
       - Lifestyle (25%): Hobbies, going out, alcohol
       - Communication (20%): Texting, friend groups
       - Returns score 0-100
   
   Step 5: Greedy Matching
   └─> Sort pairs by compatibility score (highest first)
   └─> For each pair (if score >= 60%):
       - If neither duo already matched → create match
       - Mark both duos as matched
   
   Step 6: Save Matches
   └─> INSERT into weekly_matches table
       - Stores all 4 user IDs
       - Stores compatibility score
       - Stores match reasons
       - Stores week start date

3. RETURN MATCH TO USER
   └─> Query weekly_matches WHERE user_id IN (user1, user2, user3, user4)
   └─> Determine which duo user belongs to
   └─> Return matched duo and compatibility info
```

---

## 🎯 Key Components Explained

### Frontend Architecture

**1. App.tsx - Root Component**
```typescript
<QueryClientProvider>      // React Query for API state
  <AuthProvider>           // Authentication context
    <Router>               // Wouter routing
      <ProtectedRoute>     // Auth guard
        <Pages>            // Actual pages
```

**2. AuthContext - Global Auth State**
- Stores current user
- Provides `setUser()`, `signOut()`, `handleAuthError()`
- Persists to localStorage
- Checks token validity on mount

**3. ProtectedRoute - Route Guard**
- Checks if user is authenticated
- Checks if token exists
- Redirects to `/auth` if not authenticated
- Prevents rendering protected pages

**4. React Query Integration**
- `lib/queryClient.ts` - Configures React Query
- Automatically includes `Authorization` header
- Handles 401 errors globally
- Provides `useQuery` and `useMutation` hooks

### Backend Architecture

**1. server/index.ts - Entry Point**
- Creates Express app and HTTP server
- Loads environment variables (dotenv)
- Registers routes
- Sets up Vite middleware (dev) or static serving (prod)
- Starts server on port 5001

**2. server/routes.ts - Main API Routes**
- `authenticateToken` middleware - Verifies JWT tokens
- Auth routes: `/api/auth/signup`, `/api/auth/login`
- Profile routes: `/api/profile` (GET, PUT)
- Survey routes: `/api/survey` (GET, PUT)
- Partner routes: `/api/partners`, `/api/partner-invites`
- Registers matching routes from `matching-routes.ts`

**3. server/matching.ts - Matching Algorithm**
- `getActiveDuos()` - Fetches all duos with surveys
- `separateDuosByGender()` - Splits into men's/women's duos
- `filterValidDuoPairs()` - Applies feasibility filters
- `calculateCompatibility()` - Scores pairs 0-100
- `runMatchingAlgorithm()` - Main algorithm orchestrator
- `saveMatchesForWeek()` - Persists matches to database

**4. server/matching-routes.ts - Matching API**
- `/api/match/current` - Get user's current match (auto-generates if needed)
- `/api/match/history` - Get user's match history
- `/api/match/run` - Manually trigger matching algorithm

---

## 🔗 How Everything Connects

### Request Lifecycle

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

### State Management Flow

```
┌─────────────────────────────────────────────────┐
│           GLOBAL STATE (AuthContext)             │
│  - Current user (id, email)                     │
│  - Loading state                                 │
│  - Auth functions                                │
└──────────────────┬──────────────────────────────┘
                   │
                   │ Provides to all components
                   │
┌──────────────────▼──────────────────────────────┐
│         COMPONENT STATE (useState)              │
│  - Form data                                    │
│  - UI state (loading, errors)                   │
│  - Local component data                         │
└──────────────────┬──────────────────────────────┘
                   │
                   │ Fetches via React Query
                   │
┌──────────────────▼──────────────────────────────┐
│      SERVER STATE (React Query Cache)           │
│  - API response cache                           │
│  - Automatic refetching                         │
│  - Optimistic updates                           │
└──────────────────┬──────────────────────────────┘
                   │
                   │ Queries via API
                   │
┌──────────────────▼──────────────────────────────┐
│         DATABASE (Supabase PostgreSQL)          │
│  - Source of truth                              │
│  - Persistent storage                           │
└─────────────────────────────────────────────────┘
```

---

## 🎨 Frontend Pages & Their Purposes

**1. Landing (`/`)**
- Public landing page
- Links to signup/login

**2. Auth (`/auth`)**
- Login and signup forms
- Validates Penn email domain
- Stores auth state on success
- Redirects based on survey completion

**3. Survey (`/survey`)**
- Multi-step survey form
- Collects profile info + survey answers
- Saves to both `profiles` and `survey_responses`
- Only shown if `survey_completed = false`

**4. Dashboard (`/dashboard`)**
- Shows user's profile
- Shows current partner (if any)
- Shows partner invites (sent/received)
- Navigation hub

**5. Partner Select (`/partner`)**
- Lists available partners (same gender)
- Search/filter functionality
- Send partner invites
- Accept/reject received invites

**6. Match Reveal (`/match`)**
- Shows current week's match
- Auto-generates matches if none exist
- Displays compatibility score and reasons
- Shows matched duo information

**7. Settings (`/settings`)**
- Edit profile information
- Edit survey responses
- Update preferences

**8. Chat (`/chat`)**
- Group chat with matched duo (future feature)

**9. Date Ideas (`/dates`)**
- Browse date ideas (future feature)

---

## 🧮 Matching Algorithm Deep Dive

### Filtering Phase (v1.1)

**Purpose:** Ensure matches are structurally feasible before scoring

**Filters Applied:**

1. **Graduation Year Filter**
   - Gets most restrictive preference from duo
   - Checks if year difference ≤ allowed window
   - Example: If one person wants "Only people in my year" (window=0), both must be same year

2. **Religion Filter**
   - Checks if either person has "No preference"
   - Checks if person A's religion is in person B's preferred list
   - Checks if person B's religion is in person A's preferred list
   - Checks if they share a common religion

3. **Race/Ethnicity Filter**
   - Same logic as religion filter
   - Checks preferences and commonalities

**Duo-to-Duo Validity:**
- Each person in men's duo must have ≥1 feasible match in women's duo
- Each person in women's duo must have ≥1 feasible match in men's duo
- Uses existential logic (not universal - doesn't require all 4 pairs to match)

### Scoring Phase

**Compatibility Score Calculation (0-100):**

1. **Goals (25%)**
   - Compares `q1_looking_for` answers
   - Closer goals = higher score
   - Max 25 points

2. **Personality (30%)**
   - Friday night preference (8 points)
   - Humor style (7 points)
   - Conflict resolution (8 points)
   - Social battery compatibility (7 points)
   - Max 30 points

3. **Lifestyle (25%)**
   - Shared hobbies (up to 12 points)
   - Going out frequency (5 points)
   - Alcohol compatibility (8 points)
   - Max 25 points

4. **Communication (20%)**
   - Texting style (6 points)
   - Friend group preferences (8 points)
   - Dealbreakers (penalty if overlap)
   - Max 20 points

**Final Score:** `(totalScore / maxScore) * 100`

### Matching Phase

**Greedy Algorithm:**
1. Sort all valid pairs by compatibility score (highest first)
2. For each pair:
   - If score ≥ 60% (threshold)
   - If neither duo already matched
   - Create match and mark both duos as matched
3. Continue until all duos matched or no more valid pairs

**Prevents Re-matching:**
- Checks previous matches in database
- Skips pairs that have been matched before

---

## 🛠️ Development Workflow

### Running the App

**Development:**
```bash
npm run dev
```
- Starts Express server on port 5001
- Vite dev server proxies API requests
- Hot module replacement enabled
- Client runs on port 5000 (via Vite)

**Production:**
```bash
npm run build
npm start
```
- Builds client and server
- Serves static files from Express
- Single port (5001)

### Environment Variables

**.env file (server-side):**
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PORT=5001
```

**Vite environment (client-side):**
- Uses `VITE_` prefix
- Accessible via `import.meta.env.VITE_SUPABASE_URL`

---

## 🔒 Security Considerations

**1. Token Storage**
- Tokens stored in localStorage (persists across sessions)
- Also in sessionStorage (cleared on tab close)
- Never exposed in URLs or logs

**2. API Authentication**
- All protected routes require `Authorization: Bearer <token>` header
- Server verifies token with Supabase on every request
- Invalid/expired tokens return 401 → auto-logout

**3. Database Security**
- Row Level Security (RLS) enabled on Supabase tables
- Admin client bypasses RLS (server-side only)
- Service role key never exposed to client

**4. Input Validation**
- Zod schemas validate all inputs
- Email domain validation (Penn emails only)
- SQL injection prevented by Supabase client

---

## 📈 Data Flow Summary

```
USER ACTION
    ↓
REACT COMPONENT
    ↓
API REQUEST (with JWT token)
    ↓
EXPRESS MIDDLEWARE (authenticateToken)
    ↓
ROUTE HANDLER
    ↓
SUPABASE QUERY (admin client)
    ↓
POSTGRESQL DATABASE
    ↓
RESPONSE DATA
    ↓
REACT QUERY CACHE
    ↓
COMPONENT RE-RENDER
    ↓
USER SEES UPDATED UI
```

---

## 🎯 Key Design Decisions

**1. Why Two Supabase Clients?**
- Regular client respects RLS (for user-specific queries)
- Admin client bypasses RLS (for server operations like matching)

**2. Why JSONB for Survey Answers?**
- Flexible schema (can add questions without migrations)
- Easy to query nested data
- PostgreSQL JSONB is fast and indexed

**3. Why Greedy Matching?**
- Simple and fast
- Ensures best matches get paired first
- Prevents suboptimal pairings

**4. Why Auto-Generate Matches?**
- User experience: matches appear automatically
- No need to wait for admin to run algorithm
- Can still manually trigger via API

**5. Why Filter Before Scoring?**
- Performance: don't score impossible matches
- User preferences: respect hard filters (year, religion, race)
- Scoring focuses on compatibility, not feasibility

---

This architecture provides a scalable, secure, and maintainable foundation for the matching system. Each layer has clear responsibilities, and the separation of concerns makes it easy to modify or extend functionality.

