import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, ArrowLeft, Heart, Sparkles, Users, Calendar, MessageCircle, Zap, Check, User, Search, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const sections = [
  { id: "about", title: "About You", description: "Basic info", icon: User, color: "from-violet-500 to-purple-500" },
  { id: "basics", title: "The Basics", description: "What you're looking for", icon: Heart, color: "from-rose-500 to-pink-500" },
  { id: "personality", title: "Personality & Energy", description: "Vibe check", icon: Users, color: "from-emerald-500 to-teal-500" },
  { id: "life", title: "Lifestyle", description: "How you live & go out", icon: Calendar, color: "from-blue-500 to-indigo-500" },
  { id: "connection", title: "Connection", description: "How you interact", icon: MessageCircle, color: "from-cyan-500 to-blue-500" },
  { id: "dealbreakers", title: "Dealbreakers", description: "Hard filters", icon: Zap, color: "from-rose-500 to-red-500" },
];

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

const graduationYears = ["2026", "2027", "2028", "2029"];

type SurveyData = {
  [key: string]: string | string[] | number | number[] | boolean;
};

function formatHeight(inches: number): string {
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}'${remainingInches}"`;
}

function ScrollableOptions({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showGradient, setShowGradient] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
        const isScrollable = scrollHeight > clientHeight;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        setShowGradient(isScrollable && !isAtBottom);
      }
    };

    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }

    return () => {
      if (el) {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      }
    };
  }, [children]);

  return (
    <div className="relative">
      <div 
        ref={scrollRef}
        className="space-y-4 max-h-[600px] overflow-y-auto pr-2 pb-4"
      >
        {children}
      </div>
      {showGradient && (
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
      )}
    </div>
  );
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

export default function Survey() {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<SurveyData>({
    height: 66,
    partnerHeightMin: 58,
    partnerHeightMax: 78,
  });

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/auth");
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    async function checkSurveyCompleted() {
      if (!user) return;
      
      try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        
        if (!token) {
          setCheckingProfile(false);
          return;
        }

        const response = await fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const profile = await response.json();
      // If survey is already completed, redirect to dashboard
      if (profile?.survey_completed) {
        setLocation("/dashboard");
        return;
      }
        }
      } catch (error) {
        console.error('Error checking profile:', error);
      } finally {
        setCheckingProfile(false);
      }
    }

    if (!loading && user) {
      checkSurveyCompleted();
    }
  }, [user, loading, setLocation]);

  const questions = getQuestionsForSection(currentSection);
  const totalQuestions = sections.reduce((acc, _, idx) => acc + getQuestionsForSection(idx).length, 0);
  const completedQuestions = sections.slice(0, currentSection).reduce((acc, _, idx) => acc + getQuestionsForSection(idx).length, 0) + currentQuestion;
  const progress = Math.min(((completedQuestions + 1) / totalQuestions) * 100, 100);

  const currentQ = questions[currentQuestion];
  const currentAnswer = answers[currentQ?.id];

  const canProceed = (() => {
    if (!currentQ) return false;
    
    if (currentQ.type === "profile") {
      const name = answers.fullName as string;
      const gender = answers.gender as string;
      const interestedIn = answers.interestedIn as string[];
      const major = answers.major as string;
      const gradYear = answers.graduationYear as string;
      
      return !!(name && name.trim().length > 0 && gender && interestedIn && interestedIn.length > 0 && major && gradYear);
    }
    
    if (currentQ.type === "multi") {
      return Array.isArray(currentAnswer) && currentAnswer.length > 0 && currentAnswer.length <= (currentQ.maxSelect || 5);
    }
    
    return !!currentAnswer;
  })();

  const handleAnswer = (value: string) => {
    if (currentQ.type === "multi") {
      const current = (answers[currentQ.id] as string[]) || [];
      const maxSelect = currentQ.maxSelect || 5;
      if (current.includes(value)) {
        setAnswers({ ...answers, [currentQ.id]: current.filter(v => v !== value) });
      } else if (current.length < maxSelect) {
        setAnswers({ ...answers, [currentQ.id]: [...current, value] });
      }
    } else {
      setAnswers({ ...answers, [currentQ.id]: value });
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

  const saveSurveyToSupabase = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
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

      // Filter to only include valid survey questions (exclude profile fields)
      const validQuestionIds = new Set([
        "q1_looking_for",
        "q2_who_to_meet",
        "q_race_ethnicity",
        "q_preferred_race_ethnicity",
        "q_religious_affiliation",
        "q_preferred_religious_affiliation",
        "q3_friday_night",
        "q4_humor",
        "q5_argument",
        "q6_social_battery",
        "q7_hobbies",
        "q8_going_out",
        "q9_alcohol",
        "q10_partner_alcohol",
        "q11_texting",
        "q12_friend_groups",
        "q13_dealbreakers"
      ]);
      
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
        throw new Error(errorData.message || 'Failed to save survey');
      }

      toast({
        title: "Survey complete!",
        description: "Your profile has been saved successfully.",
      });

      setLocation("/dashboard");
    } catch (error: any) {
      console.error("Error saving survey:", error);
      toast({
        variant: "destructive",
        title: "Error saving survey",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentQuestion(0);
    } else {
      saveSurveyToSupabase();
    }
  };

  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      const prevQuestions = getQuestionsForSection(currentSection - 1);
      setCurrentQuestion(prevQuestions.length - 1);
    }
  };

  const isFirstQuestion = currentSection === 0 && currentQuestion === 0;
  const isLastQuestion = currentSection === sections.length - 1 && currentQuestion === questions.length - 1;
  const SectionIcon = sections[currentSection].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-white to-primary/5 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${sections[currentSection].color} flex items-center justify-center shadow-lg`}>
              <SectionIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg">{sections[currentSection].title}</h2>
              <p className="text-sm text-muted-foreground">{sections[currentSection].description}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">{Math.round(progress)}%</span>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>

        <div className="h-2 bg-secondary/20 rounded-full overflow-hidden mb-2">
          <motion.div 
            className={`h-full bg-gradient-to-r ${sections[currentSection].color}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        <div className="flex gap-1 justify-center">
          {sections.map((section, idx) => (
            <div 
              key={section.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx < currentSection ? 'bg-primary w-8' : 
                idx === currentSection ? 'bg-primary/60 w-12' : 
                'bg-secondary/30 w-6'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="w-full max-w-2xl flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentSection}-${currentQuestion}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full flex flex-col"
          >
            <div className="bg-white p-12 rounded-3xl shadow-xl border border-border/50 mb-6 flex-1 min-h-[600px]">
              {currentQ?.type === "profile" ? (
                <ProfileSection 
                  answers={answers} 
                  setAnswers={setAnswers}
                  handleInterestedIn={handleInterestedIn}
                />
              ) : (
                <>
                  <div className="mb-8">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                      Question {completedQuestions + 1} of {totalQuestions}
                    </span>
                    <h3 className="font-heading font-bold text-4xl text-foreground leading-tight">
                      {currentQ?.question}
                    </h3>
                    {currentQ?.type === "multi" && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Select up to {currentQ.maxSelect || 5} options
                      </p>
                    )}
                  </div>

                  <ScrollableOptions>
                    {currentQ?.type === "single" ? (
                      <RadioGroup 
                        value={currentAnswer as string || ""} 
                        onValueChange={handleAnswer}
                        className="space-y-4"
                      >
                        {currentQ.options.map((option, idx) => (
                          <motion.div
                            key={option}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <label 
                              htmlFor={option}
                              className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 ${
                                currentAnswer === option 
                                  ? 'border-primary bg-primary/10 shadow-md' 
                                  : 'border-border/50 bg-white'
                              }`}
                            >
                              <RadioGroupItem value={option} id={option} className="sr-only" />
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                                currentAnswer === option 
                                  ? 'border-primary bg-primary' 
                                  : 'border-muted-foreground/30'
                              }`}>
                                {currentAnswer === option && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-2.5 h-2.5 rounded-full bg-white"
                                  />
                                )}
                              </div>
                              <span className={`flex-1 font-medium text-lg ${currentAnswer === option ? 'text-primary' : 'text-foreground'}`}>
                                {option}
                              </span>
                            </label>
                          </motion.div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {currentQ?.options.map((option, idx) => {
                          const selectedOptions = (currentAnswer as string[]) || [];
                          const isSelected = selectedOptions.includes(option);
                          const maxSelect = currentQ.maxSelect || 5;
                          const canSelect = isSelected || selectedOptions.length < maxSelect;
                          return (
                            <motion.div
                              key={option}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.03 }}
                            >
                              <label 
                                className={`flex items-center gap-3 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                                  isSelected 
                                    ? 'border-primary bg-primary/10 shadow-md' 
                                    : canSelect
                                      ? 'border-border/50 bg-white hover:border-primary/50 hover:bg-primary/5'
                                      : 'border-border/30 bg-gray-50 opacity-50 cursor-not-allowed'
                                }`}
                              >
                                <Checkbox 
                                  checked={isSelected}
                                  onCheckedChange={() => canSelect && handleAnswer(option)}
                                  disabled={!canSelect}
                                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <span className={`flex-1 text-base font-medium ${isSelected ? 'text-primary' : ''}`}>
                                  {option}
                                </span>
                              </label>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollableOptions>
                </>
              )}
            </div>

            <div className="flex justify-between gap-4">
              <Button 
                variant="outline" 
                onClick={prevQuestion} 
                disabled={isFirstQuestion}
                className="rounded-full px-6 h-12 border-2"
                data-testid="button-prev"
              >
                <ArrowLeft className="mr-2 w-4 h-4" /> Back
              </Button>
              <Button 
                onClick={nextQuestion}
                disabled={!canProceed || isSubmitting}
                className={`rounded-full px-8 h-12 shadow-lg transition-all duration-300 ${
                  canProceed && !isSubmitting
                    ? `bg-gradient-to-r ${sections[currentSection].color} hover:shadow-xl hover:scale-105` 
                    : 'bg-muted'
                }`}
                data-testid="button-next"
              >
                {isSubmitting ? (
                  <>Saving... <Loader2 className="ml-2 w-4 h-4 animate-spin" /></>
                ) : isLastQuestion ? (
                  <>Complete <Check className="ml-2 w-4 h-4" /></>
                ) : (
                  <>Next <ArrowRight className="ml-2 w-4 h-4" /></>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ProfileSection({ 
  answers, 
  setAnswers,
  handleInterestedIn 
}: { 
  answers: SurveyData; 
  setAnswers: React.Dispatch<React.SetStateAction<SurveyData>>;
  handleInterestedIn: (value: string) => void;
}) {
  const interestedIn = (answers.interestedIn as string[]) || [];
  
  return (
    <div className="relative">
      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 pb-4">
        <div className="text-center mb-6">
          <h3 className="font-heading font-bold text-2xl text-foreground">Tell us about yourself</h3>
          <p className="text-muted-foreground mt-1">This helps us find your perfect match</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Full Name</Label>
          <Input 
            placeholder="Enter your full name"
            value={(answers.fullName as string) || ""}
            onChange={(e) => setAnswers({ ...answers, fullName: e.target.value })}
            className="h-12 rounded-xl border-2 focus:border-primary"
            data-testid="input-fullname"
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
  );
}

type Question = {
  id: string;
  question: string;
  type: "single" | "multi" | "profile";
  options: string[];
  maxSelect?: number;
};
function getQuestionsForSection(sectionIndex: number): Question[] {
  switch (sectionIndex) {

    // ABOUT YOU
    case 0:
      return [
        {
          id: "profile",
          question: "Tell us about yourself",
          type: "profile",
          options: []
        }
      ];

    // THE BASICS — INTENT & AGE FLEXIBILITY
    case 1:
      return [
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
        }
      ];

    // PERSONALITY & ENERGY — SOCIAL VIBE
    case 2:
      return [
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
        }
      ];

    // LIFESTYLE — ACTIVITY & GOING OUT
    case 3:
      return [
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
        }
      ];

    // CONNECTION — COMMUNICATION & SOCIAL MERGING
    case 4:
      return [
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
        }
      ];

    // DEALBREAKERS — IMMEDIATE BLOCKERS ONLY
    case 5:
      return [
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
        }
      ];

    default:
      return [];
  }
}
