import {
  riskAssessments,
  type RiskAssessment,
  type InsertRiskAssessment,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";

/**
 * Repository for risk assessment database operations
 */
export class AssessmentRepository {
  /**
   * Create a new risk assessment
   */
  async createRiskAssessment(assessment: InsertRiskAssessment): Promise<RiskAssessment> {
    const [riskAssessment] = await db
      .insert(riskAssessments)
      .values(assessment)
      .returning();
    return riskAssessment;
  }

  /**
   * Get the most recent risk assessment for a user
   */
  async getRiskAssessmentByUserId(userId: string): Promise<RiskAssessment | undefined> {
    const [assessment] = await db
      .select()
      .from(riskAssessments)
      .where(eq(riskAssessments.userId, userId))
      .orderBy(desc(riskAssessments.createdAt))
      .limit(1);
    return assessment;
  }

  /**
   * Get all risk assessments for a user
   */
  async getRiskAssessmentsByUserId(userId: string): Promise<RiskAssessment[]> {
    return await db
      .select()
      .from(riskAssessments)
      .where(eq(riskAssessments.userId, userId))
      .orderBy(desc(riskAssessments.createdAt));
  }

  /**
   * Delete all risk assessments for a user
   */
  async deleteRiskAssessmentsByUserId(userId: string): Promise<void> {
    await db
      .delete(riskAssessments)
      .where(eq(riskAssessments.userId, userId));
  }
}

