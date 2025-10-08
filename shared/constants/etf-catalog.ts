/**
 * Comprehensive ETF catalog for the application
 */

export interface ETFDefinition {
  ticker: string;
  name: string;
  assetType: string;
  color: string;
  category: 'equity' | 'bond' | 'reit' | 'commodity' | 'mixed';
  geographicFocus: 'us' | 'international' | 'global' | 'emerging';
  isESG: boolean;
  isDividendFocused: boolean;
  isGrowthFocused: boolean;
}

/**
 * Available ETFs organized by category
 */
export const ETF_CATALOG: Record<string, ETFDefinition> = {
  // US Equity - Broad Market
  VTI: {
    ticker: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    assetType: 'US Equity',
    color: 'hsl(var(--chart-1))',
    category: 'equity',
    geographicFocus: 'us',
    isESG: false,
    isDividendFocused: false,
    isGrowthFocused: false,
  },
  
  // US Equity - Growth
  QQQ: {
    ticker: 'QQQ',
    name: 'Invesco QQQ Trust',
    assetType: 'US Growth',
    color: 'hsl(var(--chart-5))',
    category: 'equity',
    geographicFocus: 'us',
    isESG: false,
    isDividendFocused: false,
    isGrowthFocused: true,
  },
  
  // US Equity - Dividend
  VIG: {
    ticker: 'VIG',
    name: 'Vanguard Dividend Appreciation ETF',
    assetType: 'US Dividend Equity',
    color: 'hsl(var(--chart-1))',
    category: 'equity',
    geographicFocus: 'us',
    isESG: false,
    isDividendFocused: true,
    isGrowthFocused: false,
  },
  
  // US Equity - ESG
  ESGV: {
    ticker: 'ESGV',
    name: 'Vanguard ESG U.S. Stock ETF',
    assetType: 'US Equity',
    color: 'hsl(var(--chart-1))',
    category: 'equity',
    geographicFocus: 'us',
    isESG: true,
    isDividendFocused: false,
    isGrowthFocused: false,
  },
  
  // International Equity - Broad
  VXUS: {
    ticker: 'VXUS',
    name: 'Vanguard Total International Stock ETF',
    assetType: 'International Equity',
    color: 'hsl(var(--chart-2))',
    category: 'equity',
    geographicFocus: 'international',
    isESG: false,
    isDividendFocused: false,
    isGrowthFocused: false,
  },
  
  // International Equity - Dividend
  VYMI: {
    ticker: 'VYMI',
    name: 'Vanguard International High Dividend Yield ETF',
    assetType: 'International Dividend Equity',
    color: 'hsl(var(--chart-2))',
    category: 'equity',
    geographicFocus: 'international',
    isESG: false,
    isDividendFocused: true,
    isGrowthFocused: false,
  },
  
  // International Equity - ESG
  ESGD: {
    ticker: 'ESGD',
    name: 'iShares ESG Aware MSCI EAFE ETF',
    assetType: 'International Equity',
    color: 'hsl(var(--chart-2))',
    category: 'equity',
    geographicFocus: 'international',
    isESG: true,
    isDividendFocused: false,
    isGrowthFocused: false,
  },
  
  // Emerging Markets
  VWO: {
    ticker: 'VWO',
    name: 'Vanguard FTSE Emerging Markets ETF',
    assetType: 'Emerging Markets Equity',
    color: 'hsl(var(--chart-2))',
    category: 'equity',
    geographicFocus: 'emerging',
    isESG: false,
    isDividendFocused: false,
    isGrowthFocused: true,
  },
  
  // Bonds - Broad
  BND: {
    ticker: 'BND',
    name: 'Vanguard Total Bond Market ETF',
    assetType: 'Bonds',
    color: 'hsl(var(--chart-3))',
    category: 'bond',
    geographicFocus: 'us',
    isESG: false,
    isDividendFocused: false,
    isGrowthFocused: false,
  },
  
  // Bonds - ESG
  SUSB: {
    ticker: 'SUSB',
    name: 'iShares ESG Aware USD Corporate Bond ETF',
    assetType: 'Bonds',
    color: 'hsl(var(--chart-3))',
    category: 'bond',
    geographicFocus: 'us',
    isESG: true,
    isDividendFocused: false,
    isGrowthFocused: false,
  },
  
  // REIT
  VNQ: {
    ticker: 'VNQ',
    name: 'Vanguard Real Estate ETF',
    assetType: 'REIT',
    color: 'hsl(var(--chart-4))',
    category: 'reit',
    geographicFocus: 'us',
    isESG: false,
    isDividendFocused: true,
    isGrowthFocused: false,
  },
};

/**
 * Get ETF by ticker
 */
export function getETF(ticker: string): ETFDefinition | undefined {
  return ETF_CATALOG[ticker.toUpperCase()];
}

/**
 * Get all ETFs matching criteria
 */
export function filterETFs(criteria: {
  category?: ETFDefinition['category'];
  geographicFocus?: ETFDefinition['geographicFocus'];
  isESG?: boolean;
  isDividendFocused?: boolean;
  isGrowthFocused?: boolean;
}): ETFDefinition[] {
  return Object.values(ETF_CATALOG).filter(etf => {
    if (criteria.category && etf.category !== criteria.category) return false;
    if (criteria.geographicFocus && etf.geographicFocus !== criteria.geographicFocus) return false;
    if (criteria.isESG !== undefined && etf.isESG !== criteria.isESG) return false;
    if (criteria.isDividendFocused !== undefined && etf.isDividendFocused !== criteria.isDividendFocused) return false;
    if (criteria.isGrowthFocused !== undefined && etf.isGrowthFocused !== criteria.isGrowthFocused) return false;
    return true;
  });
}

/**
 * Chart color palette
 */
export const CHART_COLORS = {
  chart1: 'hsl(var(--chart-1))',
  chart2: 'hsl(var(--chart-2))',
  chart3: 'hsl(var(--chart-3))',
  chart4: 'hsl(var(--chart-4))',
  chart5: 'hsl(var(--chart-5))',
};

