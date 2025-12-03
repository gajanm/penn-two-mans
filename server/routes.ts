import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { supabase } from "./supabase";
import { z } from "zod";

const pennEmailSchema = z.string().email().refine(email => {
  const allowedDomains = ["@upenn.edu", "@seas.upenn.edu", "@sas.upenn.edu", "@wharton.upenn.edu"];
  return allowedDomains.some(domain => email.endsWith(domain));
}, {
  message: "Must be a valid Penn email (@upenn.edu, @seas, @sas, or @wharton)",
});

const signupSchema = z.object({
  email: pennEmailSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
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
      const result = signupSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: result.error.errors[0]?.message || "Invalid input" 
        });
      }

      const { email, password } = result.data;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }
      }

      res.status(201).json({ 
        user: data.user,
        session: data.session,
        message: data.session ? "Account created and logged in" : "Please check your email to verify your account"
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(401).json({ message: error.message });
      }

      res.json({ 
        user: data.user,
        session: data.session 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/profile", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
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

      const { data: profile, error } = await supabase
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

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileResult.data)
        .eq('id', user.id);

      if (profileError) {
        return res.status(400).json({ message: profileError.message });
      }

      const { data: existingSurvey } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingSurvey) {
        const { error: updateError } = await supabase
          .from('survey_responses')
          .update({ answers, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (updateError) {
          return res.status(400).json({ message: updateError.message });
        }
      } else {
        const { error: insertError } = await supabase
          .from('survey_responses')
          .insert({ user_id: user.id, answers });

        if (insertError) {
          return res.status(400).json({ message: insertError.message });
        }
      }

      res.json({ message: "Survey saved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/survey", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      const { data: survey, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        return res.status(404).json({ message: "Survey not found" });
      }

      res.json(survey);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
