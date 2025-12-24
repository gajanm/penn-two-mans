import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Heart, Mail, Lock } from "lucide-react";
import collageImage from "@assets/generated_images/collage_style_image_of_philadelphia_romantic_spots..png";
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

type AuthMode = "login" | "signup";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, setUser, loading } = useAuth();

  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!loading && user) {
      // Only redirect if we have a valid token
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (token) {
        // Check if survey is completed before redirecting
        fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.ok ? res.json() : null)
          .then(profile => {
            if (profile?.survey_completed) {
              setLocation("/dashboard");
            } else {
              setLocation("/survey");
            }
          })
          .catch(() => {
            // If check fails, default to survey
            setLocation("/survey");
          });
      }
    }
  }, [user, loading, setLocation]);

  async function onSubmit(values: z.infer<typeof authSchema>) {
    setIsLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Authentication failed",
        });
        return;
      }

      // Store user and token in context and localStorage
      const userData = { id: data.user.id, email: values.email };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Log current user
      console.log("🔐 Current logged in user:", userData);
      console.log("📧 Email:", values.email);
      console.log("🆔 User ID:", data.user.id);
      
      // Store session token
      if (data.session) {
        localStorage.setItem('auth_token', data.session.access_token);
        sessionStorage.setItem('auth_token', data.session.access_token);
      }

      toast({
        title: mode === "login" ? "Welcome back!" : "Account created!",
        description: mode === "login" ? "You've been logged in successfully." : "Let's get you set up!",
      });

      // Check if survey is already completed
      try {
        const token = data.session?.access_token || localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (token) {
          const profileRes = await fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (profileRes.ok) {
            const profile = await profileRes.json();
            if (profile.survey_completed) {
              // Survey already completed, go to dashboard
              setLocation("/dashboard");
              return;
            }
          }
        }
      } catch (error) {
        console.error("Error checking survey status:", error);
        // If check fails, still redirect to survey (safer default)
      }

      // Survey not completed, go to survey
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:block w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/20 z-10 mix-blend-multiply" />
        <img
          src={collageImage}
          alt="Philly Collage"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-12 left-12 z-20 max-w-md text-white">
          <h2 className="font-heading font-bold text-4xl mb-4 drop-shadow-md">
            Love is better together.
          </h2>
          <p className="text-lg font-medium drop-shadow-md">
            Join thousands of Penn students finding connection through double
            dates.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative bg-gradient-to-br from-background via-white to-primary/5">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <h1 className="font-heading font-bold text-3xl text-foreground">
              Welcome to Penn Double It
            </h1>
            <p className="text-muted-foreground mt-2">
              {mode === "login"
                ? "Sign in to your account"
                : "Create a new account"}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Penn Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          data-testid="input-email"
                          type="email"
                          placeholder="your.name@upenn.edu"
                          {...field}
                          className="h-12 pl-12 rounded-xl bg-white/50 border-border focus:border-primary focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">Use your Penn email (@upenn.edu, @seas, @sas, or @wharton)</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          data-testid="input-password"
                          type="password"
                          placeholder="Enter your password"
                          {...field}
                          className="h-12 pl-12 rounded-xl bg-white/50 border-border focus:border-primary focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                data-testid="button-submit"
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02]"
              >
                {isLoading
                  ? mode === "login"
                    ? "Signing in..."
                    : "Creating account..."
                  : mode === "login"
                    ? "Sign In"
                    : "Create Account"}
                {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>
            </form>
          </Form>

          <div className="text-center">
            <p className="text-muted-foreground">
              {mode === "login"
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  form.reset();
                }}
                className="text-primary font-semibold hover:underline"
                data-testid="button-toggle-mode"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
