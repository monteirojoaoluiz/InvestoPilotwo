import { Router, type Request, Response } from 'express';
import { z } from 'zod';
import { assessmentRepository } from '../repositories';
import { isAuthenticated } from '../middleware/auth.middleware';
import { logger } from '../logger';

const router = Router();

/**
 * POST /api/risk-assessment
 * Create or update user's risk assessment
 */
router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const answers = req.body;
    
    logger.info('Received risk assessment data:', JSON.stringify(answers, null, 2));
    
    // Ensure arrays are properly formatted
    if (answers.geographicFocus && !Array.isArray(answers.geographicFocus)) {
      if (typeof answers.geographicFocus === 'string') {
        answers.geographicFocus = [answers.geographicFocus];
      } else {
        answers.geographicFocus = [];
      }
    }
    
    if (answers.esgExclusions && !Array.isArray(answers.esgExclusions)) {
      if (typeof answers.esgExclusions === 'string') {
        answers.esgExclusions = [answers.esgExclusions];
      } else {
        answers.esgExclusions = [];
      }
    }
    
    // Import scoring functions
    const { computeInvestorProfile, validateQuestionnaireAnswers } = await import('../profileScoring');
    
    // Validate questionnaire answers
    const validation = validateQuestionnaireAnswers(answers);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }
    
    // Compute investor profile
    const investorProfile = computeInvestorProfile(answers);
    
    // Store in database
    const assessmentData = {
      userId,
      answers: answers as any,
      investorProfile: investorProfile as any,
    };
    
    logger.info('Creating risk assessment with computed profile:', investorProfile);
    const assessment = await assessmentRepository.createRiskAssessment(assessmentData);
    
    res.json(assessment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error("Validation error:", error.errors);
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    logger.error("Error creating risk assessment:", error);
    res.status(500).json({ message: "Failed to create risk assessment" });
  }
});

/**
 * GET /api/risk-assessment
 * Get user's current risk assessment
 */
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const assessment = await assessmentRepository.getRiskAssessmentByUserId(userId);
    res.json(assessment);
  } catch (error) {
    logger.error("Error fetching risk assessment:", error);
    res.status(500).json({ message: "Failed to fetch risk assessment" });
  }
});

export default router;

