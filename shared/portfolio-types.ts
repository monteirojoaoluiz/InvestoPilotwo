/**
 * Portfolio Optimization Types
 * Types for efficient portfolio construction based on risk assessment
 */

// ETF Data Structure
export interface ETFData {
  ticker: string;
  name: string;
  assetClass: "equity" | "bond" | "commodity" | "mixed";
  domicile: string;
  ucits: boolean;
  ter: number; // Total Expense Ratio (annual %)
  replication: "physical" | "synthetic";
  currency: string;
  hedged: boolean;

  // Liquidity metrics
  aum: number; // Assets under management (millions)
  avgSpread: number; // Average bid-ask spread (%)
  avgDailyVolume: number; // Average daily trading volume

  // Regional exposures (must sum to ~1.0)
  regionExposure: {
    NL: number;
    EU_EX_NL: number;
    US: number;
    DEV_EX_US_EU: number; // Developed ex-US/EU
    EM: number; // Emerging markets
  };

  // Industry exposures (for exclusions)
  industryExposure: {
    TOBACCO?: number;
    FOSSIL_FUELS?: number;
    WEAPONS?: number;
    GAMBLING?: number;
    ALCOHOL?: number;
    NUCLEAR?: number;
  };

  esgCompliant: boolean;

  // Historical returns (monthly net returns)
  monthlyReturns: number[];

  // Optional: factor loadings
  factorLoads?: {
    market: number;
    size: number;
    value: number;
    momentum: number;
  };
}

// Geographic regions
export type GeographicRegion = "NL" | "EU_EX_NL" | "US" | "DEV_EX_US_EU" | "EM";

// Industry exclusions
export type IndustryExclusion =
  | "TOBACCO"
  | "FOSSIL_FUELS"
  | "WEAPONS"
  | "GAMBLING"
  | "ALCOHOL"
  | "NUCLEAR";

// Risk profile inputs from assessment
export interface RiskProfileInputs {
  riskTolerance: number; // 0-100 scale
  riskCapacity: number; // 0-100 scale
  investmentHorizon: number; // 0-100 scale
  investorExperience: number; // 0-100 scale
  regionsSelected: GeographicRegion[];
  industryExclusions: IndustryExclusion[];
}

// Portfolio optimization parameters (derived from profile)
export interface OptimizationParams {
  targetVolatility: number; // σ* - annualized target volatility cap
  maxETFs: number; // K - maximum number of ETFs in portfolio
  riskAversion: number; // λ - risk aversion parameter
  feePenalty: number; // α - penalty weight for fees
  regionPenalty: number; // β - penalty for deviation from target regions
  liquidityPenalty: number; // γ - penalty for illiquid funds
  targetRegionMix: Record<GeographicRegion, number>;
  exclusionThreshold: number; // ε - max exposure to excluded industries
  minWeight: number; // minimum position size
  maxWeight: number; // maximum position size
}

// Statistical estimates
export interface PortfolioStatistics {
  expectedReturns: number[]; // μ - expected excess returns per ETF
  covarianceMatrix: number[][]; // Σ - covariance matrix
  feePenalties: number[]; // TER per ETF
  liquidityPenalties: number[]; // illiquidity score per ETF
  regionMatrix: number[][]; // A_reg - region exposure matrix (5 x n)
  industryExclusionMatrix: number[][]; // A_ind_excl - industry exposure matrix
}

// Optimization result
export interface OptimizedPortfolio {
  tickers: string[];
  weights: number[];
  expectedReturn: number; // annual
  expectedVolatility: number; // annual
  sharpeRatio: number;
  regionExposure: Record<GeographicRegion, number>;
  totalFees: number;
  constraints: {
    excludedIndustries: IndustryExclusion[];
    volatilityCap: number;
    maxETFs: number;
    targetRegions: GeographicRegion[];
  };
  etfDetails: Array<{
    ticker: string;
    name: string;
    weight: number;
    expectedReturn: number;
    volatility: number;
    ter: number;
  }>;
}

// Rebalancing decision
export interface RebalancingDecision {
  shouldRebalance: boolean;
  reason?: string;
  maxDrift?: number;
  costBenefitRatio?: number;
  newPortfolio?: OptimizedPortfolio;
}

// Risk score computation
export interface RiskScore {
  overall: number; // 0-100 composite score
  components: {
    tolerance: number;
    capacity: number;
    horizon: number;
    experience: number;
  };
}
