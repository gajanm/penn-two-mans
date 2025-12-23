import type { Express, Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "./supabase";
import {
  runMatchingAlgorithm,
  saveMatchesForWeek,
  getCurrentWeekStart
} from "./matching";

/**
 * API Routes for Matching System
 */

/**
 * Get current week's match for authenticated user
 */
async function getCurrentMatch(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    console.log(`\n📥 getCurrentMatch called for user: ${user.id} (${user.email})`);
    const weekStart = getCurrentWeekStart();
    console.log(`📅 Week start: ${weekStart.toISOString()}`);

    // Check if matches have been released for this week
    // Use maybeSingle() instead of single() to avoid errors when no rows exist
    console.log("🔍 Checking for existing matches...");
    let weekMatches = null;
    let weekError = null;
    
    try {
      const result = await supabaseAdmin
        .from('weekly_matches')
        .select('*')
        .eq('match_week', weekStart.toISOString())
        .limit(1)
        .maybeSingle();
      
      weekMatches = result.data;
      weekError = result.error;
    } catch (queryError) {
      console.error("💥 Exception during match query:", queryError);
      console.error("Exception type:", queryError instanceof Error ? queryError.constructor.name : typeof queryError);
      console.error("Exception message:", queryError instanceof Error ? queryError.message : String(queryError));
      console.error("Exception stack:", queryError instanceof Error ? queryError.stack : 'No stack trace');
      return res.status(500).json({ 
        message: "Database query error",
        error: queryError instanceof Error ? queryError.message : String(queryError)
      });
    }

    if (weekError) {
      console.error("❌ Error checking for existing matches:");
      console.error("  Error object:", weekError);
      console.error("  Error code:", weekError.code);
      console.error("  Error message:", weekError.message);
      console.error("  Error details:", JSON.stringify(weekError, null, 2));
      console.error("  Error hint:", (weekError as any).hint);
      
      // Check for common error types
      const errorMessage = weekError.message || String(weekError);
      const errorCode = weekError.code || "UNKNOWN";
      
      // If it's a "relation does not exist" error, the table might not be created yet
      if (errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorCode === '42P01') {
        console.error("⚠️  Table 'weekly_matches' does not exist. Please run the migration script:");
        console.error("   1. Go to Supabase Dashboard > SQL Editor");
        console.error("   2. Run the contents of database-migration-weekly-matches.sql");
        return res.status(500).json({ 
          message: "Database table 'weekly_matches' not found. Please run the migration script.",
          error: errorMessage,
          code: errorCode,
          hint: "Run database-migration-weekly-matches.sql in Supabase SQL Editor"
        });
      }
      
      // Permission errors
      if (errorMessage.includes('permission') || errorMessage.includes('access') || errorCode === '42501') {
        console.error("⚠️  Permission error accessing weekly_matches table");
        return res.status(500).json({ 
          message: "Database permission error. Please check table permissions.",
          error: errorMessage,
          code: errorCode
        });
      }
      
      return res.status(400).json({ 
        message: "Error checking matches",
        error: errorMessage,
        code: errorCode,
        details: JSON.stringify(weekError)
      });
    }
    
    console.log(`📊 Existing matches check result: ${weekMatches ? 'Found matches' : 'No matches found'}`);

    // If no matches exist, try to run matching algorithm automatically
    if (!weekMatches) {
      console.log("\n⚠️  No matches found for this week, attempting to generate matches...");
      console.log(`📅 Week start: ${weekStart.toISOString()}`);
      
      try {
        // Run matching algorithm
        console.log("🚀 Auto-running matching algorithm...");
        const matches = await runMatchingAlgorithm(weekStart);
        console.log(`📊 Algorithm returned ${matches.length} matches`);
        
        if (matches.length > 0) {
          // Save matches to database
          console.log("💾 Saving auto-generated matches...");
          await saveMatchesForWeek(matches, weekStart);
          console.log(`✅ Successfully generated and saved ${matches.length} matches for this week`);
          // Continue to fetch the match below
        } else {
          console.log("❌ No matches could be generated");
          console.log("   This could mean:");
          console.log("   - Not enough duos (need at least 2 duos = 4 people)");
          console.log("   - Not enough duos of both genders (need at least 1 men's duo AND 1 women's duo)");
          console.log("   - No valid pairs after filtering (graduation year, religion, race compatibility)");
          console.log("   - All pairs have been matched before");
          console.log("   - All compatibility scores below 60% threshold");
          return res.status(404).json({ 
            message: "No matches could be created. Check server logs for details.",
            details: "Possible reasons: not enough duos, filtering too strict, or all pairs already matched"
          });
        }
      } catch (matchError) {
        console.error("💥 Error generating matches:", matchError);
        console.error("Error stack:", matchError instanceof Error ? matchError.stack : 'No stack trace');
        return res.status(500).json({ 
          message: "Error generating matches",
          error: matchError instanceof Error ? matchError.message : String(matchError)
        });
      }
    } else {
      console.log(`✅ Matches already exist for this week (${weekStart.toISOString()})`);
    }

    // Re-fetch matches after potentially generating them
    // Find match that includes this user
    console.log(`🔍 Looking for match that includes user ${user.id}...`);
    const { data: userMatch, error: matchError } = await supabaseAdmin
      .from('weekly_matches')
      .select(`
        *,
        user1:profiles!weekly_matches_user1_id_fkey(id, email, full_name, major, graduation_year, gender),
        user2:profiles!weekly_matches_user2_id_fkey(id, email, full_name, major, graduation_year, gender),
        user3:profiles!weekly_matches_user3_id_fkey(id, email, full_name, major, graduation_year, gender),
        user4:profiles!weekly_matches_user4_id_fkey(id, email, full_name, major, graduation_year, gender)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id},user3_id.eq.${user.id},user4_id.eq.${user.id}`)
      .eq('match_week', weekStart.toISOString())
      .maybeSingle();

    if (matchError) {
      console.error("❌ Error fetching user match:", matchError);
      console.error("Error code:", matchError.code);
      console.error("Error message:", matchError.message);
      return res.status(400).json({ 
        message: "Error fetching your match",
        error: matchError.message,
        code: matchError.code
      });
    }

    if (!userMatch) {
      console.log(`⚠️  No match found for user ${user.id} this week`);
      return res.status(404).json({ 
        message: "No match found for you this week. Make sure you have a partner selected!"
      });
    }

    console.log(`✅ Found match for user ${user.id}:`, {
      matchId: userMatch.id,
      user1: userMatch.user1_id,
      user2: userMatch.user2_id,
      user3: userMatch.user3_id,
      user4: userMatch.user4_id
    });

    // Determine which duo the user belongs to and which is their match
    const userId = user.id;
    const isInDuo1 = userMatch.user1_id === userId || userMatch.user2_id === userId;
    
    const yourDuo = isInDuo1 
      ? [userMatch.user1, userMatch.user2]
      : [userMatch.user3, userMatch.user4];
    
    const matchedDuo = isInDuo1
      ? [userMatch.user3, userMatch.user4]
      : [userMatch.user1, userMatch.user2];

    res.json({
      match: {
        id: userMatch.id,
        compatibilityScore: userMatch.compatibility_score,
        reasons: userMatch.match_reasons,
        yourDuo,
        matchedDuo,
        matchWeek: userMatch.match_week
      }
    });
  } catch (error) {
    console.error("Get match error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Get match history for authenticated user
 */
async function getMatchHistory(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    const { data: matches, error } = await supabaseAdmin
      .from('weekly_matches')
      .select(`
        *,
        user1:profiles!weekly_matches_user1_id_fkey(id, email, full_name, major, graduation_year, gender),
        user2:profiles!weekly_matches_user2_id_fkey(id, email, full_name, major, graduation_year, gender),
        user3:profiles!weekly_matches_user3_id_fkey(id, email, full_name, major, graduation_year, gender),
        user4:profiles!weekly_matches_user4_id_fkey(id, email, full_name, major, graduation_year, gender)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id},user3_id.eq.${user.id},user4_id.eq.${user.id}`)
      .order('match_week', { ascending: false })
      .limit(10);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    // Format matches for response
    const formattedMatches = (matches || []).map(match => {
      const userId = user.id;
      const isInDuo1 = match.user1_id === userId || match.user2_id === userId;
      
      const yourDuo = isInDuo1 
        ? [match.user1, match.user2]
        : [match.user3, match.user4];
      
      const matchedDuo = isInDuo1
        ? [match.user3, match.user4]
        : [match.user1, match.user2];

      return {
        id: match.id,
        compatibilityScore: match.compatibility_score,
        reasons: match.match_reasons,
        yourDuo,
        matchedDuo,
        matchWeek: match.match_week
      };
    });

    res.json({ matches: formattedMatches });
  } catch (error) {
    console.error("Get match history error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Admin endpoint: Run matching algorithm for current week
 * Can be called manually at any time to generate matches
 * 
 * ⚠️ SECURITY WARNING: Currently unprotected - add admin auth before production!
 */
async function runMatching(req: Request, res: Response) {
  try {
    // TODO: Add admin authentication check here
    // For now, this is open - you should secure this endpoint!
    
    const weekStart = getCurrentWeekStart();
    const forceRegenerate = req.query.force === 'true' || req.body?.force === true;

    // Check if matches already exist for this week
    const { data: existingMatches } = await supabaseAdmin
      .from('weekly_matches')
      .select('id')
      .eq('match_week', weekStart.toISOString())
      .limit(1);

    if (existingMatches && existingMatches.length > 0 && !forceRegenerate) {
      return res.status(400).json({ 
        message: "Matches already exist for this week. Use ?force=true to regenerate.",
        weekStart: weekStart.toISOString()
      });
    }

    // If forcing regeneration, delete existing matches first
    if (existingMatches && existingMatches.length > 0 && forceRegenerate) {
      console.log("🗑️ Deleting existing matches for regeneration...");
      const { error: deleteError } = await supabaseAdmin
        .from('weekly_matches')
        .delete()
        .eq('match_week', weekStart.toISOString());
      
      if (deleteError) {
        console.error("Error deleting existing matches:", deleteError);
        return res.status(500).json({ message: "Failed to delete existing matches" });
      }
    }

    // Run matching algorithm
    const matches = await runMatchingAlgorithm(weekStart);

    if (matches.length === 0) {
      return res.status(200).json({ 
        message: "No matches could be created (not enough duos or all previously matched)",
        matchesCreated: 0
      });
    }

    // Save matches to database
    await saveMatchesForWeek(matches, weekStart);

    res.json({
      message: `Successfully created ${matches.length} matches for this week`,
      matchesCreated: matches.length,
      weekStart: weekStart.toISOString(),
      matches: matches.map(m => ({
        compatibilityScore: m.compatibilityScore,
        reasons: m.reasons,
        duo1: [m.duo1.user1.email, m.duo1.user2.email],
        duo2: [m.duo2.user1.email, m.duo2.user2.email]
      }))
    });
  } catch (error) {
    console.error("Run matching error:", error);
    res.status(500).json({ 
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Register matching routes
 * @param app Express app instance
 * @param authenticateToken Middleware function to authenticate requests
 */
export function registerMatchingRoutes(
  app: Express,
  authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  // Get current week's match (protected)
  app.get("/api/match/current", authenticateToken, getCurrentMatch);
  
  // Get match history (protected)
  app.get("/api/match/history", authenticateToken, getMatchHistory);
  
  // Run matching algorithm (should be protected/admin only)
  // ⚠️ Currently unprotected - add admin auth middleware here!
  app.post("/api/match/run", runMatching);
}

