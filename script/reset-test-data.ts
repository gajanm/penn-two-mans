import "dotenv/config";
import { supabaseAdmin } from "../server/supabase";

/**
 * Reset test data - deletes all test users and their data
 * Test users are identified by email patterns: test.men*@penn.edu and test.women*@penn.edu
 */

async function resetTestData() {
  console.log("=".repeat(60));
  console.log("🗑️  RESETTING TEST DATA");
  console.log("=".repeat(60));

  // Find all test users
  console.log("\n🔍 Finding test users...");
  const { data: testProfiles, error: findError } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .or('email.ilike.test.men%@penn.edu,email.ilike.test.women%@penn.edu');

  if (findError) {
    console.error("❌ Error finding test users:", findError);
    return;
  }

  if (!testProfiles || testProfiles.length === 0) {
    console.log("✅ No test users found to delete");
    return;
  }

  console.log(`📋 Found ${testProfiles.length} test users to delete`);

  const userIds = testProfiles.map(p => p.id);

  // Delete in order: matches, invites, survey responses, profiles, auth users
  console.log("\n🗑️  Deleting test data...");

  // 1. Delete weekly matches involving test users
  console.log("   1. Deleting weekly matches...");
  const { error: matchesError } = await supabaseAdmin
    .from('weekly_matches')
    .delete()
    .or(`user1_id.in.(${userIds.join(',')}),user2_id.in.(${userIds.join(',')}),user3_id.in.(${userIds.join(',')}),user4_id.in.(${userIds.join(',')})`);

  if (matchesError) {
    console.error("   ⚠️  Error deleting matches:", matchesError.message);
  } else {
    console.log("   ✅ Deleted matches");
  }

  // 2. Delete partner invites
  console.log("   2. Deleting partner invites...");
  const { error: invitesError } = await supabaseAdmin
    .from('partner_invites')
    .delete()
    .or(`sender_id.in.(${userIds.join(',')}),receiver_id.in.(${userIds.join(',')})`);

  if (invitesError) {
    console.error("   ⚠️  Error deleting invites:", invitesError.message);
  } else {
    console.log("   ✅ Deleted invites");
  }

  // 3. Delete survey responses
  console.log("   3. Deleting survey responses...");
  const { error: surveyError } = await supabaseAdmin
    .from('survey_responses')
    .delete()
    .in('user_id', userIds);

  if (surveyError) {
    console.error("   ⚠️  Error deleting survey responses:", surveyError.message);
  } else {
    console.log("   ✅ Deleted survey responses");
  }

  // 4. Delete profiles (this will cascade to partner_id references)
  console.log("   4. Deleting profiles...");
  const { error: profilesError } = await supabaseAdmin
    .from('profiles')
    .delete()
    .in('id', userIds);

  if (profilesError) {
    console.error("   ⚠️  Error deleting profiles:", profilesError.message);
  } else {
    console.log("   ✅ Deleted profiles");
  }

  // 5. Delete auth users
  console.log("   5. Deleting auth users...");
  let deletedAuthUsers = 0;
  for (const userId of userIds) {
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (!authError) {
      deletedAuthUsers++;
    }
  }

  console.log(`   ✅ Deleted ${deletedAuthUsers} auth users`);

  console.log("\n" + "=".repeat(60));
  console.log(`✅ Successfully reset ${testProfiles.length} test users`);
  console.log("=".repeat(60));
}

resetTestData()
  .then(() => {
    console.log("\n✅ Reset complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Error resetting test data:", error);
    process.exit(1);
  });

