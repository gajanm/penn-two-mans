import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { supabase, supabaseAdmin } from "./supabase";
import { z } from "zod";

const pennEmailSchema = z.string().email().refine(email => {
  const allowedDomains = ["@upenn.edu", "@seas.upenn.edu", "@sas.upenn.edu", "@wharton.upenn.edu"];
  return allowedDomains.some(domain => email.endsWith(domain));
}, {
  message: "Must be a valid Penn email (@upenn.edu, @seas, @sas, or @wharton)",
});

const authSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const profileUpdateSchema = z.object({
  full_name: z.string().optional(),
  gender: z.string().optional(),
  interested_in: z.array(z.string()).optional(),
  graduation_year: z.string().optional(),
  major: z.string().optional(),
  height: z.number().optional(),
  partner_height_min: z.number().optional(),
  partner_height_max: z.number().optional(),
  survey_completed: z.boolean().optional(),
  partner_id: z.string().uuid().optional(),
});

async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token verification failed" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const result = authSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: result.error.errors[0]?.message || "Invalid input" 
        });
      }

      const { email, password } = result.data;

      // Check if email already exists
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Create auth user with Supabase
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          return res.status(400).json({ message: "Failed to create profile" });
        }

        return res.status(201).json({ 
          user: { id: data.user.id, email },
          message: "Account created successfully"
        });
      }

      res.status(400).json({ message: "Failed to create account" });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const result = authSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ 
          message: result.error.errors[0]?.message || "Invalid input" 
        });
      }

      const { email, password } = result.data;

      // Try to login with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      res.json({ 
        user: { id: data.user.id, email },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/profile", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      let { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
          })
          .select()
          .single();

        if (createError) {
          console.error("Profile creation error:", createError);
          return res.status(500).json({ message: "Failed to create profile" });
        }

        profile = newProfile;
      } else if (error) {
        return res.status(404).json({ message: "Profile not found" });
      }

      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/profile", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const result = profileUpdateSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ 
          message: result.error.errors[0]?.message || "Invalid input" 
        });
      }

      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .update(result.data)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/partners", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      const { data: partners, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, major, graduation_year, gender')
        .eq('survey_completed', true)
        .neq('id', user.id);

      if (error) {
        console.error("Partners fetch error:", error);
        return res.status(400).json({ message: error.message });
      }

      res.json(partners || []);
    } catch (error) {
      console.error("Partners error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get a specific profile by ID (for fetching partner info)
  app.get("/api/profile/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const profileId = req.params.id;
      
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, major, graduation_year, gender')
        .eq('id', profileId)
        .single();

      if (error || !profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      res.json(profile);
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/survey", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { answers, profileData } = req.body;

      if (!answers || typeof answers !== 'object') {
        return res.status(400).json({ message: "Survey answers are required" });
      }

      const profileResult = profileUpdateSchema.safeParse({
        ...profileData,
        survey_completed: true
      });

      if (!profileResult.success) {
        return res.status(400).json({ 
          message: profileResult.error.errors[0]?.message || "Invalid profile data" 
        });
      }

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileResult.data)
        .eq('id', user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        return res.status(400).json({ message: profileError.message });
      }

      const { data: existingSurvey } = await supabaseAdmin
        .from('survey_responses')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingSurvey) {
        const { error: updateError } = await supabaseAdmin
          .from('survey_responses')
          .update({ answers, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (updateError) {
          console.error("Survey update error:", updateError);
          return res.status(400).json({ message: updateError.message });
        }
      } else {
        const { error: insertError } = await supabaseAdmin
          .from('survey_responses')
          .insert({ user_id: user.id, answers });

        if (insertError) {
          console.error("Survey insert error:", insertError);
          return res.status(400).json({ message: insertError.message });
        }
      }

      res.json({ message: "Survey saved successfully" });
    } catch (error) {
      console.error("Survey save error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/survey", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      const { data: survey, error } = await supabaseAdmin
        .from('survey_responses')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        return res.status(400).json({ message: error.message });
      }

      res.json(survey || { answers: {} });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Partner Invite Endpoints
  app.post("/api/partner-invites", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { receiver_id } = req.body;

      if (!receiver_id) {
        return res.status(400).json({ message: "Receiver ID is required" });
      }

      if (receiver_id === user.id) {
        return res.status(400).json({ message: "You cannot invite yourself" });
      }

      // Check if user already has an accepted partner
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('partner_id')
        .eq('id', user.id)
        .single();

      if (profile?.partner_id) {
        return res.status(400).json({ message: "You already have a partner for this week" });
      }

      // Check for existing pending invite between these users
      const { data: existingInvite } = await supabaseAdmin
        .from('partner_invites')
        .select('id')
        .eq('status', 'pending')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${user.id})`)
        .single();

      if (existingInvite) {
        return res.status(400).json({ message: "There's already a pending invite between you two" });
      }

      const { data: invite, error } = await supabaseAdmin
        .from('partner_invites')
        .insert({
          sender_id: user.id,
          receiver_id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error("Invite creation error:", error);
        return res.status(400).json({ message: error.message });
      }

      res.status(201).json(invite);
    } catch (error) {
      console.error("Invite error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/partner-invites", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      // Get sent invites with receiver info
      const { data: sent, error: sentError } = await supabaseAdmin
        .from('partner_invites')
        .select(`
          id, status, created_at, responded_at,
          receiver:profiles!partner_invites_receiver_id_fkey(id, email, full_name, major, graduation_year, gender)
        `)
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      // Get received invites with sender info
      const { data: received, error: receivedError } = await supabaseAdmin
        .from('partner_invites')
        .select(`
          id, status, created_at, responded_at,
          sender:profiles!partner_invites_sender_id_fkey(id, email, full_name, major, graduation_year, gender)
        `)
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });

      if (sentError || receivedError) {
        console.error("Invite fetch error:", sentError || receivedError);
        return res.status(400).json({ message: (sentError || receivedError)?.message });
      }

      res.json({ sent: sent || [], received: received || [] });
    } catch (error) {
      console.error("Invites error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/partner-invites/:id/accept", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const inviteId = req.params.id;

      // Get the invite
      const { data: invite, error: inviteError } = await supabaseAdmin
        .from('partner_invites')
        .select('*')
        .eq('id', inviteId)
        .single();

      if (inviteError || !invite) {
        return res.status(404).json({ message: "Invite not found" });
      }

      if (invite.receiver_id !== user.id) {
        return res.status(403).json({ message: "You can only accept invites sent to you" });
      }

      if (invite.status !== 'pending') {
        return res.status(400).json({ message: "This invite is no longer pending" });
      }

      // Check if either user already has a partner
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, partner_id')
        .in('id', [invite.sender_id, invite.receiver_id]);

      const hasPartner = profiles?.some(p => p.partner_id);
      if (hasPartner) {
        return res.status(400).json({ message: "One of you already has a partner for this week" });
      }

      // Update invite status
      await supabaseAdmin
        .from('partner_invites')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', inviteId);

      // Set partner_id for both users
      await supabaseAdmin
        .from('profiles')
        .update({ partner_id: invite.receiver_id })
        .eq('id', invite.sender_id);

      await supabaseAdmin
        .from('profiles')
        .update({ partner_id: invite.sender_id })
        .eq('id', invite.receiver_id);

      // Cancel all other pending invites for both users
      await supabaseAdmin
        .from('partner_invites')
        .update({ status: 'cancelled', responded_at: new Date().toISOString() })
        .eq('status', 'pending')
        .or(`sender_id.eq.${invite.sender_id},sender_id.eq.${invite.receiver_id},receiver_id.eq.${invite.sender_id},receiver_id.eq.${invite.receiver_id}`)
        .neq('id', inviteId);

      res.json({ message: "Partner invite accepted!" });
    } catch (error) {
      console.error("Accept invite error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/partner-invites/:id/reject", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const inviteId = req.params.id;

      const { data: invite, error: inviteError } = await supabaseAdmin
        .from('partner_invites')
        .select('*')
        .eq('id', inviteId)
        .single();

      if (inviteError || !invite) {
        return res.status(404).json({ message: "Invite not found" });
      }

      if (invite.receiver_id !== user.id) {
        return res.status(403).json({ message: "You can only reject invites sent to you" });
      }

      if (invite.status !== 'pending') {
        return res.status(400).json({ message: "This invite is no longer pending" });
      }

      await supabaseAdmin
        .from('partner_invites')
        .update({ status: 'rejected', responded_at: new Date().toISOString() })
        .eq('id', inviteId);

      res.json({ message: "Invite declined" });
    } catch (error) {
      console.error("Reject invite error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/partner-invites/:id/cancel", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const inviteId = req.params.id;

      const { data: invite, error: inviteError } = await supabaseAdmin
        .from('partner_invites')
        .select('*')
        .eq('id', inviteId)
        .single();

      if (inviteError || !invite) {
        return res.status(404).json({ message: "Invite not found" });
      }

      if (invite.sender_id !== user.id) {
        return res.status(403).json({ message: "You can only cancel invites you sent" });
      }

      if (invite.status !== 'pending') {
        return res.status(400).json({ message: "This invite is no longer pending" });
      }

      await supabaseAdmin
        .from('partner_invites')
        .update({ status: 'cancelled', responded_at: new Date().toISOString() })
        .eq('id', inviteId);

      res.json({ message: "Invite cancelled" });
    } catch (error) {
      console.error("Cancel invite error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Unpair from partner
  app.post("/api/partner/unpair", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      // Get current user's profile to find partner
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('partner_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      if (!profile.partner_id) {
        return res.status(400).json({ message: "You don't have a partner to unpair from" });
      }

      const partnerId = profile.partner_id;

      // Verify mutual pairing before clearing
      const { data: partnerProfile } = await supabaseAdmin
        .from('profiles')
        .select('partner_id')
        .eq('id', partnerId)
        .single();

      if (partnerProfile?.partner_id !== user.id) {
        // Partner's side is already inconsistent, just clear current user
        await supabaseAdmin
          .from('profiles')
          .update({ partner_id: null })
          .eq('id', user.id);
        return res.json({ message: "Successfully unpaired" });
      }

      // Atomic update: Remove partner_id from both users in a single query
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ partner_id: null })
        .in('id', [user.id, partnerId]);

      if (updateError) {
        console.error("Unpair update error:", updateError);
        return res.status(500).json({ message: "Failed to unpair" });
      }

      res.json({ message: "Successfully unpaired from partner" });
    } catch (error) {
      console.error("Unpair error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
