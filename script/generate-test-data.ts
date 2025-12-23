import "dotenv/config";
import { supabaseAdmin } from "../server/supabase";

/**
 * Generate test data for matching algorithm testing
 * Creates users, profiles, partnerships, and survey responses
 */

interface TestUser {
  email: string;
  password: string;
  full_name: string;
  gender: string;
  graduation_year: string;
  major: string;
  height: number;
}

const majors = [
  "Computer Science", "Business", "Engineering", "Biology", "Psychology",
  "Economics", "Political Science", "English", "Mathematics", "Chemistry"
];

// All users will be in the same graduation year for easier matching
const DEFAULT_GRADUATION_YEAR = "2025";

const relationshipGoals = [
  "Just seeing where things go",
  "Just having fun for now",
  "Keeping it casual but open to more",
  "Something serious, but not in a rush",
  "A genuine relationship",
  "My person — the real deal"
];

// Use permissive year preferences so all users can match with each other
const yearPreferences = [
  "Anyone at Penn — age is just a number" // Most permissive - allows all matches
];

const races = [
  "African", "Asian (East)", "Asian (South)", "Asian (Southeast)",
  "Black / African American", "Hispanic / Latinx", "Middle Eastern / North African",
  "Native American / Alaskan Native", "Native Hawaiian / Pacific Islander", "White"
];

const religions = [
  "Agnostic", "Atheist", "Buddhist", "Catholic", "Hindu", "Jewish",
  "Mormon", "Muslim", "Protestant", "Spiritual but not religious", "Christian (Other)", "Other"
];

const fridayNights = [
  "Low-key in my dorm or chilling quietly alone",
  "Studying in a GSR at Huntsman",
  "Hanging with a small group of friends",
  "Good food and conversation",
  "Something spontaneous or random",
  "Out with a crowd — party or bar",
  "Literally anywhere — go with the flow"
];

const humorStyles = [
  "Dry and subtle",
  "Sharp and sarcastic",
  "Dark",
  "Finding humor in everyday chaos",
  "Unserious and ridiculous",
  "Silly and physical",
  "Aggressively wholesome"
];

const hobbies = [
  "Binge-watching / relaxing",
  "Wellness & mindfulness",
  "Gaming",
  "Research / learning deeply",
  "Make things (art, music, writing)",
  "Outdoor adventures",
  "Play sports",
  "Live at the gym",
  "Foodie life",
  "Travel whenever possible",
  "Out at night",
  "Greek life",
  "Perform (theater, dance)"
];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomChoices<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

function generateSurveyAnswers(): Record<string, any> {
  return {
    q1_looking_for: randomChoice(relationshipGoals),
    q2_who_to_meet: "Anyone at Penn — age is just a number", // Always permissive for test data
    q_race_ethnicity: randomChoices(races, Math.floor(Math.random() * 3) + 1),
    q_preferred_race_ethnicity: ["No preference", ...randomChoices(races, 2)],
    q_religious_affiliation: randomChoices(religions, Math.floor(Math.random() * 2) + 1),
    q_preferred_religious_affiliation: ["No preference", ...randomChoices(religions, 2)],
    q3_friday_night: randomChoice(fridayNights),
    q4_humor: randomChoice(humorStyles),
    q5_argument: randomChoice([
      "I avoid conflict if possible",
      "I need space to cool off first",
      "I try to understand their side",
      "Let's talk it through calmly",
      "I'm emotional but communicative",
      "I'm passionate and make my case",
      "I joke to diffuse tension"
    ]),
    q6_social_battery: randomChoice([
      "Extreme introvert",
      "Introvert-leaning",
      "Right in the middle",
      "Extrovert-leaning",
      "Extreme extrovert"
    ]),
    q7_hobbies: randomChoices(hobbies, Math.floor(Math.random() * 5) + 2),
    q8_going_out: randomChoice([
      "Never",
      "Rarely",
      "Occasionally",
      "Some weekends",
      "Most weekends",
      "Multiple times a week"
    ]),
    q9_alcohol: randomChoice([
      "I don't drink",
      "Very rarely",
      "Occasionally",
      "Socially",
      "Regularly"
    ]),
    q10_partner_alcohol: randomChoice([
      "Dealbreaker",
      "Only rarely",
      "Occasionally is fine",
      "Socially is fine",
      "Doesn't bother me at all"
    ]),
    q11_texting: randomChoice([
      "Only when something matters",
      "Not a big texter",
      "Daily when there's something to say",
      "Frequent check-ins",
      "Constant all day"
    ]),
    q12_friend_groups: randomChoice([
      "Totally separate is fine",
      "Separate squads that overlap sometimes",
      "We keep our own friendships",
      "Everyone should get along",
      "All my friends are your friends"
    ]),
    q13_dealbreakers: randomChoices([
      "Very different relationship with substances",
      "Shuts down instead of communicating",
      "Rude to my friends or family",
      "Extreme introvert/extrovert mismatch",
      "Zero shared interests",
      "None — I'm pretty open-minded"
    ], Math.floor(Math.random() * 2) + 1)
  };
}

async function createTestUser(user: TestUser): Promise<string | null> {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true
    });

    if (authError || !authData.user) {
      console.error(`❌ Failed to create auth user ${user.email}:`, authError);
      return null;
    }

    const userId = authData.user.id;

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email: user.email,
        full_name: user.full_name,
        gender: user.gender,
        graduation_year: user.graduation_year,
        major: user.major,
        height: user.height,
        survey_completed: false
      });

    if (profileError) {
      console.error(`❌ Failed to create profile for ${user.email}:`, profileError);
      return null;
    }

    // Create survey response
    const surveyAnswers = generateSurveyAnswers();
    const { error: surveyError } = await supabaseAdmin
      .from('survey_responses')
      .insert({
        user_id: userId,
        answers: surveyAnswers
      });

    if (surveyError) {
      console.error(`❌ Failed to create survey for ${user.email}:`, surveyError);
      return null;
    }

    // Mark survey as completed
    await supabaseAdmin
      .from('profiles')
      .update({ survey_completed: true })
      .eq('id', userId);

    return userId;
  } catch (error) {
    console.error(`💥 Exception creating user ${user.email}:`, error);
    return null;
  }
}

async function createPartnership(user1Id: string, user2Id: string): Promise<boolean> {
  try {
    // Create mutual partnership
    const { error: error1 } = await supabaseAdmin
      .from('profiles')
      .update({ partner_id: user2Id })
      .eq('id', user1Id);

    const { error: error2 } = await supabaseAdmin
      .from('profiles')
      .update({ partner_id: user1Id })
      .eq('id', user2Id);

    if (error1 || error2) {
      console.error(`❌ Failed to create partnership between ${user1Id} and ${user2Id}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`💥 Exception creating partnership:`, error);
    return false;
  }
}

async function generateTestData() {
  console.log("=".repeat(60));
  console.log("🧪 GENERATING TEST DATA FOR MATCHING ALGORITHM");
  console.log("=".repeat(60));

  const numMen = 20; // 20 men = 10 men's duos
  const numWomen = 20; // 20 women = 10 women's duos
  const totalUsers = numMen + numWomen;

  console.log(`\n📊 Generating ${totalUsers} test users:`);
  console.log(`   👨 ${numMen} men (will create ${numMen / 2} men's duos)`);
  console.log(`   👩 ${numWomen} women (will create ${numWomen / 2} women's duos)`);
  console.log(`   🎯 Expected: ${(numMen / 2) * (numWomen / 2)} possible matches\n`);

  const menUsers: TestUser[] = [];
  const womenUsers: TestUser[] = [];
  const createdUserIds: string[] = [];

  // Generate men - all same graduation year
  for (let i = 1; i <= numMen; i++) {
    menUsers.push({
      email: `test.men${i}@penn.edu`,
      password: "testpassword123",
      full_name: `Test Man ${i}`,
      gender: "Male",
      graduation_year: DEFAULT_GRADUATION_YEAR, // All same year
      major: randomChoice(majors),
      height: Math.floor(Math.random() * 10) + 66 // 66-75 inches
    });
  }

  // Generate women - all same graduation year
  for (let i = 1; i <= numWomen; i++) {
    womenUsers.push({
      email: `test.women${i}@penn.edu`,
      password: "testpassword123",
      full_name: `Test Woman ${i}`,
      gender: "Female",
      graduation_year: DEFAULT_GRADUATION_YEAR, // All same year
      major: randomChoice(majors),
      height: Math.floor(Math.random() * 10) + 60 // 60-69 inches
    });
  }

  // Create all users
  console.log("👥 Creating users...");
  for (const user of [...menUsers, ...womenUsers]) {
    const userId = await createTestUser(user);
    if (userId) {
      createdUserIds.push(userId);
      console.log(`   ✅ Created: ${user.full_name} (${user.email})`);
    } else {
      console.log(`   ❌ Failed: ${user.full_name}`);
    }
  }

  console.log(`\n✅ Created ${createdUserIds.length} users`);

  // Create partnerships (duos)
  console.log("\n💑 Creating partnerships...");
  
  // Get IDs of created users by gender
  const { data: menProfiles } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .in('email', menUsers.map(u => u.email))
    .eq('gender', 'Male');

  const { data: womenProfiles } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .in('email', womenUsers.map(u => u.email))
    .eq('gender', 'Female');

  const menIds = (menProfiles || []).map(p => p.id);
  const womenIds = (womenProfiles || []).map(p => p.id);

  console.log(`   Found ${menIds.length} men and ${womenIds.length} women`);

  // Pair up men
  let menDuosCreated = 0;
  for (let i = 0; i < menIds.length - 1; i += 2) {
    if (await createPartnership(menIds[i], menIds[i + 1])) {
      menDuosCreated++;
      console.log(`   ✅ Men's duo ${menDuosCreated}: ${menIds[i]} & ${menIds[i + 1]}`);
    }
  }

  // Pair up women
  let womenDuosCreated = 0;
  for (let i = 0; i < womenIds.length - 1; i += 2) {
    if (await createPartnership(womenIds[i], womenIds[i + 1])) {
      womenDuosCreated++;
      console.log(`   ✅ Women's duo ${womenDuosCreated}: ${womenIds[i]} & ${womenIds[i + 1]}`);
    }
  }

  console.log(`\n✅ Created ${menDuosCreated} men's duos and ${womenDuosCreated} women's duos`);
  console.log(`\n🎯 Ready to test matching algorithm!`);
  console.log(`   Expected matches: up to ${Math.min(menDuosCreated, womenDuosCreated)} matches`);
  console.log("=".repeat(60));
}

// Run the script when executed directly
generateTestData()
  .then(() => {
    console.log("\n✅ Test data generation complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Error generating test data:", error);
    process.exit(1);
  });

export { generateTestData };

