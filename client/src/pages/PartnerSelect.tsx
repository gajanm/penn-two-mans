import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { friends, currentUser } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";

export default function PartnerSelect() {
  const [selectedPartnerId, setSelectedPartnerId] = useState(currentUser.partnerId);
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const handleSelect = (id: string, name: string) => {
    setSelectedPartnerId(id);
    toast({
      title: "Partner Updated!",
      description: `You've selected ${name} as your wingperson for this week.`,
      duration: 3000,
    });
  };

  const filteredFriends = friends.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="font-heading font-bold text-3xl mb-3">Who's your wingperson this week?</h1>
        <p className="text-muted-foreground">Select a friend to pair up with. You'll be matched as a duo based on your combined preferences.</p>
      </div>

      <div className="relative max-w-md mx-auto mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search friends..." 
          className="pl-10 rounded-full bg-white border-none shadow-sm h-12"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFriends.map((friend) => {
          const isSelected = selectedPartnerId === friend.id;
          
          return (
            <motion.div
              key={friend.id}
              layoutId={friend.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Card 
                className={`
                  overflow-hidden border-2 transition-all cursor-pointer relative
                  ${isSelected ? 'border-primary shadow-lg shadow-primary/10 ring-2 ring-primary ring-offset-2' : 'border-transparent shadow-sm hover:shadow-md bg-white'}
                `}
                onClick={() => handleSelect(friend.id, friend.name)}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 z-10 bg-primary text-white rounded-full p-1 shadow-sm">
                    <Check className="w-4 h-4" />
                  </div>
                )}
                
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img 
                    src={friend.avatar} 
                    alt={friend.name} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
                  <div className="absolute bottom-0 left-0 p-4 text-white">
                    <h3 className="font-heading font-bold text-xl">{friend.name}</h3>
                    <p className="text-white/80 text-sm">{friend.major}</p>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground italic mb-4">"{friend.funFact}"</p>
                  <Button 
                    className={`w-full rounded-full ${isSelected ? 'bg-primary hover:bg-primary/90' : 'bg-secondary/20 text-secondary-foreground hover:bg-secondary/30'}`}
                    variant={isSelected ? "default" : "ghost"}
                  >
                    {isSelected ? "Selected Partner" : "Choose Partner"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
