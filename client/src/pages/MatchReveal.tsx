import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Calendar, Sparkles, Star } from "lucide-react";
import { Link } from "wouter";
import { currentMatch } from "@/lib/mockData";
import confetti from "canvas-confetti";

export default function MatchReveal() {
  const [revealed, setRevealed] = useState(false);

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
          <h1 className="font-heading font-bold text-4xl mb-2 text-foreground">It's Tuesday!</h1>
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
            <p className="text-xl text-muted-foreground">You and Sarah have been paired with Michael & David</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Match Profile Card */}
            <Card className="overflow-hidden border-none shadow-xl bg-white/80 backdrop-blur-sm">
              <div className="aspect-video relative">
                <div className="absolute inset-0 flex">
                  <img src={currentMatch.avatars[0]} className="w-1/2 h-full object-cover" alt="Match 1" />
                  <img src={currentMatch.avatars[1]} className="w-1/2 h-full object-cover" alt="Match 2" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <h2 className="font-heading font-bold text-3xl">{currentMatch.names.join(" & ")}</h2>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium">Wharton '24</span>
                    <span className="px-2 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium">Engineering '25</span>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-green-100 text-green-700">
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                    <span className="font-bold text-lg text-green-700">{currentMatch.compatibilityScore}% Match</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-heading font-semibold text-lg">Why you matched</h3>
                  <p className="text-muted-foreground leading-relaxed">{currentMatch.reason}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {currentMatch.sharedValues.map((val) => (
                      <span key={val} className="px-3 py-1 rounded-full bg-secondary/20 text-secondary-foreground text-sm font-medium">
                        {val}
                      </span>
                    ))}
                  </div>
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
                    <Button size="lg" className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/20">
                      <MessageCircle className="mr-2 w-5 h-5" /> Start Group Chat
                    </Button>
                  </Link>
                  <Link href="/dates">
                    <Button size="lg" variant="outline" className="w-full h-14 text-lg rounded-xl border-2">
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
