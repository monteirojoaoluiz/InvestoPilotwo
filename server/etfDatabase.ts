/**
 * ETF Database for Portfolio Optimization
 * Uses real ETF data compatible with the ETF catalog
 */
import { ETFData } from "../shared/portfolio-types";

/**
 * Generate synthetic monthly returns based on asset class and risk level
 */
function generateMonthlyReturns(
  assetType: string,
  riskLevel: string,
  periods: number = 60,
): number[] {
  const returns: number[] = [];

  // Base monthly return and volatility by asset type and risk
  const baseParams: Record<string, { mean: number; vol: number }> = {
    "US Equity-Moderate": { mean: 0.009, vol: 0.045 },
    "US Equity-High": { mean: 0.01, vol: 0.055 },
    "US Equity-Low": { mean: 0.007, vol: 0.035 },
    "US Growth-High": { mean: 0.011, vol: 0.06 },
    "International Equity-Moderate": { mean: 0.007, vol: 0.042 },
    "International Equity-High": { mean: 0.008, vol: 0.05 },
    "Emerging Markets-High": { mean: 0.009, vol: 0.055 },
    "Fixed Income-Low": { mean: 0.003, vol: 0.015 },
    "Fixed Income-Moderate": { mean: 0.004, vol: 0.02 },
    "Bonds-Low": { mean: 0.003, vol: 0.012 },
    "Technology-High": { mean: 0.012, vol: 0.065 },
  };

  const key = `${assetType}-${riskLevel}`;
  const { mean, vol } = baseParams[key] || { mean: 0.008, vol: 0.045 };

  // Generate returns with some autocorrelation
  let prev = 0;
  for (let i = 0; i < periods; i++) {
    const shock = (Math.random() - 0.5) * 2 * vol * 1.732;
    const ret = mean + 0.1 * prev + shock;
    returns.push(ret);
    prev = ret;
  }

  return returns;
}

/**
 * ETF universe for portfolio optimization
 * Based on popular ETFs from the catalog
 */
export const sampleETFs: ETFData[] = [
  // Large Cap US Equity
  {
    ticker: "VOO",
    name: "Vanguard S&P 500 ETF",
    assetClass: "equity",
    domicile: "US",
    ucits: false,
    ter: 0.03,
    replication: "physical",
    currency: "USD",
    hedged: false,
    aum: 350000,
    avgSpread: 0.0001,
    avgDailyVolume: 5000000,
    regionExposure: { NL: 0, EU_EX_NL: 0, US: 1.0, DEV_EX_US_EU: 0, EM: 0 },
    industryExposure: { FOSSIL_FUELS: 0.04, WEAPONS: 0.01 },
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns("US Equity", "Moderate"),
  },
  {
    ticker: "VTI",
    name: "Vanguard Total Stock Market ETF",
    assetClass: "equity",
    domicile: "US",
    ucits: false,
    ter: 0.03,
    replication: "physical",
    currency: "USD",
    hedged: false,
    aum: 400000,
    avgSpread: 0.0001,
    avgDailyVolume: 4000000,
    regionExposure: { NL: 0, EU_EX_NL: 0, US: 1.0, DEV_EX_US_EU: 0, EM: 0 },
    industryExposure: { FOSSIL_FUELS: 0.03, WEAPONS: 0.01 },
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns("US Equity", "Moderate"),
  },
  {
    ticker: "QQQ",
    name: "Invesco QQQ Trust",
    assetClass: "equity",
    domicile: "US",
    ucits: false,
    ter: 0.2,
    replication: "physical",
    currency: "USD",
    hedged: false,
    aum: 250000,
    avgSpread: 0.0001,
    avgDailyVolume: 50000000,
    regionExposure: { NL: 0, EU_EX_NL: 0, US: 1.0, DEV_EX_US_EU: 0, EM: 0 },
    industryExposure: {},
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns("US Growth", "High"),
  },

  // International Equity
  {
    ticker: "VXUS",
    name: "Vanguard Total International Stock ETF",
    assetClass: "equity",
    domicile: "US",
    ucits: false,
    ter: 0.07,
    replication: "physical",
    currency: "USD",
    hedged: false,
    aum: 70000,
    avgSpread: 0.0005,
    avgDailyVolume: 4000000,
    regionExposure: {
      NL: 0.01,
      EU_EX_NL: 0.4,
      US: 0,
      DEV_EX_US_EU: 0.35,
      EM: 0.24,
    },
    industryExposure: { FOSSIL_FUELS: 0.05 },
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns("International Equity", "Moderate"),
  },
  {
    ticker: "VEA",
    name: "Vanguard FTSE Developed Markets ETF",
    assetClass: "equity",
    domicile: "US",
    ucits: false,
    ter: 0.05,
    replication: "physical",
    currency: "USD",
    hedged: false,
    aum: 100000,
    avgSpread: 0.0004,
    avgDailyVolume: 10000000,
    regionExposure: {
      NL: 0.02,
      EU_EX_NL: 0.45,
      US: 0,
      DEV_EX_US_EU: 0.53,
      EM: 0,
    },
    industryExposure: { FOSSIL_FUELS: 0.04 },
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns("International Equity", "Moderate"),
  },
  {
    ticker: "VWO",
    name: "Vanguard FTSE Emerging Markets ETF",
    assetClass: "equity",
    domicile: "US",
    ucits: false,
    ter: 0.08,
    replication: "physical",
    currency: "USD",
    hedged: false,
    aum: 90000,
    avgSpread: 0.0008,
    avgDailyVolume: 15000000,
    regionExposure: { NL: 0, EU_EX_NL: 0, US: 0, DEV_EX_US_EU: 0, EM: 1.0 },
    industryExposure: { FOSSIL_FUELS: 0.08 },
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns("Emerging Markets", "High"),
  },

  // Technology
  {
    ticker: "VGT",
    name: "Vanguard Information Technology ETF",
    assetClass: "equity",
    domicile: "US",
    ucits: false,
    ter: 0.1,
    replication: "physical",
    currency: "USD",
    hedged: false,
    aum: 60000,
    avgSpread: 0.0003,
    avgDailyVolume: 1000000,
    regionExposure: {
      NL: 0,
      EU_EX_NL: 0,
      US: 0.95,
      DEV_EX_US_EU: 0.03,
      EM: 0.02,
    },
    industryExposure: {},
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns("Technology", "High"),
  },

  // Bonds
  {
    ticker: "BND",
    name: "Vanguard Total Bond Market ETF",
    assetClass: "bond",
    domicile: "US",
    ucits: false,
    ter: 0.03,
    replication: "physical",
    currency: "USD",
    hedged: false,
    aum: 95000,
    avgSpread: 0.0002,
    avgDailyVolume: 6000000,
    regionExposure: { NL: 0, EU_EX_NL: 0, US: 1.0, DEV_EX_US_EU: 0, EM: 0 },
    industryExposure: {},
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns("Bonds", "Low"),
  },
  {
    ticker: "AGG",
    name: "iShares Core U.S. Aggregate Bond ETF",
    assetClass: "bond",
    domicile: "US",
    ucits: false,
    ter: 0.03,
    replication: "physical",
    currency: "USD",
    hedged: false,
    aum: 100000,
    avgSpread: 0.0002,
    avgDailyVolume: 7000000,
    regionExposure: { NL: 0, EU_EX_NL: 0, US: 1.0, DEV_EX_US_EU: 0, EM: 0 },
    industryExposure: {},
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns("Bonds", "Low"),
  },
  {
    ticker: "BNDX",
    name: "Vanguard Total International Bond ETF",
    assetClass: "bond",
    domicile: "US",
    ucits: false,
    ter: 0.07,
    replication: "physical",
    currency: "USD",
    hedged: true,
    aum: 75000,
    avgSpread: 0.0005,
    avgDailyVolume: 1000000,
    regionExposure: {
      NL: 0.02,
      EU_EX_NL: 0.6,
      US: 0,
      DEV_EX_US_EU: 0.35,
      EM: 0.03,
    },
    industryExposure: {},
    esgCompliant: false,
    monthlyReturns: generateMonthlyReturns("Fixed Income", "Low"),
  },

  // ESG Options
  {
    ticker: "ESGV",
    name: "Vanguard ESG U.S. Stock ETF",
    assetClass: "equity",
    domicile: "US",
    ucits: false,
    ter: 0.09,
    replication: "physical",
    currency: "USD",
    hedged: false,
    aum: 8000,
    avgSpread: 0.0008,
    avgDailyVolume: 500000,
    regionExposure: { NL: 0, EU_EX_NL: 0, US: 1.0, DEV_EX_US_EU: 0, EM: 0 },
    industryExposure: {},
    esgCompliant: true,
    monthlyReturns: generateMonthlyReturns("US Equity", "Moderate"),
  },
  {
    ticker: "VSGX",
    name: "Vanguard ESG International Stock ETF",
    assetClass: "equity",
    domicile: "US",
    ucits: false,
    ter: 0.12,
    replication: "physical",
    currency: "USD",
    hedged: false,
    aum: 5000,
    avgSpread: 0.001,
    avgDailyVolume: 200000,
    regionExposure: {
      NL: 0.01,
      EU_EX_NL: 0.42,
      US: 0,
      DEV_EX_US_EU: 0.54,
      EM: 0.03,
    },
    industryExposure: {},
    esgCompliant: true,
    monthlyReturns: generateMonthlyReturns("International Equity", "Moderate"),
  },
];

/**
 * Get filtered ETF universe based on user preferences
 */
export function getETFUniverse(): ETFData[] {
  return sampleETFs;
}
