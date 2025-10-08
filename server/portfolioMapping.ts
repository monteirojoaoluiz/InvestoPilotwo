/**
 * Risk Profile Mapping
 * Maps assessment inputs to portfolio optimization parameters
 */
import {
  RiskProfileInputs,
  OptimizationParams,
  RiskScore,
  GeographicRegion,
} from "../shared/portfolio-types";

/**
 * Compute composite risk score from assessment inputs
 *
 * Formula: risk_score = 0.40*tolerance + 0.30*capacity + 0.20*horizon + 0.10*experience
 */
export function computeRiskScore(inputs: RiskProfileInputs): RiskScore {
  const overall =
    0.4 * inputs.riskTolerance +
    0.3 * inputs.riskCapacity +
    0.2 * inputs.investmentHorizon +
    0.1 * inputs.investorExperience;

  return {
    overall: Math.max(0, Math.min(100, overall)),
    components: {
      tolerance: inputs.riskTolerance,
      capacity: inputs.riskCapacity,
      horizon: inputs.investmentHorizon,
      experience: inputs.investorExperience,
    },
  };
}

/**
 * Map risk score to target annualized volatility
 *
 * Formula: σ* = 5% + 0.15 * (risk_score/100)
 * Range: ~5% (conservative) to ~20% (aggressive)
 */
export function computeTargetVolatility(riskScore: number): number {
  return 0.05 + 0.15 * (riskScore / 100);
}

/**
 * Map experience score to maximum number of ETFs
 *
 * Formula: K = round(3 + 7 * (experience/100))
 * Range: 3-10 ETFs (simpler for beginners, more complex for experts)
 */
export function computeMaxETFs(experienceScore: number): number {
  return Math.round(3 + 7 * (experienceScore / 100));
}

/**
 * Map risk score to risk aversion parameter (λ)
 *
 * Formula: λ = 2.0 * (1 - risk_score/100) + 0.5
 * Range: ~0.5 (high risk tolerance) to ~2.5 (low risk tolerance)
 */
export function computeRiskAversion(riskScore: number): number {
  return 2.0 * (1 - riskScore / 100) + 0.5;
}

/**
 * Create target region mix from selected regions
 *
 * Two approaches:
 * 1. If regions selected: equal weight among selected
 * 2. If no regions: global cap-weighted neutral
 */
export function computeTargetRegionMix(
  selectedRegions: GeographicRegion[],
): Record<GeographicRegion, number> {
  const allRegions: GeographicRegion[] = [
    "NL",
    "EU_EX_NL",
    "US",
    "DEV_EX_US_EU",
    "EM",
  ];

  // If no regions selected, use global cap-weighted approximation
  if (selectedRegions.length === 0) {
    return {
      NL: 0.02, // ~2% Netherlands
      EU_EX_NL: 0.13, // ~13% Europe ex-NL
      US: 0.6, // ~60% US (largest market)
      DEV_EX_US_EU: 0.15, // ~15% Developed ex-US/EU (Japan, UK, etc.)
      EM: 0.1, // ~10% Emerging markets
    };
  }

  // Equal weight among selected regions
  const equalWeight = 1.0 / selectedRegions.length;
  const targetMix: Record<GeographicRegion, number> = {
    NL: 0,
    EU_EX_NL: 0,
    US: 0,
    DEV_EX_US_EU: 0,
    EM: 0,
  };

  for (const region of selectedRegions) {
    targetMix[region] = equalWeight;
  }

  return targetMix;
}

/**
 * Map risk profile to all optimization parameters
 */
export function mapRiskProfileToParams(
  inputs: RiskProfileInputs,
): OptimizationParams {
  const riskScore = computeRiskScore(inputs);
  const targetVolatility = computeTargetVolatility(riskScore.overall);
  const maxETFs = computeMaxETFs(inputs.investorExperience);
  const riskAversion = computeRiskAversion(riskScore.overall);
  const targetRegionMix = computeTargetRegionMix(inputs.regionsSelected);

  return {
    targetVolatility,
    maxETFs,
    riskAversion,

    // Standard penalty weights (can be tuned)
    feePenalty: 1.0, // α - fees matter linearly
    regionPenalty: 10.0, // β - moderate penalty for region deviation
    liquidityPenalty: 2.0, // γ - penalize illiquid funds

    targetRegionMix,

    // Constraints
    exclusionThreshold: 0.005, // ε - max 0.5% exposure to excluded industries
    minWeight: 0.0, // Allow zero weights (sparsity)
    maxWeight: 0.4, // Max 40% in single ETF
  };
}

/**
 * Adjust parameters based on special cases
 */
export function adjustParamsForEdgeCases(
  params: OptimizationParams,
  inputs: RiskProfileInputs,
): OptimizationParams {
  const adjusted = { ...params };

  // Very short horizon + low risk tolerance → higher bond allocation
  const riskScore = computeRiskScore(inputs);
  if (riskScore.overall < 30 && inputs.investmentHorizon < 30) {
    adjusted.targetVolatility = Math.min(adjusted.targetVolatility, 0.08); // Cap at 8%
    adjusted.riskAversion = Math.max(adjusted.riskAversion, 2.0);
  }

  // High experience → allow more ETFs and complexity
  if (inputs.investorExperience > 80) {
    adjusted.maxETFs = Math.min(adjusted.maxETFs + 2, 12);
    adjusted.minWeight = 0.02; // Allow smaller positions
  }

  // All regions selected → more flexible region constraints
  if (inputs.regionsSelected.length >= 4) {
    adjusted.regionPenalty = 5.0; // Relax region penalty
  }

  // Single region selected → stricter region adherence
  if (inputs.regionsSelected.length === 1) {
    adjusted.regionPenalty = 20.0; // Strict adherence
  }

  return adjusted;
}

/**
 * Convert assessment answers to risk profile inputs
 * Maps string answers to 0-100 numeric scores
 */
export function assessmentToRiskProfile(answers: any): RiskProfileInputs {
  // Risk tolerance mapping
  const toleranceMap: Record<string, number> = {
    "very-conservative": 10,
    conservative: 30,
    moderate: 50,
    aggressive: 70,
    "very-aggressive": 90,
  };

  // Time horizon mapping (years to score)
  const horizonMap: Record<string, number> = {
    "less-than-1": 10,
    "1-3": 25,
    "3-5": 45,
    "5-10": 65,
    "10-20": 85,
    "more-than-20": 95,
  };

  // Experience mapping
  const experienceMap: Record<string, number> = {
    none: 10,
    limited: 30,
    moderate: 50,
    experienced: 70,
    expert: 90,
  };

  // Compute risk capacity from financial situation
  const riskCapacity = computeRiskCapacity(answers);

  // Parse regions
  const regionsSelected = (answers.geographicFocus || []) as GeographicRegion[];

  // Parse industry exclusions
  const industryExclusions = (answers.esgExclusions || []).filter(
    (e: string) => e !== "NO_ESG_SCREEN",
  );

  return {
    riskTolerance: toleranceMap[answers.riskTolerance] || 50,
    riskCapacity,
    investmentHorizon: horizonMap[answers.timeHorizon] || 50,
    investorExperience: experienceMap[answers.investmentExperience] || 50,
    regionsSelected,
    industryExclusions,
  };
}

/**
 * Compute risk capacity from financial situation
 * Higher income, lower debt, better emergency fund = higher capacity
 */
function computeRiskCapacity(answers: any): number {
  let capacity = 50; // Start at neutral

  // Income stability
  const stabilityBonus: Record<string, number> = {
    "very-stable": 15,
    stable: 10,
    "somewhat-stable": 5,
    unstable: -10,
    "very-unstable": -20,
  };
  capacity += stabilityBonus[answers.incomeStability] || 0;

  // Emergency fund
  const emergencyBonus: Record<string, number> = {
    "more-than-6": 15,
    "3-6": 10,
    "1-3": 0,
    "less-than-1": -15,
    none: -25,
  };
  capacity += emergencyBonus[answers.emergencyFund] || 0;

  // Debt level
  const debtPenalty: Record<string, number> = {
    none: 15,
    low: 5,
    moderate: -5,
    high: -15,
    "very-high": -25,
  };
  capacity += debtPenalty[answers.debtLevel] || 0;

  // Income range
  const incomeBonus: Record<string, number> = {
    "less-20k": -10,
    "20-40k": -5,
    "40-60k": 0,
    "60-100k": 5,
    "100-150k": 10,
    "more-150k": 15,
  };
  capacity += incomeBonus[answers.incomeRange] || 0;

  return Math.max(0, Math.min(100, capacity));
}
