import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, ArrowRight, CheckCircle2, Clock, MapPin, UserPlus, Loader2 } from "lucide-react";
import { getInitials, getAvatarColor } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface PartnerProfile {
  id: string;
  email: string;
  full_name: string | null;
  major: string | null;
  graduation_year: string | null;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  partner_id: string | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingInvites, setPendingInvites] = useState(0);

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'there';

  async function getToken() {
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData?.session?.access_token;
  }

  async function fetchData() {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const [profileRes, invitesRes] = await Promise.all([
        fetch('/api/profile', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/partner-invites', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);

        if (profileData?.partner_id) {
          // Fetch partner directly by ID for reliability
          const partnerRes = await fetch(`/api/profile/${profileData.partner_id}`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
          });
          if (partnerRes.ok) {
            const partnerData = await partnerRes.json();
            setPartner(partnerData);
          }
        }
      }

      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        const pendingCount = invitesData.received?.filter((i: any) => i.status === 'pending').length || 0;
        setPendingInvites(pendingCount);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-3xl text-foreground">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground">Here's what's happening with your double date journey this week.</p>
        </div>
        <Link href="/partner">
          <Button className="rounded-full shadow-md hover:shadow-lg transition-all relative" data-testid="button-change-partner">
            {partner ? 'Change Partner' : 'Find Partner'} <Users className="ml-2 w-4 h-4" />
            {pendingInvites > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {pendingInvites}
              </span>
            )}
          </Button>
        </Link>
      </div>

      {/* Partner Status Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-none shadow-lg bg-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full -ml-12 -mb-12" />
          
          <CardContent className="p-8 relative z-10">
            {partner ? (
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Partner Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative">
                    <div className={`w-20 h-20 rounded-full border-4 border-white shadow-md flex items-center justify-center text-white font-bold text-xl ${getAvatarColor(userName)}`}>
                      {getInitials(userName)}
                    </div>
                    <div className={`w-20 h-20 rounded-full border-4 border-white shadow-md -ml-8 absolute top-0 left-12 flex items-center justify-center text-white font-bold text-xl ${getAvatarColor(partner.full_name || partner.email)}`}>
                      {getInitials(partner.full_name || partner.email.split('@')[0])}
                    </div>
                  </div>
                  <div className="ml-14">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-bold text-xl" data-testid="text-partner-status">
                        You & {partner.full_name || partner.email.split('@')[0]}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium border border-green-200">
                        Active Pair
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">
                      {partner.major ? `${partner.major} '${partner.graduation_year?.slice(-2) || '??'}` : 'Ready for this week\'s match!'}
                    </p>
                  </div>
                </div>

                {/* Status Divider */}
                <div className="h-px w-full md:w-px md:h-16 bg-border" />

                {/* Match Status */}
                <div className="flex-1 flex flex-col items-center md:items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Status</span>
                  <div className="flex items-center gap-2 text-muted-foreground font-bold text-xl">
                    <Clock className="w-6 h-6" />
                    Waiting for Tuesday...
                  </div>
                </div>

                {/* Action */}
                <div>
                  <Button disabled variant="outline" className="rounded-full">
                    Matches release Tuesday
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* No Partner State */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative">
                    <div className={`w-20 h-20 rounded-full border-4 border-white shadow-md flex items-center justify-center text-white font-bold text-xl ${getAvatarColor(userName)}`}>
                      {getInitials(userName)}
                    </div>
                    <div className="w-20 h-20 rounded-full border-4 border-white shadow-md -ml-8 absolute top-0 left-12 flex items-center justify-center bg-gray-100 border-dashed border-gray-300">
                      <UserPlus className="w-8 h-8 text-gray-400" />
                    </div>
                  </div>
                  <div className="ml-14">
                    <h3 className="font-heading font-bold text-xl text-gray-600" data-testid="text-no-partner">
                      No Partner Yet
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">Find a friend to be your wingperson!</p>
                  </div>
                </div>

                {/* Status Divider */}
                <div className="h-px w-full md:w-px md:h-16 bg-border" />

                {/* Status */}
                <div className="flex-1 flex flex-col items-center md:items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Status</span>
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-lg">
                    <UserPlus className="w-5 h-5" />
                    Partner Needed
                  </div>
                </div>

                {/* Action */}
                <div>
                  <Link href="/partner">
                    <Button size="lg" className="rounded-full bg-gradient-to-r from-primary to-tertiary hover:opacity-90 transition-opacity shadow-lg shadow-primary/25" data-testid="button-find-partner">
                      Find a Partner <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <QuickActionCard 
          title="Browse Date Ideas"
          description="Find the perfect spot for your next double date."
          icon={<MapPin className="w-6 h-6 text-white" />}
          color="bg-tertiary"
          href="/dates"
          delay={0.1}
        />
        <QuickActionCard 
          title="Group Chat"
          description="Plan the details with your match."
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-secondary"
          href="/chat"
          delay={0.2}
        />
        <QuickActionCard 
          title="Update Profile"
          description="Keep your preferences fresh for better matches."
          icon={<Calendar className="w-6 h-6 text-white" />}
          color="bg-primary"
          href="/settings"
          delay={0.3}
        />
      </div>
    </div>
  );
}

function QuickActionCard({ title, description, icon, color, href, delay }: any) {
  return (
    <Link href={href}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className="group cursor-pointer"
      >
        <Card className="h-full border-none shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 bg-white">
          <CardContent className="p-6 flex flex-col gap-4">
            <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
              {icon}
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg mb-1 group-hover:text-primary transition-colors">{title}</h3>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
