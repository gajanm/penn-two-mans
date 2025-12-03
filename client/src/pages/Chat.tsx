import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Calendar, Smile, X } from "lucide-react";
import { chatMessages, currentMatch, currentUser, friends, getInitials, getAvatarColor } from "@/lib/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Chat() {
  const [messages, setMessages] = useState(chatMessages);
  const [input, setInput] = useState("");
  const [showIcebreakers, setShowIcebreakers] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = {
      id: `new-${Date.now()}`,
      senderId: currentUser.id,
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, newMessage]);
    setInput("");
  };

  const getSenderName = (id: string) => {
    if (id === currentUser.id) return "You";
    if (id === currentUser.partnerId) return friends.find(f => f.id === id)?.name;
    return currentMatch.names.find((_, idx) => `m1-${idx}` === id) || "Match";
  };

  const getSenderInitials = (id: string) => {
    const name = getSenderName(id) || 'U';
    return getInitials(name);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-border overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-white/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white font-medium text-sm ${getAvatarColor(currentUser.name)}`}>
                {getInitials(currentUser.name)}
              </div>
              <div className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white font-medium text-sm ${getAvatarColor(friends.find(f => f.id === currentUser.partnerId)?.name || 'Partner')}`}>
                {getInitials(friends.find(f => f.id === currentUser.partnerId)?.name || 'Partner')}
              </div>
              {currentMatch.names.map((name, i) => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white font-medium text-sm ${getAvatarColor(name)}`}>
                  {getInitials(name)}
                </div>
              ))}
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg">The Dream Team</h2>
              <p className="text-xs text-muted-foreground">You, {friends.find(f => f.id === currentUser.partnerId)?.name}, {currentMatch.names.join(" & ")}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50" ref={scrollRef}>
          {/* Icebreaker Prompts */}
          <AnimatePresence>
            {showIcebreakers && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-secondary/10 border border-secondary/20 rounded-xl p-4 mb-6 relative"
              >
                <button 
                  onClick={() => setShowIcebreakers(false)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
                <h3 className="font-bold text-secondary-foreground mb-2 flex items-center gap-2">
                  <Smile className="w-4 h-4" /> Icebreakers
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {["Best cheesesteak in Philly?", "Favorite study spot?", "Ideal Sunday morning?"].map((q) => (
                    <button 
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="whitespace-nowrap px-4 py-2 bg-white rounded-full text-sm border border-border hover:border-primary hover:text-primary transition-colors shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            const senderName = getSenderName(msg.senderId) || 'User';
            return (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-3 max-w-[80%]", isMe ? "ml-auto flex-row-reverse" : "")}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs mt-1 ${getAvatarColor(senderName)}`}>
                  {getSenderInitials(msg.senderId)}
                </div>
                <div>
                  <div className={cn("flex items-baseline gap-2 mb-1", isMe ? "justify-end" : "")}>
                    {!isMe && <span className="text-xs font-medium text-muted-foreground">{senderName}</span>}
                    <span className="text-[10px] text-muted-foreground/60">{msg.timestamp}</span>
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                    isMe 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-white text-foreground rounded-tl-none border border-border"
                  )}>
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-border">
          <form onSubmit={handleSend} className="flex gap-2">
            <Button type="button" variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary">
              <Calendar className="w-5 h-5" />
            </Button>
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..." 
              className="flex-1 rounded-full bg-slate-50 border-slate-200 focus:ring-primary/20"
              data-testid="input-chat-message"
            />
            <Button type="submit" size="icon" className="rounded-full bg-primary hover:bg-primary/90 shadow-md" disabled={!input.trim()} data-testid="button-send-message">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Sidebar (Date Plan) - Hidden on mobile */}
      <div className="hidden md:block w-80 space-y-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-border sticky top-24">
          <h3 className="font-heading font-bold text-xl mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Date Plan
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-tertiary/10 border border-tertiary/20">
              <p className="text-xs font-bold text-tertiary-foreground uppercase tracking-wider mb-1">Suggestion</p>
              <p className="font-bold text-foreground">Talula's Garden</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span className="flex -space-x-2">
                  <div className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white font-medium text-[10px] ${getAvatarColor(currentUser.name)}`}>
                    {getInitials(currentUser.name)}
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white font-medium text-[10px] ${getAvatarColor(currentMatch.names[0])}`}>
                    {getInitials(currentMatch.names[0])}
                  </div>
                </span>
                <span>voted for this</span>
              </div>
            </div>

            <Button variant="outline" className="w-full rounded-xl border-dashed border-2 h-12">
              + Propose Date Spot
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
