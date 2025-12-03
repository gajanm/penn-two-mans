import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, Heart, Sparkles, Users, Calendar, MessageCircle, Home, Check } from "lucide-react";
import { useLocation } from "wouter";

const sections = [
  { id: "intentions", title: "Relationship Intentions", description: "What are you looking for?", icon: Heart, color: "from-rose-500 to-pink-500" },
  { id: "values", title: "Core Values & Beliefs", description: "What matters most to you?", icon: Sparkles, color: "from-amber-500 to-orange-500" },
  { id: "personality", title: "Personality", description: "How do you connect?", icon: Users, color: "from-emerald-500 to-teal-500" },
  { id: "lifestyle", title: "Lifestyle", description: "How do you spend your time?", icon: Calendar, color: "from-blue-500 to-indigo-500" },
  { id: "intimacy", title: "Partnership Style", description: "How do you love?", icon: Heart, color: "from-purple-500 to-violet-500" },
  { id: "communication", title: "Communication", description: "How do you connect?", icon: MessageCircle, color: "from-cyan-500 to-blue-500" },
  { id: "future", title: "Future & Deal-Breakers", description: "What's non-negotiable?", icon: Home, color: "from-rose-500 to-red-500" },
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
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <h3 className="font-heading font-bold text-2xl text-foreground leading-tight">
                  {currentQ?.question}
                </h3>
                {currentQ?.type === "multi" && currentQ.maxSelect && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Select up to {currentQ.maxSelect} options
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
    case 0: // Relationship Intentions & Basics
      return [
        {
          id: "q1_looking_for",
          question: "What are you looking for?",
          type: "single",
          options: [
            "Life partner",
            "Long-term relationship",
            "Long-term relationship, open to short",
            "Short-term relationship, open to long",
            "Short-term relationship",
            "Exploring and seeing what feels right"
          ]
        },
        {
          id: "q2_graduation_match",
          question: "I only want to be matched with:",
          type: "single",
          options: [
            "People in any graduation year",
            "People within 2 years of me",
            "People within 1 year of me",
            "People in my year only"
          ]
        },
        {
          id: "q3_timeline",
          question: "My ideal relationship timeline looks like:",
          type: "single",
          options: [
            "Taking things very slow - friendship first, romance later",
            "Natural progression - let things unfold organically",
            "Moderate pace - exclusivity within a few dates",
            "Moving quickly - I know what I want when I feel it",
            "No timeline - every connection is different"
          ]
        },
        {
          id: "q4_five_years",
          question: "When I imagine my life 5 years from now, I see myself:",
          type: "single",
          options: [
            "Established in my career in a major city",
            "Pursuing graduate school or advanced training",
            "Traveling and exploring before settling down",
            "Building a home and possibly starting a family",
            "Entrepreneurial ventures or creative pursuits",
            "Following opportunities wherever they lead",
            "Making an impact through activism or service"
          ]
        }
      ];

    case 1: // Core Values & Beliefs
      return [
        {
          id: "q5_religion",
          question: "My religious/spiritual identity is:",
          type: "single",
          options: [
            "Christian (practicing regularly)",
            "Christian (culturally/occasionally)",
            "Jewish (practicing regularly)",
            "Jewish (culturally/occasionally)",
            "Muslim (practicing regularly)",
            "Muslim (culturally/occasionally)",
            "Hindu, Buddhist, or other Eastern religion",
            "Spiritual but not religious",
            "Agnostic - questioning and open",
            "Atheist - not religious",
            "Other or prefer to describe myself differently"
          ]
        },
        {
          id: "q6_partner_religion",
          question: "Regarding my partner's religious/spiritual beliefs:",
          type: "single",
          options: [
            "Must share my specific religious tradition",
            "Should share my general faith category",
            "Must be religious/spiritual, any tradition welcome",
            "Should be open-minded and respectful, any background okay",
            "Prefer similar views but not a deal-breaker",
            "Religion doesn't factor into my compatibility needs"
          ]
        },
        {
          id: "q7_causes",
          question: "The social causes I care most about are:",
          type: "multi",
          maxSelect: 3,
          options: [
            "Climate change and environmental justice",
            "Racial justice and equality",
            "LGBTQ+ rights",
            "Women's rights and gender equality",
            "Economic inequality and workers' rights",
            "Immigration and refugee rights",
            "Education access and reform",
            "Healthcare access",
            "Criminal justice reform",
            "International human rights",
            "Animal welfare",
            "Religious freedom",
            "I'm not particularly activist-oriented"
          ]
        },
        {
          id: "q8_values_engagement",
          question: "How I engage with my values:",
          type: "single",
          options: [
            "Very active - volunteering, organizing, advocacy work",
            "Moderately active - I participate when I can",
            "Supportive - I stay informed and donate",
            "Personal - I live my values but don't organize",
            "Private - these are personal matters to me"
          ]
        }
      ];

    case 2: // Personality & Emotional Compatibility
      return [
        {
          id: "q9_friday_night",
          question: "On a typical Friday night, you'll find me:",
          type: "single",
          options: [
            "At a party, bar, or social event with lots of people",
            "At a dinner party or gathering with close friends",
            "Trying something new - concert, event, restaurant",
            "Having a movie night or game night with a few people",
            "On a date or quality time with someone special",
            "Reading, studying, or working on personal projects",
            "At the gym, playing sports, or doing outdoor activities",
            "Genuinely could be any of these - I'm spontaneous"
          ]
        },
        {
          id: "q10_decisions",
          question: "When making big decisions, I:",
          type: "single",
          options: [
            "Trust my gut and intuition above all",
            "Analyze all the data and think it through logically",
            "Seek advice from friends and family first",
            "Make pro/con lists and weigh options carefully",
            "Go with what feels right in the moment",
            "Pray, meditate, or seek spiritual guidance",
            "Combine logic and emotion to find balance"
          ]
        },
        {
          id: "q11_difficult_time",
          question: "When I'm going through a difficult time, I need my partner to:",
          type: "single",
          options: [
            "Give me practical advice and help me problem-solve",
            "Listen without judgment and validate my feelings",
            "Distract me with fun activities and positivity",
            "Give me space to process, then be there when I'm ready",
            "Take action to help fix the situation",
            "Match my energy and vent with me",
            "Ask me what I need rather than assume"
          ]
        },
        {
          id: "q12_humor",
          question: "My sense of humor is best described as:",
          type: "single",
          options: [
            "Witty and sarcastic - I love clever wordplay",
            "Goofy and silly - I don't take life too seriously",
            "Dry and deadpan - subtle jokes are my thing",
            "Dark humor - I laugh at uncomfortable things",
            "Playful teasing - I show affection through jokes",
            "Wholesome and pun-based - dad jokes forever",
            "Observational and storytelling - I find humor in everyday life",
            "Physical comedy and goofiness"
          ]
        },
        {
          id: "q13_arguments",
          question: "In arguments, I tend to:",
          type: "single",
          options: [
            "Stand firm on my perspective and debate passionately",
            "Seek compromise and find middle ground quickly",
            "Need time to cool off before discussing rationally",
            "Get emotional first, then work toward resolution",
            "Avoid confrontation and try to keep the peace",
            "Focus on understanding their perspective deeply",
            "Use humor to diffuse tension"
          ]
        }
      ];

    case 3: // Lifestyle & Daily Rhythms
      return [
        {
          id: "q14_hobbies",
          question: "My hobbies and interests include:",
          type: "multi",
          maxSelect: 6,
          options: [
            "Playing sports (varsity, club, intramural)",
            "Fitness and working out regularly",
            "Outdoor activities (hiking, camping, nature)",
            "Creative arts (painting, music, writing, photography)",
            "Performing arts (theater, dance, improv)",
            "Gaming (video games, board games, card games)",
            "Reading and literature",
            "Cooking and exploring food culture",
            "Following sports as a fan",
            "Clubbing and nightlife scene",
            "Activism and community organizing",
            "Greek life and social organizations",
            "Academic research or intellectual pursuits",
            "Fashion and personal style",
            "Travel and exploring new places",
            "Netflix/TV show marathons",
            "Meditation, yoga, wellness practices"
          ]
        },
        {
          id: "q15_new_experiences",
          question: "How I approach new experiences:",
          type: "single",
          options: [
            "Thrillseeker - I'm always seeking adventure and adrenaline",
            "Enthusiastically open - I love trying new things",
            "Selectively adventurous - new experiences with familiar people",
            "Cautiously curious - I'll try things if they seem safe/fun",
            "Prefer the familiar - I like my routines and comfort zone",
            "Spontaneity stresses me out - I need to plan ahead"
          ]
        },
        {
          id: "q16_substances",
          question: "My relationship with substances:",
          type: "single",
          options: [
            "I don't drink alcohol at all (personal/religious choice)",
            "Rare drinker - only special occasions, 1-2 drinks max",
            "Social drinker - I enjoy drinking at parties/bars regularly",
            "Party culture enthusiast - drinking is part of my social life",
            "I use marijuana occasionally",
            "I use marijuana regularly",
            "I'm exploring what works for me",
            "Sober lifestyle is important to me"
          ]
        },
        {
          id: "q17_ambition",
          question: "The role of ambition and achievement in my life:",
          type: "single",
          options: [
            "Extremely driven - grades, career, success are top priorities",
            "Very ambitious - I work hard but maintain balance",
            "Balanced approach - success matters but so does enjoyment",
            "Go with the flow - I'm more about experiences than achievement",
            "Low-key about achievement - I'm here for learning and growth",
            "Still figuring out what drives me"
          ]
        }
      ];

    case 4: // Intimacy & Partnership Style
      return [
        {
          id: "q18_love_language",
          question: "The way I express love and affection is primarily through:",
          type: "single",
          options: [
            "Physical touch - cuddling, holding hands, physical closeness",
            "Quality time - deep conversations and undivided attention",
            "Words of affirmation - expressing feelings verbally and often",
            "Acts of service - doing thoughtful things to help",
            "Thoughtful gestures - remembering details and giving gifts",
            "Shared experiences - making memories together",
            "Support - being there for goals and challenges"
          ]
        },
        {
          id: "q19_balance",
          question: "In a relationship, my ideal balance is:",
          type: "single",
          options: [
            "Very interdependent - we do most things together",
            "Mostly together - shared life with some separate interests",
            "Balanced - equal time together and pursuing own things",
            "Mostly independent - separate lives that intersect meaningfully",
            "Very independent - strong autonomy with quality moments",
            "Varies by phase - sometimes closer, sometimes more space"
          ]
        },
        {
          id: "q20_emotional_intimacy",
          question: "When it comes to emotional intimacy, I:",
          type: "single",
          options: [
            "Open up quickly and deeply - vulnerability comes naturally",
            "Take time to trust, but then share everything",
            "Share gradually as trust builds over time",
            "Keep some emotional walls up even in relationships",
            "Struggle with vulnerability but want to work on it",
            "Prefer to keep deep emotions private"
          ]
        },
        {
          id: "q21_privacy",
          question: "My boundaries around privacy and sharing:",
          type: "single",
          options: [
            "Completely open book - shared passwords, locations, full transparency",
            "Mostly transparent - trust but verify when needed",
            "Balanced - open communication but respect for privacy",
            "Autonomous - separate lives with updates on important things",
            "Very private - need significant personal space and boundaries"
          ]
        }
      ];

    case 5: // Communication & Social Dynamics
      return [
        {
          id: "q22_communication",
          question: "My communication style in relationships:",
          type: "single",
          options: [
            "Constant communication - texting throughout the day",
            "Frequent check-ins - morning and evening texts plus calls",
            "Regular updates - daily conversation when we have things to share",
            "Periodic connection - we talk when it matters",
            "Low-key texter - prefer in-person quality time",
            "Independent - we each do our thing and connect intentionally"
          ]
        },
        {
          id: "q23_friendships",
          question: "How I handle my partner's friendships and social life:",
          type: "single",
          options: [
            "We should have mostly shared friends and social life",
            "I want to be friends with their friends and vice versa",
            "Separate friend groups that occasionally mix",
            "Completely separate social lives are fine",
            "I need my partner to be close with my core friends",
            "I prefer we each maintain our own separate friendships"
          ]
        }
      ];

    case 6: // Future & Deal-Breakers
      return [
        {
          id: "q24_children",
          question: "My thoughts on having children:",
          type: "single",
          options: [
            "Definitely want children (2+ kids)",
            "Probably want children someday (1-2 kids)",
            "Open to it if my partner wants them",
            "Genuinely undecided - way too early to know",
            "Probably don't want children",
            "Definitely don't want children",
            "Want to adopt or foster rather than biological"
          ]
        },
        {
          id: "q25_dealbreakers",
          question: "These are absolute deal-breakers for me:",
          type: "multi",
          maxSelect: 5,
          options: [
            "Misaligned religious beliefs or level of religiosity",
            "Opposite political views or civic values",
            "Different stance on having children",
            "Incompatible substance use (too much or too little)",
            "Lack of career ambition or drive",
            "Too much career focus without work-life balance",
            "Unwilling to communicate during conflict",
            "Disrespectful to my friends or family",
            "Extreme introversion or extraversion mismatch",
            "Different financial values (spending vs. saving)",
            "Not willing to explore Philadelphia and try new things",
            "Unable to express emotions or be vulnerable",
            "Different views on monogamy or relationship exclusivity",
            "Doesn't share any of my core hobbies or interests",
            "None of these - I'm open-minded and adaptable"
          ]
        }
      ];

    default:
      return [];
  }
}
