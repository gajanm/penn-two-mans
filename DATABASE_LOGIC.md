# Database Logic Locations

This document shows where all database operations happen in the codebase.

## Database Client Setup

### `server/supabase.ts` - Database Client Configuration
**Location:** `/server/supabase.ts`

This file sets up the Supabase clients used for all database operations:

```typescript
// Regular client - for token verification
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client - for all database operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
```

**Why two clients?**
- `supabase` - Used only for token verification (`auth.getUser()`)
- `supabaseAdmin` - Used for all database queries (bypasses Row Level Security)

---

## Main Database Operations

### `server/routes.ts` - API Routes with Database Operations

**Location:** `/server/routes.ts`

This file contains all the API endpoints and their database operations:

#### Authentication Operations

**POST `/api/auth/signup`** (lines 58-129)
```typescript
// Check if email exists
await supabaseAdmin.from('profiles').select('id').eq('email', email)

// Create auth user
await supabaseAdmin.auth.admin.createUser({ email, password })

// Create profile
await supabaseAdmin.from('profiles').insert({ id, email })

// Sign in to get session
await supabase.auth.signInWithPassword({ email, password })
```

**POST `/api/auth/login`** (lines 131-161)
```typescript
// Authenticate user
await supabase.auth.signInWithPassword({ email, password })
```

#### Profile Operations

**GET `/api/profile`** (lines 163-197)
```typescript
// Get user profile
await supabaseAdmin.from('profiles').select('*').eq('id', user.id)

// Create profile if doesn't exist
await supabaseAdmin.from('profiles').insert({ id, email })
```

**PUT `/api/profile`** (lines 199-225)
```typescript
// Update profile
await supabaseAdmin.from('profiles')
  .update(result.data)
  .eq('id', user.id)
  .select()
```

**GET `/api/profile/:id`** (lines 250-269)
```typescript
// Get another user's profile (for partner info)
await supabaseAdmin.from('profiles')
  .select('id, email, full_name, major, graduation_year, gender')
  .eq('id', profileId)
```

**GET `/api/partners`** (lines 227-247)
```typescript
// Get all users who completed survey (potential partners)
await supabaseAdmin.from('profiles')
  .select('id, email, full_name, major, graduation_year, gender')
  .eq('survey_completed', true)
  .neq('id', user.id)
```

#### Survey Operations

**POST `/api/survey`** (lines 271-333)
```typescript
// Update profile with survey_completed flag
await supabaseAdmin.from('profiles')
  .update(profileResult.data)
  .eq('id', user.id)

// Check if survey exists
await supabaseAdmin.from('survey_responses')
  .select('id')
  .eq('user_id', user.id)

// Update existing survey
await supabaseAdmin.from('survey_responses')
  .update({ answers, updated_at })
  .eq('user_id', user.id)

// Insert new survey
await supabaseAdmin.from('survey_responses')
  .insert({ user_id: user.id, answers })
```

**GET `/api/survey`** (lines 335-353)
```typescript
// Get user's survey responses
await supabaseAdmin.from('survey_responses')
  .select('*')
  .eq('user_id', user.id)
  .single()
```

#### Partner Invite Operations

**POST `/api/partner-invites`** (lines 356-412)
```typescript
// Check if user has partner
await supabaseAdmin.from('profiles')
  .select('partner_id')
  .eq('id', user.id)

// Check for existing invite
await supabaseAdmin.from('partner_invites')
  .select('id')
  .eq('status', 'pending')
  .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiver_id})...`)

// Create invite
await supabaseAdmin.from('partner_invites')
  .insert({ sender_id, receiver_id, status: 'pending' })
```

**GET `/api/partner-invites`** (lines 414-448)
```typescript
// Get sent invites with receiver info
await supabaseAdmin.from('partner_invites')
  .select(`id, status, created_at, responded_at,
    receiver:profiles!partner_invites_receiver_id_fkey(...)`)
  .eq('sender_id', user.id)

// Get received invites with sender info
await supabaseAdmin.from('partner_invites')
  .select(`id, status, created_at, responded_at,
    sender:profiles!partner_invites_sender_id_fkey(...)`)
  .eq('receiver_id', user.id)
```

**POST `/api/partner-invites/:id/accept`** (lines 450-515)
```typescript
// Get invite
await supabaseAdmin.from('partner_invites').select('*').eq('id', inviteId)

// Check if users have partners
await supabaseAdmin.from('profiles')
  .select('id, partner_id')
  .in('id', [sender_id, receiver_id])

// Update invite status
await supabaseAdmin.from('partner_invites')
  .update({ status: 'accepted', responded_at })
  .eq('id', inviteId)

// Set partner_id for sender
await supabaseAdmin.from('profiles')
  .update({ partner_id: receiver_id })
  .eq('id', sender_id)

// Set partner_id for receiver
await supabaseAdmin.from('profiles')
  .update({ partner_id: sender_id })
  .eq('id', receiver_id)

// Cancel other pending invites
await supabaseAdmin.from('partner_invites')
  .update({ status: 'cancelled', responded_at })
  .eq('status', 'pending')
  .or(`sender_id.eq.${sender_id},sender_id.eq.${receiver_id}...`)
```

**POST `/api/partner-invites/:id/reject`** (lines 517-550)
```typescript
// Get invite
await supabaseAdmin.from('partner_invites').select('*').eq('id', inviteId)

// Update status to rejected
await supabaseAdmin.from('partner_invites')
  .update({ status: 'rejected', responded_at })
  .eq('id', inviteId)
```

**POST `/api/partner-invites/:id/cancel`** (lines 552-585)
```typescript
// Get invite
await supabaseAdmin.from('partner_invites').select('*').eq('id', inviteId)

// Update status to cancelled
await supabaseAdmin.from('partner_invites')
  .update({ status: 'cancelled', responded_at })
  .eq('id', inviteId)
```

**POST `/api/partner/unpair`** (lines 587-641)
```typescript
// Get user's profile
await supabaseAdmin.from('profiles')
  .select('partner_id')
  .eq('id', user.id)

// Verify partner's profile
await supabaseAdmin.from('profiles')
  .select('partner_id')
  .eq('id', partnerId)

// Remove partner_id from both users
await supabaseAdmin.from('profiles')
  .update({ partner_id: null })
  .in('id', [user.id, partnerId])
```

---

## Matching System Database Operations

### `server/matching.ts` - Matching Algorithm Database Logic

**Location:** `/server/matching.ts`

#### Get Active Duos (lines 218-250)
```typescript
// Get all profiles with partners who completed survey
await supabaseAdmin.from('profiles')
  .select('*')
  .not('partner_id', 'is', null)
  .eq('survey_completed', true)

// Get survey for user 1
await supabaseAdmin.from('survey_responses')
  .select('answers')
  .eq('user_id', profile.id)
  .single()

// Get survey for user 2
await supabaseAdmin.from('survey_responses')
  .select('answers')
  .eq('user_id', partner.id)
  .single()
```

#### Get Previous Matches (lines 275-290)
```typescript
// Get all previous matches before this week
await supabaseAdmin.from('weekly_matches')
  .select('user1_id, user2_id, user3_id, user4_id')
  .lt('match_week', weekStartDate.toISOString())
```

#### Save Matches (lines 399-401)
```typescript
// Insert matches for the week
await supabaseAdmin.from('weekly_matches')
  .insert(matchRecords)
```

### `server/matching-routes.ts` - Matching API Routes

**Location:** `/server/matching-routes.ts`

#### Get Current Match (lines 23-95)
```typescript
// Check if matches exist for this week
await supabaseAdmin.from('weekly_matches')
  .select('*')
  .eq('match_week', weekStart.toISOString())
  .limit(1)
  .single()

// Get user's match with profile info
await supabaseAdmin.from('weekly_matches')
  .select(`
    *,
    user1:profiles!weekly_matches_user1_id_fkey(...),
    user2:profiles!weekly_matches_user2_id_fkey(...),
    user3:profiles!weekly_matches_user3_id_fkey(...),
    user4:profiles!weekly_matches_user4_id_fkey(...)
  `)
  .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}...`)
  .eq('match_week', weekStart.toISOString())
```

#### Get Match History (lines 96-120)
```typescript
// Get all matches for user
await supabaseAdmin.from('weekly_matches')
  .select(`
    *,
    user1:profiles!weekly_matches_user1_id_fkey(...),
    user2:profiles!weekly_matches_user2_id_fkey(...),
    user3:profiles!weekly_matches_user3_id_fkey(...),
    user4:profiles!weekly_matches_user4_id_fkey(...)
  `)
  .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}...`)
  .order('match_week', { ascending: false })
  .limit(10)
```

#### Run Matching (lines 157-159)
```typescript
// Check if matches already exist for this week
await supabaseAdmin.from('weekly_matches')
  .select('id')
  .eq('match_week', weekStart.toISOString())
  .limit(1)
```

---

## Database Tables Used

### 1. `profiles` Table
**Operations:** SELECT, INSERT, UPDATE

**Fields:**
- `id` (UUID, Primary Key)
- `email` (Text)
- `full_name` (Text, nullable)
- `gender` (Text, nullable)
- `interested_in` (Text[], nullable)
- `graduation_year` (Text, nullable)
- `major` (Text, nullable)
- `height` (Number, nullable)
- `partner_height_min` (Number, nullable)
- `partner_height_max` (Number, nullable)
- `partner_id` (UUID, nullable, Foreign Key → profiles.id)
- `survey_completed` (Boolean)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Used in:**
- `routes.ts` - Profile CRUD, partner selection
- `matching.ts` - Finding active duos

### 2. `survey_responses` Table
**Operations:** SELECT, INSERT, UPDATE

**Fields:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → profiles.id)
- `answers` (JSONB) - Stores all survey question answers
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Used in:**
- `routes.ts` - Save/get survey responses
- `matching.ts` - Read survey answers for compatibility scoring

### 3. `partner_invites` Table
**Operations:** SELECT, INSERT, UPDATE

**Fields:**
- `id` (UUID, Primary Key)
- `sender_id` (UUID, Foreign Key → profiles.id)
- `receiver_id` (UUID, Foreign Key → profiles.id)
- `status` (Text) - 'pending', 'accepted', 'rejected', 'cancelled'
- `created_at` (Timestamp)
- `responded_at` (Timestamp, nullable)

**Used in:**
- `routes.ts` - Partner invitation system

### 4. `weekly_matches` Table
**Operations:** SELECT, INSERT

**Fields:**
- `id` (UUID, Primary Key)
- `user1_id` (UUID, Foreign Key → profiles.id)
- `user2_id` (UUID, Foreign Key → profiles.id)
- `user3_id` (UUID, Foreign Key → profiles.id)
- `user4_id` (UUID, Foreign Key → profiles.id)
- `compatibility_score` (Integer, 0-100)
- `match_reasons` (Text[])
- `match_week` (TimestamPTZ) - Tuesday start of week
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Used in:**
- `matching.ts` - Save matches
- `matching-routes.ts` - Get current/historical matches

### 5. Supabase Auth (Built-in)
**Operations:** CREATE_USER, SIGN_IN, GET_USER

**Used in:**
- `routes.ts` - User authentication

---

## Database Operation Patterns

### Pattern 1: Simple SELECT
```typescript
const { data, error } = await supabaseAdmin
  .from('table_name')
  .select('field1, field2')
  .eq('field', value)
  .single(); // or no single() for array
```

### Pattern 2: INSERT
```typescript
const { data, error } = await supabaseAdmin
  .from('table_name')
  .insert({ field1: value1, field2: value2 })
  .select(); // Returns inserted row
```

### Pattern 3: UPDATE
```typescript
const { data, error } = await supabaseAdmin
  .from('table_name')
  .update({ field: newValue })
  .eq('id', userId)
  .select(); // Returns updated row
```

### Pattern 4: JOIN (Foreign Key Relations)
```typescript
const { data } = await supabaseAdmin
  .from('table1')
  .select(`
    *,
    related:table2!foreign_key_name(field1, field2)
  `)
```

### Pattern 5: Complex Queries
```typescript
// Multiple conditions
.or(`condition1,condition2`)

// Array contains
.eq('array_field', value)

// Not null
.not('field', 'is', null)

// In array
.in('id', [id1, id2])

// Less than
.lt('date_field', date)
```

---

## Key Files Summary

| File | Purpose | Database Operations |
|------|---------|-------------------|
| `server/supabase.ts` | Client setup | None (just exports clients) |
| `server/routes.ts` | API endpoints | All CRUD operations for profiles, surveys, invites |
| `server/matching.ts` | Matching algorithm | Reads profiles, surveys; writes matches |
| `server/matching-routes.ts` | Match API routes | Reads matches, checks for existing matches |

---

## Important Notes

1. **All database operations use `supabaseAdmin`** - This bypasses Row Level Security (RLS) because the server needs full access.

2. **No direct SQL queries** - Everything uses Supabase's query builder API.

3. **Error handling** - All operations check for `error` and handle it appropriately.

4. **Type safety** - TypeScript provides type checking, but Supabase returns `any` types that need casting.

5. **JSONB storage** - Survey answers are stored as JSONB in `survey_responses.answers` for flexibility.

6. **Foreign keys** - Relationships are enforced at the database level (profiles → partner_invites, profiles → survey_responses, etc.)

