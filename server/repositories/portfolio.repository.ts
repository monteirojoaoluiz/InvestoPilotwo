import {
  portfolioRecommendations,
  portfolioMessages,
  type PortfolioRecommendation,
  type InsertPortfolioRecommendation,
  type PortfolioMessage,
  type InsertPortfolioMessage,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";

/**
 * Repository for portfolio-related database operations
 */
export class PortfolioRepository {
  /**
   * Create a new portfolio recommendation
   */
  async createPortfolioRecommendation(
    portfolio: InsertPortfolioRecommendation
  ): Promise<PortfolioRecommendation> {
    const [recommendation] = await db
      .insert(portfolioRecommendations)
      .values(portfolio)
      .returning();
    return recommendation;
  }

  /**
   * Get the most recent portfolio for a user
   */
  async getPortfolioByUserId(userId: string): Promise<PortfolioRecommendation | undefined> {
    const [portfolio] = await db
      .select()
      .from(portfolioRecommendations)
      .where(eq(portfolioRecommendations.userId, userId))
      .orderBy(desc(portfolioRecommendations.createdAt))
      .limit(1);
    return portfolio;
  }

  /**
   * Get all portfolios for a user
   */
  async getPortfolioRecommendationsByUserId(userId: string): Promise<PortfolioRecommendation[]> {
    return await db
      .select()
      .from(portfolioRecommendations)
      .where(eq(portfolioRecommendations.userId, userId))
      .orderBy(desc(portfolioRecommendations.createdAt));
  }

  /**
   * Update portfolio value and return
   */
  async updatePortfolioValue(
    portfolioId: string,
    totalValue: number,
    totalReturn: number
  ): Promise<void> {
    await db
      .update(portfolioRecommendations)
      .set({
        totalValue,
        totalReturn,
        updatedAt: new Date(),
      })
      .where(eq(portfolioRecommendations.id, portfolioId));
  }

  /**
   * Delete all portfolios for a user
   */
  async deletePortfoliosByUserId(userId: string): Promise<void> {
    await db
      .delete(portfolioRecommendations)
      .where(eq(portfolioRecommendations.userId, userId));
  }
}

/**
 * Repository for portfolio chat message operations
 */
export class MessageRepository {
  /**
   * Create a new portfolio chat message
   */
  async createPortfolioMessage(message: InsertPortfolioMessage): Promise<PortfolioMessage> {
    const [portfolioMessage] = await db
      .insert(portfolioMessages)
      .values(message)
      .returning();
    return portfolioMessage;
  }

  /**
   * Get all messages for a portfolio
   */
  async getPortfolioMessages(portfolioId: string): Promise<PortfolioMessage[]> {
    return await db
      .select()
      .from(portfolioMessages)
      .where(eq(portfolioMessages.portfolioId, portfolioId))
      .orderBy(portfolioMessages.createdAt);
  }

  /**
   * Get all messages for a user (across all portfolios)
   */
  async getPortfolioMessagesByUserId(userId: string): Promise<PortfolioMessage[]> {
    return await db
      .select()
      .from(portfolioMessages)
      .where(eq(portfolioMessages.userId, userId))
      .orderBy(portfolioMessages.createdAt);
  }

  /**
   * Delete all messages for a portfolio
   */
  async deletePortfolioMessages(portfolioId: string): Promise<void> {
    await db
      .delete(portfolioMessages)
      .where(eq(portfolioMessages.portfolioId, portfolioId));
  }

  /**
   * Delete all messages for a user
   */
  async deleteMessagesByUserId(userId: string): Promise<void> {
    await db
      .delete(portfolioMessages)
      .where(eq(portfolioMessages.userId, userId));
  }
}

