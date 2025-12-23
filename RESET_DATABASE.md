# How to Reset Your Database

This guide shows you how to delete all users and reset your database to a clean state.

## ⚠️ WARNING

**This will permanently delete ALL data including:**
- All user accounts
- All profiles
- All survey responses
- All partner invites
- All weekly matches

**This action cannot be undone!**

---

## Method 1: Using SQL Script (Recommended)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### Step 2: Run the Reset Script

1. Open the file `reset-database.sql` in this project
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **"Run"** (or press `Cmd+Enter` / `Ctrl+Enter`)

### Step 3: Verify Reset

After running, you should see all tables have 0 rows. The script includes verification queries at the bottom.

---

## Method 2: Using Supabase Dashboard (Manual)

### Delete Data from Tables

1. Go to **Table Editor** in Supabase Dashboard
2. For each table, click on it and delete all rows:
   - `weekly_matches` → Select all → Delete
   - `partner_invites` → Select all → Delete
   - `survey_responses` → Select all → Delete
   - `profiles` → Select all → Delete

### Delete Auth Users

1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Select all users (checkbox at top)
3. Click **"Delete selected users"**
4. Confirm deletion

---

## Method 3: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Connect to your project
supabase db reset

# Or run the SQL script directly
supabase db execute --file reset-database.sql
```

---

## What Gets Deleted

### Custom Tables (in order):
1. ✅ `weekly_matches` - All weekly match records
2. ✅ `partner_invites` - All partner invitations
3. ✅ `survey_responses` - All survey answers
4. ✅ `profiles` - All user profiles

### Supabase Auth:
5. ✅ `auth.users` - All authenticated users (cascades to remove auth sessions)

---

## After Reset

Once reset, you can:

1. **Create new test users** via the signup flow
2. **Fill out surveys** to populate data
3. **Test the matching algorithm** with fresh data

---

## Troubleshooting

### Error: "violates foreign key constraint"

If you get foreign key errors, make sure to delete tables in this order:
1. `weekly_matches`
2. `partner_invites`
3. `survey_responses`
4. `profiles`
5. `auth.users`

### Error: "permission denied"

Make sure you're using the **SQL Editor** (which runs with admin privileges), not the Table Editor.

### Tables still have data

Check if there are any RLS policies blocking deletion. The SQL script uses admin privileges, so it should bypass RLS.

---

## Quick Reset Command (Copy-Paste)

```sql
-- Quick reset (copy this into Supabase SQL Editor)
DELETE FROM weekly_matches;
DELETE FROM partner_invites;
DELETE FROM survey_responses;
DELETE FROM profiles;
DELETE FROM auth.users;
```

---

## Safety Tips

1. **Backup first**: Export your data before resetting if you might need it
2. **Use staging**: Test resets on a staging/development database first
3. **Double-check**: Verify you're on the right Supabase project before running

---

## Need Help?

If you encounter issues:
1. Check Supabase Dashboard → Logs for error messages
2. Verify your database connection
3. Ensure you have admin access to the project

