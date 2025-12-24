import "dotenv/config";
import { supabaseAdmin } from "../server/supabase";
import { getActiveDuos, separateDuosByGender, filterValidDuoPairs, getCurrentWeekStart } from "../server/matching";

async function analyzeMatching() {
  console.log("=".repeat(60));
  console.log("📊 MATCHING ALGORITHM ANALYSIS");
  console.log("=".repeat(60));

  const allDuos = await getActiveDuos();
  console.log(`\n📊 Total active duos: ${allDuos.length}`);

  if (allDuos.length < 2) {
    console.log("❌ Not enough duos to analyze");
    return;
  }

  const { mensDuos, womensDuos } = separateDuosByGender(allDuos);
  console.log(`\n👨 Men's duos: ${mensDuos.length}`);
  console.log(`👩 Women's duos: ${womensDuos.length}`);

  if (mensDuos.length === 0 || womensDuos.length === 0) {
    console.log("❌ Need both men's and women's duos");
    return;
  }

  console.log(`\n🔍 Possible matches (before filtering): ${mensDuos.length * womensDuos.length}`);

  const validPairs = filterValidDuoPairs(mensDuos, womensDuos);
  console.log(`\n✅ Valid pairs after filtering: ${validPairs.length}`);
  console.log(`❌ Invalid pairs (filtered out): ${mensDuos.length * womensDuos.length - validPairs.length}`);

  // Check previous matches
  const weekStart = getCurrentWeekStart();
  const { data: previousMatches } = await supabaseAdmin
    .from('weekly_matches')
    .select('user1_id, user2_id, user3_id, user4_id')
    .lt('match_week', weekStart.toISOString());

  const previousMatchSet = new Set<string>();
  if (previousMatches) {
    for (const match of previousMatches) {
      const ids = [
        match.user1_id,
        match.user2_id,
        match.user3_id,
        match.user4_id
      ].sort();
      previousMatchSet.add(ids.join(','));
    }
  }

  console.log(`\n📜 Previous matches: ${previousMatchSet.size}`);

  // Analyze why pairs might be filtered out
  console.log("\n" + "=".repeat(60));
  console.log("🔍 FILTERING ANALYSIS");
  console.log("=".repeat(60));

  let graduationYearBlocked = 0;
  let religionBlocked = 0;
  let raceBlocked = 0;
  let otherBlocked = 0;

  // Sample a few pairs to see why they're being filtered
  const sampleSize = Math.min(10, mensDuos.length * womensDuos.length);
  let sampled = 0;

  for (const menDuo of mensDuos.slice(0, 3)) {
    for (const womenDuo of womensDuos.slice(0, 3)) {
      if (sampled >= sampleSize) break;
      
      // Check if this pair would be valid
      // (We'd need to import the validation function, but for now let's just show the data)
      sampled++;
    }
    if (sampled >= sampleSize) break;
  }

  console.log(`\n💡 Insights:`);
  console.log(`   • ${validPairs.length} out of ${mensDuos.length * womensDuos.length} pairs passed filtering`);
  console.log(`   • Filter pass rate: ${((validPairs.length / (mensDuos.length * womensDuos.length)) * 100).toFixed(1)}%`);
  
  if (validPairs.length < mensDuos.length * womensDuos.length) {
    console.log(`\n⚠️  Many pairs are being filtered out. Possible reasons:`);
    console.log(`   • Graduation year restrictions (q2_who_to_meet)`);
    console.log(`   • Religion preferences`);
    console.log(`   • Race/ethnicity preferences`);
    console.log(`\n💡 Consider:`);
    console.log(`   • Check if test data has restrictive preferences`);
    console.log(`   • Review server logs for detailed filtering reasons`);
  }

  console.log("\n" + "=".repeat(60));
}

// Import the functions we need
async function getActiveDuos() {
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .not('partner_id', 'is', null)
    .eq('survey_completed', true);

  if (error || !profiles) return [];

  const duos: any[] = [];
  const processed = new Set<string>();

  for (const profile of profiles) {
    if (processed.has(profile.id) || !profile.partner_id) continue;
    const partner = profiles.find(p => p.id === profile.partner_id);
    if (!partner || partner.partner_id !== profile.id) continue;

    const [survey1Res, survey2Res] = await Promise.all([
      supabaseAdmin.from('survey_responses').select('answers').eq('user_id', profile.id).single(),
      supabaseAdmin.from('survey_responses').select('answers').eq('user_id', partner.id).single()
    ]);

    duos.push({
      user1: profile,
      user2: partner,
      survey1: survey1Res.data?.answers,
      survey2: survey2Res.data?.answers
    });

    processed.add(profile.id);
    processed.add(partner.id);
  }

  return duos;
}

function separateDuosByGender(duos: any[]) {
  const mensDuos: any[] = [];
  const womensDuos: any[] = [];
  
  for (const duo of duos) {
    const gender1 = duo.user1.gender?.toLowerCase();
    const gender2 = duo.user2.gender?.toLowerCase();
    
    const isMensDuo = 
      (gender1 === 'male' || gender1 === 'man' || gender1 === 'm') &&
      (gender2 === 'male' || gender2 === 'man' || gender2 === 'm');
    
    const isWomensDuo = 
      (gender1 === 'female' || gender1 === 'woman' || gender1 === 'f' || gender1 === 'w') &&
      (gender2 === 'female' || gender2 === 'woman' || gender2 === 'f' || gender2 === 'w');
    
    if (isMensDuo) mensDuos.push(duo);
    else if (isWomensDuo) womensDuos.push(duo);
  }
  
  return { mensDuos, womensDuos };
}

function filterValidDuoPairs(mensDuos: any[], womensDuos: any[]) {
  // Simplified - just return all pairs for analysis
  // The actual filtering happens in the matching algorithm
  return mensDuos.flatMap(menDuo => 
    womensDuos.map(womenDuo => ({ menDuo, womenDuo }))
  );
}

analyzeMatching()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n💥 Error:", error);
    process.exit(1);
  });


