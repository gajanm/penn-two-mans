import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Check, Search, Loader2, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { getInitials, getAvatarColor } from "@/lib/mockData";

const majors = [
  "Accounting", "Africana Studies", "African American Studies", "African Diaspora Studies", "African Studies",
  "Ancient History", "Anthropology", "Architecture", "Artificial Intelligence", "Artificial Intelligence for Business",
  "Behavioral Economics", "Biochemistry", "Bioengineering", "Biology", "Biophysics", "Biomedical Science",
  "Business Analytics", "Business Economics and Public Policy", "Chemical and Biomolecular Engineering", "Chemistry",
  "Cinema and Media Studies", "Classical Studies", "Cognitive Science", "Communication", "Comparative Literature",
  "Computer Engineering", "Computer Science", "Criminology", "Design", "Digital Media Design",
  "Earth and Environmental Science", "East Asian Languages and Civilizations", "Economics", "Electrical Engineering",
  "English", "Entrepreneurship and Innovation", "Environmental Studies", "Environmental, Social, and Governance Factors for Business",
  "Finance", "Fine Arts", "Francophone, Italian and Germanic Studies", "Gender, Sexuality, & Women's Studies",
  "Health and Societies", "Health Care Management and Policy", "Hispanic Studies", "History", "History of Art",
  "Individualized", "International Relations", "International Studies", "Jewish Studies",
  "Latin American & Latinx Studies", "Law and Society", "Leading Across Differences", "Legal Studies & Business Ethics",
  "Linguistics", "Logic, Information, & Computation", "Management", "Marketing", "Marketing & Communication",
  "Marketing & Operations Management", "Materials Science and Engineering", "Mathematical Economics", "Mathematics",
  "Mechanical Engineering and Applied Mechanics", "Middle Eastern Languages & Cultures", "Modern Middle Eastern Studies",
  "Music", "Neuroscience", "Nursing", "Nutrition Science", "Operations, Information & Decisions", "Philosophy",
  "Philosophy, Politics and Economics", "Physics", "Political Science", "Psychology", "Real Estate", "Religious Studies",
  "Retailing", "Russian and East European Studies", "Science, Technology and Society", "Sociology", "South Asia Studies",
  "Statistics and Data Science", "Theatre Arts", "Urban Studies", "Visual Studies"
];

const graduationYears = ["2025", "2026", "2027", "2028", "2029"];

type SurveyData = {
  [key: string]: string | string[] | number | number[];
};

function formatHeight(inches: number): string {
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}'${remainingInches}"`;
}

function SearchableMajorSelect({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredMajors = majors.filter(major => 
    major.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="relative"
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search major..."
          value={isOpen ? search : value || ""}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="h-12 rounded-xl border-2 pl-10"
        />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 rounded-xl shadow-lg max-h-[200px] overflow-y-auto">
          {filteredMajors.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">No major found</div>
          ) : (
            filteredMajors.map((major) => (
              <div
                key={major}
                className={`p-3 cursor-pointer hover:bg-primary/10 flex items-center gap-2 ${
                  value === major ? 'bg-primary/5 text-primary' : ''
                }`}
                onClick={() => {
                  onChange(major);
                  setSearch("");
                  setIsOpen(false);
                }}
              >
                {value === major && <Check className="w-4 h-4" />}
                <span className="text-sm">{major}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const allQuestions = [
  { id: "q1_looking_for", question: "What are you looking for?", type: "single", options: ["My person - the real deal", "A genuine relationship - something meaningful", "Something serious, but I'm not in a rush", "Keeping it casual but open to more", "Just having fun for now", "Honestly? Just seeing where things go"] },
  { id: "q2_who_to_meet", question: "I want to meet:", type: "single", options: ["Anyone at Penn - age is just a number", "People within 2 years of me - similar life phase vibes", "People within 1 year of me - we're on the same timeline", "Only people in my year - we get it"] },
  { id: "q3_dtr", question: "When it comes to defining the relationship:", type: "single", options: ["Slow burn - let's build a friendship first", "Let it happen naturally - no pressure", "Traditional route - exclusive after a few dates", "When you know, you know - I don't waste time", "Every connection is different"] },
  { id: "q4_five_years", question: "Picture yourself in 5 years. Where are you?", type: "single", options: ["Killing it in my career in a major city", "Deep in grad school or advanced training", "Exploring the world before I settle", "Actually settled - home, maybe starting a family", "Building something of my own - startup, art, passion project", "Wherever life takes me - I'm adaptable"] },
  { id: "q5_kids", question: "The whole kids question:", type: "single", options: ["Yes, definitely - I want a few", "Probably - one or two sounds right", "If my partner wants them, I'm open", "Way too soon to decide", "Leaning toward no", "Hard no - not for me", "Adoption or fostering feels more my speed"] },
  { id: "q6_values", question: "What actually matters to you?", type: "multi", maxSelect: 3, options: ["Family and the people closest to me", "Crushing my career goals", "Constantly growing and evolving as a person", "Adventures and making memories", "Financial stability and security", "Actually making a difference in the world", "Creative expression and authenticity", "Learning and intellectual stimulation", "Health and taking care of myself", "My community and friendships"] },
  { id: "q7_friday_night", question: "It's Friday night. Where am I?", type: "single", options: ["Somewhere with a crowd - party, bar, living it up", "Good food and conversation with my people", "Something random - concert, new restaurant, spontaneous plan", "Low-key vibes - movie or game night", "Hopefully on a date", "In my zone - personal project time", "Getting a workout in or playing sports", "Literally anywhere - I go with the flow"] },
  { id: "q8_decisions", question: "Big decision time. What's your move?", type: "single", options: ["Gut feeling all the way", "Let me think this through logically", "Group chat consultation required", "Time for a pros and cons list", "Whatever feels right right now", "Head and heart - I need both"] },
  { id: "q9_rough_day", question: "You're having a really rough day. What do you need from someone you're dating?", type: "single", options: ["Tell me what to do - I need solutions", "Just listen and validate what I'm feeling", "Get my mind off it - let's do something fun", "Give me space, but be ready when I'm ready to talk", "Actually help me fix the problem", "Let me be mad and be mad with me", "Just ask - I'll tell you what I need"] },
  { id: "q10_humor", question: "Your humor style is:", type: "single", options: ["Sharp and sarcastic - I'm basically a comedy writer", "Unserious and ridiculous - can't take me anywhere", "Dry delivery - subtlety is an art", "Dark - nothing is off limits", "Roasting people I love is my love language", "Aggressively wholesome - yes, I make dad jokes", "I find the funny in everyday chaos", "Silly and physical - I'll do anything for a laugh"] },
  { id: "q11_argument", question: "Mid-argument with someone you care about:", type: "single", options: ["I'm passionate and I'm making my case", "Let's figure this out together right now", "I need 20 minutes to not say something I'll regret", "I'm probably crying but we'll work it out", "Can we not fight? This is uncomfortable", "Help me see your side - I want to understand", "Joke about it? Please?"] },
  { id: "q12_social_battery", question: "Social battery check:", type: "single", options: ["Extreme introvert - people are exhausting", "Introvert-leaning - small groups are my limit", "Right in the middle - depends on the day", "Extrovert-leaning - I like being around people", "Extreme extrovert - alone time makes me sad"] },
  { id: "q13_hobbies", question: "Things I actually do with my time:", type: "multi", maxSelect: 5, options: ["Play sports - I'm competitive", "Live at the gym", "Outdoor adventures - hiking, camping, nature stuff", "Make things - art, music, writing, photos", "Perform - theater, dance, any stage really", "Game hard - video games, board games, all of it", "Always reading something", "Foodie life - cooking or trying restaurants", "Watch sports religiously", "Out at night - clubs, parties, the scene", "Greek life is my whole thing", "Research nerd - I love going deep on topics", "Fashion matters to me", "Travel whenever possible", "Binge-watching is valid self-care", "Wellness and mindfulness stuff"] },
  { id: "q14_new_experiences", question: "Someone suggests something you've never done before:", type: "single", options: ["Say less - I'm immediately in", "I love new experiences - count me in", "If my friends are going, I'm down", "Maybe if it sounds fun and safe", "I like what I like - probably not", "I need advance notice and a full itinerary"] },
  { id: "q15_going_out", question: "How often do you go out (parties, bars, clubs)?", type: "single", options: ["Multiple times a week - it's a big part of my life", "Most weekends - Thursday through Saturday", "Some weekends - maybe twice a month", "Occasionally - once a month or for special events", "Rarely - a few times a semester", "Never - not my scene at all"] },
  { id: "q16_alcohol", question: "Your relationship with alcohol:", type: "single", options: ["I don't drink at all", "Very rarely - maybe a few times a year", "Occasionally - special occasions and events", "Socially - most weekends when I go out", "Regularly - it's part of my social life", "Still figuring out my limits and preferences"] },
  { id: "q17_partner_alcohol", question: "How do you feel about a partner who drinks?", type: "single", options: ["They shouldn't drink at all - dealbreaker for me", "Rarely is fine - special occasions only", "Occasionally is okay - not too often", "Socially is totally fine - most weekends", "However much they want - doesn't bother me", "As long as it's responsible, I don't care"] },
  { id: "q18_weed", question: "Your relationship with weed:", type: "single", options: ["I don't smoke and prefer not to be around it", "I don't smoke but don't mind if others do", "Occasionally - like a few times a semester", "Socially - when I'm out with friends", "Regularly - it's part of my routine", "Daily or near-daily", "Not my thing but totally fine with it"] },
  { id: "q19_partner_weed", question: "How do you feel about a partner who smokes weed?", type: "single", options: ["They shouldn't smoke at all - dealbreaker", "Very occasionally is okay - rarely", "Socially is fine - when out with friends", "Regularly is fine - doesn't bother me", "However much they want - their choice", "Prefer they don't but not a dealbreaker"] },
  { id: "q20_mess", question: "The mess tolerance question:", type: "single", options: ["Everything has a place and it better be there", "I'm pretty clean - it matters to me", "Organized enough - I know where things are", "I clean when it gets bad", "Mess doesn't bother me at all"] },
  { id: "q21_morning_night", question: "Morning person or night owl?", type: "single", options: ["Up early crushing it", "Morning-ish but flexible", "Whatever works - I adapt", "Better at night but I can do mornings", "100% night owl - don't talk to me before 10am"] },
  { id: "q22_show_interest", question: "The way you show someone you're into them:", type: "single", options: ["Touch - I'm naturally physically affectionate", "Time - giving you my full attention", "Words - I'll tell you how I feel", "Actions - doing things to make your life easier", "Small thoughtful things that show I remember", "Experiences - making memories together", "Hyping you up and supporting your dreams"] },
  { id: "q23_dynamic", question: "Your ideal relationship dynamic:", type: "single", options: ["Pretty much joined at the hip", "Mostly together, some independence", "50/50 - balance is key", "Mostly separate lives that overlap nicely", "Very independent with intentional quality time", "Depends on the phase we're in"] },
  { id: "q24_emotional", question: "Opening up emotionally:", type: "single", options: ["I'm an open book from day one", "Slow to trust, but then all in", "Gradual - I share as I get comfortable", "I keep some walls up", "I want to open up but it's hard for me", "Pretty private with feelings"] },
  { id: "q25_privacy", question: "The privacy talk:", type: "single", options: ["Full transparency - passwords and all", "Pretty open but we're still individuals", "Open communication, personal boundaries respected", "Tell me the important stuff, live your life", "I need a lot of personal space"] },
  { id: "q26_physical", question: "Physical affection in a relationship:", type: "single", options: ["Constant - I'm very touchy", "Regular - it's important to me", "Moderate - balanced with everything else", "Occasional - I like it but don't need it all the time", "Not my main thing - other stuff matters more"] },
  { id: "q27_texting", question: "Your texting personality:", type: "single", options: ["Constant stream of consciousness all day", "Frequent - good morning/goodnight type", "Daily convos when there's something to say", "When something actually matters", "Honestly not a big texter - rather see you", "Pretty independent - we'll link when we link"] },
  { id: "q28_friend_groups", question: "Friend groups and relationships:", type: "single", options: ["All my friends are your friends and vice versa", "I want everyone to get along and hang out", "Separate squads that sometimes overlap", "Totally separate is fine", "You need to vibe with my core group though", "We should each keep our own friendships"] },
  { id: "q29_dealbreakers", question: "Absolute deal-breakers:", type: "multi", maxSelect: 5, options: ["Poor communication or stonewalling", "Jealousy and possessiveness", "Disrespects my boundaries", "Rude to service workers", "Doesn't share my religion or values", "No ambition or goals", "Incompatible on the kids question", "Different political views", "Doesn't get along with my friends", "No sense of humor", "Smokes cigarettes", "Excessive partying", "Different lifestyle expectations"] },
];

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [answers, setAnswers] = useState<SurveyData>({
    height: 66,
    partnerHeightMin: 58,
    partnerHeightMax: 78,
  });

  const userName = user?.email?.split('@')[0] || 'User';
  const initials = getInitials(userName);
  const avatarColor = getAvatarColor(userName);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const { data: survey } = await supabase
          .from('survey_responses')
          .select('answers')
          .eq('user_id', user.id)
          .single();

        const loadedAnswers: SurveyData = {
          height: profile?.height || 66,
          partnerHeightMin: profile?.partner_height_min || 58,
          partnerHeightMax: profile?.partner_height_max || 78,
          fullName: profile?.full_name || '',
          gender: profile?.gender || '',
          interestedIn: profile?.interested_in || [],
          graduationYear: profile?.graduation_year || '',
          major: profile?.major || '',
          ...(survey?.answers || {}),
        };

        setAnswers(loadedAnswers);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user]);

  const handleAnswer = (questionId: string, value: string, type: string, maxSelect?: number) => {
    if (type === "multi") {
      const current = (answers[questionId] as string[]) || [];
      const max = maxSelect || 5;
      if (current.includes(value)) {
        setAnswers({ ...answers, [questionId]: current.filter(v => v !== value) });
      } else if (current.length < max) {
        setAnswers({ ...answers, [questionId]: [...current, value] });
      }
    } else {
      setAnswers({ ...answers, [questionId]: value });
    }
  };

  const handleInterestedIn = (value: string) => {
    const current = (answers.interestedIn as string[]) || [];
    if (current.includes(value)) {
      setAnswers({ ...answers, interestedIn: current.filter(v => v !== value) });
    } else {
      setAnswers({ ...answers, interestedIn: [...current, value] });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const profileData = {
        full_name: answers.fullName as string,
        gender: answers.gender as string,
        interested_in: answers.interestedIn as string[],
        graduation_year: answers.graduationYear as string,
        major: answers.major as string,
        height: answers.height as number,
        partner_height_min: answers.partnerHeightMin as number,
        partner_height_max: answers.partnerHeightMax as number,
        survey_completed: true,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (profileError) throw profileError;

      const surveyAnswers = { ...answers };
      delete surveyAnswers.fullName;
      delete surveyAnswers.gender;
      delete surveyAnswers.interestedIn;
      delete surveyAnswers.graduationYear;
      delete surveyAnswers.major;
      delete surveyAnswers.height;
      delete surveyAnswers.partnerHeightMin;
      delete surveyAnswers.partnerHeightMax;

      const { data: existingSurvey } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingSurvey) {
        const { error: updateError } = await supabase
          .from('survey_responses')
          .update({ answers: surveyAnswers, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('survey_responses')
          .insert({ user_id: user.id, answers: surveyAnswers });
        if (insertError) throw insertError;
      }

      toast({
        title: "Saved!",
        description: "Your preferences have been updated.",
      });
    } catch (error: any) {
      console.error("Error saving:", error);
      toast({
        variant: "destructive",
        title: "Error saving",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const interestedIn = (answers.interestedIn as string[]) || [];

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="font-heading font-bold text-3xl mb-2">Settings & Profile</h1>
        <p className="text-muted-foreground">Update your preferences to get better matches.</p>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-border">
          <h2 className="font-heading font-semibold text-xl mb-6">About You</h2>
          
          <div className="flex items-center gap-6 mb-8">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl ${avatarColor}`}>
              {initials}
            </div>
            <div>
              <h3 className="font-bold text-lg">{answers.fullName || userName}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Full Name</Label>
              <Input 
                placeholder="Enter your full name"
                value={(answers.fullName as string) || ""}
                onChange={(e) => setAnswers({ ...answers, fullName: e.target.value })}
                className="h-12 rounded-xl border-2 focus:border-primary"
                data-testid="input-settings-fullname"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">I identify as</Label>
              <RadioGroup 
                value={(answers.gender as string) || ""} 
                onValueChange={(value) => setAnswers({ ...answers, gender: value })}
                className="flex gap-3"
              >
                {["Male", "Female", "Nonbinary"].map((option) => (
                  <label 
                    key={option}
                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      answers.gender === option 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={option} className="sr-only" />
                    <span className={`font-medium ${answers.gender === option ? 'text-primary' : ''}`}>{option}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">I'm interested in matching with</Label>
              <div className="flex gap-3">
                {["Male", "Female", "Nonbinary"].map((option) => {
                  const isSelected = interestedIn.includes(option);
                  return (
                    <label 
                      key={option}
                      className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => handleInterestedIn(option)}
                        className="sr-only"
                      />
                      <span className={`font-medium ${isSelected ? 'text-primary' : ''}`}>{option}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Graduation Year</Label>
                <Select 
                  value={(answers.graduationYear as string) || ""}
                  onValueChange={(value) => setAnswers({ ...answers, graduationYear: value })}
                >
                  <SelectTrigger className="h-12 rounded-xl border-2">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {graduationYears.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Major</Label>
                <SearchableMajorSelect
                  value={(answers.major as string) || ""}
                  onChange={(value) => setAnswers({ ...answers, major: value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold">My Height</Label>
                <span className="text-lg font-bold text-primary">{formatHeight(answers.height as number)}</span>
              </div>
              <Slider
                value={[answers.height as number]}
                onValueChange={(value) => setAnswers({ ...answers, height: value[0] })}
                min={58}
                max={84}
                step={1}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>4'10"</span>
                <span>7'0"</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold">Partner Height Preference</Label>
                <span className="text-lg font-bold text-primary">
                  {formatHeight(answers.partnerHeightMin as number)} - {formatHeight(answers.partnerHeightMax as number)}
                </span>
              </div>
              <Slider
                value={[answers.partnerHeightMin as number, answers.partnerHeightMax as number]}
                onValueChange={(value) => setAnswers({ 
                  ...answers, 
                  partnerHeightMin: value[0],
                  partnerHeightMax: value[1]
                })}
                min={58}
                max={84}
                step={1}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>4'10"</span>
                <span>7'0"</span>
              </div>
            </div>
          </div>
        </div>

        {/* All Survey Questions */}
        {allQuestions.map((q, index) => (
          <div key={q.id} className="bg-white p-6 rounded-3xl shadow-sm border border-border">
            <div className="mb-4">
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                Question {index + 1}
              </span>
              <h3 className="font-heading font-semibold text-lg mt-2">{q.question}</h3>
              {q.type === "multi" && (
                <p className="text-sm text-muted-foreground mt-1">Select up to {q.maxSelect || 5} options</p>
              )}
            </div>

            {q.type === "single" ? (
              <RadioGroup 
                value={(answers[q.id] as string) || ""} 
                onValueChange={(value) => handleAnswer(q.id, value, q.type)}
                className="space-y-2"
              >
                {q.options.map((option) => (
                  <label 
                    key={option}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      answers[q.id] === option 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={option} className="sr-only" />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      answers[q.id] === option ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                    }`}>
                      {answers[q.id] === option && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className={`text-sm ${answers[q.id] === option ? 'text-primary font-medium' : ''}`}>{option}</span>
                  </label>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-2">
                {q.options.map((option) => {
                  const selectedOptions = (answers[q.id] as string[]) || [];
                  const isSelected = selectedOptions.includes(option);
                  const maxSelect = q.maxSelect || 5;
                  const canSelect = isSelected || selectedOptions.length < maxSelect;
                  return (
                    <label 
                      key={option}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/10' 
                          : canSelect 
                            ? 'border-border hover:border-primary/50'
                            : 'border-border/30 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => canSelect && handleAnswer(q.id, option, q.type, q.maxSelect)}
                        disabled={!canSelect}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <span className={`text-sm ${isSelected ? 'text-primary font-medium' : ''}`}>{option}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fixed Save Button */}
      <div className="fixed bottom-20 md:bottom-8 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-2xl mx-auto">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-14 rounded-2xl text-lg font-semibold shadow-lg"
            data-testid="button-save-settings"
          >
            {isSaving ? (
              <>Saving... <Loader2 className="ml-2 w-5 h-5 animate-spin" /></>
            ) : (
              <>Save Changes <Save className="ml-2 w-5 h-5" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
