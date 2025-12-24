# Matching System Documentation

## Overview

The matching system pairs duos (two users who have selected each other as partners) with other compatible duos for weekly double dates. Matches are released every Tuesday and stored in the database.

## Architecture

### Components

1. **`server/matching.ts`** - Core matching algorithm
2. **`server/matching-routes.ts`** - API endpoints for matches
3. **`weekly_matches` table** - Database table storing weekly matches

### Matching Algorithm

The algorithm calculates compatibility based on:

- **Core Values (40% weight)** - Shared values and priorities
- **Personality Traits (30% weight)** - Big Five personality compatibility
- **Lifestyle (20% weight)** - Activity level, interests, hobbies
- **Emotional Style (10% weight)** - Communication and conflict resolution

**Minimum Compatibility Threshold:** 60/100

**Features:**
- Avoids re-matching the same duos
- Greedy algorithm selects best matches first
- Requires both users in a duo to have completed surveys

## Database Setup

### 1. Run Migration

Execute `database-migration-weekly-matches.sql` in your Supabase SQL editor to create the `weekly_matches` table.

### 2. Table Structure

```sql
weekly_matches
├── id (UUID, Primary Key)
├── user1_id (UUID) - First user of first duo
├── user2_id (UUID) - Second user of first duo  
├── user3_id (UUID) - First user of second duo
├── user4_id (UUID) - Second user of second duo
├── compatibility_score (INTEGER, 0-100)
├── match_reasons (TEXT[]) - Array of match reasons
├── match_week (TIMESTAMPTZ) - Tuesday start of week
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

## API Endpoints

### GET `/api/match/current` (Protected)

Get the current week's match for the authenticated user.

**Response:**
```json
{
  "match": {
    "id": "uuid",
    "compatibilityScore": 85,
    "reasons": ["Shared core values: Family, Career", "Compatible personality traits"],
    "yourDuo": [
      { "id": "uuid", "email": "...", "full_name": "..." },
      { "id": "uuid", "email": "...", "full_name": "..." }
    ],
    "matchedDuo": [
      { "id": "uuid", "email": "...", "full_name": "..." },
      { "id": "uuid", "email": "...", "full_name": "..." }
    ],
    "matchWeek": "2024-01-16T00:00:00Z"
  }
}
```

**Status Codes:**
- `200` - Match found
- `404` - No match (not released yet or user doesn't have partner)

### GET `/api/match/history` (Protected)

Get match history for the authenticated user (last 10 matches).

**Response:**
```json
{
  "matches": [
    {
      "id": "uuid",
      "compatibilityScore": 85,
      "reasons": [...],
      "yourDuo": [...],
      "matchedDuo": [...],
      "matchWeek": "2024-01-16T00:00:00Z"
    }
  ]
}
```

### POST `/api/match/run` (Admin - Currently Unprotected!)

**⚠️ SECURITY WARNING:** This endpoint is currently unprotected. You should add admin authentication before deploying!

Run the matching algorithm for the current week. This should be called:
- Manually on Tuesday mornings
- Via a cron job/scheduled task
- Through an admin dashboard

**Response:**
```json
{
  "message": "Successfully created 5 matches for this week",
  "matchesCreated": 5,
  "weekStart": "2024-01-16T00:00:00Z",
  "matches": [
    {
      "compatibilityScore": 85,
      "reasons": [...],
      "duo1": ["user1@upenn.edu", "user2@upenn.edu"],
      "duo2": ["user3@upenn.edu", "user4@upenn.edu"]
    }
  ]
}
```

**Status Codes:**
- `200` - Matches created successfully
- `400` - Matches already exist for this week

## Weekly Matching Workflow

### Option 1: Manual Trigger (Recommended for Testing)

1. On Tuesday morning, call the API:
```bash
curl -X POST http://localhost:5001/api/match/run \
  -H "Content-Type: application/json"
```

2. Matches are immediately available via `/api/match/current`

### Option 2: Cron Job / Scheduled Task

Set up a cron job or scheduled task to run matching every Tuesday at a specific time (e.g., 9 AM):

**Example cron expression (every Tuesday at 9 AM):**
```
0 9 * * 2
```

**Example Node.js script:**
```javascript
// scripts/run-matching.js
import fetch from 'node-fetch';

async function runMatching() {
  const response = await fetch('http://localhost:5001/api/match/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  const result = await response.json();
  console.log('Matching result:', result);
}

runMatching().catch(console.error);
```

### Option 3: Admin Dashboard Button

Add a button in your admin/settings page that calls `/api/match/run` when clicked.

## Matching Requirements

For a user to be matched, they must:

1. ✅ Have completed the survey (`survey_completed = true`)
2. ✅ Have an accepted partner (`partner_id` is set)
3. ✅ Their partner must also have completed the survey
4. ✅ Their partner must have them as their `partner_id` (mutual partnership)

## How It Works

### Step 1: Identify Active Duos

The system finds all pairs of users who:
- Have selected each other as partners (mutual `partner_id`)
- Both have completed surveys

### Step 2: Calculate Compatibility

For each possible duo pair, calculate compatibility based on:
- Survey responses
- Profile data
- Previous match history (to avoid repeats)

### Step 3: Greedy Matching

1. Sort all possible matches by compatibility score (highest first)
2. Select best matches first
3. Skip duos that are already matched
4. Only create matches above the threshold (60/100)

### Step 4: Save Matches

Matches are saved to `weekly_matches` table with:
- The four user IDs
- Compatibility score
- Match reasons
- Week start date (Tuesday)

## Client Integration

### Update MatchReveal.tsx

Replace mock data with API call:

```typescript
const { data: matchData, isLoading } = useQuery({
  queryKey: ['/api/match/current'],
  queryFn: async () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const res = await fetch('/api/match/current', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('No match found');
    return res.json();
  }
});
```

### Update Dashboard.tsx

Show match status:
- If match exists: Show matched duo info
- If no match: Show "Matches released Tuesdays" message
- If not Tuesday: Show countdown to next Tuesday

## Security Considerations

### Current State

- ✅ `/api/match/current` - Protected (requires auth)
- ✅ `/api/match/history` - Protected (requires auth)
- ⚠️ `/api/match/run` - **UNPROTECTED** (needs admin auth)

### Recommended Security

Add admin authentication to `/api/match/run`:

```typescript
// In matching-routes.ts
async function isAdmin(userId: string): Promise<boolean> {
  // Check if user is admin (e.g., from profiles table or separate admins table)
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();
  return data?.is_admin === true;
}

export async function runMatching(req: Request, res: Response) {
  const user = (req as any).user;
  
  if (!await isAdmin(user.id)) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  // ... rest of function
}
```

## Testing

### Test Matching Algorithm

1. Create test users with partners
2. Complete surveys for all users
3. Call `/api/match/run`
4. Verify matches created in database
5. Call `/api/match/current` for each user
6. Verify they see correct match

### Test Weekly Cycle

1. Create matches for Week 1
2. Verify users can see Week 1 matches
3. Create matches for Week 2 (next Tuesday)
4. Verify users see Week 2 matches
5. Verify Week 1 matches still accessible via history

## Troubleshooting

### "No matches could be created"

**Possible causes:**
- Not enough duos (need at least 2)
- All duos have been matched before
- Compatibility scores below threshold
- Users don't have partners selected

### "Matches already exist for this week"

- Matches were already created for current week
- Wait until next Tuesday or manually delete matches if testing

### "No match found for you this week"

- User doesn't have a partner selected
- User or partner hasn't completed survey
- Matching hasn't been run for this week yet

## Future Enhancements

1. **Automatic Matching** - Cron job integration
2. **Admin Dashboard** - UI for running matches
3. **Match Preferences** - Allow users to set matching preferences
4. **Re-matching Logic** - Allow re-matching after X weeks
5. **Match Notifications** - Email/push notifications when matches released
6. **Analytics** - Track match success rates, compatibility distributions


