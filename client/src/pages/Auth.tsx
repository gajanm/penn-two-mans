import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { motion } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";
import collageImage from "@assets/generated_images/collage_style_image_of_philadelphia_romantic_spots..png";

const formSchema = z.object({
  email: z.string().email().refine(val => val.endsWith("@upenn.edu"), {
    message: "Must be a valid @upenn.edu email address",
  }),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Mock authentication
    console.log(values);
    setLocation("/survey"); // Redirect to survey first
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Image Collage */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/20 z-10 mix-blend-multiply" />
        <img 
          src={collageImage} 
          alt="Philly Collage" 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-12 left-12 z-20 max-w-md text-white">
          <h2 className="font-heading font-bold text-4xl mb-4 drop-shadow-md">Love is better together.</h2>
          <p className="text-lg font-medium drop-shadow-md">Join thousands of Penn students finding connection through double dates.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative bg-gradient-to-br from-background via-white to-primary/5">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <h1 className="font-heading font-bold text-3xl text-foreground">
              {isLogin ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLogin ? "Enter your details to access your account" : "Sign up with your Penn email to get started"}
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
                      <Input placeholder="ben.franklin@upenn.edu" {...field} className="h-12 rounded-xl bg-white/50 border-border focus:border-primary focus:ring-primary/20 transition-all" />
                    </FormControl>
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
                      <Input type="password" placeholder="••••••••" {...field} className="h-12 rounded-xl bg-white/50 border-border focus:border-primary focus:ring-primary/20 transition-all" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02]">
                {isLogin ? "Sign In" : "Create Account"} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          </Form>

          <div className="text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
