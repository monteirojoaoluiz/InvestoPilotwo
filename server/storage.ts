// Reference: javascript_database integration
import {
  users,
  riskAssessments,
  portfolioRecommendations,
  portfolioMessages,
  authTokens,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lt, sql } from "drizzle-orm";

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
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
    const [user] = await db.select().from(users).where(eq(users.email, email));
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
}

export const storage = new DatabaseStorage();
