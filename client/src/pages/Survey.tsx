import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, Heart, Sparkles, Users, Calendar, MessageCircle, Home, Check, Zap } from "lucide-react";
import { useLocation } from "wouter";

const sections = [
  { id: "basics", title: "The Basics", description: "Let's start simple", icon: Heart, color: "from-rose-500 to-pink-500" },
  { id: "vision", title: "Life Vision & Priorities", description: "Where are you headed?", icon: Sparkles, color: "from-amber-500 to-orange-500" },
  { id: "personality", title: "Your Personality", description: "Who are you really?", icon: Users, color: "from-emerald-500 to-teal-500" },
  { id: "life", title: "Your Life", description: "How do you spend your time?", icon: Calendar, color: "from-blue-500 to-indigo-500" },
  { id: "love", title: "How You Love", description: "Your relationship style", icon: Heart, color: "from-purple-500 to-violet-500" },
  { id: "connection", title: "Staying Connected", description: "Communication matters", icon: MessageCircle, color: "from-cyan-500 to-blue-500" },
  { id: "dealbreakers", title: "The Non-Negotiables", description: "What's off the table?", icon: Zap, color: "from-rose-500 to-red-500" },
];

type SurveyData = {
  [key: string]: string | string[];
};

export default function Survey() {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [, setLocation] = useLocation();
  const [answers, setAnswers] = useState<SurveyData>({});

  const questions = getQuestionsForSection(currentSection);
  const totalQuestions = sections.reduce((acc, _, idx) => acc + getQuestionsForSection(idx).length, 0);
  const completedQuestions = sections.slice(0, currentSection).reduce((acc, _, idx) => acc + getQuestionsForSection(idx).length, 0) + currentQuestion;
  const progress = Math.min(((completedQuestions + 1) / totalQuestions) * 100, 100);

  const currentQ = questions[currentQuestion];
  const currentAnswer = answers[currentQ?.id];

  const canProceed = currentQ?.type === "multi" 
    ? Array.isArray(currentAnswer) && currentAnswer.length > 0 && currentAnswer.length <= (currentQ.maxSelect || 999)
    : !!currentAnswer;

  const handleAnswer = (value: string) => {
    if (currentQ.type === "multi") {
      const current = (answers[currentQ.id] as string[]) || [];
      const maxSelect = currentQ.maxSelect || 999;
      if (current.includes(value)) {
        setAnswers({ ...answers, [currentQ.id]: current.filter(v => v !== value) });
      } else if (current.length < maxSelect) {
        setAnswers({ ...answers, [currentQ.id]: [...current, value] });
      }
    } else {
      setAnswers({ ...answers, [currentQ.id]: value });
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
              <div className="mb-6">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                  Question {completedQuestions + 1} of {totalQuestions}
                </span>
                <h3 className="font-heading font-bold text-2xl text-foreground leading-tight">
                  {currentQ?.question}
                </h3>
                {currentQ?.type === "multi" && currentQ.maxSelect && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Pick your top {currentQ.maxSelect}
                  </p>
                )}
                {currentQ?.type === "multi" && !currentQ.maxSelect && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Check whatever applies
                  </p>
                )}
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
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
                      const isSelected = Array.isArray(currentAnswer) && currentAnswer.includes(option);
                      return (
                        <motion.div
                          key={option}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.03 }}
                        >
                          <label 
                            className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 ${
                              isSelected 
                                ? 'border-primary bg-primary/10 shadow-md' 
                                : 'border-border/50 bg-white'
                            }`}
                          >
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={() => handleAnswer(option)}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <span className={`flex-1 text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                              {option}
                            </span>
                          </label>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
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

type Question = {
  id: string;
  question: string;
  type: "single" | "multi";
  options: string[];
  maxSelect?: number;
};

function getQuestionsForSection(sectionIndex: number): Question[] {
  switch (sectionIndex) {
    case 0: // THE BASICS (3 questions)
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

    case 1: // LIFE VISION & PRIORITIES (3 questions)
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

    case 2: // YOUR PERSONALITY (6 questions)
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

    case 3: // YOUR LIFE (5 questions)
      return [
        {
          id: "q13_hobbies",
          question: "Things I actually do with my time:",
          type: "multi",
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
          question: "Your relationship with going out:",
          type: "single",
          options: [
            "I don't drink - personal choice",
            "Barely ever - special occasions only",
            "Yeah I go out - it's part of college",
            "Going out is definitely part of my social life",
            "I also smoke occasionally",
            "I smoke pretty regularly",
            "Still figuring out my vibe"
          ]
        },
        {
          id: "q16_mess",
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
          id: "q17_morning_night",
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

    case 4: // HOW YOU LOVE (5 questions)
      return [
        {
          id: "q18_show_interest",
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
          id: "q19_dynamic",
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
          id: "q20_emotional",
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
          id: "q21_privacy",
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
          id: "q22_physical",
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

    case 5: // STAYING CONNECTED (2 questions)
      return [
        {
          id: "q23_texting",
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
          id: "q24_friend_groups",
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

    case 6: // THE NON-NEGOTIABLES (1 question)
      return [
        {
          id: "q25_dealbreakers",
          question: "Absolute deal-breakers:",
          type: "multi",
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
