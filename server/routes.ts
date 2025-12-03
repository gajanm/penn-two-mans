import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { supabase } from "./supabase";

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
      const updates = req.body;

      const { data: profile, error } = await supabase
        .from('profiles')
        .update(updates)
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

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          survey_completed: true
        })
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
