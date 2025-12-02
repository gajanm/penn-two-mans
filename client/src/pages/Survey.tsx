import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useLocation } from "wouter";

const steps = [
  { id: "basics", title: "The Basics", description: "Let's get to know you." },
  { id: "values", title: "Core Values", description: "What matters most to you?" },
  { id: "lifestyle", title: "Lifestyle", description: "How do you spend your time?" },
  { id: "preferences", title: "Preferences", description: "Who are you looking for?" },
];

export default function Survey() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setLocation("/dashboard");
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4">
      {/* Progress Header */}
      <div className="w-full max-w-2xl mb-12">
        <div className="flex justify-between text-sm font-medium text-muted-foreground mb-4">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% Completed</span>
        </div>
        <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-8">
              <h1 className="font-heading font-bold text-3xl mb-2">{steps[currentStep].title}</h1>
              <p className="text-muted-foreground">{steps[currentStep].description}</p>
            </div>

            {/* Form Content based on step */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-border mb-8 min-h-[400px] flex flex-col">
              {currentStep === 0 && <BasicsStep />}
              {currentStep === 1 && <ValuesStep />}
              {currentStep === 2 && <LifestyleStep />}
              {currentStep === 3 && <PreferencesStep />}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={prevStep} 
                disabled={currentStep === 0}
                className="rounded-full px-8"
              >
                <ArrowLeft className="mr-2 w-4 h-4" /> Back
              </Button>
              <Button 
                onClick={nextStep}
                className="rounded-full px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                {currentStep === steps.length - 1 ? "Finish" : "Next"} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function BasicsStep() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Gender Identity</Label>
        <RadioGroup defaultValue="woman" className="flex gap-4">
          {['Woman', 'Man', 'Non-binary'].map((opt) => (
            <div key={opt} className="flex items-center space-x-2 border rounded-xl p-4 flex-1 hover:bg-slate-50 cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <RadioGroupItem value={opt.toLowerCase()} id={opt} />
              <Label htmlFor={opt} className="cursor-pointer flex-1">{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Graduation Year</Label>
        <div className="grid grid-cols-4 gap-4">
          {['2024', '2025', '2026', '2027'].map((year) => (
             <Button key={year} variant="outline" className="rounded-xl h-12 hover:border-primary hover:text-primary">
               {year}
             </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Major / School</Label>
        <Input placeholder="e.g. Wharton, Nursing, CAS..." className="h-12 rounded-xl" />
      </div>
    </div>
  );
}

function ValuesStep() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label>Pick your top 3 core values</Label>
        <div className="grid grid-cols-2 gap-3">
          {['Ambition', 'Kindness', 'Creativity', 'Faith', 'Family', 'Adventure', 'Stability', 'Humor'].map((val) => (
            <div key={val} className="flex items-center space-x-2 border rounded-xl p-3 hover:bg-slate-50 cursor-pointer">
              <Checkbox id={val} />
              <label htmlFor={val} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 py-1">
                {val}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between">
          <Label>Importance of Religion/Spirituality</Label>
          <span className="text-sm text-muted-foreground">Very Important</span>
        </div>
        <Slider defaultValue={[70]} max={100} step={1} className="py-4" />
      </div>
    </div>
  );
}

function LifestyleStep() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Typical Friday Night</Label>
        <RadioGroup defaultValue="out" className="space-y-3">
          {[
            { val: 'out', label: 'Going out to a party/bar', icon: '🎉' },
            { val: 'chill', label: 'Dinner with friends', icon: '🍽️' },
            { val: 'in', label: 'Staying in with a movie', icon: '🎬' },
            { val: 'study', label: 'Studying late', icon: '📚' }
          ].map((opt) => (
            <div key={opt.val} className="flex items-center space-x-3 border rounded-xl p-4 hover:bg-slate-50 cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <RadioGroupItem value={opt.val} id={opt.val} />
              <span className="text-2xl">{opt.icon}</span>
              <Label htmlFor={opt.val} className="cursor-pointer flex-1 font-medium">{opt.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}

function PreferencesStep() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Interested in meeting...</Label>
        <div className="flex gap-4">
          {['Men', 'Women', 'Everyone'].map((opt) => (
             <Button key={opt} variant="outline" className="flex-1 h-14 rounded-xl text-lg hover:border-primary hover:text-primary">
               {opt}
             </Button>
          ))}
        </div>
      </div>

      <div className="bg-secondary/10 p-6 rounded-2xl mt-8 text-center">
        <h3 className="font-heading font-bold text-lg mb-2">Almost Done!</h3>
        <p className="text-muted-foreground mb-4">We use this data to find the most compatible pair for you and your wingperson.</p>
        <Check className="w-12 h-12 text-primary mx-auto bg-white rounded-full p-2 shadow-sm" />
      </div>
    </div>
  );
}
