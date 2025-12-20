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
import { ArrowRight, Heart, Mail, KeyRound, ArrowLeft } from "lucide-react";
import collageImage from "@assets/generated_images/collage_style_image_of_philadelphia_romantic_spots..png";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const emailSchema = z.object({
  email: z
    .string()
    .email()
    .refine(
      (val) => {
        const allowedDomains = [
          "@upenn.edu",
          "@seas.upenn.edu",
          "@sas.upenn.edu",
          "@wharton.upenn.edu",
        ];
        return allowedDomains.some((domain) => val.endsWith(domain));
      },
      {
        message:
          "Must be a valid Penn email (@upenn.edu, @seas, @sas, or @wharton)",
      },
    ),
});

const codeSchema = z.object({
  code: z
    .string()
    .length(8, "Code must be 8 digits")
    .regex(/^\d+$/, "Code must be numbers only"),
});

type Step = "email" | "code";

export default function Auth() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const codeForm = useForm<z.infer<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  useEffect(() => {
    if (!loading && user) {
      setLocation("/survey");
    }
  }, [user, loading, setLocation]);

  async function onEmailSubmit(values: z.infer<typeof emailSchema>) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to send verification code",
        });
        return;
      }

      setEmail(values.email);
      setStep("code");
      toast({
        title: "Check your email!",
        description: "We've sent an 8-digit code to your Penn email.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to send code. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onCodeSubmit(values: z.infer<typeof codeSchema>) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: values.code }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Invalid code",
          description: data.message || "Please try again.",
        });
        return;
      }

      toast({
        title: "Welcome!",
        description: "You've been logged in successfully.",
      });

      setLocation("/survey");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to verify code. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function goBack() {
    setStep("email");
    codeForm.reset();
  }

  async function resendCode() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to resend code",
        });
        return;
      }

      toast({
        title: "Code resent!",
        description: "Check your email for a new code.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to resend code. Please try again.",
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
        <AnimatePresence mode="wait">
          {step === "email" ? (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md space-y-8"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                  <Heart className="w-6 h-6 fill-current" />
                </div>
                <h1 className="font-heading font-bold text-3xl text-foreground">
                  Welcome to Penn Double Date
                </h1>
                <p className="text-muted-foreground mt-2">
                  Enter your Penn email to get started
                </p>
              </div>

              <Form {...emailForm}>
                <form
                  onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Penn Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              data-testid="input-email"
                              placeholder="ben.franklin@upenn.edu"
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
                    data-testid="button-send-code"
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02]"
                  >
                    {isLoading ? "Sending..." : "Send Verification Code"}
                    {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
                  </Button>
                </form>
              </Form>

              <p className="text-center text-sm text-muted-foreground">
                We'll send a 6-digit code to your email. No password needed!
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="code-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md space-y-8"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h1 className="font-heading font-bold text-3xl text-foreground">
                  Enter your code
                </h1>
                <p className="text-muted-foreground mt-2">
                  We sent a 6-digit code to
                  <br />
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>

              <Form {...codeForm}>
                <form
                  onSubmit={codeForm.handleSubmit(onCodeSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={codeForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Code</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-code"
                            placeholder="Enter 8-digit code"
                            maxLength={8}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 8);
                              field.onChange(value);
                            }}
                            onPaste={(e) => {
                              e.preventDefault();
                              const pastedText =
                                e.clipboardData.getData("text");
                              const digits = pastedText
                                .replace(/\D/g, "")
                                .slice(0, 8);
                              field.onChange(digits);
                            }}
                            className="h-14 text-center text-2xl tracking-widest font-mono rounded-xl bg-white/50 border-border focus:border-primary focus:ring-primary/20 transition-all"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          You can paste the code directly from your email
                        </p>
                      </FormItem>
                    )}
                  />

                  <Button
                    data-testid="button-verify"
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02]"
                  >
                    {isLoading ? "Verifying..." : "Verify & Sign In"}
                    {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
                  </Button>
                </form>
              </Form>

              <div className="flex items-center justify-between">
                <button
                  data-testid="button-back"
                  onClick={goBack}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium inline-flex items-center gap-1"
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Use different email
                </button>
                <button
                  data-testid="button-resend"
                  onClick={resendCode}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                  disabled={isLoading}
                >
                  Resend code
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
