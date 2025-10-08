import { logger } from '../logger';

/**
 * ETF Allocation structure
 */
export interface ETFAllocation {
  ticker: string;
  name: string;
  percentage: number;
  color: string;
  assetType: string;
}

/**
 * Portfolio generation service
 */
export class PortfolioGeneratorService {
  // Base ETF sets by risk tolerance
  private readonly ETF_SETS: Record<string, ETFAllocation[]> = {
    conservative: [
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', percentage: 60, color: 'hsl(var(--chart-3))', assetType: 'Bonds' },
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', percentage: 25, color: 'hsl(var(--chart-1))', assetType: 'US Equity' },
      { ticker: 'VXUS', name: 'Vanguard Total International Stock ETF', percentage: 10, color: 'hsl(var(--chart-2))', assetType: 'International Equity' },
      { ticker: 'VNQ', name: 'Vanguard Real Estate ETF', percentage: 5, color: 'hsl(var(--chart-4))', assetType: 'REIT' },
    ],
    moderate: [
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', percentage: 55, color: 'hsl(var(--chart-1))', assetType: 'US Equity' },
      { ticker: 'VXUS', name: 'Vanguard Total International Stock ETF', percentage: 20, color: 'hsl(var(--chart-2))', assetType: 'International Equity' },
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', percentage: 20, color: 'hsl(var(--chart-3))', assetType: 'Bonds' },
      { ticker: 'VNQ', name: 'Vanguard Real Estate ETF', percentage: 5, color: 'hsl(var(--chart-4))', assetType: 'REIT' },
    ],
    aggressive: [
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', percentage: 70, color: 'hsl(var(--chart-1))', assetType: 'US Equity' },
      { ticker: 'VXUS', name: 'Vanguard Total International Stock ETF', percentage: 20, color: 'hsl(var(--chart-2))', assetType: 'International Equity' },
      { ticker: 'QQQ', name: 'Invesco QQQ Trust', percentage: 10, color: 'hsl(var(--chart-5))', assetType: 'US Growth' },
    ],
  };

  /**
   * Generate portfolio allocations based on risk assessment
   */
  generatePortfolio(assessment: any): ETFAllocation[] {
    const { riskTolerance, geographicFocus, esgExclusions, dividendVsGrowth } = assessment;

    // Handle geographicFocus as array or string for backward compatibility
    const geographicFocusArray = Array.isArray(geographicFocus) ? geographicFocus : [geographicFocus];

    // Start with base allocation for risk level
    let allocations = this.getBaseAllocations(riskTolerance);

    // Apply dividend vs growth adjustments
    allocations = this.applyDividendGrowthPreferences(allocations, dividendVsGrowth);

    // Apply ESG transformations
    allocations = this.applyESGPreferences(allocations, esgExclusions);

    // Apply geographic focus filtering
    allocations = this.applyGeographicPreferences(allocations, geographicFocusArray);

    // Ensure total equals 100%
    allocations = this.normalizeAllocationsTo100(allocations);

    logger.info(`Generated portfolio for ${riskTolerance} risk tolerance with ${allocations.length} allocations`);
    return allocations;
  }

  /**
   * Get base allocations for risk tolerance level
   */
  private getBaseAllocations(riskTolerance: string): ETFAllocation[] {
    const allocations = this.ETF_SETS[riskTolerance] || this.ETF_SETS['moderate'];
    return allocations.map(a => ({ ...a })); // Deep copy
  }

  /**
   * Apply dividend vs growth preferences
   */
  private applyDividendGrowthPreferences(
    allocations: ETFAllocation[],
    dividendVsGrowth: string
  ): ETFAllocation[] {
    if (dividendVsGrowth === 'dividend-focus') {
      // Replace growth-oriented ETFs with dividend-focused ones
      return allocations.map((a) => {
        if (a.ticker === 'VTI') {
          return { ...a, ticker: 'VIG', name: 'Vanguard Dividend Appreciation ETF', assetType: 'US Dividend Equity' };
        }
        if (a.ticker === 'VXUS') {
          return { ...a, ticker: 'VYMI', name: 'Vanguard International High Dividend Yield ETF', assetType: 'International Dividend Equity' };
        }
        if (a.ticker === 'QQQ') {
          return { ...a, ticker: 'VIG', name: 'Vanguard Dividend Appreciation ETF', assetType: 'US Dividend Equity' };
        }
        return a;
      });
    } else if (dividendVsGrowth === 'growth-focus') {
      // Emphasize growth-oriented ETFs
      return allocations.map((a) => {
        if (a.ticker === 'VXUS') {
          return { ...a, ticker: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', assetType: 'Emerging Markets Equity' };
        }
        return a;
      });
    }
    
    // For 'balanced', keep the original allocations
    return allocations;
  }

  /**
   * Apply ESG preferences
   */
  private applyESGPreferences(
    allocations: ETFAllocation[],
    esgExclusions: any
  ): ETFAllocation[] {
    const esgExclusionsArray = Array.isArray(esgExclusions) ? esgExclusions : [];
    const excludeNonEsgFunds = esgExclusionsArray.includes('non-esg-funds');
    
    if (excludeNonEsgFunds) {
      return allocations.map((a) => {
        if (a.ticker === 'VTI') {
          return { ...a, ticker: 'ESGV', name: 'Vanguard ESG U.S. Stock ETF', assetType: 'US Equity' };
        }
        if (a.ticker === 'VIG') {
          return { ...a, ticker: 'ESGD', name: 'iShares ESG Aware MSCI EAFE ETF', assetType: 'International Equity' };
        }
        if (a.ticker === 'VXUS') {
          return { ...a, ticker: 'ESGD', name: 'iShares ESG Aware MSCI EAFE ETF', assetType: 'International Equity' };
        }
        if (a.ticker === 'BND') {
          return { ...a, ticker: 'SUSB', name: 'iShares ESG Aware USD Corporate Bond ETF', assetType: 'Bonds' };
        }
        return a;
      });
    }

    return allocations;
  }

  /**
   * Apply geographic preferences
   */
  private applyGeographicPreferences(
    allocations: ETFAllocation[],
    geographicFocusArray: string[]
  ): ETFAllocation[] {
    // If only US is selected, remove international exposure
    if (geographicFocusArray.length === 1 && geographicFocusArray.includes('united-states')) {
      const internationalTickers = ['VXUS', 'ESGD', 'VYMI', 'VWO'];
      const removedWeight = allocations
        .filter((a) => internationalTickers.includes(a.ticker))
        .reduce((sum, a) => sum + a.percentage, 0);

      // Remove international allocations
      allocations = allocations.filter((a) => !internationalTickers.includes(a.ticker));

      // Redistribute weight to US equity
      const usPosition = allocations.find((a) => 
        ['VTI', 'ESGV', 'VIG'].includes(a.ticker)
      ) || allocations.find((a) => a.ticker === 'QQQ');
      
      if (usPosition) {
        usPosition.percentage += removedWeight;
      }
    }

    return allocations;
  }

  /**
   * Normalize allocations to sum to exactly 100%
   */
  private normalizeAllocationsTo100(allocations: ETFAllocation[]): ETFAllocation[] {
    const total = allocations.reduce((sum, a) => sum + (a.percentage || 0), 0);
    
    if (total === 0) return allocations;

    const scale = 100 / total;
    const withScaled = allocations.map((a) => ({
      item: a,
      raw: (a.percentage || 0) * scale,
    }));

    const floors = withScaled.map(({ item, raw }) => ({
      item,
      floor: Math.floor(raw),
      rem: raw - Math.floor(raw),
    }));

    let sumFloors = floors.reduce((s, f) => s + f.floor, 0);
    const needed = 100 - sumFloors;

    // Distribute remainders to reach exactly 100%
    floors.sort((a, b) => b.rem - a.rem);
    for (let i = 0; i < floors.length && i < needed; i++) {
      floors[i].floor += 1;
    }

    // Restore original order
    const result = floors
      .sort((a, b) => allocations.indexOf(a.item) - allocations.indexOf(b.item))
      .map(({ item, floor }) => ({ ...item, percentage: floor }));

    return result;
  }
}

// Export singleton instance
export const portfolioGeneratorService = new PortfolioGeneratorService();

