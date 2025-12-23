import "dotenv/config";
import { supabaseAdmin } from "../server/supabase";
import { getCurrentWeekStart } from "../server/matching";

async function checkMatches() {
  console.log("=".repeat(60));
  console.log("🔍 CHECKING MATCHES FOR CURRENT WEEK");
  console.log("=".repeat(60));

  const weekStart = getCurrentWeekStart();
  console.log(`\n📅 Week start: ${weekStart.toISOString()}`);

  // Get all matches for this week
  const { data: matches, error } = await supabaseAdmin
    .from('weekly_matches')
    .select(`
      *,
      user1:profiles!weekly_matches_user1_id_fkey(id, email, full_name, gender, graduation_year, major),
      user2:profiles!weekly_matches_user2_id_fkey(id, email, full_name, gender, graduation_year, major),
      user3:profiles!weekly_matches_user3_id_fkey(id, email, full_name, gender, graduation_year, major),
      user4:profiles!weekly_matches_user4_id_fkey(id, email, full_name, gender, graduation_year, major)
    `)
    .eq('match_week', weekStart.toISOString())
    .order('compatibility_score', { ascending: false });

  if (error) {
    console.error("❌ Error fetching matches:", error);
    process.exit(1);
  }

  if (!matches || matches.length === 0) {
    console.log("\n⚠️  No matches found for this week");
    console.log("\nTo create matches, run:");
    console.log("  curl -X POST http://localhost:5001/api/match/run");
    process.exit(0);
  }

  console.log(`\n✅ Found ${matches.length} matches for this week\n`);

  matches.forEach((match, idx) => {
    console.log(`${"=".repeat(60)}`);
    console.log(`Match ${idx + 1} (ID: ${match.id})`);
    console.log(`${"=".repeat(60)}`);
    console.log(`📊 Compatibility Score: ${match.compatibility_score}%`);
    console.log(`\n👨 Men's Duo:`);
    console.log(`   • ${match.user1.full_name || match.user1.email} (${match.user1.gender}, ${match.user1.graduation_year}, ${match.user1.major})`);
    console.log(`   • ${match.user2.full_name || match.user2.email} (${match.user2.gender}, ${match.user2.graduation_year}, ${match.user2.major})`);
    console.log(`\n👩 Women's Duo:`);
    console.log(`   • ${match.user3.full_name || match.user3.email} (${match.user3.gender}, ${match.user3.graduation_year}, ${match.user3.major})`);
    console.log(`   • ${match.user4.full_name || match.user4.email} (${match.user4.gender}, ${match.user4.graduation_year}, ${match.user4.major})`);
    
    if (match.match_reasons && match.match_reasons.length > 0) {
      console.log(`\n💡 Match Reasons:`);
      match.match_reasons.forEach((reason: string) => {
        console.log(`   • ${reason}`);
      });
    }
    console.log(`\n📅 Created: ${new Date(match.created_at).toLocaleString()}`);
    console.log();
  });

  console.log("=".repeat(60));
  console.log(`✅ Total: ${matches.length} matches created`);
  console.log("=".repeat(60));
}

checkMatches()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n💥 Error:", error);
    process.exit(1);
  });

