import { describe, it, expect, beforeEach } from 'vitest';
import { register } from '../../server/di/container';
import * as portfolioController from '../../server/controllers/portfolioController';

function makeMockRes() {
  const res: any = {};
  res.statusCode = 200;
  res._json = null;
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (payload: any) => { res._json = payload; return res; };
  res.redirect = (path: string) => { res._redirect = path; return res; };
  return res;
}

describe('portfolioController', () => {
  beforeEach(() => {
    // Register a simple in-memory storage mock
    register('Storage', () => ({
      getPortfolioByUserId: async (userId: string) => undefined,
      createPortfolioRecommendation: async (p: any) => ({ id: 'p1', ...p }),
      getRiskAssessmentByUserId: async (userId: string) => ({ id: 'r1', riskTolerance: 'moderate', geographicFocus: 'global', esgExclusions: [], dividendVsGrowth: 'balanced' }),
    }));
  });

  it('returns default portfolio when none exists', async () => {
    const req: any = { user: { id: 'u1' } };
    const res = makeMockRes();
    await portfolioController.getPortfolio(req, res);
    expect(res._json).toBeTruthy();
    expect(res._json.allocations).toBeTruthy();
  });

  it('generates a portfolio from assessment', async () => {
    const req: any = { user: { id: 'u1' } };
    const res = makeMockRes();
    await portfolioController.generatePortfolio(req, res);
    expect(res._json).toBeTruthy();
    expect(res._json.id).toBe('p1');
  });
});
