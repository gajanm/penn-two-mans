import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, ArrowLeft, Heart, Sparkles, Users, Calendar, MessageCircle, Zap, Check, User, Search } from "lucide-react";
import { useLocation } from "wouter";

const sections = [
  { id: "about", title: "About You", description: "Let's get to know you", icon: User, color: "from-violet-500 to-purple-500" },
  { id: "basics", title: "The Basics", description: "Let's start simple", icon: Heart, color: "from-rose-500 to-pink-500" },
  { id: "vision", title: "Life Vision & Priorities", description: "Where are you headed?", icon: Sparkles, color: "from-amber-500 to-orange-500" },
  { id: "personality", title: "Your Personality", description: "Who are you really?", icon: Users, color: "from-emerald-500 to-teal-500" },
  { id: "life", title: "Your Life", description: "How do you spend your time?", icon: Calendar, color: "from-blue-500 to-indigo-500" },
  { id: "love", title: "How You Love", description: "Your relationship style", icon: Heart, color: "from-purple-500 to-violet-500" },
  { id: "connection", title: "Staying Connected", description: "Communication matters", icon: MessageCircle, color: "from-cyan-500 to-blue-500" },
  { id: "dealbreakers", title: "The Non-Negotiables", description: "What's off the table?", icon: Zap, color: "from-rose-500 to-red-500" },
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

const graduationYears = ["2025", "2026", "2027", "2028", "2029"];

type SurveyData = {
  [key: string]: string | string[] | number | number[];
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
        className="space-y-3 max-h-[380px] overflow-y-auto pr-2 pb-4"
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
  const [answers, setAnswers] = useState<SurveyData>({
    height: 66,
    partnerHeightMin: 58,
    partnerHeightMax: 78,
  });

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

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentQuestion(0);
    } else {
      setLocation("/dashboard");
    }
  };

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
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-border/50 mb-6 flex-1">
              {currentQ?.type === "profile" ? (
                <ProfileSection 
                  answers={answers} 
                  setAnswers={setAnswers}
                  handleInterestedIn={handleInterestedIn}
                />
              ) : (
                <>
                  <div className="mb-6">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                      Question {completedQuestions + 1} of {totalQuestions}
                    </span>
                    <h3 className="font-heading font-bold text-2xl text-foreground leading-tight">
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
                        className="space-y-3"
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
                              className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 ${
                                currentAnswer === option 
                                  ? 'border-primary bg-primary/10 shadow-md' 
                                  : 'border-border/50 bg-white'
                              }`}
                            >
                              <RadioGroupItem value={option} id={option} className="sr-only" />
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                currentAnswer === option 
                                  ? 'border-primary bg-primary' 
                                  : 'border-muted-foreground/30'
                              }`}>
                                {currentAnswer === option && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-2 h-2 rounded-full bg-white"
                                  />
                                )}
                              </div>
                              <span className={`flex-1 font-medium ${currentAnswer === option ? 'text-primary' : 'text-foreground'}`}>
                                {option}
                              </span>
                            </label>
                          </motion.div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
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
                                <span className={`flex-1 text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>
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
                disabled={!canProceed}
                className={`rounded-full px-8 h-12 shadow-lg transition-all duration-300 ${
                  canProceed 
                    ? `bg-gradient-to-r ${sections[currentSection].color} hover:shadow-xl hover:scale-105` 
                    : 'bg-muted'
                }`}
                data-testid="button-next"
              >
                {isLastQuestion ? (
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
    case 0: // ABOUT YOU (Profile section)
      return [
        {
          id: "profile",
          question: "Tell us about yourself",
          type: "profile",
          options: []
        }
      ];

    case 1: // THE BASICS (3 questions)
      return [
        {
          id: "q1_looking_for",
          question: "What are you looking for?",
          type: "single",
          options: [
            "My person - the real deal",
            "A genuine relationship - something meaningful",
            "Something serious, but I'm not in a rush",
            "Keeping it casual but open to more",
            "Just having fun for now",
            "Honestly? Just seeing where things go"
          ]
        },
        {
          id: "q2_who_to_meet",
          question: "I want to meet:",
          type: "single",
          options: [
            "Anyone at Penn - age is just a number",
            "People within 2 years of me - similar life phase vibes",
            "People within 1 year of me - we're on the same timeline",
            "Only people in my year - we get it"
          ]
        },
        {
          id: "q3_dtr",
          question: "When it comes to defining the relationship:",
          type: "single",
          options: [
            "Slow burn - let's build a friendship first",
            "Let it happen naturally - no pressure",
            "Traditional route - exclusive after a few dates",
            "When you know, you know - I don't waste time",
            "Every connection is different"
          ]
        }
      ];

    case 2: // LIFE VISION & PRIORITIES (3 questions)
      return [
        {
          id: "q4_five_years",
          question: "Picture yourself in 5 years. Where are you?",
          type: "single",
          options: [
            "Killing it in my career in a major city",
            "Deep in grad school or advanced training",
            "Exploring the world before I settle",
            "Actually settled - home, maybe starting a family",
            "Building something of my own - startup, art, passion project",
            "Wherever life takes me - I'm adaptable"
          ]
        },
        {
          id: "q5_kids",
          question: "The whole kids question:",
          type: "single",
          options: [
            "Yes, definitely - I want a few",
            "Probably - one or two sounds right",
            "If my partner wants them, I'm open",
            "Way too soon to decide",
            "Leaning toward no",
            "Hard no - not for me",
            "Adoption or fostering feels more my speed"
          ]
        },
        {
          id: "q6_values",
          question: "What actually matters to you?",
          type: "multi",
          maxSelect: 3,
          options: [
            "Family and the people closest to me",
            "Crushing my career goals",
            "Constantly growing and evolving as a person",
            "Adventures and making memories",
            "Financial stability and security",
            "Actually making a difference in the world",
            "Creative expression and authenticity",
            "Learning and intellectual stimulation",
            "Health and taking care of myself",
            "My community and friendships"
          ]
        }
      ];

    case 3: // YOUR PERSONALITY (6 questions)
      return [
        {
          id: "q7_friday_night",
          question: "It's Friday night. Where am I?",
          type: "single",
          options: [
            "Somewhere with a crowd - party, bar, living it up",
            "Good food and conversation with my people",
            "Something random - concert, new restaurant, spontaneous plan",
            "Low-key vibes - movie or game night",
            "Hopefully on a date",
            "In my zone - personal project time",
            "Getting a workout in or playing sports",
            "Literally anywhere - I go with the flow"
          ]
        },
        {
          id: "q8_decisions",
          question: "Big decision time. What's your move?",
          type: "single",
          options: [
            "Gut feeling all the way",
            "Let me think this through logically",
            "Group chat consultation required",
            "Time for a pros and cons list",
            "Whatever feels right right now",
            "Head and heart - I need both"
          ]
        },
        {
          id: "q9_rough_day",
          question: "You're having a really rough day. What do you need from someone you're dating?",
          type: "single",
          options: [
            "Tell me what to do - I need solutions",
            "Just listen and validate what I'm feeling",
            "Get my mind off it - let's do something fun",
            "Give me space, but be ready when I'm ready to talk",
            "Actually help me fix the problem",
            "Let me be mad and be mad with me",
            "Just ask - I'll tell you what I need"
          ]
        },
        {
          id: "q10_humor",
          question: "Your humor style is:",
          type: "single",
          options: [
            "Sharp and sarcastic - I'm basically a comedy writer",
            "Unserious and ridiculous - can't take me anywhere",
            "Dry delivery - subtlety is an art",
            "Dark - nothing is off limits",
            "Roasting people I love is my love language",
            "Aggressively wholesome - yes, I make dad jokes",
            "I find the funny in everyday chaos",
            "Silly and physical - I'll do anything for a laugh"
          ]
        },
        {
          id: "q11_argument",
          question: "Mid-argument with someone you care about:",
          type: "single",
          options: [
            "I'm passionate and I'm making my case",
            "Let's figure this out together right now",
            "I need 20 minutes to not say something I'll regret",
            "I'm probably crying but we'll work it out",
            "Can we not fight? This is uncomfortable",
            "Help me see your side - I want to understand",
            "Joke about it? Please?"
          ]
        },
        {
          id: "q12_social_battery",
          question: "Social battery check:",
          type: "single",
          options: [
            "Extreme introvert - people are exhausting",
            "Introvert-leaning - small groups are my limit",
            "Right in the middle - depends on the day",
            "Extrovert-leaning - I like being around people",
            "Extreme extrovert - alone time makes me sad"
          ]
        }
      ];

    case 4: // YOUR LIFE (9 questions - with drinking and weed partner preferences)
      return [
        {
          id: "q13_hobbies",
          question: "Things I actually do with my time:",
          type: "multi",
          maxSelect: 5,
          options: [
            "Play sports - I'm competitive",
            "Live at the gym",
            "Outdoor adventures - hiking, camping, nature stuff",
            "Make things - art, music, writing, photos",
            "Perform - theater, dance, any stage really",
            "Game hard - video games, board games, all of it",
            "Always reading something",
            "Foodie life - cooking or trying restaurants",
            "Watch sports religiously",
            "Out at night - clubs, parties, the scene",
            "Greek life is my whole thing",
            "Research nerd - I love going deep on topics",
            "Fashion matters to me",
            "Travel whenever possible",
            "Binge-watching is valid self-care",
            "Wellness and mindfulness stuff"
          ]
        },
        {
          id: "q14_new_experiences",
          question: "Someone suggests something you've never done before:",
          type: "single",
          options: [
            "Say less - I'm immediately in",
            "I love new experiences - count me in",
            "If my friends are going, I'm down",
            "Maybe if it sounds fun and safe",
            "I like what I like - probably not",
            "I need advance notice and a full itinerary"
          ]
        },
        {
          id: "q15_going_out",
          question: "How often do you go out (parties, bars, clubs)?",
          type: "single",
          options: [
            "Multiple times a week - it's a big part of my life",
            "Most weekends - Thursday through Saturday",
            "Some weekends - maybe twice a month",
            "Occasionally - once a month or for special events",
            "Rarely - a few times a semester",
            "Never - not my scene at all"
          ]
        },
        {
          id: "q16_alcohol",
          question: "Your relationship with alcohol:",
          type: "single",
          options: [
            "I don't drink at all",
            "Very rarely - maybe a few times a year",
            "Occasionally - special occasions and events",
            "Socially - most weekends when I go out",
            "Regularly - it's part of my social life",
            "Still figuring out my limits and preferences"
          ]
        },
        {
          id: "q17_partner_alcohol",
          question: "How do you feel about a partner who drinks?",
          type: "single",
          options: [
            "They shouldn't drink at all - dealbreaker for me",
            "Rarely is fine - special occasions only",
            "Occasionally is okay - not too often",
            "Socially is totally fine - most weekends",
            "However much they want - doesn't bother me",
            "As long as it's responsible, I don't care"
          ]
        },
        {
          id: "q18_weed",
          question: "Your relationship with weed:",
          type: "single",
          options: [
            "I don't smoke and prefer not to be around it",
            "I don't smoke but don't mind if others do",
            "Occasionally - like a few times a semester",
            "Socially - when I'm out with friends",
            "Regularly - it's part of my routine",
            "Daily or near-daily",
            "Not my thing but totally fine with it"
          ]
        },
        {
          id: "q19_partner_weed",
          question: "How do you feel about a partner who smokes weed?",
          type: "single",
          options: [
            "They shouldn't smoke at all - dealbreaker",
            "Very occasionally is okay - rarely",
            "Socially is fine - when out with friends",
            "Regularly is fine - doesn't bother me",
            "However much they want - their choice",
            "Prefer they don't but not a dealbreaker"
          ]
        },
        {
          id: "q20_mess",
          question: "The mess tolerance question:",
          type: "single",
          options: [
            "Everything has a place and it better be there",
            "I'm pretty clean - it matters to me",
            "Organized enough - I know where things are",
            "I clean when it gets bad",
            "Mess doesn't bother me at all"
          ]
        },
        {
          id: "q21_morning_night",
          question: "Morning person or night owl?",
          type: "single",
          options: [
            "Up early crushing it",
            "Morning-ish but flexible",
            "Whatever works - I adapt",
            "Better at night but I can do mornings",
            "100% night owl - don't talk to me before 10am"
          ]
        }
      ];

    case 5: // HOW YOU LOVE (5 questions)
      return [
        {
          id: "q22_show_interest",
          question: "The way you show someone you're into them:",
          type: "single",
          options: [
            "Touch - I'm naturally physically affectionate",
            "Time - giving you my full attention",
            "Words - I'll tell you how I feel",
            "Actions - doing things to make your life easier",
            "Small thoughtful things that show I remember",
            "Experiences - making memories together",
            "Hyping you up and supporting your dreams"
          ]
        },
        {
          id: "q23_dynamic",
          question: "Your ideal relationship dynamic:",
          type: "single",
          options: [
            "Pretty much joined at the hip",
            "Mostly together, some independence",
            "50/50 - balance is key",
            "Mostly separate lives that overlap nicely",
            "Very independent with intentional quality time",
            "Depends on the phase we're in"
          ]
        },
        {
          id: "q24_emotional",
          question: "Opening up emotionally:",
          type: "single",
          options: [
            "I'm an open book from day one",
            "Slow to trust, but then all in",
            "Gradual - I share as I get comfortable",
            "I keep some walls up",
            "I want to open up but it's hard for me",
            "Pretty private with feelings"
          ]
        },
        {
          id: "q25_privacy",
          question: "The privacy talk:",
          type: "single",
          options: [
            "Full transparency - passwords and all",
            "Pretty open but we're still individuals",
            "Open communication, personal boundaries respected",
            "Tell me the important stuff, live your life",
            "I need a lot of personal space"
          ]
        },
        {
          id: "q26_physical",
          question: "Physical affection in a relationship:",
          type: "single",
          options: [
            "Constant - I'm very touchy",
            "Regular - it's important to me",
            "Moderate - balanced with everything else",
            "Occasional - I like it but don't need it all the time",
            "Not my main thing - other stuff matters more"
          ]
        }
      ];

    case 6: // STAYING CONNECTED (2 questions)
      return [
        {
          id: "q27_texting",
          question: "Your texting personality:",
          type: "single",
          options: [
            "Constant stream of consciousness all day",
            "Frequent - good morning/goodnight type",
            "Daily convos when there's something to say",
            "When something actually matters",
            "Honestly not a big texter - rather see you",
            "Pretty independent - we'll link when we link"
          ]
        },
        {
          id: "q28_friend_groups",
          question: "Friend groups and relationships:",
          type: "single",
          options: [
            "All my friends are your friends and vice versa",
            "I want everyone to get along and hang out",
            "Separate squads that sometimes overlap",
            "Totally separate is fine",
            "You need to vibe with my core group though",
            "We should each keep our own friendships"
          ]
        }
      ];

    case 7: // THE NON-NEGOTIABLES (1 question)
      return [
        {
          id: "q29_dealbreakers",
          question: "Absolute deal-breakers:",
          type: "multi",
          maxSelect: 5,
          options: [
            "Different views on having kids",
            "Very different relationship with substances",
            "No ambition or drive",
            "All work, no balance",
            "Shuts down instead of communicating",
            "Rude to my friends or family",
            "Extreme introvert/extrovert clash",
            "Completely different money values",
            "Won't explore Philly with me",
            "Can't be emotionally open",
            "Different views on exclusivity/monogamy",
            "Zero shared interests",
            "None - I'm pretty open-minded"
          ]
        }
      ];

    default:
      return [];
  }
}
