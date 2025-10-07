// Reference: javascript_database integration
import {
  users,
  riskAssessments,
  portfolioRecommendations,
  portfolioMessages,
  authTokens,
  passwordResetTokens,
  emailChangeTokens,
  type User,
  type UpsertUser,
  type RiskAssessment,
  type InsertRiskAssessment,
  type PortfolioRecommendation,
  type InsertPortfolioRecommendation,
  type PortfolioMessage,
  type InsertPortfolioMessage,
  type AuthToken,
  type InsertAuthToken,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type EmailChangeToken,
  type InsertEmailChangeToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lt, sql, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;

  // Risk assessment operations
  createRiskAssessment(assessment: InsertRiskAssessment): Promise<RiskAssessment>;
  getRiskAssessmentByUserId(userId: string): Promise<RiskAssessment | undefined>;

  // Portfolio operations
  createPortfolioRecommendation(portfolio: InsertPortfolioRecommendation): Promise<PortfolioRecommendation>;
  getPortfolioByUserId(userId: string): Promise<PortfolioRecommendation | undefined>;
  updatePortfolioValue(portfolioId: string, totalValue: number, totalReturn: number): Promise<void>;

  // Chat operations
  createPortfolioMessage(message: InsertPortfolioMessage): Promise<PortfolioMessage>;
  getPortfolioMessages(portfolioId: string): Promise<PortfolioMessage[]>;
  deletePortfolioMessages(portfolioId: string): Promise<void>;
  createAuthToken(token: InsertAuthToken): Promise<AuthToken>;
  getAuthTokenByToken(token: string): Promise<AuthToken | undefined>;
  markTokenAsUsed(tokenId: string): Promise<void>;
  deleteExpiredTokens(): Promise<void>;
  
  // Password reset operations
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenAsUsed(tokenId: string): Promise<void>;
  deleteExpiredPasswordResetTokens(): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  updateUserLastLogin(userId: string): Promise<void>;
  // Email change operations
  createEmailChangeToken(token: InsertEmailChangeToken): Promise<EmailChangeToken>;
  getEmailChangeTokenByToken(token: string): Promise<EmailChangeToken | undefined>;
  markEmailChangeTokenAsUsed(tokenId: string): Promise<void>;
  deleteExpiredEmailChangeTokens(): Promise<void>;
  updateUserEmail(userId: string, email: string): Promise<void>;
  // User deletion
  deleteUserData(userId: string): Promise<void>;
  getRiskAssessmentsByUserId(userId: string): Promise<RiskAssessment[]>;
  getPortfolioRecommendationsByUserId(userId: string): Promise<PortfolioRecommendation[]>;
  getPortfolioMessagesByUserId(userId: string): Promise<PortfolioMessage[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.id, id), isNull(users.deletedAt)));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.email, email), isNull(users.deletedAt)));
    return user;
  }

  async createUser(user: UpsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Risk assessment operations
  async createRiskAssessment(assessment: InsertRiskAssessment): Promise<RiskAssessment> {
    const [riskAssessment] = await db
      .insert(riskAssessments)
      .values(assessment)
      .returning();
    return riskAssessment;
  }

  async getRiskAssessmentByUserId(userId: string): Promise<RiskAssessment | undefined> {
    const [assessment] = await db
      .select()
      .from(riskAssessments)
      .where(eq(riskAssessments.userId, userId))
      .orderBy(desc(riskAssessments.createdAt))
      .limit(1);
    return assessment;
  }

  // Portfolio operations
  async createPortfolioRecommendation(portfolio: InsertPortfolioRecommendation): Promise<PortfolioRecommendation> {
    const [recommendation] = await db
      .insert(portfolioRecommendations)
      .values(portfolio)
      .returning();
    return recommendation;
  }

  async getPortfolioByUserId(userId: string): Promise<PortfolioRecommendation | undefined> {
    try {
      console.log('Querying DB for portfolio with userId:', userId);
      const [portfolio] = await db
        .select()
        .from(portfolioRecommendations)
        .where(eq(portfolioRecommendations.userId, userId))
        .orderBy(desc(portfolioRecommendations.createdAt))
        .limit(1);
      console.log('DB query result:', portfolio ? 'Found portfolio' : 'No portfolio found');
      return portfolio;
    } catch (error) {
      console.error('DB error in getPortfolioByUserId:', error);
      throw error;
    }
  }

  async updatePortfolioValue(portfolioId: string, totalValue: number, totalReturn: number): Promise<void> {
    await db
      .update(portfolioRecommendations)
      .set({ 
        totalValue,
        totalReturn,
        updatedAt: new Date(),
      })
      .where(eq(portfolioRecommendations.id, portfolioId));
  }

  // Chat operations
  async createPortfolioMessage(message: InsertPortfolioMessage): Promise<PortfolioMessage> {
    const [portfolioMessage] = await db
      .insert(portfolioMessages)
      .values(message)
      .returning();
    return portfolioMessage;
  }

  async getPortfolioMessages(portfolioId: string): Promise<PortfolioMessage[]> {
    return await db
      .select()
      .from(portfolioMessages)
      .where(eq(portfolioMessages.portfolioId, portfolioId))
      .orderBy(portfolioMessages.createdAt);
  }

  async deletePortfolioMessages(portfolioId: string): Promise<void> {
    await db.delete(portfolioMessages).where(eq(portfolioMessages.portfolioId, portfolioId));
  }

  async createAuthToken(token: InsertAuthToken): Promise<AuthToken> {
    const [newToken] = await db.insert(authTokens).values(token).returning();
    return newToken;
  }

  async getAuthTokenByToken(token: string): Promise<AuthToken | undefined> {
    const [tokenData] = await db.select().from(authTokens).where(eq(authTokens.token, token));
    return tokenData;
  }

  async markTokenAsUsed(tokenId: string): Promise<void> {
    await db.update(authTokens).set({ used: true }).where(eq(authTokens.id, tokenId));
  }

  async deleteExpiredTokens(): Promise<void> {
    await db.delete(authTokens).where(
      and(
        lt(authTokens.expiresAt, sql`NOW()`),
        eq(authTokens.used, false)
      )
    );
  }

  // Password reset operations
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [newToken] = await db.insert(passwordResetTokens).values(token).returning();
    return newToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [tokenData] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return tokenData;
  }

  async markPasswordResetTokenAsUsed(tokenId: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, tokenId));
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    await db.delete(passwordResetTokens).where(
      and(
        lt(passwordResetTokens.expiresAt, sql`NOW()`),
        eq(passwordResetTokens.used, false)
      )
    );
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        lastLogin: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Email change operations
  async createEmailChangeToken(token: InsertEmailChangeToken): Promise<EmailChangeToken> {
    const [newToken] = await db.insert(emailChangeTokens).values(token).returning();
    return newToken;
  }

  async getEmailChangeTokenByToken(token: string): Promise<EmailChangeToken | undefined> {
    const [tokenData] = await db
      .select()
      .from(emailChangeTokens)
      .where(eq(emailChangeTokens.token, token));
    return tokenData;
  }

  async markEmailChangeTokenAsUsed(tokenId: string): Promise<void> {
    await db
      .update(emailChangeTokens)
      .set({ used: true })
      .where(eq(emailChangeTokens.id, tokenId));
  }

  async deleteExpiredEmailChangeTokens(): Promise<void> {
    await db.delete(emailChangeTokens).where(
      and(
        lt(emailChangeTokens.expiresAt, sql`NOW()`),
        eq(emailChangeTokens.used, false)
      )
    );
  }

  async updateUserEmail(userId: string, email: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        email,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async deleteUserData(userId: string): Promise<void> {
    // Soft delete user
    await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, userId));

    // Hard delete related data (no grace for these)
    await db.delete(authTokens).where(eq(authTokens.email, sql`(SELECT email FROM users WHERE id = ${userId})`));
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    await db.delete(emailChangeTokens).where(eq(emailChangeTokens.userId, userId));
    await db.delete(portfolioMessages).where(eq(portfolioMessages.userId, userId));
    await db.delete(portfolioRecommendations).where(eq(portfolioRecommendations.userId, userId));
    await db.delete(riskAssessments).where(eq(riskAssessments.userId, userId));
  }

  async hardDeleteOldUsers(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get users to delete
    const oldUsers = await db.select({id: users.id}).from(users).where(lt(users.deletedAt!, thirtyDaysAgo));

    for (const user of oldUsers) {
      await this.deleteUserData(user.id); // This now hard deletes everything
      // Actually hard delete user after
      await db.delete(users).where(eq(users.id, user.id));
    }
  }

  async getRiskAssessmentsByUserId(userId: string): Promise<RiskAssessment[]> {
    return await db.select().from(riskAssessments).where(eq(riskAssessments.userId, userId));
  }

  async getPortfolioRecommendationsByUserId(userId: string): Promise<PortfolioRecommendation[]> {
    return await db.select().from(portfolioRecommendations).where(eq(portfolioRecommendations.userId, userId));
  }

  async getPortfolioMessagesByUserId(userId: string): Promise<PortfolioMessage[]> {
    return await db.select().from(portfolioMessages).where(eq(portfolioMessages.userId, userId));
  }
}

export const storage = new DatabaseStorage();

// Provide a getter for DI container compatibility
export function getDefaultStorage(): DatabaseStorage {
  return storage;
}
