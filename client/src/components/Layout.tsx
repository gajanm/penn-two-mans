import React from "react";
import { Link, useLocation } from "wouter";
import { Home, Users, Heart, MessageCircle, MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Users, label: "Partner", path: "/partner" },
    { icon: Heart, label: "Match", path: "/match" },
    { icon: MessageCircle, label: "Chat", path: "/chat" },
    { icon: MapPin, label: "Dates", path: "/dates" },
    { icon: User, label: "Profile", path: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20 md:pb-0 flex flex-col">
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary fill-primary" />
          <span className="font-heading font-bold text-xl tracking-tight text-foreground">Penn Double Date</span>
        </div>
        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                location === item.path ? "text-primary" : "text-muted-foreground"
              )}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </a>
            </Link>
          ))}
        </nav>
        <div className="w-8 h-8 rounded-full bg-primary/20 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80" alt="Profile" className="w-full h-full object-cover" />
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="max-w-5xl mx-auto p-4 md:p-8"
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border flex justify-around py-3 px-2 z-50 pb-safe">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a className={cn(
              "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors w-full",
              location === item.path ? "text-primary" : "text-muted-foreground"
            )}>
              <item.icon className={cn("w-6 h-6", location === item.path && "fill-current")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </a>
          </Link>
        ))}
      </nav>
    </div>
  );
}
