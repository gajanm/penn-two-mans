# Survey Response Storage Documentation

## Overview

Survey responses are split into two parts when saved:
1. **Profile Data** → Stored in `profiles` table (structured columns)
2. **Survey Answers** → Stored in `survey_responses` table as JSONB (flexible JSON)

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  Client: Survey.tsx                                     │
│  User fills out survey form                            │
│  Data collected in `answers` object                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ User clicks "Submit"
                   │
┌──────────────────▼──────────────────────────────────────┐
│  Client: saveSurveyToSupabase()                         │
│                                                          │
│  1. Split data:                                         │
│     - profileData = {                                   │
│         full_name, gender, interested_in,               │
│         graduation_year, major, height,                │
│         partner_height_min, partner_height_max          │
│       }                                                 │
│                                                          │
│     - surveyAnswers = {                                 │
│         ...all other answers                            │
│       } (everything except profile fields)            │
│                                                          │
│  2. POST /api/survey                                    │
│     { answers: surveyAnswers, profileData }             │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ HTTP Request
                   │
┌──────────────────▼──────────────────────────────────────┐
│  Server: POST /api/survey (routes.ts)                  │
│                                                          │
│  1. Validate profileData with Zod schema               │
│  2. Update profiles table:                              │
│     - Set profile fields                                │
│     - Set survey_completed = true                      │
│                                                          │
│  3. Upsert survey_responses table:                     │
│     - Check if survey exists for user                  │
│     - If exists: UPDATE answers JSONB                   │
│     - If not: INSERT new row with answers JSONB        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Database Operations
                   │
┌──────────────────▼──────────────────────────────────────┐
│  Supabase Database                                      │
│                                                          │
│  profiles table:                                        │
│  ┌────────────────────────────────────┐                │
│  │ id, email, full_name, gender,      │                │
│  │ interested_in, graduation_year,   │                │
│  │ major, height, partner_height_*,   │                │
│  │ survey_completed, partner_id       │                │
│  └────────────────────────────────────┘                │
│                                                          │
│  survey_responses table:                                │
│  ┌────────────────────────────────────┐                │
│  │ id, user_id, answers (JSONB),      │                │
│  │ created_at, updated_at             │                │
│  └────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

## What Goes Where

### Profile Data (Stored in `profiles` table)

These fields are extracted and stored as structured columns:

```typescript
{
  full_name: string,           // From answers.fullName
  gender: string,              // From answers.gender
  interested_in: string[],      // From answers.interestedIn (array)
  graduation_year: string,     // From answers.graduationYear
  major: string,               // From answers.major
  height: number,             // From answers.height (inches)
  partner_height_min: number,  // From answers.partnerHeightMin
  partner_height_max: number,  // From answers.partnerHeightMax
  survey_completed: true       // Set automatically
}
```

### Survey Answers (Stored in `survey_responses.answers` JSONB)

Everything else goes into the JSONB `answers` column. The structure is flexible and can include:

```typescript
{
  // Core Values
  coreValues?: string[],
  valuesImportance?: Record<string, number>,
  
  // Personality Traits
  personality?: {
    openness?: number,
    conscientiousness?: number,
    extraversion?: number,
    agreeableness?: number,
    neuroticism?: number
  },
  
  // Lifestyle
  lifestyle?: {
    activityLevel?: string,
    socialHabits?: string,
    interests?: string[],
    hobbies?: string[]
  },
  
  // Emotional Style
  emotionalStyle?: {
    communicationPreference?: string,
    conflictResolution?: string,
    emotionalExpression?: string
  },
  
  // Relationship
  relationshipGoals?: string[],
  loveLanguages?: string[],
  
  // Any other survey questions
  // ... (flexible structure)
}
```

## Example: Complete Survey Submission

### Client-Side Data Collection

```typescript
// User fills out survey, data collected in answers object
const answers = {
  // Profile fields (will be moved to profileData)
  fullName: "John Doe",
  gender: "male",
  interestedIn: ["female", "non-binary"],
  graduationYear: "2025",
  major: "Computer Science",
  height: 72, // inches
  partnerHeightMin: 60,
  partnerHeightMax: 70,
  
  // Survey fields (stays in surveyAnswers)
  coreValues: ["Family", "Career", "Adventure"],
  valuesImportance: {
    "Family": 9,
    "Career": 8,
    "Adventure": 7
  },
  personality: {
    openness: 75,
    conscientiousness: 80,
    extraversion: 65,
    agreeableness: 70,
    neuroticism: 30
  },
  lifestyle: {
    activityLevel: "moderate",
    socialHabits: "social",
    interests: ["Technology", "Music", "Travel"],
    hobbies: ["Gaming", "Reading"]
  },
  emotionalStyle: {
    communicationPreference: "direct",
    conflictResolution: "discuss",
    emotionalExpression: "open"
  },
  relationshipGoals: ["Long-term", "Marriage"],
  loveLanguages: ["Quality Time", "Physical Touch"]
};
```

### Data Split Before Sending

```typescript
// profileData (goes to profiles table)
const profileData = {
  full_name: "John Doe",
  gender: "male",
  interested_in: ["female", "non-binary"],
  graduation_year: "2025",
  major: "Computer Science",
  height: 72,
  partner_height_min: 60,
  partner_height_max: 70
};

// surveyAnswers (goes to survey_responses.answers JSONB)
const surveyAnswers = {
  coreValues: ["Family", "Career", "Adventure"],
  valuesImportance: {
    "Family": 9,
    "Career": 8,
    "Adventure": 7
  },
  personality: {
    openness: 75,
    conscientiousness: 80,
    extraversion: 65,
    agreeableness: 70,
    neuroticism: 30
  },
  lifestyle: {
    activityLevel: "moderate",
    socialHabits: "social",
    interests: ["Technology", "Music", "Travel"],
    hobbies: ["Gaming", "Reading"]
  },
  emotionalStyle: {
    communicationPreference: "direct",
    conflictResolution: "discuss",
    emotionalExpression: "open"
  },
  relationshipGoals: ["Long-term", "Marriage"],
  loveLanguages: ["Quality Time", "Physical Touch"]
};
```

### Database Storage

**`profiles` table:**
```sql
id: "uuid-123"
email: "john@upenn.edu"
full_name: "John Doe"
gender: "male"
interested_in: ["female", "non-binary"]
graduation_year: "2025"
major: "Computer Science"
height: 72
partner_height_min: 60
partner_height_max: 70
survey_completed: true
partner_id: null
created_at: "2024-01-15T10:00:00Z"
updated_at: "2024-01-15T10:00:00Z"
```

**`survey_responses` table:**
```sql
id: "uuid-456"
user_id: "uuid-123"
answers: {
  "coreValues": ["Family", "Career", "Adventure"],
  "valuesImportance": {
    "Family": 9,
    "Career": 8,
    "Adventure": 7
  },
  "personality": {
    "openness": 75,
    "conscientiousness": 80,
    "extraversion": 65,
    "agreeableness": 70,
    "neuroticism": 30
  },
  "lifestyle": {
    "activityLevel": "moderate",
    "socialHabits": "social",
    "interests": ["Technology", "Music", "Travel"],
    "hobbies": ["Gaming", "Reading"]
  },
  "emotionalStyle": {
    "communicationPreference": "direct",
    "conflictResolution": "discuss",
    "emotionalExpression": "open"
  },
  "relationshipGoals": ["Long-term", "Marriage"],
  "loveLanguages": ["Quality Time", "Physical Touch"]
}
created_at: "2024-01-15T10:00:00Z"
updated_at: "2024-01-15T10:00:00Z"
```

## Server-Side Processing

### POST `/api/survey` Endpoint

```typescript
app.post("/api/survey", authenticateToken, async (req, res) => {
  const user = req.user;
  const { answers, profileData } = req.body;

  // 1. Validate profileData
  const profileResult = profileUpdateSchema.safeParse({
    ...profileData,
    survey_completed: true
  });

  // 2. Update profiles table
  await supabaseAdmin
    .from('profiles')
    .update(profileResult.data)
    .eq('id', user.id);

  // 3. Check if survey exists
  const { data: existingSurvey } = await supabaseAdmin
    .from('survey_responses')
    .select('id')
    .eq('user_id', user.id)
    .single();

  // 4. Upsert survey_responses
  if (existingSurvey) {
    // Update existing
    await supabaseAdmin
      .from('survey_responses')
      .update({ 
        answers, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', user.id);
  } else {
    // Insert new
    await supabaseAdmin
      .from('survey_responses')
      .insert({ 
        user_id: user.id, 
        answers 
      });
  }
});
```

## Retrieving Survey Data

### GET `/api/survey` Endpoint

```typescript
app.get("/api/survey", authenticateToken, async (req, res) => {
  const user = req.user;

  const { data: survey } = await supabaseAdmin
    .from('survey_responses')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Returns:
  // {
  //   id: "uuid",
  //   user_id: "uuid",
  //   answers: { ... }, // Full JSONB object
  //   created_at: "...",
  //   updated_at: "..."
  // }
  
  res.json(survey || { answers: {} });
});
```

## Key Points

### Why Split the Data?

1. **Profile Data** → Structured columns for:
   - Fast queries (indexed)
   - Easy filtering/searching
   - Used in partner selection UI
   - Displayed in user profiles

2. **Survey Answers** → JSONB for:
   - Flexibility (can add new questions without schema changes)
   - Complex nested structures
   - Used primarily for matching algorithm
   - Can evolve over time

### Upsert Logic

The system uses **upsert** (update or insert):
- If user has never submitted survey → **INSERT** new row
- If user updates survey → **UPDATE** existing row
- This allows users to edit their survey responses

### Data Consistency

- `survey_completed` flag in `profiles` table indicates if user has completed survey
- Both tables must be updated together (atomic operation)
- If profile update fails, survey response is not saved
- If survey response fails, profile update is rolled back (in transaction)

## Usage in Matching Algorithm

The matching algorithm reads from `survey_responses.answers`:

```typescript
// In matching.ts
const { data: survey1Res } = await supabaseAdmin
  .from('survey_responses')
  .select('answers')
  .eq('user_id', profile.id)
  .single();

const survey1 = survey1Res.data?.answers as SurveyAnswers | null;

// Access nested data
const coreValues = survey1?.coreValues;
const personality = survey1?.personality;
const lifestyle = survey1?.lifestyle;
```

## Current Survey Structure

Based on the code, the survey includes these sections:

1. **About You** - Basic info (stored in profiles)
2. **The Basics** - Relationship basics
3. **Life Vision & Priorities** - Core values
4. **Your Personality** - Big Five traits
5. **Your Life** - Lifestyle, interests, hobbies
6. **How You Love** - Relationship goals, love languages
7. **Staying Connected** - Communication style
8. **The Non-Negotiables** - Dealbreakers

The exact structure of `answers` JSONB depends on what questions are in each section, but it's designed to be flexible and accommodate changes.


