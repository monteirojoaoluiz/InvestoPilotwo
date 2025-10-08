/**
 * Portfolio Optimization Engine
 * Implements convex optimization for portfolio construction
 *
 * Uses Sequential Quadratic Programming (SQP) approach
 * Maximizes: μ'w - λ*w'Σw - α*fee'w - β*||A_reg*w - t_reg||² - γ*illiq'w
 * Subject to: sum(w)=1, w≥0, w'Σw≤σ*², A_excl*w≤ε, cardinality constraints
 */
import {
  ETFData,
  OptimizationParams,
  PortfolioStatistics,
  OptimizedPortfolio,
  GeographicRegion,
  IndustryExclusion,
} from "../shared/portfolio-types";
import {
  computePortfolioVolatility,
  computePortfolioReturn,
} from "./portfolioStatistics";

interface OptimizationState {
  weights: number[];
  objective: number;
  feasible: boolean;
  iterations: number;
}

/**
 * Main optimization function
 * Implements a simplified Sequential Quadratic Programming approach
 */
export function optimizePortfolio(
  etfs: ETFData[],
  stats: PortfolioStatistics,
  params: OptimizationParams,
  industryExclusions: IndustryExclusion[],
): OptimizedPortfolio {
  const n = etfs.length;

  if (n === 0) {
    throw new Error("No ETFs available for optimization");
  }

  // Initialize with equal weights
  let weights = new Array(n).fill(1 / n);

  // Run iterative optimization
  const result = iterativeOptimization(weights, stats, params, n);

  // Apply cardinality constraint (limit to K ETFs)
  weights = applyCardinalityConstraint(result.weights, params.maxETFs);

  // Ensure constraints are satisfied
  weights = projectOntoFeasibleSet(weights, stats, params, industryExclusions);

  // Build result
  return buildOptimizedPortfolio(
    etfs,
    weights,
    stats,
    params,
    industryExclusions,
  );
}

/**
 * Iterative optimization using gradient ascent with projections
 */
function iterativeOptimization(
  initialWeights: number[],
  stats: PortfolioStatistics,
  params: OptimizationParams,
  n: number,
): OptimizationState {
  let weights = [...initialWeights];
  let prevObjective = -Infinity;
  const maxIterations = 1000;
  const tolerance = 1e-6;

  for (let iter = 0; iter < maxIterations; iter++) {
    // Compute gradient of objective
    const gradient = computeObjectiveGradient(weights, stats, params);

    // Line search for step size
    const stepSize = lineSearch(weights, gradient, stats, params);

    // Update weights
    for (let i = 0; i < n; i++) {
      weights[i] += stepSize * gradient[i];
    }

    // Project onto feasible set
    weights = projectOntoSimpleFeasibleSet(weights, stats, params);

    // Check convergence
    const objective = computeObjective(weights, stats, params);
    if (Math.abs(objective - prevObjective) < tolerance) {
      return {
        weights,
        objective,
        feasible: checkFeasibility(weights, stats, params),
        iterations: iter + 1,
      };
    }

    prevObjective = objective;
  }

  return {
    weights,
    objective: computeObjective(weights, stats, params),
    feasible: checkFeasibility(weights, stats, params),
    iterations: maxIterations,
  };
}

/**
 * Compute objective function value
 * Objective = μ'w - λ*w'Σw - α*fee'w - β*||A_reg*w - t_reg||² - γ*illiq'w
 */
function computeObjective(
  weights: number[],
  stats: PortfolioStatistics,
  params: OptimizationParams,
): number {
  const n = weights.length;

  // Expected return term: μ'w
  let returnTerm = 0;
  for (let i = 0; i < n; i++) {
    returnTerm += stats.expectedReturns[i] * weights[i];
  }

  // Risk term: -λ*w'Σw
  let riskTerm = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      riskTerm += weights[i] * weights[j] * stats.covarianceMatrix[i][j];
    }
  }
  riskTerm *= -params.riskAversion;

  // Fee term: -α*fee'w
  let feeTerm = 0;
  for (let i = 0; i < n; i++) {
    feeTerm += stats.feePenalties[i] * weights[i];
  }
  feeTerm *= -params.feePenalty;

  // Region deviation term: -β*||A_reg*w - t_reg||²
  let regionTerm = 0;
  if (stats.regionMatrix.length > 0) {
    const regions: GeographicRegion[] = [
      "NL",
      "EU_EX_NL",
      "US",
      "DEV_EX_US_EU",
      "EM",
    ];
    for (let r = 0; r < regions.length; r++) {
      let exposure = 0;
      for (let i = 0; i < n; i++) {
        exposure += stats.regionMatrix[r][i] * weights[i];
      }
      const deviation = exposure - params.targetRegionMix[regions[r]];
      regionTerm += deviation * deviation;
    }
    regionTerm *= -params.regionPenalty;
  }

  // Liquidity term: -γ*illiq'w
  let liquidityTerm = 0;
  for (let i = 0; i < n; i++) {
    liquidityTerm += stats.liquidityPenalties[i] * weights[i];
  }
  liquidityTerm *= -params.liquidityPenalty;

  return returnTerm + riskTerm + feeTerm + regionTerm + liquidityTerm;
}

/**
 * Compute gradient of objective function
 */
function computeObjectiveGradient(
  weights: number[],
  stats: PortfolioStatistics,
  params: OptimizationParams,
): number[] {
  const n = weights.length;
  const gradient = new Array(n).fill(0);

  // Gradient of return term: μ
  for (let i = 0; i < n; i++) {
    gradient[i] += stats.expectedReturns[i];
  }

  // Gradient of risk term: -2λ*Σ*w
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += stats.covarianceMatrix[i][j] * weights[j];
    }
    gradient[i] += -2 * params.riskAversion * sum;
  }

  // Gradient of fee term: -α*fee
  for (let i = 0; i < n; i++) {
    gradient[i] += -params.feePenalty * stats.feePenalties[i];
  }

  // Gradient of region term: -2β*A_reg'*(A_reg*w - t_reg)
  if (stats.regionMatrix.length > 0) {
    const regions: GeographicRegion[] = [
      "NL",
      "EU_EX_NL",
      "US",
      "DEV_EX_US_EU",
      "EM",
    ];
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let r = 0; r < regions.length; r++) {
        let exposure = 0;
        for (let j = 0; j < n; j++) {
          exposure += stats.regionMatrix[r][j] * weights[j];
        }
        const deviation = exposure - params.targetRegionMix[regions[r]];
        sum += stats.regionMatrix[r][i] * deviation;
      }
      gradient[i] += -2 * params.regionPenalty * sum;
    }
  }

  // Gradient of liquidity term: -γ*illiq
  for (let i = 0; i < n; i++) {
    gradient[i] += -params.liquidityPenalty * stats.liquidityPenalties[i];
  }

  return gradient;
}

/**
 * Line search to find optimal step size
 */
function lineSearch(
  weights: number[],
  gradient: number[],
  stats: PortfolioStatistics,
  params: OptimizationParams,
): number {
  const baseObjective = computeObjective(weights, stats, params);
  let stepSize = 1.0;
  const backtrackFactor = 0.5;
  const maxBacktracks = 20;

  for (let i = 0; i < maxBacktracks; i++) {
    const newWeights = weights.map((w, idx) => w + stepSize * gradient[idx]);
    const projected = projectOntoSimpleFeasibleSet(newWeights, stats, params);
    const newObjective = computeObjective(projected, stats, params);

    if (newObjective > baseObjective) {
      return stepSize;
    }

    stepSize *= backtrackFactor;
  }

  return stepSize;
}

/**
 * Project weights onto simple feasible set (non-negativity + sum=1)
 */
function projectOntoSimpleFeasibleSet(
  weights: number[],
  stats: PortfolioStatistics,
  params: OptimizationParams,
): number[] {
  const n = weights.length;
  let w = [...weights];

  // Enforce non-negativity
  w = w.map((x) => Math.max(0, x));

  // Enforce max weight constraint
  w = w.map((x) => Math.min(params.maxWeight, x));

  // Project onto simplex (sum = 1)
  w = projectOntoSimplex(w);

  return w;
}

/**
 * Project onto simplex: sum(w) = 1, w ≥ 0
 * Using Duchi et al. (2008) algorithm
 */
function projectOntoSimplex(weights: number[]): number[] {
  const n = weights.length;
  const sorted = [...weights].sort((a, b) => b - a);

  let tmax = 0;
  let cumSum = 0;

  for (let i = 0; i < n; i++) {
    cumSum += sorted[i];
    const tCandidate = (cumSum - 1) / (i + 1);
    if (tCandidate < sorted[i]) {
      tmax = tCandidate;
    }
  }

  return weights.map((w) => Math.max(0, w - tmax));
}

/**
 * Project onto full feasible set including volatility and exclusion constraints
 */
function projectOntoFeasibleSet(
  weights: number[],
  stats: PortfolioStatistics,
  params: OptimizationParams,
  industryExclusions: IndustryExclusion[],
): number[] {
  let w = [...weights];
  const maxProjectionIterations = 100;

  for (let iter = 0; iter < maxProjectionIterations; iter++) {
    // Project onto simplex with bounds
    w = projectOntoSimpleFeasibleSet(w, stats, params);

    // Check and fix volatility constraint
    const vol = computePortfolioVolatility(w, stats.covarianceMatrix);
    if (vol > params.targetVolatility) {
      // Scale down risky positions
      w = reduceVolatility(w, stats, params.targetVolatility);
    }

    // Check and fix exclusion constraints
    if (stats.industryExclusionMatrix.length > 0) {
      w = enforceExclusions(w, stats, params.exclusionThreshold);
    }

    // Re-normalize
    const sum = w.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      w = w.map((x) => x / sum);
    }

    // Check if feasible
    if (checkFeasibility(w, stats, params)) {
      break;
    }
  }

  return w;
}

/**
 * Reduce portfolio volatility by scaling down weights
 */
function reduceVolatility(
  weights: number[],
  stats: PortfolioStatistics,
  targetVol: number,
): number[] {
  let scale = 1.0;
  const minScale = 0.1;

  while (scale > minScale) {
    const scaled = weights.map((w) => w * scale);
    const vol = computePortfolioVolatility(scaled, stats.covarianceMatrix);

    if (vol <= targetVol) {
      return scaled;
    }

    scale *= 0.95;
  }

  return weights.map((w) => w * minScale);
}

/**
 * Enforce industry exclusion constraints
 */
function enforceExclusions(
  weights: number[],
  stats: PortfolioStatistics,
  threshold: number,
): number[] {
  const w = [...weights];
  const n = weights.length;

  // Check each exclusion constraint
  for (let e = 0; e < stats.industryExclusionMatrix.length; e++) {
    let exposure = 0;
    for (let i = 0; i < n; i++) {
      exposure += stats.industryExclusionMatrix[e][i] * w[i];
    }

    // If violated, reduce weights proportionally for violating ETFs
    if (exposure > threshold) {
      const violators = stats.industryExclusionMatrix[e]
        .map((exp, i) => ({ index: i, exposure: exp }))
        .filter((v) => v.exposure > 0);

      const reduction = (exposure - threshold) / violators.length;
      for (const v of violators) {
        w[v.index] = Math.max(0, w[v.index] - reduction / v.exposure);
      }
    }
  }

  return w;
}

/**
 * Apply cardinality constraint (select top K ETFs)
 */
function applyCardinalityConstraint(
  weights: number[],
  maxETFs: number,
): number[] {
  const n = weights.length;

  if (maxETFs >= n) {
    return weights;
  }

  // Select top K by weight
  const indexed = weights.map((w, i) => ({ weight: w, index: i }));
  indexed.sort((a, b) => b.weight - a.weight);

  const selected = indexed.slice(0, maxETFs);
  const newWeights = new Array(n).fill(0);

  // Renormalize selected weights
  const totalWeight = selected.reduce((sum, item) => sum + item.weight, 0);
  for (const item of selected) {
    newWeights[item.index] = item.weight / totalWeight;
  }

  return newWeights;
}

/**
 * Check if weights satisfy all constraints
 */
function checkFeasibility(
  weights: number[],
  stats: PortfolioStatistics,
  params: OptimizationParams,
): boolean {
  const n = weights.length;

  // Check non-negativity
  if (weights.some((w) => w < -1e-6)) return false;

  // Check sum to 1
  const sum = weights.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) > 1e-4) return false;

  // Check max weight
  if (weights.some((w) => w > params.maxWeight + 1e-6)) return false;

  // Check volatility constraint
  const vol = computePortfolioVolatility(weights, stats.covarianceMatrix);
  if (vol > params.targetVolatility * 1.01) return false;

  // Check exclusion constraints
  if (stats.industryExclusionMatrix.length > 0) {
    for (let e = 0; e < stats.industryExclusionMatrix.length; e++) {
      let exposure = 0;
      for (let i = 0; i < n; i++) {
        exposure += stats.industryExclusionMatrix[e][i] * weights[i];
      }
      if (exposure > params.exclusionThreshold * 1.01) return false;
    }
  }

  return true;
}

/**
 * Build final OptimizedPortfolio object
 */
function buildOptimizedPortfolio(
  etfs: ETFData[],
  weights: number[],
  stats: PortfolioStatistics,
  params: OptimizationParams,
  industryExclusions: IndustryExclusion[],
): OptimizedPortfolio {
  // Filter out near-zero weights
  const threshold = 0.005; // 0.5% minimum
  const filteredIndices = weights
    .map((w, i) => ({ weight: w, index: i }))
    .filter((item) => item.weight >= threshold)
    .sort((a, b) => b.weight - a.weight);

  // Renormalize
  const totalWeight = filteredIndices.reduce(
    (sum, item) => sum + item.weight,
    0,
  );
  const finalWeights = filteredIndices.map((item) => item.weight / totalWeight);
  const finalETFs = filteredIndices.map((item) => etfs[item.index]);

  // Compute portfolio metrics
  const expectedReturn = computePortfolioReturn(
    finalWeights,
    filteredIndices.map((item) => stats.expectedReturns[item.index]),
  );
  const expectedVolatility = computePortfolioVolatility(
    finalWeights,
    extractSubmatrix(
      stats.covarianceMatrix,
      filteredIndices.map((item) => item.index),
    ),
  );
  const sharpeRatio = expectedReturn / expectedVolatility;

  // Compute region exposure
  const regions: GeographicRegion[] = [
    "NL",
    "EU_EX_NL",
    "US",
    "DEV_EX_US_EU",
    "EM",
  ];
  const regionExposure: Record<GeographicRegion, number> = {
    NL: 0,
    EU_EX_NL: 0,
    US: 0,
    DEV_EX_US_EU: 0,
    EM: 0,
  };

  for (let i = 0; i < finalETFs.length; i++) {
    for (const region of regions) {
      regionExposure[region] +=
        finalWeights[i] * finalETFs[i].regionExposure[region];
    }
  }

  // Compute total fees
  const totalFees = finalWeights.reduce(
    (sum, w, i) => sum + w * finalETFs[i].ter,
    0,
  );

  // Build ETF details
  const etfDetails = finalETFs.map((etf, i) => ({
    ticker: etf.ticker,
    name: etf.name,
    weight: finalWeights[i],
    expectedReturn: stats.expectedReturns[filteredIndices[i].index],
    volatility: Math.sqrt(
      stats.covarianceMatrix[filteredIndices[i].index][
        filteredIndices[i].index
      ],
    ),
    ter: etf.ter,
  }));

  return {
    tickers: finalETFs.map((e) => e.ticker),
    weights: finalWeights,
    expectedReturn,
    expectedVolatility,
    sharpeRatio,
    regionExposure,
    totalFees,
    constraints: {
      excludedIndustries: industryExclusions,
      volatilityCap: params.targetVolatility,
      maxETFs: params.maxETFs,
      targetRegions: regions.filter((r) => params.targetRegionMix[r] > 0),
    },
    etfDetails,
  };
}

/**
 * Extract submatrix for selected indices
 */
function extractSubmatrix(matrix: number[][], indices: number[]): number[][] {
  return indices.map((i) => indices.map((j) => matrix[i][j]));
}
