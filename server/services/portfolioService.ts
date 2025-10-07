// New portfolio service to encapsulate allocation logic
import { z } from 'zod';

export type Allocation = {
  ticker: string;
  name: string;
  percentage: number;
  color?: string;
  assetType?: string;
};

export function normalizeAllocationsTo100<T extends { percentage: number }>(allocs: T[]): T[] {
  const total = allocs.reduce((sum, a) => sum + (a.percentage || 0), 0);
  if (total === 0) return allocs;
  const scale = 100 / total;
  const withScaled = allocs.map((a) => ({
    item: a,
    raw: (a.percentage || 0) * scale,
  }));
  const floors = withScaled.map(({ item, raw }) => ({ item, floor: Math.floor(raw), rem: raw - Math.floor(raw) }));
  let sumFloors = floors.reduce((s, f) => s + f.floor, 0);
  const needed = 100 - sumFloors;
  floors.sort((a, b) => b.rem - a.rem);
  for (let i = 0; i < floors.length; i++) {
    if (i < needed) floors[i].floor += 1;
  }
  const result = floors
    .sort((a, b) => allocs.indexOf(a.item) - allocs.indexOf(b.item))
    .map(({ item, floor }) => ({ ...item, percentage: floor } as T));
  return result;
}

export function generateEtfAllocationsFromAssessment(assessment: any): Allocation[] {
  const { riskTolerance, geographicFocus, esgExclusions, dividendVsGrowth } = assessment;

  const geographicFocusArray = Array.isArray(geographicFocus) ? geographicFocus : [geographicFocus];

  const ETF_SETS: Record<string, Allocation[]> = {
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

  let allocations = ETF_SETS[riskTolerance] || ETF_SETS['moderate'];

  if (dividendVsGrowth === 'dividend-focus') {
    allocations = allocations.map((a) => {
      if (a.ticker === 'VTI') return { ...a, ticker: 'VIG', name: 'Vanguard Dividend Appreciation ETF', assetType: 'US Dividend Equity' };
      if (a.ticker === 'VXUS') return { ...a, ticker: 'VYMI', name: 'Vanguard International High Dividend Yield ETF', assetType: 'International Dividend Equity' };
      if (a.ticker === 'QQQ') return { ...a, ticker: 'VIG', name: 'Vanguard Dividend Appreciation ETF', assetType: 'US Dividend Equity' };
      return a;
    });
  } else if (dividendVsGrowth === 'growth-focus') {
    allocations = allocations.map((a) => {
      if (a.ticker === 'VTI' && allocations.some(alloc => alloc.ticker === 'QQQ')) {
        return a;
      }
      if (a.ticker === 'VXUS') return { ...a, ticker: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', assetType: 'Emerging Markets Equity' };
      return a;
    });
  }

  const esgExclusionsArray = Array.isArray(esgExclusions) ? esgExclusions : [];
  const excludeNonEsgFunds = esgExclusionsArray.includes('non-esg-funds');
  if (excludeNonEsgFunds) {
    allocations = allocations.map((a) => {
      if (a.ticker === 'VTI') return { ...a, ticker: 'ESGV', name: 'Vanguard ESG U.S. Stock ETF', assetType: 'US Equity' };
      if (a.ticker === 'VIG') return { ...a, ticker: 'ESGD', name: 'iShares ESG Aware MSCI EAFE ETF', assetType: 'International Equity' };
      if (a.ticker === 'VXUS') return { ...a, ticker: 'ESGD', name: 'iShares ESG Aware MSCI EAFE ETF', assetType: 'International Equity' };
      if (a.ticker === 'BND') return { ...a, ticker: 'SUSB', name: 'iShares ESG Aware USD Corporate Bond ETF', assetType: 'Bonds' };
      return a;
    });
  }

  if (geographicFocusArray.length === 1 && geographicFocusArray.includes('united-states')) {
    const removedWeight = allocations
      .filter((a) => a.ticker === 'VXUS' || a.ticker === 'ESGD' || a.ticker === 'VYMI' || a.ticker === 'VWO')
      .reduce((sum, a) => sum + a.percentage, 0);
    allocations = allocations.filter((a) => a.ticker !== 'VXUS' && a.ticker !== 'ESGD' && a.ticker !== 'VYMI' && a.ticker !== 'VWO').map((a) => ({ ...a }));
    const usPosition = allocations.find((a) => a.ticker === 'VTI' || a.ticker === 'ESGV' || a.ticker === 'VIG') || allocations.find((a) => a.ticker === 'QQQ');
    if (usPosition) usPosition.percentage += removedWeight;
  }

  return normalizeAllocationsTo100(allocations);
}
