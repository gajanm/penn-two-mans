import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Search, Loader2, Send, X, Clock, UserCheck, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getInitials, getAvatarColor } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

// Log immediately when module loads
console.log("📦 PartnerSelect.tsx module loaded");

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  major: string | null;
  graduation_year: string | null;
  gender: string | null;
}

interface Invite {
  id: string;
  status: string;
  created_at: string;
  responded_at: string | null;
  sender?: UserProfile;
  receiver?: UserProfile;
}

interface InvitesData {
  sent: Invite[];
  received: Invite[];
}

export default function PartnerSelect() {
  // Force console output - this should ALWAYS show
  console.log("=".repeat(50));
  console.log("🎬 PartnerSelect component rendered");
  console.log("=".repeat(50));
  
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<InvitesData>({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [currentPartner, setCurrentPartner] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState("find");
  const [currentUserGender, setCurrentUserGender] = useState<string | null>(null);
  const { user } = useAuth();

  console.log("👤 PartnerSelect - Current user:", user);
  console.log("⏳ PartnerSelect - Loading state:", loading);
  
  // Also log to window for debugging
  if (typeof window !== 'undefined') {
    (window as any).partnerSelectDebug = {
      user,
      loading,
      usersCount: users.length,
      hasPartner: !!currentPartner
    };
  }

  const pendingReceivedCount = invites.received.filter(i => i.status === 'pending').length;

  function getToken() {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    console.log("🔑 PartnerSelect - Token exists:", !!token);
    return token;
  }

  async function fetchData() {
    if (!user) {
      console.log("❌ PartnerSelect: No user, skipping fetch");
      return;
    }
    
    try {
      const token = await getToken();
      if (!token) {
        console.log("❌ PartnerSelect: No token, skipping fetch");
        setLoading(false);
        return;
      }

      console.log("📡 PartnerSelect: Fetching partners data...");
      console.log("👤 Current user:", user);
      
      const [partnersRes, profileRes, invitesRes] = await Promise.all([
        fetch('/api/partners', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/profile', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/partner-invites', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      console.log("📥 PartnerSelect: Partners response status:", partnersRes.status);
      console.log("📥 PartnerSelect: Partners response ok:", partnersRes.ok);

      let partnersData: UserProfile[] = [];
      let currentUserGender: string | null = null;
      
      // Get current user's gender first
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        currentUserGender = profileData?.gender || null;
        setCurrentUserGender(currentUserGender); // Store in state for filtering
        console.log("👤 Current user's gender from profile:", currentUserGender);
        
        if (profileData?.partner_id) {
          // Fetch partner directly by ID for reliability
          const partnerRes = await fetch(`/api/profile/${profileData.partner_id}`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
          });
          if (partnerRes.ok) {
            const partnerData = await partnerRes.json();
            setCurrentPartner(partnerData);
          }
        }
      }

      // Process partners response
      if (partnersRes.ok) {
        partnersData = await partnersRes.json();
        console.log("✅ PartnerSelect: Received partners:", partnersData.length);
        console.log("📋 PartnerSelect: Partner genders:", partnersData.map(p => ({ name: p.full_name || p.email, gender: p.gender })));
        
        // Client-side gender filter as backup (server should already filter, but double-check)
        if (currentUserGender) {
          const beforeFilter = partnersData.length;
          partnersData = partnersData.filter(p => {
            const partnerGender = p.gender?.trim();
            const matches = partnerGender === currentUserGender.trim();
            if (!matches) {
              console.warn(`⚠️ Gender mismatch filtered out: ${p.full_name || p.email} (${partnerGender} vs ${currentUserGender})`);
            }
            return matches;
          });
          console.log(`🔍 Client-side filter: ${beforeFilter} → ${partnersData.length} partners (removed ${beforeFilter - partnersData.length} with different gender)`);
        }
        
        setUsers(partnersData || []);
      } else {
        const errorText = await partnersRes.text();
        console.error("❌ PartnerSelect: Partners fetch failed:", partnersRes.status, errorText);
      }

      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        setInvites(invitesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log("🔄 PartnerSelect useEffect triggered, user:", user);
    fetchData();
  }, [user]);

  const sendInvite = async (receiverId: string, name: string) => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch('/api/partner-invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ receiver_id: receiverId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send invite');
      }

      toast({
        title: "Invite Sent!",
        description: `You've invited ${name} to be your wingperson.`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send invite.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const acceptInvite = async (inviteId: string, senderName: string) => {
    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`/api/partner-invites/${inviteId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept invite');
      }

      toast({
        title: "Partner Confirmed!",
        description: `You and ${senderName} are now partners for this week!`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to accept invite.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const rejectInvite = async (inviteId: string) => {
    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`/api/partner-invites/${inviteId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to decline invite');
      }

      toast({
        title: "Invite Declined",
        description: "You've declined this partner request.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to decline invite.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const cancelInvite = async (inviteId: string) => {
    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`/api/partner-invites/${inviteId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to cancel invite');
      }

      toast({
        title: "Invite Cancelled",
        description: "Your invite has been withdrawn.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to cancel invite.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getInviteStatus = (userId: string) => {
    const sentPending = invites.sent.find(i => i.receiver?.id === userId && i.status === 'pending');
    const receivedPending = invites.received.find(i => i.sender?.id === userId && i.status === 'pending');
    
    if (sentPending) return { type: 'sent', invite: sentPending };
    if (receivedPending) return { type: 'received', invite: receivedPending };
    return null;
  };

  // Filter users by search AND by same gender (client-side backup filter)
  const filteredUsers = users.filter(u => {
    // Search filter
    const name = u.full_name || u.email.split('@')[0];
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    
    // Gender filter - only show same gender (backup to server-side filter)
    let matchesGender = true; // Default to true if we can't determine gender
    if (currentUserGender && u.gender) {
      const userGenderTrimmed = String(currentUserGender).trim();
      const partnerGenderTrimmed = String(u.gender).trim();
      matchesGender = userGenderTrimmed === partnerGenderTrimmed;
      
      if (!matchesGender) {
        console.warn(`🚫 Filtered out ${u.full_name || u.email}: gender mismatch (${partnerGenderTrimmed} vs ${userGenderTrimmed})`);
      }
    }
    
    return matchesSearch && matchesGender;
  });

  const pendingReceived = invites.received.filter(i => i.status === 'pending');
  const pendingSent = invites.sent.filter(i => i.status === 'pending');

  console.log("🎨 PartnerSelect render - loading:", loading, "users:", users.length, "currentPartner:", !!currentPartner);

  if (loading) {
    console.log("⏳ PartnerSelect: Showing loading state");
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const unpairFromPartner = async () => {
    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch('/api/partner/unpair', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to unpair');
      }

      toast({
        title: "Unpaired Successfully",
        description: "You can now find a new partner for this week.",
      });

      setCurrentPartner(null);
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to unpair.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (currentPartner) {
    const displayName = currentPartner.full_name || currentPartner.email.split('@')[0];
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-8 shadow-lg">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
            <UserCheck className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-heading font-bold text-2xl mb-2">You're Paired Up!</h2>
          <p className="text-muted-foreground mb-6">Your wingperson for this week:</p>
          
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 ${getAvatarColor(displayName)}`}>
            {getInitials(displayName)}
          </div>
          <h3 className="font-heading font-bold text-xl">{displayName}</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {currentPartner.major ? `${currentPartner.major} '${currentPartner.graduation_year?.slice(-2) || '??'}` : 'Your partner for this week'}
          </p>
          
          <Button 
            variant="outline" 
            className="rounded-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            onClick={unpairFromPartner}
            disabled={isSaving}
            data-testid="button-unpair"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
            Unpair from Partner
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto mb-6">
        <h1 className="font-heading font-bold text-3xl mb-3">Find Your Wingperson</h1>
        <p className="text-muted-foreground">Send an invite to a friend. Once they accept, you'll be matched as a duo!</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
          <TabsTrigger value="find" className="flex items-center gap-2" data-testid="tab-find">
            <Users className="w-4 h-4" />
            Find Partners
          </TabsTrigger>
          <TabsTrigger value="invites" className="flex items-center gap-2 relative" data-testid="tab-invites">
            <Send className="w-4 h-4" />
            My Invites
            {pendingReceivedCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500">
                {pendingReceivedCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="find" className="space-y-6">
          <div className="relative max-w-md mx-auto">
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
                const displayName = profile.full_name || profile.email.split('@')[0];
                const majorDisplay = profile.major ? `${profile.major} '${profile.graduation_year?.slice(-2) || '??'}` : 'Major not set';
                const inviteStatus = getInviteStatus(profile.id);
                
                return (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="overflow-hidden border-2 border-transparent shadow-sm hover:shadow-md bg-white" data-testid={`card-partner-${profile.id}`}>
                      <div className="p-6 flex flex-col items-center text-center">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4 ${getAvatarColor(displayName)}`}>
                          {getInitials(displayName)}
                        </div>
                        <h3 className="font-heading font-bold text-xl">{displayName}</h3>
                        <p className="text-muted-foreground text-sm">{majorDisplay}</p>
                      </div>
                      
                      <CardContent className="p-4 pt-0">
                        {inviteStatus?.type === 'sent' ? (
                          <div className="space-y-2">
                            <Badge variant="secondary" className="w-full justify-center py-2">
                              <Clock className="w-3 h-3 mr-1" /> Invite Pending
                            </Badge>
                            <Button 
                              variant="outline"
                              className="w-full rounded-full"
                              onClick={() => cancelInvite(inviteStatus.invite.id)}
                              disabled={isSaving}
                              data-testid={`button-cancel-${profile.id}`}
                            >
                              Cancel Invite
                            </Button>
                          </div>
                        ) : inviteStatus?.type === 'received' ? (
                          <div className="space-y-2">
                            <Badge className="w-full justify-center py-2 bg-primary/10 text-primary border-primary/20">
                              Wants to pair with you!
                            </Badge>
                            <div className="flex gap-2">
                              <Button 
                                className="flex-1 rounded-full"
                                onClick={() => acceptInvite(inviteStatus.invite.id, displayName)}
                                disabled={isSaving}
                                data-testid={`button-accept-${profile.id}`}
                              >
                                <Check className="w-4 h-4 mr-1" /> Accept
                              </Button>
                              <Button 
                                variant="outline"
                                className="flex-1 rounded-full"
                                onClick={() => rejectInvite(inviteStatus.invite.id)}
                                disabled={isSaving}
                                data-testid={`button-reject-${profile.id}`}
                              >
                                <X className="w-4 h-4 mr-1" /> Decline
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button 
                            className="w-full rounded-full"
                            onClick={() => sendInvite(profile.id, displayName)}
                            disabled={isSaving}
                            data-testid={`button-invite-${profile.id}`}
                          >
                            <Send className="w-4 h-4 mr-2" /> Send Invite
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invites" className="space-y-8">
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Incoming Invites ({pendingReceived.length})
            </h3>
            {pendingReceived.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 bg-secondary/10 rounded-xl">
                No pending invites from others
              </p>
            ) : (
              <div className="space-y-3">
                {pendingReceived.map((invite) => {
                  const sender = invite.sender!;
                  const displayName = sender.full_name || sender.email.split('@')[0];
                  return (
                    <Card key={invite.id} className="p-4" data-testid={`invite-received-${invite.id}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getAvatarColor(displayName)}`}>
                          {getInitials(displayName)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{displayName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {sender.major} '{sender.graduation_year?.slice(-2)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => acceptInvite(invite.id, displayName)}
                            disabled={isSaving}
                            data-testid={`button-accept-invite-${invite.id}`}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => rejectInvite(invite.id)}
                            disabled={isSaving}
                            data-testid={`button-reject-invite-${invite.id}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Sent Invites ({pendingSent.length})
            </h3>
            {pendingSent.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 bg-secondary/10 rounded-xl">
                You haven't sent any invites yet
              </p>
            ) : (
              <div className="space-y-3">
                {pendingSent.map((invite) => {
                  const receiver = invite.receiver!;
                  const displayName = receiver.full_name || receiver.email.split('@')[0];
                  return (
                    <Card key={invite.id} className="p-4" data-testid={`invite-sent-${invite.id}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getAvatarColor(displayName)}`}>
                          {getInitials(displayName)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{displayName}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Waiting for response
                          </p>
                        </div>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => cancelInvite(invite.id)}
                          disabled={isSaving}
                          data-testid={`button-cancel-invite-${invite.id}`}
                        >
                          Cancel
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
