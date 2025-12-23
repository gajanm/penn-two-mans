import "dotenv/config";
import { supabaseAdmin } from "../server/supabase";
import { getCurrentWeekStart } from "../server/matching";

interface Duo {
  user1: any;
  user2: any;
  survey1: any;
  survey2: any;
}

async function analyzeFiltering() {
  console.log("=".repeat(60));
  console.log("🔍 DETAILED FILTERING ANALYSIS");
  console.log("=".repeat(60));

  // Get all profiles with partners
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .not('partner_id', 'is', null)
    .eq('survey_completed', true);

  if (error || !profiles) {
    console.error("❌ Error fetching profiles:", error);
    return;
  }

  console.log(`\n📋 Found ${profiles.length} profiles with partners`);

  // Group into duos
  const duos: Duo[] = [];
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

  console.log(`✅ Created ${duos.length} duos\n`);

  // Separate by gender
  const mensDuos: Duo[] = [];
  const womensDuos: Duo[] = [];

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

  console.log(`👨 Men's duos: ${mensDuos.length}`);
  console.log(`👩 Women's duos: ${womensDuos.length}`);
  console.log(`\n🔢 Total possible pairs: ${mensDuos.length * womensDuos.length}\n`);

  // Analyze filtering
  let totalPairs = 0;
  let passedGraduationYear = 0;
  let passedReligion = 0;
  let passedRace = 0;
  let passedAllFilters = 0;
  let graduationYearBlocked = 0;
  let religionBlocked = 0;
  let raceBlocked = 0;

  const blockingReasons: Array<{
    menDuo: string;
    womenDuo: string;
    reason: string;
    details: string;
  }> = [];

  // Helper functions (simplified versions)
  function parseYearWindow(preference: string | undefined): number {
    if (!preference) return Infinity;
    switch (preference) {
      case "Only people in my year": return 0;
      case "People within 1 year of me": return 1;
      case "People within 2 years of me": return 2;
      case "Anyone at Penn — age is just a number": return Infinity;
      default: return Infinity;
    }
  }

  function getDuoYearWindow(duo: Duo): number {
    const window1 = parseYearWindow(duo.survey1?.q2_who_to_meet);
    const window2 = parseYearWindow(duo.survey2?.q2_who_to_meet);
    return Math.min(window1, window2);
  }

  function checkGraduationYearFeasible(personA: any, personB: any, yearWindow: number): boolean {
    if (yearWindow === Infinity) return true;
    if (!personA.graduation_year || !personB.graduation_year) return true;
    
    const yearA = parseInt(personA.graduation_year, 10);
    const yearB = parseInt(personB.graduation_year, 10);
    if (isNaN(yearA) || isNaN(yearB)) return true;
    
    return Math.abs(yearA - yearB) <= yearWindow;
  }

  function checkReligionFeasible(surveyA: any, surveyB: any): boolean {
    if (!surveyA || !surveyB) return true;
    
    const religionA = surveyA.q_religious_affiliation || [];
    const religionB = surveyB.q_religious_affiliation || [];
    const preferredA = surveyA.q_preferred_religious_affiliation || [];
    const preferredB = surveyB.q_preferred_religious_affiliation || [];
    
    const aOpenToAll = preferredA.includes("No preference");
    const bOpenToAll = preferredB.includes("No preference");
    if (aOpenToAll && bOpenToAll) return true;
    
    const aReligionInBPreferred = religionA.some((r: string) => preferredB.includes(r));
    const bReligionInAPreferred = religionB.some((r: string) => preferredA.includes(r));
    const hasCommonReligion = religionA.some((r: string) => religionB.includes(r));
    
    return aOpenToAll || bOpenToAll || aReligionInBPreferred || bReligionInAPreferred || hasCommonReligion;
  }

  function checkRaceFeasible(surveyA: any, surveyB: any): boolean {
    if (!surveyA || !surveyB) return true;
    
    const raceA = surveyA.q_race_ethnicity || [];
    const raceB = surveyB.q_race_ethnicity || [];
    const preferredA = surveyA.q_preferred_race_ethnicity || [];
    const preferredB = surveyB.q_preferred_race_ethnicity || [];
    
    const aOpenToAll = preferredA.includes("No preference");
    const bOpenToAll = preferredB.includes("No preference");
    if (aOpenToAll && bOpenToAll) return true;
    
    const aRaceInBPreferred = raceA.some((r: string) => preferredB.includes(r));
    const bRaceInAPreferred = raceB.some((r: string) => preferredA.includes(r));
    const hasCommonRace = raceA.some((r: string) => raceB.includes(r));
    
    return aOpenToAll || bOpenToAll || aRaceInBPreferred || bRaceInAPreferred || hasCommonRace;
  }

  function isPersonToPersonFeasible(personA: any, personB: any, surveyA: any, surveyB: any, yearWindow: number): boolean {
    if (!checkGraduationYearFeasible(personA, personB, yearWindow)) return false;
    if (!checkReligionFeasible(surveyA, surveyB)) return false;
    if (!checkRaceFeasible(surveyA, surveyB)) return false;
    return true;
  }

  function isDuoToDuoValid(menDuo: Duo, womenDuo: Duo): { valid: boolean; reason?: string; details?: string } {
    const menYearWindow = getDuoYearWindow(menDuo);
    const womenYearWindow = getDuoYearWindow(womenDuo);
    const yearWindow = Math.min(menYearWindow, womenYearWindow);

    // Check each man has at least one feasible woman
    const m1Feasible = 
      isPersonToPersonFeasible(menDuo.user1, womenDuo.user1, menDuo.survey1, womenDuo.survey1, yearWindow) ||
      isPersonToPersonFeasible(menDuo.user1, womenDuo.user2, menDuo.survey1, womenDuo.survey2, yearWindow);
    
    const m2Feasible = 
      isPersonToPersonFeasible(menDuo.user2, womenDuo.user1, menDuo.survey2, womenDuo.survey1, yearWindow) ||
      isPersonToPersonFeasible(menDuo.user2, womenDuo.user2, menDuo.survey2, womenDuo.survey2, yearWindow);

    // Check each woman has at least one feasible man
    const w1Feasible = 
      isPersonToPersonFeasible(menDuo.user1, womenDuo.user1, menDuo.survey1, womenDuo.survey1, yearWindow) ||
      isPersonToPersonFeasible(menDuo.user2, womenDuo.user1, menDuo.survey2, womenDuo.survey1, yearWindow);
    
    const w2Feasible = 
      isPersonToPersonFeasible(menDuo.user1, womenDuo.user2, menDuo.survey1, womenDuo.survey2, yearWindow) ||
      isPersonToPersonFeasible(menDuo.user2, womenDuo.user2, menDuo.survey2, womenDuo.survey2, yearWindow);

    if (!m1Feasible) {
      return { 
        valid: false, 
        reason: "Graduation Year / Religion / Race",
        details: `${menDuo.user1.full_name || menDuo.user1.email} has no feasible match in women's duo`
      };
    }
    if (!m2Feasible) {
      return { 
        valid: false, 
        reason: "Graduation Year / Religion / Race",
        details: `${menDuo.user2.full_name || menDuo.user2.email} has no feasible match in women's duo`
      };
    }
    if (!w1Feasible) {
      return { 
        valid: false, 
        reason: "Graduation Year / Religion / Race",
        details: `${womenDuo.user1.full_name || womenDuo.user1.email} has no feasible match in men's duo`
      };
    }
    if (!w2Feasible) {
      return { 
        valid: false, 
        reason: "Graduation Year / Religion / Race",
        details: `${womenDuo.user2.full_name || womenDuo.user2.email} has no feasible match in men's duo`
      };
    }

    return { valid: true };
  }

  // Analyze all pairs
  console.log("🔍 Analyzing all pairs...\n");

  for (const menDuo of mensDuos) {
    for (const womenDuo of womensDuos) {
      totalPairs++;
      
      const menYearWindow = getDuoYearWindow(menDuo);
      const womenYearWindow = getDuoYearWindow(womenDuo);
      const yearWindow = Math.min(menYearWindow, womenYearWindow);

      // Check graduation year
      let gradYearPass = true;
      const checks = [
        { p1: menDuo.user1, p2: womenDuo.user1, s1: menDuo.survey1, s2: womenDuo.survey1 },
        { p1: menDuo.user1, p2: womenDuo.user2, s1: menDuo.survey1, s2: womenDuo.survey2 },
        { p1: menDuo.user2, p2: womenDuo.user1, s1: menDuo.survey2, s2: womenDuo.survey1 },
        { p1: menDuo.user2, p2: womenDuo.user2, s1: menDuo.survey2, s2: womenDuo.survey2 },
      ];

      for (const check of checks) {
        if (!checkGraduationYearFeasible(check.p1, check.p2, yearWindow)) {
          gradYearPass = false;
          break;
        }
      }

      if (gradYearPass) {
        passedGraduationYear++;
      } else {
        graduationYearBlocked++;
        continue;
      }

      // Check religion
      let religionPass = true;
      for (const check of checks) {
        if (!checkReligionFeasible(check.s1, check.s2)) {
          religionPass = false;
          break;
        }
      }

      if (religionPass) {
        passedReligion++;
      } else {
        religionBlocked++;
        continue;
      }

      // Check race
      let racePass = true;
      for (const check of checks) {
        if (!checkRaceFeasible(check.s1, check.s2)) {
          racePass = false;
          break;
        }
      }

      if (racePass) {
        passedRace++;
      } else {
        raceBlocked++;
        continue;
      }

      // Check duo-to-duo validity
      const validity = isDuoToDuoValid(menDuo, womenDuo);
      if (validity.valid) {
        passedAllFilters++;
      } else {
        blockingReasons.push({
          menDuo: `${menDuo.user1.full_name || menDuo.user1.email} & ${menDuo.user2.full_name || menDuo.user2.email}`,
          womenDuo: `${womenDuo.user1.full_name || womenDuo.user1.email} & ${womenDuo.user2.full_name || womenDuo.user2.email}`,
          reason: validity.reason || "Unknown",
          details: validity.details || ""
        });
      }
    }
  }

  // Print results
  console.log("=".repeat(60));
  console.log("📊 FILTERING RESULTS");
  console.log("=".repeat(60));
  console.log(`\nTotal pairs analyzed: ${totalPairs}`);
  console.log(`\n✅ Passed graduation year filter: ${passedGraduationYear} (${((passedGraduationYear/totalPairs)*100).toFixed(1)}%)`);
  console.log(`   ❌ Blocked by graduation year: ${graduationYearBlocked}`);
  console.log(`\n✅ Passed religion filter: ${passedReligion} (${((passedReligion/totalPairs)*100).toFixed(1)}%)`);
  console.log(`   ❌ Blocked by religion: ${religionBlocked}`);
  console.log(`\n✅ Passed race filter: ${passedRace} (${((passedRace/totalPairs)*100).toFixed(1)}%)`);
  console.log(`   ❌ Blocked by race: ${raceBlocked}`);
  console.log(`\n✅ Passed ALL filters: ${passedAllFilters} (${((passedAllFilters/totalPairs)*100).toFixed(1)}%)`);
  console.log(`   ❌ Blocked by duo-to-duo validity: ${totalPairs - passedAllFilters - graduationYearBlocked - religionBlocked - raceBlocked}`);

  if (blockingReasons.length > 0 && blockingReasons.length <= 20) {
    console.log("\n" + "=".repeat(60));
    console.log("🚫 SAMPLE BLOCKING REASONS");
    console.log("=".repeat(60));
    blockingReasons.slice(0, 10).forEach((reason, idx) => {
      console.log(`\n${idx + 1}. Men's Duo: ${reason.menDuo}`);
      console.log(`   Women's Duo: ${reason.womenDuo}`);
      console.log(`   Reason: ${reason.reason}`);
      console.log(`   Details: ${reason.details}`);
    });
  }

  console.log("\n" + "=".repeat(60));
  console.log("💡 RECOMMENDATIONS");
  console.log("=".repeat(60));
  
  if (graduationYearBlocked > totalPairs * 0.3) {
    console.log("\n⚠️  Many pairs blocked by graduation year restrictions");
    console.log("   Consider: Test data may have restrictive 'q2_who_to_meet' preferences");
  }
  
  if (religionBlocked > totalPairs * 0.3) {
    console.log("\n⚠️  Many pairs blocked by religion preferences");
    console.log("   Consider: Test data may have specific religion preferences without 'No preference'");
  }
  
  if (raceBlocked > totalPairs * 0.3) {
    console.log("\n⚠️  Many pairs blocked by race/ethnicity preferences");
    console.log("   Consider: Test data may have specific race preferences without 'No preference'");
  }

  if (passedAllFilters < mensDuos.length && passedAllFilters < womensDuos.length) {
    console.log(`\n✅ ${passedAllFilters} valid pairs found - should be able to create ${Math.min(passedAllFilters, mensDuos.length, womensDuos.length)} matches`);
  } else {
    console.log(`\n⚠️  Only ${passedAllFilters} valid pairs found - may limit number of matches`);
  }

  console.log("\n" + "=".repeat(60));
}

analyzeFiltering()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n💥 Error:", error);
    process.exit(1);
  });

