import { Request, Response } from 'express';
import { resolve } from '../di/container';
import { generateEtfAllocationsFromAssessment } from '../services/portfolioService';

export async function getPortfolio(req: Request, res: Response) {
  try {
    const storage = resolve<any>('Storage');
    const userId = (req.user as any).id;
    const portfolio = await storage.getPortfolioByUserId(userId);

    if (!portfolio) {
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

    res.json({ ...portfolio, allocations: portfolio.allocations });
  } catch (error) {
    console.error('Error fetching portfolio for user:', (req.user as any)?.id || 'unknown', 'Full error:', error);
    res.status(500).json({ message: 'Failed to fetch portfolio' });
  }
}

export async function generatePortfolio(req: Request, res: Response) {
  try {
    const storage = resolve<any>('Storage');
    const userId = (req.user as any).id;
    const assessment = await storage.getRiskAssessmentByUserId(userId);

    if (!assessment) {
      return res.status(400).json({ message: 'Please complete risk assessment first' });
    }

    const allocations = generateEtfAllocationsFromAssessment(assessment);

    const portfolio = await storage.createPortfolioRecommendation({
      userId,
      riskAssessmentId: assessment.id,
      allocations,
      totalValue: 0,
      totalReturn: 0,
    });

    res.json(portfolio);
  } catch (error) {
    console.error('Error generating portfolio:', error);
    res.status(500).json({ message: 'Failed to generate portfolio' });
  }
}
