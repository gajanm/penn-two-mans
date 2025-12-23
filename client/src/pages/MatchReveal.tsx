import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Calendar, Sparkles, Star, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { getInitials, getAvatarColor } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import confetti from "canvas-confetti";

interface MatchData {
  id: string;
  compatibilityScore: number;
  reasons: string[];
  yourDuo: Array<{ id: string; email: string; full_name: string | null; major: string | null; graduation_year: string | null; gender: string | null }>;
  matchedDuo: Array<{ id: string; email: string; full_name: string | null; major: string | null; graduation_year: string | null; gender: string | null }>;
  matchWeek: string;
}

export default function MatchReveal() {
  const [revealed, setRevealed] = useState(false);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchMatch() {
      if (!user) return;
      
      try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        console.log("📡 Fetching current match...");
        const response = await fetch('/api/match/current', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Match data received:", data);
          setMatchData(data.match);
        } else {
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
          }
          console.error("❌ Match fetch error:", errorData);
          console.error("  Full error object:", JSON.stringify(errorData, null, 2));
          console.error("  Response status:", response.status);
          console.error("  Response statusText:", response.statusText);
          setError(errorData.message || errorData.error || "Failed to load match");
        }
      } catch (err) {
        console.error("💥 Match fetch exception:", err);
        setError("Failed to load match");
      } finally {
        setLoading(false);
      }
    }

    fetchMatch();
  }, [user]);

  useEffect(() => {
    if (revealed) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FF8B7B', '#A8C69F', '#F4A259']
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FF8B7B', '#A8C69F', '#F4A259']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [revealed]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="font-heading font-bold text-2xl mb-4">No Match Yet</h1>
          <p className="text-muted-foreground mb-6">{error || "You don't have a match for this week yet."}</p>
          <p className="text-sm text-muted-foreground">
            Make sure you have a partner selected and check back later!
          </p>
        </div>
      </div>
    );
  }

  const yourDuoNames = matchData.yourDuo.map(u => u.full_name || u.email.split('@')[0]);
  const matchedDuoNames = matchData.matchedDuo.map(u => u.full_name || u.email.split('@')[0]);
  const matchedDuoMajors = matchData.matchedDuo
    .map(u => u.major && u.graduation_year ? `${u.major} '${u.graduation_year.slice(-2)}` : null)
    .filter(Boolean);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center relative">
      {!revealed ? (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center cursor-pointer"
          onClick={() => setRevealed(true)}
        >
          <div className="w-64 h-64 rounded-full bg-gradient-to-br from-primary to-tertiary flex items-center justify-center shadow-2xl shadow-primary/30 mb-8 animate-pulse hover:scale-105 transition-transform">
            <Sparkles className="w-24 h-24 text-white" />
          </div>
          <h1 className="font-heading font-bold text-4xl mb-2 text-foreground">Your Match is Ready!</h1>
          <p className="text-xl text-muted-foreground">Tap to reveal your double date match</p>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="w-full max-w-4xl"
        >
          <div className="text-center mb-12">
            <h1 className="font-heading font-bold text-4xl md:text-5xl text-gradient mb-4">It's a Match!</h1>
            <p className="text-xl text-muted-foreground">
              {yourDuoNames.length > 0 
                ? `You and ${yourDuoNames[1] || 'your partner'} have been paired with ${matchedDuoNames.join(' & ')}`
                : `You've been matched with ${matchedDuoNames.join(' & ')}`
              }
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Match Profile Card */}
            <Card className="overflow-hidden border-none shadow-xl bg-white/80 backdrop-blur-sm">
              <div className="aspect-video relative bg-gradient-to-br from-primary/20 to-tertiary/20">
                <div className="absolute inset-0 flex items-center justify-center gap-4">
                  {matchedDuoNames.map((name, i) => (
                    <div 
                      key={i}
                      className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl ${getAvatarColor(name)}`}
                    >
                      {getInitials(name)}
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <h2 className="font-heading font-bold text-3xl">{matchedDuoNames.join(" & ")}</h2>
                  {matchedDuoMajors.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {matchedDuoMajors.map((major, i) => (
                        <span key={i} className="px-2 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium">
                          {major}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-green-100 text-green-700">
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                    <span className="font-bold text-lg text-green-700">{matchData.compatibilityScore}% Match</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-heading font-semibold text-lg">Why you matched</h3>
                  {matchData.reasons && matchData.reasons.length > 0 ? (
                    <div className="space-y-2">
                      {matchData.reasons.map((reason, i) => (
                        <p key={i} className="text-muted-foreground leading-relaxed">{reason}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">Compatible match based on your profiles and preferences!</p>
                  )}
                  
                  {matchData.reasons && matchData.reasons.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {matchData.reasons.slice(0, 3).map((reason, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-secondary/20 text-secondary-foreground text-sm font-medium">
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <div className="flex flex-col gap-6 justify-center">
              <div className="bg-white p-8 rounded-3xl shadow-lg border border-border">
                <h3 className="font-heading font-bold text-2xl mb-4">Next Steps</h3>
                <p className="text-muted-foreground mb-8">Start the conversation and pick a spot for your double date this weekend!</p>
                
                <div className="space-y-4">
                  <Link href="/chat">
                    <Button size="lg" className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/20" data-testid="button-start-chat">
                      <MessageCircle className="mr-2 w-5 h-5" /> Start Group Chat
                    </Button>
                  </Link>
                  <Link href="/dates">
                    <Button size="lg" variant="outline" className="w-full h-14 text-lg rounded-xl border-2" data-testid="button-browse-dates">
                      <Calendar className="mr-2 w-5 h-5" /> Browse Date Ideas
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
