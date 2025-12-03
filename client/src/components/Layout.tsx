import React from "react";
import { Link, useLocation } from "wouter";
import { Home, Users, Heart, MessageCircle, MapPin, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getInitials, getAvatarColor } from "@/lib/mockData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Users, label: "Partner", path: "/partner" },
    { icon: Heart, label: "Match", path: "/match" },
    { icon: MessageCircle, label: "Chat", path: "/chat" },
    { icon: MapPin, label: "Dates", path: "/dates" },
    { icon: User, label: "Profile", path: "/settings" },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You've been logged out successfully.",
      });
      setLocation("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    }
  };

  const userName = user?.email?.split('@')[0] || 'User';
  const initials = getInitials(userName);
  const avatarColor = getAvatarColor(userName);

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white font-medium text-sm cursor-pointer hover:opacity-90 transition-opacity`}>
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
        {navItems.slice(0, 5).map((item) => (
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
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors w-full text-muted-foreground hover:text-red-500"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-[10px] font-medium">Logout</span>
        </button>
      </nav>
    </div>
  );
}
