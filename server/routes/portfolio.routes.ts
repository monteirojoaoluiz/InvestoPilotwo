import { Router, type Request, Response } from 'express';
import { assessmentRepository, portfolioRepository } from '../repositories';
import { portfolioGeneratorService } from '../services';
import { isAuthenticated } from '../middleware/auth.middleware';
import { logger } from '../logger';

const router = Router();

/**
 * POST /api/portfolio/generate
 * Generate a new portfolio based on user's risk assessment
 */
router.post('/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const assessment = await assessmentRepository.getRiskAssessmentByUserId(userId);
    
    if (!assessment) {
      return res.status(400).json({ message: "Please complete risk assessment first" });
    }

    // Generate allocations using the portfolio generator service
    const allocations = portfolioGeneratorService.generatePortfolio(assessment);
    
    // Create portfolio recommendation
    const portfolio = await portfolioRepository.createPortfolioRecommendation({
      userId,
      riskAssessmentId: assessment.id,
      allocations,
      totalValue: 0,
      totalReturn: 0,
    });
    
    logger.info(`Generated portfolio for user ${userId}`);
    res.json(portfolio);
  } catch (error) {
    logger.error("Error generating portfolio:", error);
    res.status(500).json({ message: "Failed to generate portfolio" });
  }
});

/**
 * GET /api/portfolio
 * Get user's current portfolio
 */
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    logger.info('Fetching portfolio for userId:', userId);
    
    const portfolio = await portfolioRepository.getPortfolioByUserId(userId);

    if (!portfolio) {
      logger.info('No portfolio found for user:', userId);
      // Return default conservative portfolio when no user portfolio exists
      const defaultPortfolio = {
        id: null,
        totalValue: 0,
        totalReturn: 0,
        allocations: [
          { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', percentage: 60, color: 'hsl(var(--chart-3))', assetType: 'Bonds' },
          { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', percentage: 25, color: 'hsl(var(--chart-1))', assetType: 'US Equity' },
          { ticker: 'VXUS', name: 'Vanguard Total International Stock ETF', percentage: 10, color: 'hsl(var(--chart-2))', assetType: 'International Equity' },
          { ticker: 'VNQ', name: 'Vanguard Real Estate ETF', percentage: 5, color: 'hsl(var(--chart-4))', assetType: 'REIT' },
        ]
      };
      return res.json(defaultPortfolio);
    }

    const response = {
      ...portfolio,
      allocations: portfolio.allocations, // Already parsed object from jsonb
    };

    res.json(response);
  } catch (error) {
    logger.error("Error fetching portfolio:", error);
    res.status(500).json({ message: "Failed to fetch portfolio" });
  }
});

export default router;

