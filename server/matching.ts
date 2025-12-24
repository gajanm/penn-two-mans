import { supabaseAdmin } from "./supabase";

/**
 * Matching Algorithm for Double-Dating App
 * 
 * Matches pairs of users (duos) who have selected each other as partners
 * with another compatible duo based on survey responses and preferences.
 */

interface SurveyAnswers {
  // Relationship Goals & Intent
  q1_looking_for?: string; // "Just seeing where things go" | "Just having fun for now" | etc.
  
  // Filtering fields (v1.1 - used only for feasibility, not scoring)
  q2_who_to_meet?: string; // "Only people in my year" | "People within 1 year of me" | "People within 2 years of me" | "Anyone at Penn — age is just a number"
  q_race_ethnicity?: string[]; // User's race/ethnicity
  q_preferred_race_ethnicity?: string[]; // Preferred races/ethnicities (includes "No preference")
  q_religious_affiliation?: string[]; // User's religion
  q_preferred_religious_affiliation?: string[]; // Preferred religions (includes "No preference")
  
  // Personality & Social Vibe
  q3_friday_night?: string; // "Low-key in my dorm..." | "Out with a crowd..." | etc.
  q4_humor?: string; // "Dry and subtle" | "Sharp and sarcastic" | etc.
  q5_argument?: string; // "I avoid conflict..." | "Let's talk it through..." | etc.
  q6_social_battery?: string; // "Extreme introvert" | "Extreme extrovert" | etc.
  
  // Lifestyle
  q7_hobbies?: string[]; // Multi-select hobbies
  q8_going_out?: string; // "Never" | "Rarely" | "Occasionally" | etc.
  q9_alcohol?: string; // "I don't drink" | "Very rarely" | etc.
  q10_partner_alcohol?: string; // "Dealbreaker" | "Doesn't bother me at all" | etc.
  
  // Communication & Social Merging
  q11_texting?: string; // "Only when something matters" | "Constant all day" | etc.
  q12_friend_groups?: string; // "Totally separate is fine" | "All my friends are your friends" | etc.
  
  // Dealbreakers
  q13_dealbreakers?: string[]; // Multi-select dealbreakers
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  gender: string | null;
  interested_in: string[] | null;
  graduation_year: string | null;
  major: string | null;
  partner_id: string | null;
  survey_completed: boolean;
}

interface Duo {
  user1: UserProfile;
  user2: UserProfile;
  survey1: SurveyAnswers | null;
  survey2: SurveyAnswers | null;
}

interface MatchResult {
  duo1: Duo;
  duo2: Duo;
  compatibilityScore: number;
  reasons: string[];
}

/**
 * Calculate compatibility score between two duos
 * Returns a score from 0-100
 * Uses actual survey questions from the current survey
 */
function calculateCompatibility(duo1: Duo, duo2: Duo): MatchResult {
  let totalScore = 0;
  let maxScore = 0;
  const reasons: string[] = [];

  // Helper to get survey answer (checks both users in duo)
  // Survey answers come from JSONB, so we access them as Record<string, any>
  const getDuoAnswer = (duo: Duo, questionId: string): string | string[] | undefined => {
    const survey1 = duo.survey1 as Record<string, any> | null;
    const survey2 = duo.survey2 as Record<string, any> | null;
    return survey1?.[questionId] || survey2?.[questionId];
  };

  // Helper to get array answer (for multi-select questions)
  const getDuoArrayAnswer = (duo: Duo, questionId: string): string[] => {
    const survey1 = duo.survey1 as Record<string, any> | null;
    const survey2 = duo.survey2 as Record<string, any> | null;
    const answer1 = survey1?.[questionId];
    const answer2 = survey2?.[questionId];
    const arr1 = Array.isArray(answer1) ? answer1 : [];
    const arr2 = Array.isArray(answer2) ? answer2 : [];
    // Combine and deduplicate
    return Array.from(new Set([...arr1, ...arr2]));
  };

  // Relationship Goals Matching (25% weight)
  // Match people with similar relationship intentions
  let goalScore = 0;
  const goalMax = 25;
  const goal1 = getDuoAnswer(duo1, 'q1_looking_for') as string | undefined;
  const goal2 = getDuoAnswer(duo2, 'q1_looking_for') as string | undefined;
  
  if (goal1 && goal2) {
    // Score based on similarity of relationship goals
    const goalOptions = [
      "Just seeing where things go",
      "Just having fun for now",
      "Keeping it casual but open to more",
      "Something serious, but not in a rush",
      "A genuine relationship",
      "My person — the real deal"
    ];
    const index1 = goalOptions.indexOf(goal1);
    const index2 = goalOptions.indexOf(goal2);
    
    if (index1 !== -1 && index2 !== -1) {
      const diff = Math.abs(index1 - index2);
      // Closer goals = higher score (max 25 points)
      goalScore = (5 - Math.min(diff, 5)) * 5;
      totalScore += goalScore;
      
      if (diff <= 1) {
        reasons.push("Similar relationship goals");
      }
    }
  }
  maxScore += goalMax;

  // Personality & Social Vibe Matching (30% weight)
  let personalityScore = 0;
  const personalityMax = 30;
  
  // Friday night preference (social energy)
  const friday1 = getDuoAnswer(duo1, 'q3_friday_night') as string | undefined;
  const friday2 = getDuoAnswer(duo2, 'q3_friday_night') as string | undefined;
  if (friday1 && friday2) {
    if (friday1 === friday2) {
      personalityScore += 8;
    } else {
      // Partial match for similar vibes
      const lowKey = ["Low-key in my dorm or chilling quietly alone", "Studying in a GSR at Huntsman"];
      const social = ["Hanging with a small group of friends", "Good food and conversation"];
      const outgoing = ["Out with a crowd — party or bar", "Multiple times a week"];
      
      if ((lowKey.includes(friday1) && lowKey.includes(friday2)) ||
          (social.includes(friday1) && social.includes(friday2)) ||
          (outgoing.includes(friday1) && outgoing.includes(friday2))) {
        personalityScore += 5;
      }
    }
  }
  
  // Humor style
  const humor1 = getDuoAnswer(duo1, 'q4_humor') as string | undefined;
  const humor2 = getDuoAnswer(duo2, 'q4_humor') as string | undefined;
  if (humor1 && humor2) {
    if (humor1 === humor2) {
      personalityScore += 7;
      reasons.push("Similar humor style");
    }
  }
  
  // Conflict resolution
  const argument1 = getDuoAnswer(duo1, 'q5_argument') as string | undefined;
  const argument2 = getDuoAnswer(duo2, 'q5_argument') as string | undefined;
  if (argument1 && argument2) {
    if (argument1 === argument2) {
      personalityScore += 8;
    } else {
      // Complementary styles can work too
      const communicative = ["Let's talk it through calmly", "I'm emotional but communicative"];
      if ((communicative.includes(argument1) && communicative.includes(argument2))) {
        personalityScore += 5;
      }
    }
  }
  
  // Social battery (introversion/extroversion)
  const battery1 = getDuoAnswer(duo1, 'q6_social_battery') as string | undefined;
  const battery2 = getDuoAnswer(duo2, 'q6_social_battery') as string | undefined;
  if (battery1 && battery2) {
    const batteryMap: Record<string, number> = {
      "Extreme introvert": 1,
      "Introvert-leaning": 2,
      "Right in the middle": 3,
      "Extrovert-leaning": 4,
      "Extreme extrovert": 5
    };
    const val1 = batteryMap[battery1] || 3;
    const val2 = batteryMap[battery2] || 3;
    const diff = Math.abs(val1 - val2);
    // Prefer complementary (not too similar, not too different)
    if (diff === 1 || diff === 2) {
      personalityScore += 7;
      reasons.push("Complementary social energy");
    } else if (diff === 0) {
      personalityScore += 5;
    }
  }
  
  totalScore += personalityScore;
  maxScore += personalityMax;

  // Lifestyle Matching (25% weight)
  let lifestyleScore = 0;
  const lifestyleMax = 25;
  
  // Shared hobbies
  const hobbies1 = getDuoArrayAnswer(duo1, 'q7_hobbies');
  const hobbies2 = getDuoArrayAnswer(duo2, 'q7_hobbies');
  if (hobbies1.length > 0 && hobbies2.length > 0) {
    const sharedHobbies = hobbies1.filter(h => hobbies2.includes(h));
    const hobbyScore = Math.min(sharedHobbies.length * 3, 12);
    lifestyleScore += hobbyScore;
    
    if (sharedHobbies.length > 0) {
      reasons.push(`Shared hobbies: ${sharedHobbies.slice(0, 2).join(", ")}`);
    }
  }
  
  // Going out frequency
  const goingOut1 = getDuoAnswer(duo1, 'q8_going_out') as string | undefined;
  const goingOut2 = getDuoAnswer(duo2, 'q8_going_out') as string | undefined;
  if (goingOut1 && goingOut2) {
    if (goingOut1 === goingOut2) {
      lifestyleScore += 5;
    } else {
      // Similar ranges are okay
      const neverRarely = ["Never", "Rarely"];
      const occasionally = ["Occasionally", "Some weekends"];
      const frequent = ["Most weekends", "Multiple times a week"];
      
      if ((neverRarely.includes(goingOut1) && neverRarely.includes(goingOut2)) ||
          (occasionally.includes(goingOut1) && occasionally.includes(goingOut2)) ||
          (frequent.includes(goingOut1) && frequent.includes(goingOut2))) {
        lifestyleScore += 3;
      }
    }
  }
  
  // Alcohol compatibility
  const alcohol1 = getDuoAnswer(duo1, 'q9_alcohol') as string | undefined;
  const alcohol2 = getDuoAnswer(duo2, 'q9_alcohol') as string | undefined;
  const partnerAlcohol1 = getDuoAnswer(duo1, 'q10_partner_alcohol') as string | undefined;
  const partnerAlcohol2 = getDuoAnswer(duo2, 'q10_partner_alcohol') as string | undefined;
  
  if (alcohol1 && alcohol2 && partnerAlcohol1 && partnerAlcohol2) {
    // Check if alcohol preferences are compatible
    const noDrink = ["I don't drink"];
    const drinks = ["Very rarely", "Occasionally", "Socially", "Regularly"];
    
    const a1NoDrink = noDrink.includes(alcohol1);
    const a2NoDrink = noDrink.includes(alcohol2);
    const p1Dealbreaker = partnerAlcohol1 === "Dealbreaker";
    const p2Dealbreaker = partnerAlcohol2 === "Dealbreaker";
    
    // If one doesn't drink and the other has it as dealbreaker, incompatible
    if (!((a1NoDrink && p2Dealbreaker) || (a2NoDrink && p1Dealbreaker))) {
      lifestyleScore += 8;
    }
  }
  
  totalScore += lifestyleScore;
  maxScore += lifestyleMax;

  // Communication & Social Merging (20% weight)
  let communicationScore = 0;
  const communicationMax = 20;
  
  // Texting style
  const texting1 = getDuoAnswer(duo1, 'q11_texting') as string | undefined;
  const texting2 = getDuoAnswer(duo2, 'q11_texting') as string | undefined;
  if (texting1 && texting2) {
    if (texting1 === texting2) {
      communicationScore += 8;
    } else {
      // Similar ranges
      const low = ["Only when something matters", "Not a big texter"];
      const medium = ["Daily when there's something to say", "Frequent check-ins"];
      const high = ["Constant all day"];
      
      if ((low.includes(texting1) && low.includes(texting2)) ||
          (medium.includes(texting1) && medium.includes(texting2)) ||
          (high.includes(texting1) && high.includes(texting2))) {
        communicationScore += 5;
      }
    }
  }
  
  // Friend groups preference
  const friends1 = getDuoAnswer(duo1, 'q12_friend_groups') as string | undefined;
  const friends2 = getDuoAnswer(duo2, 'q12_friend_groups') as string | undefined;
  if (friends1 && friends2) {
    if (friends1 === friends2) {
      communicationScore += 12;
      reasons.push("Compatible friend group preferences");
    } else {
      // Similar preferences
      const separate = ["Totally separate is fine", "Separate squads that overlap sometimes", "We keep our own friendships"];
      const together = ["Everyone should get along", "All my friends are your friends"];
      
      if ((separate.includes(friends1) && separate.includes(friends2)) ||
          (together.includes(friends1) && together.includes(friends2))) {
        communicationScore += 8;
      }
    }
  }
  
  totalScore += communicationScore;
  maxScore += communicationMax;

  // Dealbreakers check (can reduce score, but not block - filtering already handled this)
  const dealbreakers1 = getDuoArrayAnswer(duo1, 'q13_dealbreakers');
  const dealbreakers2 = getDuoArrayAnswer(duo2, 'q13_dealbreakers');
  
  // If "None — I'm pretty open-minded" is selected, don't penalize
  if (!dealbreakers1.includes("None — I'm pretty open-minded") || 
      !dealbreakers2.includes("None — I'm pretty open-minded")) {
    // Minor penalty if dealbreakers overlap (but shouldn't happen due to filtering)
    const overlap = dealbreakers1.filter(d => dealbreakers2.includes(d));
    if (overlap.length > 0) {
      totalScore -= overlap.length * 5; // Small penalty
    }
  }

  // Calculate final score (0-100)
  const compatibilityScore = maxScore > 0 ? Math.max(0, Math.min(100, Math.round((totalScore / maxScore) * 100))) : 50;

  // Log detailed score breakdown (only in verbose mode - can be toggled)
  const logDetails = true; // Set to false to reduce noise
  if (logDetails) {
    console.log(`    📊 Score Breakdown:`);
    console.log(`       Goals (25%): ${goalScore}/${goalMax} points`);
    console.log(`       Personality (30%): ${personalityScore}/${personalityMax} points`);
    console.log(`       Lifestyle (25%): ${lifestyleScore}/${lifestyleMax} points`);
    console.log(`       Communication (20%): ${communicationScore}/${communicationMax} points`);
    console.log(`       Total: ${totalScore}/${maxScore} = ${compatibilityScore}%`);
  }

  return {
    duo1,
    duo2,
    compatibilityScore,
    reasons: reasons.length > 0 ? reasons : ["Compatible match based on profiles"]
  };
}

/**
 * Get all active duos (pairs of users who have selected each other as partners)
 */
async function getActiveDuos(): Promise<Duo[]> {
  console.log("\n🔍 Fetching active duos...");
  
  // Get all profiles with partners
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .not('partner_id', 'is', null)
    .eq('survey_completed', true);

  if (error || !profiles) {
    console.error("❌ Error fetching profiles:", error);
    return [];
  }

  console.log(`📋 Found ${profiles.length} profiles with partners and completed surveys`);

  // Group into duos (mutual partnerships)
  const duos: Duo[] = [];
  const processed = new Set<string>();
  let nonMutualCount = 0;

  for (const profile of profiles) {
    if (processed.has(profile.id) || !profile.partner_id) continue;

    // Verify mutual partnership
    const partner = profiles.find(p => p.id === profile.partner_id);
    if (!partner || partner.partner_id !== profile.id) {
      nonMutualCount++;
      console.log(`  ⚠️  Non-mutual partnership detected: ${profile.full_name || profile.email} → ${partner?.full_name || partner?.email || 'not found'}`);
      continue;
    }

    // Get surveys for both users
    const [survey1Res, survey2Res] = await Promise.all([
      supabaseAdmin
        .from('survey_responses')
        .select('answers')
        .eq('user_id', profile.id)
        .single(),
      supabaseAdmin
        .from('survey_responses')
        .select('answers')
        .eq('user_id', partner.id)
        .single()
    ]);

    const survey1 = survey1Res.data?.answers as SurveyAnswers | null;
    const survey2 = survey2Res.data?.answers as SurveyAnswers | null;

    if (!survey1 || !survey2) {
      console.log(`  ⚠️  Missing survey data for duo: ${profile.full_name || profile.email} & ${partner.full_name || partner.email}`);
    }

    duos.push({
      user1: profile,
      user2: partner,
      survey1,
      survey2
    });

    processed.add(profile.id);
    processed.add(partner.id);
  }

  console.log(`✅ Created ${duos.length} valid duos (${nonMutualCount} non-mutual partnerships skipped)`);
  return duos;
}

/**
 * Get previous matches to avoid re-matching
 */
async function getPreviousMatches(weekStartDate: Date): Promise<Set<string>> {
  const { data: matches } = await supabaseAdmin
    .from('weekly_matches')
    .select('user1_id, user2_id, user3_id, user4_id')
    .lt('match_week', weekStartDate.toISOString());

  const previousMatchSet = new Set<string>();
  
  if (matches) {
    for (const match of matches) {
      // Create a normalized key for each match (sorted IDs)
      const ids = [
        match.user1_id,
        match.user2_id,
        match.user3_id,
        match.user4_id
      ].sort();
      previousMatchSet.add(ids.join(','));
    }
  }

  return previousMatchSet;
}

/**
 * Check if two duos have been matched before
 */
function haveBeenMatchedBefore(
  duo1: Duo,
  duo2: Duo,
  previousMatches: Set<string>
): boolean {
  const ids = [
    duo1.user1.id,
    duo1.user2.id,
    duo2.user1.id,
    duo2.user2.id
  ].sort();
  
  return previousMatches.has(ids.join(','));
}

/**
 * ============================================
 * FILTERING LOGIC (v1.1 - Feasibility Only)
 * ============================================
 * These functions implement hard filters for graduation year,
 * religion, and race. They do NOT contribute to scoring.
 */

/**
 * Parse year window from q2_who_to_meet preference
 * Returns the maximum allowed year difference
 * 
 * Adds leniency: each preference gets +1 year window
 * - "Only people in my year" → ±1 year window
 * - "People within 1 year of me" → ±2 year window
 * - "People within 2 years of me" → ±3 year window
 */
function parseYearWindow(preference: string | undefined): number {
  if (!preference) return Infinity; // No preference = no restriction
  
  switch (preference) {
    case "Only people in my year":
      return 1; // Leniency: allow ±1 year window
    case "People within 1 year of me":
      return 2; // Leniency: allow ±2 year window
    case "People within 2 years of me":
      return 3; // Leniency: allow ±3 year window
    case "Anyone at Penn — age is just a number":
      return Infinity;
    default:
      return Infinity; // Default to most permissive
  }
}

/**
 * Get the most restrictive year window for a duo
 * This is the minimum window between the two people's preferences
 */
function getDuoYearWindow(duo: Duo): number {
  const window1 = parseYearWindow(duo.survey1?.q2_who_to_meet);
  const window2 = parseYearWindow(duo.survey2?.q2_who_to_meet);
  return Math.min(window1, window2);
}

/**
 * Check if two people are feasible based on graduation year
 */
function checkGraduationYearFeasible(
  personA: UserProfile,
  personB: UserProfile,
  yearWindow: number
): boolean {
  if (yearWindow === Infinity) return true; // No restriction
  
  if (!personA.graduation_year || !personB.graduation_year) {
    // If either person doesn't have a graduation year, allow it
    // (could be missing data, don't block on this)
    return true;
  }
  
  const yearA = parseInt(personA.graduation_year, 10);
  const yearB = parseInt(personB.graduation_year, 10);
  
  if (isNaN(yearA) || isNaN(yearB)) {
    return true; // Invalid year data, don't block
  }
  
  const yearDiff = Math.abs(yearA - yearB);
  return yearDiff <= yearWindow;
}

/**
 * Check if two people are feasible based on religion
 */
function checkReligionFeasible(
  surveyA: SurveyAnswers | null,
  surveyB: SurveyAnswers | null
): boolean {
  // If either person has no survey data, allow it (don't block)
  if (!surveyA || !surveyB) return true;
  
  const religionA = surveyA.q_religious_affiliation || [];
  const religionB = surveyB.q_religious_affiliation || [];
  const preferredA = surveyA.q_preferred_religious_affiliation || [];
  const preferredB = surveyB.q_preferred_religious_affiliation || [];
  
  // Check if either has "No preference" (open to all)
  const aOpenToAll = preferredA.includes("No preference");
  const bOpenToAll = preferredB.includes("No preference");
  
  if (aOpenToAll && bOpenToAll) return true;
  
  // Check if Person A's religion is in Person B's preferred list
  const aReligionInBPreferred = religionA.some(r => preferredB.includes(r));
  
  // Check if Person B's religion is in Person A's preferred list
  const bReligionInAPreferred = religionB.some(r => preferredA.includes(r));
  
  // Also check if they have the same religion (even if not explicitly preferred)
  const hasCommonReligion = religionA.some(r => religionB.includes(r));
  
  return aOpenToAll || bOpenToAll || aReligionInBPreferred || bReligionInAPreferred || hasCommonReligion;
}

/**
 * Check if two people are feasible based on race/ethnicity
 */
function checkRaceFeasible(
  surveyA: SurveyAnswers | null,
  surveyB: SurveyAnswers | null
): boolean {
  // If either person has no survey data, allow it (don't block)
  if (!surveyA || !surveyB) return true;
  
  const raceA = surveyA.q_race_ethnicity || [];
  const raceB = surveyB.q_race_ethnicity || [];
  const preferredA = surveyA.q_preferred_race_ethnicity || [];
  const preferredB = surveyB.q_preferred_race_ethnicity || [];
  
  // Check if either has "No preference" (open to all)
  const aOpenToAll = preferredA.includes("No preference");
  const bOpenToAll = preferredB.includes("No preference");
  
  if (aOpenToAll && bOpenToAll) return true;
  
  // Check if Person A's race is in Person B's preferred list
  const aRaceInBPreferred = raceA.some(r => preferredB.includes(r));
  
  // Check if Person B's race is in Person A's preferred list
  const bRaceInAPreferred = raceB.some(r => preferredA.includes(r));
  
  // Also check if they have the same race (even if not explicitly preferred)
  const hasCommonRace = raceA.some(r => raceB.includes(r));
  
  return aOpenToAll || bOpenToAll || aRaceInBPreferred || bRaceInAPreferred || hasCommonRace;
}

/**
 * Check if two people are feasible (person-to-person feasibility)
 * This checks graduation year, religion, and race
 */
function isPersonToPersonFeasible(
  personA: UserProfile,
  personB: UserProfile,
  surveyA: SurveyAnswers | null,
  surveyB: SurveyAnswers | null,
  yearWindow: number
): boolean {
  // Check graduation year
  if (!checkGraduationYearFeasible(personA, personB, yearWindow)) {
    return false;
  }
  
  // Check religion
  if (!checkReligionFeasible(surveyA, surveyB)) {
    return false;
  }
  
  // Check race
  if (!checkRaceFeasible(surveyA, surveyB)) {
    return false;
  }
  
  return true;
}

/**
 * Check if a men's duo and women's duo are valid (duo-to-duo validity)
 * Uses existential logic: each person must have at least one feasible match
 */
function isDuoToDuoValid(
  menDuo: Duo,
  womenDuo: Duo
): boolean {
  // Get the most restrictive year window for each duo
  const menYearWindow = getDuoYearWindow(menDuo);
  const womenYearWindow = getDuoYearWindow(womenDuo);
  // Use the more restrictive window for cross-duo checks
  const yearWindow = Math.min(menYearWindow, womenYearWindow);
  
  // Check that each man has at least one feasible woman
  const m1Feasible = 
    isPersonToPersonFeasible(menDuo.user1, womenDuo.user1, menDuo.survey1, womenDuo.survey1, yearWindow) ||
    isPersonToPersonFeasible(menDuo.user1, womenDuo.user2, menDuo.survey1, womenDuo.survey2, yearWindow);
  
  const m2Feasible = 
    isPersonToPersonFeasible(menDuo.user2, womenDuo.user1, menDuo.survey2, womenDuo.survey1, yearWindow) ||
    isPersonToPersonFeasible(menDuo.user2, womenDuo.user2, menDuo.survey2, womenDuo.survey2, yearWindow);
  
  // Check that each woman has at least one feasible man
  const w1Feasible = 
    isPersonToPersonFeasible(womenDuo.user1, menDuo.user1, womenDuo.survey1, menDuo.survey1, yearWindow) ||
    isPersonToPersonFeasible(womenDuo.user1, menDuo.user2, womenDuo.survey1, menDuo.survey2, yearWindow);
  
  const w2Feasible = 
    isPersonToPersonFeasible(womenDuo.user2, menDuo.user1, womenDuo.survey2, menDuo.survey1, yearWindow) ||
    isPersonToPersonFeasible(womenDuo.user2, menDuo.user2, womenDuo.survey2, menDuo.survey2, yearWindow);
  
  return m1Feasible && m2Feasible && w1Feasible && w2Feasible;
}

/**
 * Separate duos into men's duos and women's duos
 * A duo is a men's duo if both users are men (or identify as such)
 * A duo is a women's duo if both users are women (or identify as such)
 */
function separateDuosByGender(duos: Duo[]): {
  mensDuos: Duo[];
  womensDuos: Duo[];
} {
  console.log("\n👥 Separating duos by gender...");
  
  const mensDuos: Duo[] = [];
  const womensDuos: Duo[] = [];
  const skippedDuos: Duo[] = [];
  
  for (const duo of duos) {
    const gender1 = duo.user1.gender?.toLowerCase();
    const gender2 = duo.user2.gender?.toLowerCase();
    
    console.log(`  Checking duo: ${duo.user1.full_name || duo.user1.email} (${duo.user1.gender}) & ${duo.user2.full_name || duo.user2.email} (${duo.user2.gender})`);
    
    // Check if both are men
    const isMensDuo = 
      (gender1 === 'male' || gender1 === 'man' || gender1 === 'm') &&
      (gender2 === 'male' || gender2 === 'man' || gender2 === 'm');
    
    // Check if both are women
    const isWomensDuo = 
      (gender1 === 'female' || gender1 === 'woman' || gender1 === 'f' || gender1 === 'w') &&
      (gender2 === 'female' || gender2 === 'woman' || gender2 === 'f' || gender2 === 'w');
    
    if (isMensDuo) {
      mensDuos.push(duo);
      console.log(`    ✅ Added to men's duos`);
    } else if (isWomensDuo) {
      womensDuos.push(duo);
      console.log(`    ✅ Added to women's duos`);
    } else {
      skippedDuos.push(duo);
      console.log(`    ⚠️  Skipped (unclear gender match)`);
    }
  }
  
  if (skippedDuos.length > 0) {
    console.log(`  ⚠️  Skipped ${skippedDuos.length} duos due to unclear gender`);
  }
  
  console.log(`  👨 Men's duos: ${mensDuos.length}`);
  console.log(`  👩 Women's duos: ${womensDuos.length}`);
  
  return { mensDuos, womensDuos };
}

/**
 * Filter valid duo pairs using feasibility checks
 * Returns an array of valid (menDuo, womenDuo) pairs
 */
function filterValidDuoPairs(
  mensDuos: Duo[],
  womensDuos: Duo[]
): Array<{ menDuo: Duo; womenDuo: Duo }> {
  console.log("\n🔍 Filtering valid duo pairs...");
  console.log(`  Checking ${mensDuos.length} × ${womensDuos.length} = ${mensDuos.length * womensDuos.length} possible pairs`);
  
  const validPairs: Array<{ menDuo: Duo; womenDuo: Duo }> = [];
  let invalidCount = 0;
  
  for (const menDuo of mensDuos) {
    for (const womenDuo of womensDuos) {
      if (isDuoToDuoValid(menDuo, womenDuo)) {
        validPairs.push({ menDuo, womenDuo });
      } else {
        invalidCount++;
      }
    }
  }
  
  console.log(`  ✅ Valid pairs: ${validPairs.length}`);
  console.log(`  ❌ Invalid pairs: ${invalidCount}`);
  
  return validPairs;
}

/**
 * Main matching algorithm
 * Uses filtering (v1.1) + greedy approach to find best matches
 */
export async function runMatchingAlgorithm(weekStartDate: Date): Promise<MatchResult[]> {
  console.log("=".repeat(60));
  console.log("🎯 MATCHING ALGORITHM STARTED");
  console.log("=".repeat(60));
  console.log("📅 Week Start Date:", weekStartDate.toISOString());
  
  const allDuos = await getActiveDuos();
  console.log(`\n📊 Total active duos found: ${allDuos.length}`);
  
  if (allDuos.length < 2) {
    console.log("❌ Not enough duos to create matches (need at least 2)");
    return [];
  }

  // Log duo details
  console.log("\n👥 Duo Details:");
  allDuos.forEach((duo, idx) => {
    console.log(`  Duo ${idx + 1}:`);
    console.log(`    User 1: ${duo.user1.full_name || duo.user1.email} (${duo.user1.gender}) - ID: ${duo.user1.id}`);
    console.log(`    User 2: ${duo.user2.full_name || duo.user2.email} (${duo.user2.gender}) - ID: ${duo.user2.id}`);
    console.log(`    Has survey1: ${!!duo.survey1}, Has survey2: ${!!duo.survey2}`);
  });

  // Step 1: Separate duos by gender
  const { mensDuos, womensDuos } = separateDuosByGender(allDuos);
  console.log(`\n👨 Men's duos: ${mensDuos.length}`);
  console.log(`👩 Women's duos: ${womensDuos.length}`);
  
  if (mensDuos.length === 0 || womensDuos.length === 0) {
    console.log(`❌ Not enough duos of both genders. Men's duos: ${mensDuos.length}, Women's duos: ${womensDuos.length}`);
    return [];
  }

  // Step 2: Filter valid duo pairs using feasibility checks
  const validPairs = filterValidDuoPairs(mensDuos, womensDuos);
  console.log(`\n✅ Found ${validPairs.length} valid duo pairs after filtering`);
  
  if (validPairs.length === 0) {
    console.log("❌ No valid duo pairs found after filtering. Consider relaxing constraints.");
    return [];
  }

  const previousMatches = await getPreviousMatches(weekStartDate);
  console.log(`\n📜 Previous matches found: ${previousMatches.size}`);
  
  const matches: MatchResult[] = [];
  const matchedMensDuos = new Set<number>();
  const matchedWomensDuos = new Set<number>();

  // Step 3: Calculate compatibility scores for valid pairs only
  const compatibilityMatrix: Array<{
    menDuoIndex: number;
    womenDuoIndex: number;
    score: number;
    result: MatchResult;
  }> = [];

  console.log("\n🔢 Calculating compatibility scores...");
  let skippedCount = 0;
  
  for (const pair of validPairs) {
    const menDuoIndex = mensDuos.findIndex(d => 
      d.user1.id === pair.menDuo.user1.id && d.user2.id === pair.menDuo.user2.id
    );
    const womenDuoIndex = womensDuos.findIndex(d => 
      d.user1.id === pair.womenDuo.user1.id && d.user2.id === pair.womenDuo.user2.id
    );

    // Skip if already matched before
    if (haveBeenMatchedBefore(pair.menDuo, pair.womenDuo, previousMatches)) {
      skippedCount++;
      console.log(`  ⏭️  Skipping pair (previously matched):`);
      console.log(`     Men's duo: ${pair.menDuo.user1.full_name || pair.menDuo.user1.email} & ${pair.menDuo.user2.full_name || pair.menDuo.user2.email}`);
      console.log(`     Women's duo: ${pair.womenDuo.user1.full_name || pair.womenDuo.user1.email} & ${pair.womenDuo.user2.full_name || pair.womenDuo.user2.email}`);
      continue;
    }

    // Calculate compatibility (menDuo = duo1, womenDuo = duo2)
    const result = calculateCompatibility(pair.menDuo, pair.womenDuo);
    
    console.log(`  💯 Compatibility Score: ${result.compatibilityScore}%`);
    console.log(`     Men's duo: ${pair.menDuo.user1.full_name || pair.menDuo.user1.email} & ${pair.menDuo.user2.full_name || pair.menDuo.user2.email}`);
    console.log(`     Women's duo: ${pair.womenDuo.user1.full_name || pair.womenDuo.user1.email} & ${pair.womenDuo.user2.full_name || pair.womenDuo.user2.email}`);
    if (result.reasons && result.reasons.length > 0) {
      console.log(`     Reasons: ${result.reasons.join(", ")}`);
    }
    
    compatibilityMatrix.push({
      menDuoIndex,
      womenDuoIndex,
      score: result.compatibilityScore,
      result
    });
  }

  console.log(`\n📈 Compatibility matrix size: ${compatibilityMatrix.length} (skipped ${skippedCount} previously matched)`);

  // Step 4: Sort by compatibility score (highest first)
  compatibilityMatrix.sort((a, b) => b.score - a.score);
  
  console.log("\n🏆 Top 5 compatibility scores:");
  compatibilityMatrix.slice(0, 5).forEach((candidate, idx) => {
    console.log(`  ${idx + 1}. Score: ${candidate.score}%`);
  });

  // Step 5: Greedy matching: take best matches first
  console.log("\n🎯 Performing greedy matching (min score: 60%)...");
  let belowThresholdCount = 0;
  
  for (const candidate of compatibilityMatrix) {
    if (candidate.score < 60) {
      belowThresholdCount++;
      continue;
    }
    
    if (
      !matchedMensDuos.has(candidate.menDuoIndex) &&
      !matchedWomensDuos.has(candidate.womenDuoIndex)
    ) {
      matches.push(candidate.result);
      matchedMensDuos.add(candidate.menDuoIndex);
      matchedWomensDuos.add(candidate.womenDuoIndex);
      
      console.log(`  ✅ Match created (Score: ${candidate.score}%):`);
      console.log(`     Men's duo: ${candidate.result.duo1.user1.full_name || candidate.result.duo1.user1.email} & ${candidate.result.duo1.user2.full_name || candidate.result.duo1.user2.email}`);
      console.log(`     Women's duo: ${candidate.result.duo2.user1.full_name || candidate.result.duo2.user1.email} & ${candidate.result.duo2.user2.full_name || candidate.result.duo2.user2.email}`);
    }
  }

  console.log(`\n📊 Matching Summary:`);
  console.log(`   Total valid pairs: ${validPairs.length}`);
  console.log(`   Previously matched (skipped): ${skippedCount}`);
  console.log(`   Below threshold (<60%): ${belowThresholdCount}`);
  console.log(`   Final matches created: ${matches.length}`);
  console.log("=".repeat(60));
  console.log("✅ MATCHING ALGORITHM COMPLETED");
  console.log("=".repeat(60));

  return matches;
}

/**
 * Save matches to database for a specific week
 */
export async function saveMatchesForWeek(
  matches: MatchResult[],
  weekStartDate: Date
): Promise<void> {
  console.log("\n💾 Saving matches to database...");
  console.log(`  Week: ${weekStartDate.toISOString()}`);
  console.log(`  Matches to save: ${matches.length}`);
  
  const matchRecords = matches.map((match, idx) => {
    const record = {
      user1_id: match.duo1.user1.id,
      user2_id: match.duo1.user2.id,
      user3_id: match.duo2.user1.id,
      user4_id: match.duo2.user2.id,
      compatibility_score: match.compatibilityScore,
      match_reasons: match.reasons,
      match_week: weekStartDate.toISOString(),
      created_at: new Date().toISOString()
    };
    
    console.log(`  Match ${idx + 1}:`);
    console.log(`    Users: ${match.duo1.user1.full_name || match.duo1.user1.email}, ${match.duo1.user2.full_name || match.duo1.user2.email}, ${match.duo2.user1.full_name || match.duo2.user1.email}, ${match.duo2.user2.full_name || match.duo2.user2.email}`);
    console.log(`    Score: ${match.compatibilityScore}%`);
    console.log(`    Reasons: ${match.reasons?.join(", ") || "None"}`);
    
    return record;
  });

  const { error, data } = await supabaseAdmin
    .from('weekly_matches')
    .insert(matchRecords)
    .select();

  if (error) {
    console.error("❌ Error saving matches:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to save matches: ${error.message}`);
  }

  console.log(`✅ Successfully saved ${data?.length || 0} matches to database`);
  if (data && data.length > 0) {
    console.log("  Saved match IDs:", data.map(m => m.id));
  }
}

/**
 * Get the start of the current week (Tuesday)
 */
export function getCurrentWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  // Tuesday is day 2 (0 = Sunday, 1 = Monday, 2 = Tuesday)
  const daysUntilTuesday = day <= 2 ? 2 - day : 9 - day;
  
  const tuesday = new Date(now);
  tuesday.setDate(now.getDate() - daysUntilTuesday);
  tuesday.setHours(0, 0, 0, 0);
  
  return tuesday;
}

/**
 * Check if it's Tuesday (match release day)
 */
export function isMatchReleaseDay(): boolean {
  const now = new Date();
  return (now.getDay() === 2 && now.getHours() >= 21); // Tuesday
}

