import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Risk assessment table
export const riskAssessments = pgTable("risk_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  riskTolerance: varchar("risk_tolerance").notNull(),
  timeHorizon: varchar("time_horizon").notNull(),
  usOnly: boolean("us_only").notNull().default(false),
  esgOnly: boolean("esg_only").notNull().default(false),
  lifeStage: varchar("life_stage").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Portfolio recommendations table
export const portfolioRecommendations = pgTable("portfolio_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  riskAssessmentId: varchar("risk_assessment_id").notNull().references(() => riskAssessments.id),
  allocations: jsonb("allocations").notNull(), // JSON array of allocation objects
  totalValue: integer("total_value").notNull().default(0),
  totalReturn: integer("total_return").notNull().default(0), // Stored as percentage * 100 (e.g., 8.4% = 840)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Portfolio chat messages table
export const portfolioMessages = pgTable("portfolio_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  portfolioId: varchar("portfolio_id").notNull().references(() => portfolioRecommendations.id),
  content: text("content").notNull(),
  sender: varchar("sender").notNull(), // 'user' or 'ai'
  createdAt: timestamp("created_at").defaultNow(),
});

export const authTokens = pgTable("auth_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  token: varchar("token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AuthToken = typeof authTokens.$inferSelect;
export type InsertAuthToken = typeof authTokens.$inferInsert;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

export const insertAuthTokenSchema = createInsertSchema(authTokens).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export type InsertAuthTokenInput = z.infer<typeof insertAuthTokenSchema>;
export type InsertPasswordResetTokenInput = z.infer<typeof insertPasswordResetTokenSchema>;

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertRiskAssessment = typeof riskAssessments.$inferInsert;
export type RiskAssessment = typeof riskAssessments.$inferSelect;

export type InsertPortfolioRecommendation = typeof portfolioRecommendations.$inferInsert;
export type PortfolioRecommendation = typeof portfolioRecommendations.$inferSelect;

export type InsertPortfolioMessage = typeof portfolioMessages.$inferInsert;
export type PortfolioMessage = typeof portfolioMessages.$inferSelect;

// Zod schemas
export const insertRiskAssessmentSchema = createInsertSchema(riskAssessments).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPortfolioMessageSchema = createInsertSchema(portfolioMessages)
  .omit({
    id: true,
    userId: true,
    portfolioId: true,
    createdAt: true,
    sender: true,
  });

export type InsertRiskAssessmentInput = z.infer<typeof insertRiskAssessmentSchema>;
export type InsertPortfolioMessageInput = z.infer<typeof insertPortfolioMessageSchema>;
