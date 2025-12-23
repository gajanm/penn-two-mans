# Penn Two Mans - Complete Architecture Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture Layers](#system-architecture-layers)
3. [Technology Stack](#technology-stack)
4. [How Everything Works Together](#how-everything-works-together)
5. [API Layer Deep Dive](#api-layer-deep-dive)
6. [Authentication Flow](#authentication-flow)
7. [Database Architecture](#database-architecture)
8. [Client-Server Communication](#client-server-communication)
9. [Development vs Production](#development-vs-production)
10. [Data Flow Examples](#data-flow-examples)

---

## Project Overview

**Penn Two Mans** is a double-dating application for University of Pennsylvania students. It allows pairs of friends to find compatible couples for double dates through a matching system based on surveys and preferences.

**Key Features:**
- Penn email-only authentication (@upenn.edu domains)
- User profile and survey system
- Partner invitation system
- Match reveal (weekly on Tuesdays)
- Group chat for matched couples
- Curated Philadelphia date ideas

---

## System Architecture Layers

The application follows a **3-tier architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  (React + TypeScript + Vite + Wouter)                   │
│  - UI Components                                        │
│  - State Management (React Query + Context)             │
│  - Client-side Routing                                  │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP Requests (REST API)
                   │ Bearer Token Authentication
┌──────────────────▼──────────────────────────────────────┐
│                   API LAYER                             │
│  (Express.js + Node.js + TypeScript)                    │
│  - Request Validation (Zod)                             │
│  - Authentication Middleware                             │
│  - Business Logic                                       │
│  - Error Handling                                       │
└──────────────────┬──────────────────────────────────────┘
                   │ Supabase Client SDK
                   │ Service Role Key (Admin)
┌──────────────────▼──────────────────────────────────────┐
│                 DATABASE LAYER                          │
│  (Supabase PostgreSQL)                                  │
│  - User Authentication (Supabase Auth)                  │
│  - Profiles Table                                       │
│  - Survey Responses Table                               │
│  - Partner Invites Table                                │
│  - Row Level Security (RLS)                             │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend (Client Layer)
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Wouter** - Lightweight routing (similar to React Router)
- **TanStack Query (React Query)** - Server state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation (shared with backend)
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library (built on Radix UI)
- **Framer Motion** - Animations
- **Supabase JS Client** - For client-side Supabase operations

### Backend (API Layer)
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Zod** - Request validation
- **Supabase JS SDK** - Database operations and auth
- **dotenv** - Environment variable management

### Database & Infrastructure
- **Supabase** - PostgreSQL database + Auth service
- **Drizzle ORM** - Type-safe database queries (configured but using Supabase SDK directly)

---

## How Everything Works Together

### 1. Application Startup Flow

#### Development Mode (`npm run dev`)

```
1. Server starts (server/index.ts)
   ├─ Loads environment variables (dotenv/config)
   ├─ Creates Express app
   ├─ Creates HTTP server
   ├─ Sets up JSON body parser middleware
   ├─ Sets up request logging middleware
   ├─ Registers API routes (registerRoutes)
   ├─ Sets up Vite dev server in middleware mode
   │  └─ Vite serves React app with HMR (Hot Module Replacement)
   └─ Listens on port 5001

2. Client loads (client/index.html → main.tsx → App.tsx)
   ├─ React Query Provider wraps app
   ├─ AuthProvider wraps app (manages auth state)
   ├─ Router initializes
   └─ User sees Landing page or redirects based on auth
```

#### Production Mode (`npm run build` → `npm start`)

```
1. Build process (script/build.ts)
   ├─ Vite builds client → dist/public/
   ├─ esbuild bundles server → dist/index.cjs
   └─ Static assets copied

2. Server starts
   ├─ Same setup as dev mode
   └─ Serves static files from dist/public/ instead of Vite
```

### 2. Request Flow (Example: User Login)

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │ 1. User fills login form
       │ 2. onSubmit() called
       │ 3. fetch('/api/auth/login', { email, password })
       │
┌──────▼──────────────────────────────────────────────┐
│  Express Server (server/index.ts)                  │
│  ┌──────────────────────────────────────────────┐ │
│  │ Middleware Stack:                             │ │
│  │ 1. express.json() - Parses JSON body          │ │
│  │ 2. Request logger - Logs API calls            │ │
│  │ 3. Route handler (/api/auth/login)            │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │ Route Handler (server/routes.ts)             │ │
│  │ 1. Validates request with Zod schema         │ │
│  │ 2. Calls supabase.auth.signInWithPassword()  │ │
│  │ 3. Returns { user, session }                 │ │
│  └──────────────────────────────────────────────┘ │
└──────┬──────────────────────────────────────────────┘
       │
       │ 4. Response: { user: {id, email}, session: {...} }
       │
┌──────▼──────┐
│   Browser   │
│  (React)    │
│             │
│  Auth.tsx:  │
│  5. Stores user in AuthContext                    │
│  6. Stores token in localStorage                  │
│  7. Redirects to /survey                          │
└─────────────┘
```

---

## API Layer Deep Dive

### API Structure (`server/routes.ts`)

The API follows RESTful conventions with all endpoints prefixed with `/api`:

#### Authentication Endpoints

**POST `/api/auth/signup`**
- **Purpose**: Create new user account
- **Validation**: Zod schema checks Penn email domain
- **Process**:
  1. Validates email/password with Zod
  2. Checks if email already exists in `profiles` table
  3. Creates auth user via `supabaseAdmin.auth.admin.createUser()`
  4. Creates profile record in `profiles` table
  5. Signs user in to get session token
  6. Returns user data and session

**POST `/api/auth/login`**
- **Purpose**: Authenticate existing user
- **Process**:
  1. Validates email/password
  2. Calls `supabase.auth.signInWithPassword()`
  3. Returns user data and session token

#### Profile Endpoints

**GET `/api/profile`** (Protected)
- **Middleware**: `authenticateToken` - verifies JWT token
- **Process**:
  1. Extracts user from token
  2. Fetches profile from `profiles` table
  3. Creates profile if doesn't exist (lazy creation)
  4. Returns profile data

**PUT `/api/profile`** (Protected)
- **Purpose**: Update user profile
- **Validation**: `profileUpdateSchema` validates fields
- **Process**:
  1. Validates request body
  2. Updates profile in database
  3. Returns updated profile

**GET `/api/profile/:id`** (Protected)
- **Purpose**: Get another user's profile (for partner info)
- **Returns**: Limited fields (id, email, name, major, graduation_year, gender)

#### Survey Endpoints

**POST `/api/survey`** (Protected)
- **Purpose**: Save survey responses
- **Process**:
  1. Validates survey answers and profile data
  2. Updates profile with `survey_completed: true`
  3. Upserts survey responses (insert or update)
  4. Stores answers as JSONB in `survey_responses` table

**GET `/api/survey`** (Protected)
- **Purpose**: Retrieve user's survey responses
- **Returns**: Survey data or empty object if none exists

#### Partner Management Endpoints

**GET `/api/partners`** (Protected)
- **Purpose**: List available partners (users who completed survey)
- **Returns**: Array of profiles excluding current user

**POST `/api/partner-invites`** (Protected)
- **Purpose**: Send partner invitation
- **Validation**: 
  - Checks user doesn't already have partner
  - Checks no pending invite exists between users
- **Process**: Creates invite record with `status: 'pending'`

**GET `/api/partner-invites`** (Protected)
- **Purpose**: Get sent and received invites
- **Returns**: `{ sent: [...], received: [...] }` with profile info

**POST `/api/partner-invites/:id/accept`** (Protected)
- **Purpose**: Accept partner invitation
- **Process**:
  1. Validates invite exists and is pending
  2. Checks neither user has partner already
  3. Updates invite status to 'accepted'
  4. Sets `partner_id` for both users
  5. Cancels all other pending invites for both users

**POST `/api/partner-invites/:id/reject`** (Protected)
- **Purpose**: Reject partner invitation
- **Process**: Updates invite status to 'rejected'

**POST `/api/partner-invites/:id/cancel`** (Protected)
- **Purpose**: Cancel sent invitation
- **Process**: Updates invite status to 'cancelled'

**POST `/api/partner/unpair`** (Protected)
- **Purpose**: Remove partner pairing
- **Process**: Sets `partner_id` to null for both users

### Authentication Middleware (`authenticateToken`)

```typescript
async function authenticateToken(req, res, next) {
  // 1. Extract token from Authorization header
  const token = req.headers.authorization?.split(' ')[1];
  
  // 2. Verify token with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  // 3. Attach user to request object
  req.user = user;
  
  // 4. Call next() to continue to route handler
  next();
}
```

**How it works:**
- Client sends token in `Authorization: Bearer <token>` header
- Server verifies token with Supabase Auth
- If valid, attaches user to request
- If invalid, returns 401 Unauthorized

---

## Authentication Flow

### Complete Authentication Journey

```
┌─────────────────────────────────────────────────────────────┐
│                    SIGNUP FLOW                               │
└─────────────────────────────────────────────────────────────┘

1. User visits /auth page
   └─ Auth.tsx renders login/signup form

2. User fills signup form (email, password)
   └─ React Hook Form validates client-side

3. Form submission
   └─ POST /api/auth/signup
      ├─ Server validates Penn email domain
      ├─ Checks email doesn't exist
      ├─ Creates Supabase Auth user
      ├─ Creates profile record
      └─ Returns { user, session }

4. Client receives response
   └─ Auth.tsx:
      ├─ Stores user in AuthContext
      ├─ Stores token in localStorage
      └─ Redirects to /survey

5. Protected routes now accessible
   └─ ProtectedRoute checks AuthContext
      └─ If user exists, renders page


┌─────────────────────────────────────────────────────────────┐
│                    LOGIN FLOW                                │
└─────────────────────────────────────────────────────────────┘

1. User visits /auth (or redirected from protected route)
   └─ Auth.tsx renders login form

2. User fills login form
   └─ POST /api/auth/login
      ├─ Server validates credentials
      ├─ Supabase authenticates user
      └─ Returns { user, session }

3. Client stores auth state
   └─ Same as signup step 4


┌─────────────────────────────────────────────────────────────┐
│              PROTECTED ROUTE ACCESS                         │
└─────────────────────────────────────────────────────────────┘

1. User navigates to /dashboard
   └─ ProtectedRoute component checks:
      ├─ AuthContext.user exists?
      ├─ Token in localStorage?
      └─ If no → redirect to /auth

2. If authenticated, page loads
   └─ Dashboard.tsx fetches data:
      ├─ GET /api/profile (with Bearer token)
      └─ GET /api/partner-invites (with Bearer token)

3. Server validates token
   └─ authenticateToken middleware:
      ├─ Extracts token from header
      ├─ Verifies with Supabase
      └─ Attaches user to request

4. Route handler executes
   └─ Uses req.user.id for queries
```

### Token Storage Strategy

**Client-side:**
- Token stored in both `localStorage` and `sessionStorage`
- User object stored in `localStorage`
- Token sent in `Authorization: Bearer <token>` header for all API calls

**Server-side:**
- Token verified on every protected endpoint
- No token storage (stateless)
- User identity extracted from token on each request

---

## Database Architecture

### Supabase Setup

**Two Supabase Clients:**

1. **Regular Client** (`supabase`)
   - Uses `SUPABASE_ANON_KEY`
   - Respects Row Level Security (RLS)
   - Used for token verification

2. **Admin Client** (`supabaseAdmin`)
   - Uses `SUPABASE_SERVICE_ROLE_KEY`
   - Bypasses RLS (full database access)
   - Used for all database operations
   - Required because RLS policies restrict access

### Database Tables

**`profiles` Table**
```sql
- id (UUID, Primary Key) - Links to Supabase Auth user
- email (Text) - User's Penn email
- full_name (Text, nullable)
- gender (Text, nullable)
- interested_in (Text[], nullable) - Array of genders
- graduation_year (Text, nullable)
- major (Text, nullable)
- height (Number, nullable)
- partner_height_min (Number, nullable)
- partner_height_max (Number, nullable)
- partner_id (UUID, nullable) - References another profile
- survey_completed (Boolean, default false)
- created_at (Timestamp)
- updated_at (Timestamp)
```

**`survey_responses` Table**
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → profiles.id)
- answers (JSONB) - Flexible JSON storage for survey data
- created_at (Timestamp)
- updated_at (Timestamp)
```

**`partner_invites` Table**
```sql
- id (UUID, Primary Key)
- sender_id (UUID, Foreign Key → profiles.id)
- receiver_id (UUID, Foreign Key → profiles.id)
- status (Text) - 'pending', 'accepted', 'rejected', 'cancelled'
- created_at (Timestamp)
- responded_at (Timestamp, nullable)
```

**Supabase Auth (Built-in)**
- Managed by Supabase
- Stores user credentials
- Generates JWT tokens
- Handles password hashing

### Row Level Security (RLS)

Supabase uses RLS policies to ensure:
- Users can only read their own profile
- Users can only update their own profile
- Users can only access their own survey responses

**Why Admin Client?**
- RLS policies are restrictive
- Server needs to:
  - Create profiles for new users
  - Read any profile (for partner info)
  - Update profiles (set partner_id)
- Service role key bypasses RLS for these operations

---

## Client-Server Communication

### Request Pattern

**All API calls follow this pattern:**

```typescript
// 1. Get token from storage
const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

// 2. Make request with token in header
const response = await fetch('/api/endpoint', {
  method: 'POST', // or GET, PUT, etc.
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // Token authentication
  },
  body: JSON.stringify(data) // For POST/PUT requests
});

// 3. Handle response
if (response.ok) {
  const data = await response.json();
  // Use data
} else {
  // Handle error
}
```

### React Query Integration

**Query Function** (`lib/queryClient.ts`):
- Automatically includes credentials
- Handles 401 errors
- Throws errors for non-ok responses

**Usage Example:**
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['/api/profile'],
  // Automatically uses getQueryFn which includes credentials
});
```

### Error Handling

**Client-side:**
- React Query handles errors automatically
- Toast notifications for user feedback
- 401 errors trigger logout/redirect

**Server-side:**
- Zod validation errors return 400 with message
- Authentication errors return 401
- Database errors return 400/500 with message
- Global error handler catches unhandled errors

---

## Development vs Production

### Development Mode

**Server (`server/index.ts`):**
```typescript
if (process.env.NODE_ENV === "production") {
  serveStatic(app); // Serve built files
} else {
  const { setupVite } = await import("./vite");
  await setupVite(httpServer, app); // Vite dev server
}
```

**Vite Dev Server (`server/vite.ts`):**
- Runs in **middleware mode**
- Integrates with Express
- Provides Hot Module Replacement (HMR)
- Transforms React/TypeScript on-the-fly
- Serves from `client/` directory

**How it works:**
1. Express receives request
2. If API route (`/api/*`), Express handles it
3. If not API route, Vite middleware handles it
4. Vite transforms `index.html` and React components
5. Returns transformed HTML/JS to browser

### Production Mode

**Build Process (`script/build.ts`):**
1. **Client Build:**
   - Vite builds React app
   - Outputs to `dist/public/`
   - Bundles and minifies code
   - Optimizes assets

2. **Server Build:**
   - esbuild bundles server code
   - Outputs to `dist/index.cjs`
   - Bundles selected dependencies
   - Reduces cold start time

**Static File Serving (`server/static.ts`):**
- Serves files from `dist/public/`
- Express static middleware
- Fallback to `index.html` for client-side routing
- No Vite in production

### Environment Variables

**Development:**
- Loaded from `.env` file via `dotenv/config`
- `NODE_ENV=development`
- Vite uses `VITE_*` prefixed vars

**Production:**
- Set in deployment environment
- `NODE_ENV=production`
- Same env vars required

---

## Data Flow Examples

### Example 1: User Completes Survey

```
1. User fills survey form (Survey.tsx)
   └─ React Hook Form manages form state

2. User clicks "Submit"
   └─ onSubmit() handler:
      ├─ Validates form data
      └─ POST /api/survey
         ├─ Body: { answers: {...}, profileData: {...} }
         └─ Headers: { Authorization: Bearer <token> }

3. Server receives request (routes.ts)
   └─ authenticateToken middleware:
      ├─ Verifies token
      └─ Attaches user to req.user

4. Route handler executes:
   └─ POST /api/survey handler:
      ├─ Validates request body with Zod
      ├─ Updates profiles table:
      │  └─ SET survey_completed = true, ...profileData
      ├─ Upserts survey_responses:
      │  └─ INSERT or UPDATE answers JSONB
      └─ Returns { message: "Survey saved successfully" }

5. Client receives response
   └─ Survey.tsx:
      ├─ Shows success toast
      └─ Redirects to /dashboard
```

### Example 2: User Sends Partner Invite

```
1. User selects partner (PartnerSelect.tsx)
   └─ Shows list from GET /api/partners

2. User clicks "Invite"
   └─ POST /api/partner-invites
      ├─ Body: { receiver_id: "uuid" }
      └─ Headers: { Authorization: Bearer <token> }

3. Server validates:
   └─ authenticateToken → extracts user
   └─ Checks:
      ├─ User doesn't have partner already
      ├─ No pending invite exists
      └─ receiver_id !== sender_id

4. Creates invite:
   └─ INSERT INTO partner_invites
      └─ { sender_id, receiver_id, status: 'pending' }

5. Returns invite object
   └─ Client updates UI to show "Invite Sent"
```

### Example 3: User Accepts Partner Invite

```
1. User sees invite in Dashboard
   └─ GET /api/partner-invites returns received invites

2. User clicks "Accept"
   └─ POST /api/partner-invites/:id/accept

3. Server processes:
   └─ Validates invite exists and is pending
   └─ Checks neither user has partner
   └─ Updates invite: status = 'accepted'
   └─ Updates profiles:
      ├─ SET partner_id = receiver_id WHERE id = sender_id
      └─ SET partner_id = sender_id WHERE id = receiver_id
   └─ Cancels other pending invites for both users

4. Returns success
   └─ Client refreshes dashboard
   └─ Shows partner info
```

---

## Key Design Patterns

### 1. **Separation of Concerns**
- **Client**: UI, user interaction, client-side validation
- **Server**: Business logic, data validation, database operations
- **Database**: Data storage, relationships, constraints

### 2. **Stateless Authentication**
- JWT tokens in headers (not cookies)
- Server doesn't store sessions
- Token verified on each request

### 3. **Type Safety**
- TypeScript throughout
- Zod schemas shared between client/server
- Type inference from schemas

### 4. **Error Handling**
- Consistent error responses
- Client-side error boundaries
- Server-side error middleware

### 5. **Middleware Pattern**
- Request logging middleware
- Authentication middleware
- Error handling middleware

---

## File Structure Explained

```
penn-two-mans-1/
├── client/                    # Frontend React application
│   ├── index.html            # Entry HTML file
│   ├── public/               # Static assets
│   └── src/
│       ├── main.tsx          # React entry point
│       ├── App.tsx           # Root component with routing
│       ├── components/       # Reusable UI components
│       │   ├── Layout.tsx   # Main layout wrapper
│       │   ├── ProtectedRoute.tsx  # Auth guard
│       │   └── ui/          # shadcn/ui components
│       ├── contexts/         # React contexts
│       │   └── AuthContext.tsx  # Auth state management
│       ├── hooks/           # Custom React hooks
│       ├── lib/             # Utilities
│       │   ├── supabase.ts  # Supabase client
│       │   ├── queryClient.ts  # React Query setup
│       │   └── utils.ts     # Helper functions
│       └── pages/           # Page components
│           ├── Landing.tsx
│           ├── Auth.tsx
│           ├── Survey.tsx
│           ├── Dashboard.tsx
│           └── ...
│
├── server/                   # Backend Express application
│   ├── index.ts             # Server entry point
│   ├── routes.ts            # API route handlers
│   ├── supabase.ts          # Supabase clients (regular + admin)
│   ├── db.ts                # Database setup (Drizzle)
│   ├── vite.ts              # Vite dev server integration
│   └── static.ts            # Static file serving (production)
│
├── shared/                   # Shared code between client/server
│   └── schema.ts            # Zod schemas and Drizzle types
│
├── .env                      # Environment variables (not in git)
├── package.json             # Dependencies and scripts
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── drizzle.config.ts        # Drizzle ORM configuration
```

---

## Summary

This application uses a **modern full-stack architecture** with:

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

