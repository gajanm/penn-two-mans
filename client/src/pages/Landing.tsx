import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, MapPin, Sparkles, Mail, Lock, X } from "lucide-react";
import { DoubleCherries } from "@/components/ui/double-cherries";
import { motion } from "framer-motion";
import heroImage from "@assets/generated_images/warm_golden_hour_scene_at_upenn_campus_with_students_walking.png";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const pennEmailSchema = z.string().email("Please enter a valid email").refine(email => {
  const allowedDomains = ["@upenn.edu", "@seas.upenn.edu", "@sas.upenn.edu", "@wharton.upenn.edu"];
  return allowedDomains.some(domain => email.endsWith(domain));
}, {
  message: "Must be a valid Penn email (@upenn.edu, @seas, @sas, or @wharton)",
});

const authSchema = z.object({
  email: pennEmailSchema,
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

type AuthMode = "signup" | "login" | null;

export default function Landing() {
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuth();

  const signupForm = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginForm = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSignupSubmit(values: z.infer<typeof authSchema>) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Sign up failed",
        });
        return;
      }

      // Store user and token
      const userData = { id: data.user.id, email: values.email };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      if (data.session) {
        localStorage.setItem('auth_token', data.session.access_token);
        sessionStorage.setItem('auth_token', data.session.access_token);
      }

      toast({
        title: "Account created!",
        description: "Let's get you set up!",
      });

      // Close modal and redirect to survey
      setAuthMode(null);
      setLocation("/survey");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to process request. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onLoginSubmit(values: z.infer<typeof authSchema>) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Login failed",
        });
        return;
      }

      // Store user and token
      const userData = { id: data.user.id, email: values.email };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      if (data.session) {
        localStorage.setItem('auth_token', data.session.access_token);
        sessionStorage.setItem('auth_token', data.session.access_token);
      }

      toast({
        title: "Welcome back!",
        description: "You've been logged in successfully.",
      });

      // Check if survey is completed
      try {
        const token = data.session?.access_token || localStorage.getItem('auth_token');
        if (token) {
          const profileRes = await fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (profileRes.ok) {
            const profile = await profileRes.json();
            if (profile.survey_completed) {
              setAuthMode(null);
              setLocation("/dashboard");
              return;
            }
          }
        }
      } catch (error) {
        console.error("Error checking survey status:", error);
      }

      // Close modal and redirect to survey
      setAuthMode(null);
      setLocation("/survey");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to process request. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const switchToLogin = () => {
    setAuthMode("login");
    signupForm.reset();
  };

  const switchToSignup = () => {
    setAuthMode("signup");
    loginForm.reset();
  };
  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <DoubleCherries className="w-10 h-10" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-heading font-bold text-xl text-white tracking-tight">Penn</span>
            <span className="font-heading font-bold text-xl text-white tracking-tight -mt-1">Double-It</span>
          </div>
        </div>
        <Button 
          variant="secondary" 
          onClick={() => setAuthMode("login")}
          className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-none rounded-full px-6"
        >
          Log In
        </Button>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Penn Campus" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background/90" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-3xl px-6 mt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-block py-1 px-4 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-medium mb-6">
              Exclusive to University of Pennsylvania
            </span>
            <h1 className="font-heading font-bold text-5xl md:text-7xl text-white mb-6 leading-tight">
              Find Your Perfect <br />
              <span className="font-script text-6xl md:text-8xl text-primary-foreground/90">Double Date</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-xl mx-auto leading-relaxed">
              Pair up with a friend, get matched with another duo, and explore Philadelphia's best spots together. Less pressure, more fun.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => setAuthMode("signup")}
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-14 text-lg font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-105"
              >
                Sign Up with Penn Email <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Three simple steps to your next Friday night.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-primary" />}
              title="1. Pick a Partner"
              description="Choose a friend to be your wingperson for the week. You're in this together."
              delay={0.1}
            />
            <FeatureCard 
              icon={<Sparkles className="w-8 h-8 text-primary" />}
              title="2. Get Matched"
              description="Every Tuesday, our algorithm pairs you with another duo based on shared values and vibes."
              delay={0.2}
            />
            <FeatureCard 
              icon={<MapPin className="w-8 h-8 text-primary" />}
              title="3. Explore Philly"
              description="We suggest curated double-date spots in Philadelphia perfect for breaking the ice."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Sign Up Modal - Vertically centered, slides up from bottom and swipes left to right */}
      <Dialog open={authMode === "signup"} onOpenChange={(open) => !open && setAuthMode(null)}>
        <DialogContent className="max-w-md rounded-3xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-bottom data-[state=open]:slide-in-from-left duration-700">
          <DialogHeader className="text-center !text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4 mx-auto">
              <DoubleCherries className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-heading text-center">Welcome to Penn Double-It</DialogTitle>
            <DialogDescription className="text-base mt-2 text-center">
              Create a new account
            </DialogDescription>
          </DialogHeader>

          <div className="max-w-md mx-auto mt-8 pb-6">
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-6">
                <FormField
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="w-full" style={{ textAlign: 'center', display: 'block' }}>Penn Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="your.name@upenn.edu"
                            {...field}
                            className="h-12 pl-12 rounded-xl bg-white border-border focus:border-primary focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1 text-center">
                        Use your upenn.edu email
                      </p>
                      <FormMessage className="text-center" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="w-full" style={{ textAlign: 'center', display: 'block' }}>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            {...field}
                            className="h-12 pl-12 rounded-xl bg-white border-border focus:border-primary focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-center" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                  {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
                </Button>
              </form>
            </Form>

            <div className="text-center mt-6">
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <button 
                  onClick={switchToLogin}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Modal - Vertically centered, slides down from top and swipes right to left */}
      <Dialog open={authMode === "login"} onOpenChange={(open) => !open && setAuthMode(null)}>
        <DialogContent className="max-w-md rounded-3xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-top data-[state=open]:slide-in-from-right duration-700">
          <DialogHeader className="text-center !text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4 mx-auto">
              <DoubleCherries className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-heading text-center">Welcome Back</DialogTitle>
            <DialogDescription className="text-base mt-2 text-center">
              Sign in to your account
            </DialogDescription>
          </DialogHeader>

          <div className="max-w-md mx-auto mt-8 pb-6">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="w-full" style={{ textAlign: 'center', display: 'block' }}>Penn Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="your.name@upenn.edu"
                            {...field}
                            className="h-12 pl-12 rounded-xl bg-white border-border focus:border-primary focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1 text-center">
                        Use your upenn.edu email
                      </p>
                      <FormMessage className="text-center" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="w-full" style={{ textAlign: 'center', display: 'block' }}>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            {...field}
                            className="h-12 pl-12 rounded-xl bg-white border-border focus:border-primary focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-center" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                  {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
                </Button>
              </form>
            </Form>

            <div className="text-center mt-6">
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <button 
                  onClick={switchToSignup}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white p-8 rounded-3xl shadow-sm border border-border/50 hover:shadow-md transition-shadow"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="font-heading font-bold text-xl mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}
