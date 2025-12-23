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
  [key: string]: string | string[] | number | number[] | boolean;
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

// Questions must match exactly with Survey.tsx getQuestionsForSection()
const allQuestions = [
  { 
    id: "q1_looking_for", 
    question: "What are you looking for?", 
    type: "single", 
    options: [
      "Just seeing where things go",
      "Just having fun for now",
      "Keeping it casual but open to more",
      "Something serious, but not in a rush",
      "A genuine relationship",
      "My person — the real deal"
    ] 
  },
  { 
    id: "q2_who_to_meet", 
    question: "I want to meet:", 
    type: "single", 
    options: [
      "Only people in my year",
      "People within 1 year of me",
      "People within 2 years of me",
      "Anyone at Penn — age is just a number"
    ] 
  },
  {
    id: "q_race_ethnicity",
    question: "Race / Ethnicity:",
    type: "multi",
    maxSelect: 10,
    options: [
      "African",
      "Asian (East)",
      "Asian (South)",
      "Asian (Southeast)",
      "Black / African American",
      "Hispanic / Latinx",
      "Middle Eastern / North African",
      "Native American / Alaskan Native",
      "Native Hawaiian / Pacific Islander",
      "White"
    ]
  },
  {
    id: "q_preferred_race_ethnicity",
    question: "I would prefer if my match was of one of the following ethnicities:",
    type: "multi",
    maxSelect: 11,
    options: [
      "No preference",
      "African",
      "Asian (East)",
      "Asian (South)",
      "Asian (Southeast)",
      "Black / African American",
      "Hispanic / Latinx",
      "Middle Eastern / North African",
      "Native American / Alaskan Native",
      "Native Hawaiian / Pacific Islander",
      "White"
    ]
  },
  {
    id: "q_religious_affiliation",
    question: "My religious affiliation:",
    type: "multi",
    maxSelect: 12,
    options: [
      "Agnostic",
      "Atheist",
      "Buddhist",
      "Catholic",
      "Hindu",
      "Jewish",
      "Mormon",
      "Muslim",
      "Protestant",
      "Spiritual but not religious",
      "Christian (Other)",
      "Other"
    ]
  },
  {
    id: "q_preferred_religious_affiliation",
    question: "I would prefer if my match was of one of the following religions:",
    type: "multi",
    maxSelect: 13,
    options: [
      "No preference",
      "Agnostic",
      "Atheist",
      "Buddhist",
      "Catholic",
      "Hindu",
      "Jewish",
      "Mormon",
      "Muslim",
      "Protestant",
      "Spiritual but not religious",
      "Christian (Other)",
      "Other"
    ]
  },
  { 
    id: "q3_friday_night", 
    question: "It's Friday night. Where am I?", 
    type: "single", 
    options: [
      "Low-key in my dorm or chilling quietly alone",
      "Studying in a GSR at Huntsman",
      "Hanging with a small group of friends",
      "Good food and conversation",
      "Something spontaneous or random",
      "Out with a crowd — party or bar",
      "Literally anywhere — go with the flow"
    ] 
  },
  { 
    id: "q4_humor", 
    question: "Your humor style is:", 
    type: "single", 
    options: [
      "Dry and subtle",
      "Sharp and sarcastic",
      "Dark",
      "Finding humor in everyday chaos",
      "Unserious and ridiculous",
      "Silly and physical",
      "Aggressively wholesome"
    ] 
  },
  { 
    id: "q5_argument", 
    question: "Mid-argument with someone you care about:", 
    type: "single", 
    options: [
      "I avoid conflict if possible",
      "I need space to cool off first",
      "I try to understand their side",
      "Let's talk it through calmly",
      "I'm emotional but communicative",
      "I'm passionate and make my case",
      "I joke to diffuse tension"
    ] 
  },
  { 
    id: "q6_social_battery", 
    question: "Social battery check:", 
    type: "single", 
    options: [
      "Extreme introvert",
      "Introvert-leaning",
      "Right in the middle",
      "Extrovert-leaning",
      "Extreme extrovert"
    ] 
  },
  { 
    id: "q7_hobbies", 
    question: "Things I actually do with my time:", 
    type: "multi", 
    maxSelect: 5, 
    options: [
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
    ] 
  },
  { 
    id: "q8_going_out", 
    question: "How often do you go out?", 
    type: "single", 
    options: [
      "Never",
      "Rarely",
      "Occasionally",
      "Some weekends",
      "Most weekends",
      "Multiple times a week"
    ] 
  },
  { 
    id: "q9_alcohol", 
    question: "Your relationship with alcohol:", 
    type: "single", 
    options: [
      "I don't drink",
      "Very rarely",
      "Occasionally",
      "Socially",
      "Regularly"
    ] 
  },
  { 
    id: "q10_partner_alcohol", 
    question: "How do you feel about a partner who drinks?", 
    type: "single", 
    options: [
      "Dealbreaker",
      "Only rarely",
      "Occasionally is fine",
      "Socially is fine",
      "Doesn't bother me at all"
    ] 
  },
  { 
    id: "q11_texting", 
    question: "Your texting personality:", 
    type: "single", 
    options: [
      "Only when something matters",
      "Not a big texter",
      "Daily when there's something to say",
      "Frequent check-ins",
      "Constant all day"
    ] 
  },
  { 
    id: "q12_friend_groups", 
    question: "Friend groups and relationships:", 
    type: "single", 
    options: [
      "Totally separate is fine",
      "Separate squads that overlap sometimes",
      "We keep our own friendships",
      "Everyone should get along",
      "All my friends are your friends"
    ] 
  },
  { 
    id: "q13_dealbreakers", 
    question: "Absolute deal-breakers:", 
    type: "multi", 
    maxSelect: 2, 
    options: [
      "Very different relationship with substances",
      "Shuts down instead of communicating",
      "Rude to my friends or family",
      "Extreme introvert/extrovert mismatch",
      "Zero shared interests",
      "None — I'm pretty open-minded"
    ] 
  },
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
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        
        if (!token) {
          setIsLoading(false);
          return;
        }

        const [profileRes, surveyRes] = await Promise.all([
          fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/survey', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        let profile = null;
        let survey = null;

        if (profileRes.ok) {
          profile = await profileRes.json();
        }
        if (surveyRes.ok) {
          survey = await surveyRes.json();
        }

        // Start with defaults
        const loadedAnswers: SurveyData = {
          height: profile?.height || 66,
          partnerHeightMin: profile?.partner_height_min || 58,
          partnerHeightMax: profile?.partner_height_max || 78,
          fullName: profile?.full_name || '',
          gender: profile?.gender || '',
          interestedIn: profile?.interested_in || [],
          graduationYear: profile?.graduation_year || '',
          major: profile?.major || '',
        };

        // Merge survey answers if they exist
        // The API returns: { id, user_id, answers: {...}, created_at, updated_at }
        // or { answers: {} } if no survey exists (from routes.ts line 349)
        const surveyAnswers = survey?.answers;
        
        if (surveyAnswers && typeof surveyAnswers === 'object' && Object.keys(surveyAnswers).length > 0) {
          // Only include valid question IDs from allQuestions
          const validQuestionIds = new Set(allQuestions.map(q => q.id));
          
          // Copy all valid survey answers
          Object.keys(surveyAnswers).forEach(key => {
            if (validQuestionIds.has(key)) {
              const value = surveyAnswers[key];
              // Ensure arrays are properly formatted
              if (Array.isArray(value)) {
                loadedAnswers[key] = [...value];
              } else if (value !== null && value !== undefined && value !== '') {
                loadedAnswers[key] = value;
              }
            }
          });
        }

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
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error("Not authenticated");
      }

      const profileData = {
        full_name: answers.fullName as string,
        gender: answers.gender as string,
        interested_in: answers.interestedIn as string[],
        graduation_year: answers.graduationYear as string,
        major: answers.major as string,
        height: answers.height as number,
        partner_height_min: answers.partnerHeightMin as number,
        partner_height_max: answers.partnerHeightMax as number,
      };

      // Filter to only include the questions that match Survey.tsx
      const validQuestionIds = new Set(allQuestions.map(q => q.id));
      const surveyAnswers: Record<string, any> = {};
      
      // Only include answers for valid question IDs
      Object.keys(answers).forEach(key => {
        if (validQuestionIds.has(key)) {
          surveyAnswers[key] = answers[key];
        }
      });
      
      // Explicitly remove profile fields (these go to profileData, not surveyAnswers)
      delete surveyAnswers.fullName;
      delete surveyAnswers.gender;
      delete surveyAnswers.interestedIn;
      delete surveyAnswers.graduationYear;
      delete surveyAnswers.major;
      delete surveyAnswers.height;
      delete surveyAnswers.partnerHeightMin;
      delete surveyAnswers.partnerHeightMax;

      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: surveyAnswers,
          profileData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save');
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
                  {(answers.noHeightPreference as boolean) 
                    ? "No preference" 
                    : `${formatHeight(answers.partnerHeightMin as number)} - ${formatHeight(answers.partnerHeightMax as number)}`
                  }
                </span>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox
                  id="no-height-preference"
                  checked={(answers.noHeightPreference as boolean) || false}
                  onCheckedChange={(checked) => setAnswers({ 
                    ...answers, 
                    noHeightPreference: checked as boolean
                  })}
                />
                <Label htmlFor="no-height-preference" className="text-sm cursor-pointer">
                  No preference
                </Label>
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
                disabled={(answers.noHeightPreference as boolean) || false}
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
