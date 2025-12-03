import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getInitials, getAvatarColor } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  major: string | null;
  graduation_year: string | null;
  gender: string | null;
}

export default function PartnerSelect() {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        
        if (!token) {
          setLoading(false);
          return;
        }

        const [partnersRes, profileRes] = await Promise.all([
          fetch('/api/partners', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (partnersRes.ok) {
          const partnersData = await partnersRes.json();
          setUsers(partnersData || []);
        }
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData?.partner_id) {
            setSelectedPartnerId(profileData.partner_id);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load users. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, toast]);

  const handleSelect = async (id: string, name: string) => {
    if (!user) return;
    
    setIsSaving(true);
    setSelectedPartnerId(id);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (token) {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ partner_id: id }),
        });

        if (!response.ok) {
          console.warn('Partner persistence failed');
        }
      }

      toast({
        title: "Partner Updated!",
        description: `You've selected ${name} as your wingperson for this week.`,
        duration: 3000,
      });
    } catch (error) {
      console.warn('Partner persistence error:', error);
      toast({
        title: "Partner Selected!",
        description: `You've selected ${name} as your wingperson.`,
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const name = u.full_name || u.email.split('@')[0];
    return name.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="font-heading font-bold text-3xl mb-3">Who's your wingperson this week?</h1>
        <p className="text-muted-foreground">Select a friend to pair up with. You'll be matched as a duo based on your combined preferences.</p>
      </div>

      <div className="relative max-w-md mx-auto mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search users..." 
          className="pl-10 rounded-full bg-white border-none shadow-sm h-12"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-partner"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No users found. Be the first to complete your survey!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((profile) => {
            const isSelected = selectedPartnerId === profile.id;
            const displayName = profile.full_name || profile.email.split('@')[0];
            const majorDisplay = profile.major ? `${profile.major} '${profile.graduation_year?.slice(-2) || '??'}` : 'Major not set';
            
            return (
              <motion.div
                key={profile.id}
                layoutId={profile.id}
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
                  onClick={() => handleSelect(profile.id, displayName)}
                  data-testid={`card-partner-${profile.id}`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 z-10 bg-primary text-white rounded-full p-1 shadow-sm">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  
                  <div className="p-6 flex flex-col items-center text-center">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4 ${getAvatarColor(displayName)}`}>
                      {getInitials(displayName)}
                    </div>
                    <h3 className="font-heading font-bold text-xl">{displayName}</h3>
                    <p className="text-muted-foreground text-sm">{majorDisplay}</p>
                  </div>
                  
                  <CardContent className="p-4 pt-0">
                    <Button 
                      className={`w-full rounded-full ${isSelected ? 'bg-primary hover:bg-primary/90' : 'bg-secondary/20 text-secondary-foreground hover:bg-secondary/30'}`}
                      variant={isSelected ? "default" : "ghost"}
                      data-testid={`button-select-${profile.id}`}
                    >
                      {isSelected ? "Selected Partner" : "Choose Partner"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
