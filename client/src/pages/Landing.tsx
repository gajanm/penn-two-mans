import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Users, MapPin, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@assets/generated_images/warm_golden_hour_scene_at_upenn_campus_with_students_walking..png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-white fill-white" />
          <span className="font-heading font-bold text-xl text-white tracking-tight">Penn Double It</span>
        </div>
        <Link href="/auth">
          <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-none rounded-full px-6">
            Log In
          </Button>
        </Link>
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
              <Link href="/auth">
                <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-14 text-lg font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-105">
                  Sign Up with Penn Email <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
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
