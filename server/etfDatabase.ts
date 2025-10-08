/**
 * Sample ETF Database
 * Real-world ETF data for portfolio optimization
 */

import { ETFData } from '../shared/portfolio-types';

/**
 * Generate synthetic monthly returns based on asset class and region
 */
function generateMonthlyReturns(
  assetClass: string,
  region: string,
  periods: number = 60
): number[] {
  const returns: number[] = [];
  
  // Base monthly return and volatility by asset class
  const params: Record<string, { mean: number; vol: number }> = {
    'equity-US': { mean: 0.009, vol: 0.045 },
    'equity-EU': { mean: 0.007, vol: 0.040 },
    'equity-EM': { mean: 0.008, vol: 0.055 },
    'equity-DEV': { mean: 0.007, vol: 0.042 },
    'bond': { mean: 0.003, vol: 0.015 },
  };
  
  const key = `${assetClass}-${region}`;
  const { mean, vol } = params[key] || params['equity-US'];
  
  // Generate returns with some autocorrelation
  let prev = 0;
  for (let i = 0; i < periods; i++) {
    const shock = (Math.random() - 0.5) * 2 * vol * 1.732; // ~uniform to normal
    const ret = mean + 0.1 * prev + shock;
    returns.push(ret);
    prev = ret;
  }
  
  return returns;
}

/**
 * Sample ETF universe - real tickers and approximate characteristics
 */
export const sampleETFs: ETFData[] = [
  // US Equity
  {
    ticker: 'VUSA',
    name: 'Vanguard S&P 500 UCITS ETF',
    assetClass: 'equity',
    domicile: 'IE',
    ucits: true,
    ter: 0.07,
    replication: 'physical',
    currency: 'USD',
    hedged: false,
    aum: 35000,
    avgSpread: 0.0005,
    avgDailyVolume: 5000000,
    regionExposure: { NL: 0, EU_EX_NL: 0, US: 1.0, DEV_EX_US_EU: 0, EM: 0 },
    industryExposure: { FOSSIL_FUELS: 0.04, WEAPONS: 0.01 },
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns('equity', 'US'),
  },
  {
    ticker: 'CSPX',
    name: 'iShares Core S&P 500 UCITS ETF',
    assetClass: 'equity',
    domicile: 'IE',
    ucits: true,
    ter: 0.07,
    replication: 'physical',
    currency: 'USD',
    hedged: false,
    aum: 70000,
    avgSpread: 0.0004,
    avgDailyVolume: 8000000,
    regionExposure: { NL: 0, EU_EX_NL: 0, US: 1.0, DEV_EX_US_EU: 0, EM: 0 },
    industryExposure: { FOSSIL_FUELS: 0.04, WEAPONS: 0.01 },
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns('equity', 'US'),
  },
  {
    ticker: 'ESGV',
    name: 'Vanguard ESG US Stock ETF',
    assetClass: 'equity',
    domicile: 'IE',
    ucits: true,
    ter: 0.12,
    replication: 'physical',
    currency: 'USD',
    hedged: false,
    aum: 8000,
    avgSpread: 0.0008,
    avgDailyVolume: 500000,
    regionExposure: { NL: 0, EU_EX_NL: 0, US: 1.0, DEV_EX_US_EU: 0, EM: 0 },
    industryExposure: {},
    esgCompliant: true,
    monthlyReturns: generateMonthlyReturns('equity', 'US'),
  },
  
  // European Equity
  {
    ticker: 'VEUR',
    name: 'Vanguard FTSE Developed Europe UCITS ETF',
    assetClass: 'equity',
    domicile: 'IE',
    ucits: true,
    ter: 0.10,
    replication: 'physical',
    currency: 'EUR',
    hedged: false,
    aum: 4500,
    avgSpread: 0.0010,
    avgDailyVolume: 300000,
    regionExposure: { NL: 0.05, EU_EX_NL: 0.95, US: 0, DEV_EX_US_EU: 0, EM: 0 },
    industryExposure: { FOSSIL_FUELS: 0.06, WEAPONS: 0.02 },
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns('equity', 'EU'),
  },
  {
    ticker: 'MEUD',
    name: 'iShares MSCI Europe UCITS ETF',
    assetClass: 'equity',
    domicile: 'IE',
    ucits: true,
    ter: 0.12,
    replication: 'physical',
    currency: 'EUR',
    hedged: false,
    aum: 6000,
    avgSpread: 0.0012,
    avgDailyVolume: 400000,
    regionExposure: { NL: 0.04, EU_EX_NL: 0.96, US: 0, DEV_EX_US_EU: 0, EM: 0 },
    industryExposure: { FOSSIL_FUELS: 0.06, WEAPONS: 0.02 },
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns('equity', 'EU'),
  },
  
  // Netherlands
  {
    ticker: 'AEX',
    name: 'iShares AEX UCITS ETF',
    assetClass: 'equity',
    domicile: 'NL',
    ucits: true,
    ter: 0.30,
    replication: 'physical',
    currency: 'EUR',
    hedged: false,
    aum: 500,
    avgSpread: 0.0020,
    avgDailyVolume: 50000,
    regionExposure: { NL: 1.0, EU_EX_NL: 0, US: 0, DEV_EX_US_EU: 0, EM: 0 },
    industryExposure: {},
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns('equity', 'EU'),
  },
  
  // Developed ex-US/EU
  {
    ticker: 'VJPN',
    name: 'Vanguard FTSE Japan UCITS ETF',
    assetClass: 'equity',
    domicile: 'IE',
    ucits: true,
    ter: 0.15,
    replication: 'physical',
    currency: 'JPY',
    hedged: false,
    aum: 2000,
    avgSpread: 0.0015,
    avgDailyVolume: 200000,
    regionExposure: { NL: 0, EU_EX_NL: 0, US: 0, DEV_EX_US_EU: 1.0, EM: 0 },
    industryExposure: {},
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns('equity', 'DEV'),
  },
  {
    ticker: 'VAPX',
    name: 'Vanguard FTSE Developed Asia Pacific ex Japan UCITS ETF',
    assetClass: 'equity',
    domicile: 'IE',
    ucits: true,
    ter: 0.15,
    replication: 'physical',
    currency: 'USD',
    hedged: false,
    aum: 1500,
    avgSpread: 0.0018,
    avgDailyVolume: 150000,
    regionExposure: { NL: 0, EU_EX_NL: 0, US: 0, DEV_EX_US_EU: 1.0, EM: 0 },
    industryExposure: {},
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns('equity', 'DEV'),
  },
  
  // Emerging Markets
  {
    ticker: 'VFEM',
    name: 'Vanguard FTSE Emerging Markets UCITS ETF',
    assetClass: 'equity',
    domicile: 'IE',
    ucits: true,
    ter: 0.22,
    replication: 'physical',
    currency: 'USD',
    hedged: false,
    aum: 4000,
    avgSpread: 0.0020,
    avgDailyVolume: 500000,
    regionExposure: { NL: 0, EU_EX_NL: 0, US: 0, DEV_EX_US_EU: 0, EM: 1.0 },
    industryExposure: { FOSSIL_FUELS: 0.08 },
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns('equity', 'EM'),
  },
  {
    ticker: 'EIMI',
    name: 'iShares Core MSCI EM IMI UCITS ETF',
    assetClass: 'equity',
    domicile: 'IE',
    ucits: true,
    ter: 0.18,
    replication: 'physical',
    currency: 'USD',
    hedged: false,
    aum: 15000,
    avgSpread: 0.0015,
    avgDailyVolume: 1000000,
    regionExposure: { NL: 0, EU_EX_NL: 0, US: 0, DEV_EX_US_EU: 0, EM: 1.0 },
    industryExposure: { FOSSIL_FUELS: 0.08 },
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns('equity', 'EM'),
  },
  
  // Global/Multi-region
  {
    ticker: 'VWRL',
    name: 'Vanguard FTSE All-World UCITS ETF',
    assetClass: 'equity',
    domicile: 'IE',
    ucits: true,
    ter: 0.22,
    replication: 'physical',
    currency: 'USD',
    hedged: false,
    aum: 12000,
    avgSpread: 0.0010,
    avgDailyVolume: 2000000,
    regionExposure: { NL: 0.01, EU_EX_NL: 0.14, US: 0.60, DEV_EX_US_EU: 0.15, EM: 0.10 },
    industryExposure: { FOSSIL_FUELS: 0.05, WEAPONS: 0.01 },
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns('equity', 'US'),
  },
  {
    ticker: 'IWDA',
    name: 'iShares Core MSCI World UCITS ETF',
    assetClass: 'equity',
    domicile: 'IE',
    ucits: true,
    ter: 0.20,
    replication: 'physical',
    currency: 'USD',
    hedged: false,
    aum: 60000,
    avgSpread: 0.0008,
    avgDailyVolume: 3000000,
    regionExposure: { NL: 0.01, EU_EX_NL: 0.15, US: 0.68, DEV_EX_US_EU: 0.16, EM: 0 },
    industryExposure: { FOSSIL_FUELS: 0.04, WEAPONS: 0.01 },
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns('equity', 'US'),
  },
  
  // Bonds
  {
    ticker: 'AGGH',
    name: 'iShares Core Global Aggregate Bond UCITS ETF',
    assetClass: 'bond',
    domicile: 'IE',
    ucits: true,
    ter: 0.10,
    replication: 'physical',
    currency: 'EUR',
    hedged: true,
    aum: 3000,
    avgSpread: 0.0015,
    avgDailyVolume: 100000,
    regionExposure: { NL: 0.02, EU_EX_NL: 0.30, US: 0.45, DEV_EX_US_EU: 0.18, EM: 0.05 },
    industryExposure: {},
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns('bond', 'US'),
  },
  {
    ticker: 'IEAG',
    name: 'iShares Euro Aggregate Bond UCITS ETF',
    assetClass: 'bond',
    domicile: 'IE',
    ucits: true,
    ter: 0.09,
    replication: 'physical',
    currency: 'EUR',
    hedged: false,
    aum: 2500,
    avgSpread: 0.0012,
    avgDailyVolume: 150000,
    regionExposure: { NL: 0.05, EU_EX_NL: 0.95, US: 0, DEV_EX_US_EU: 0, EM: 0 },
    industryExposure: {},
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns('bond', 'EU'),
  },
];

/**
 * Get filtered ETF universe based on user preferences
 */
export function getETFUniverse(): ETFData[] {
  return sampleETFs;
}
