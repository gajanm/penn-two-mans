import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
}).refine(data => {
  const allowedDomains = ["@upenn.edu", "@seas.upenn.edu", "@sas.upenn.edu", "@wharton.upenn.edu"];
  return allowedDomains.some(domain => data.email.endsWith(domain));
}, {
  message: "Must be a valid Penn email (@upenn.edu, @seas, @sas, or @wharton)",
  path: ["email"],
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
